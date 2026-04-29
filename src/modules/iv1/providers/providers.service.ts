import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma, ContentStatus, ProviderType } from "@prisma/client";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import { UserPayload } from "@/common/guards/auth.guard";
import QueryBuilder from "@/common/utils/queryBuilder";

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    CreateProviderDto,
    CreateProviderModelDto,
    UpdateProviderDto,
    UpdateProviderModelDto,
    UpdateProviderModelStatusDto,
    UpdateProviderStatusDto,
} from "./dto/body.dto";

type GlobalProvider = Prisma.ProviderGetPayload<{ include: { model: true } }>;
type CustomProvider = Prisma.UserProviderGetPayload<{
    include: { models: true };
}>;

@Injectable()
export class ProvidersService {
    constructor(private prisma: PrismaService) {}

    async fetchAllProviders(query: Record<string, string>) {
        if (query.type === "global") {
            const queryBuilder = new QueryBuilder<
                typeof this.prisma.provider,
                Prisma.$ProviderPayload
            >(this.prisma.provider, query);

            const data = await queryBuilder
                .search(["name", "description"])
                .filter({ exacts: ["status", "type"], booleans: ["free"] })
                .sort()
                .paginate()
                .include({ model: true })
                .execute();

            const pagination = await queryBuilder.countTotal();

            const formatted = await Promise.all(
                (data as any[]).map(async (p) => {
                    const modelsCount = p.model ? 1 : 0;
                    const activeModelsCount =
                        p.model && p.model.status === "ACTIVE" ? 1 : 0;
                    const connectedApiCount =
                        await this.prisma.providerSelection.count({
                            where: {
                                OR: [
                                    { providerIds: { has: p.id } },
                                    { userProviderIds: { has: p.id } },
                                ],
                            },
                        });

                    return {
                        id: p.id,
                        name: p.name,
                        description: p.description,
                        free: p.free,
                        type: p.type,
                        status: p.status,
                        modelsCount,
                        activeModelsCount,
                        connectedApiCount,
                        createdAt: p.createdAt,
                        updatedAt: p.updatedAt,
                    };
                }),
            );

            return {
                message: "Providers fetched",
                data: formatted,
                pagination,
            };
        } else if (query.type === "custom") {
            const queryBuilder = new QueryBuilder<
                typeof this.prisma.userProvider,
                Prisma.$UserProviderPayload
            >(this.prisma.userProvider, query);
            const data = await queryBuilder
                .search(["name", "description"])
                .filter({ exacts: ["status", "type"], booleans: ["free"] })
                .sort()
                .paginate()
                .include({ models: true })
                .execute();
            const pagination = await queryBuilder.countTotal();

            const formatted = await Promise.all(
                (data as any[]).map(async (p) => {
                    const modelsCount = (p.models ?? []).length;
                    const activeModelsCount = (p.models ?? []).filter(
                        (m: any) => m.status === "ACTIVE",
                    ).length;
                    const connectedApiCount =
                        await this.prisma.providerSelection.count({
                            where: {
                                OR: [
                                    { providerIds: { has: p.id } },
                                    { userProviderIds: { has: p.id } },
                                ],
                            },
                        });

                    return {
                        id: p.id,
                        name: p.name,
                        description: p.description,
                        free: p.free,
                        type: p.type,
                        status: p.status,
                        modelsCount,
                        activeModelsCount,
                        connectedApiCount,
                        createdAt: p.createdAt,
                        updatedAt: p.updatedAt,
                    };
                }),
            );

            return {
                message: "Providers fetched",
                data: formatted,
                pagination,
            };
        }
    }

    async fetchSingleProvider(id: string) {
        const prisma = this.prisma;

        const globalProvider = await prisma.provider.findUnique({
            where: { id },
            include: { model: true },
        });

        if (globalProvider) {
            return {
                message: "Provider fetched",
                data: globalProvider,
            };
        }

        const customProvider = await prisma.userProvider.findUnique({
            where: { id },
            include: { models: true },
        });

        if (!customProvider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        return {
            message: "Provider fetched",
            data: customProvider,
        };
    }

    async createProvider(payload: CreateProviderDto, user: UserPayload) {
        const prisma = this.prisma;
        this.ensureUserContext(user);

        const created = await prisma.userProvider.create({
            data: {
                name: payload.name,
                description: payload.description,
                baseApi: payload.baseApi,
                free: payload.free ?? false,
                type: payload.type ?? ProviderType.CUSTOM,
                status: payload.status ?? ContentStatus.ACTIVE,
                models: payload.model
                    ? {
                          create: {
                              name: payload.model.name,
                              code: payload.model.code,
                              maxTokens: payload.model.maxTokens,
                              tokenResetInterval:
                                  payload.model.tokenResetInterval,
                              efficiencyScore: payload.model.efficiencyScore,
                              bestFor: payload.model.bestFor ?? [],
                              status:
                                  payload.model.status ?? ContentStatus.ACTIVE,
                          },
                      }
                    : undefined,
            },
            include: { models: true },
        });

        return {
            message: "Provider created",
            data: { id: created.id },
        };
    }

    async updateProvider(
        id: string,
        payload: UpdateProviderDto,
        user: UserPayload,
    ) {
        await this.ensureUserCanAccessCustomProvider(id, user.id);
        const provider = await this.findCustomProvider(id);

        const updated = await this.prisma.userProvider.update({
            where: { id: provider.id },
            data: {
                ...(payload.name !== undefined ? { name: payload.name } : {}),
                ...(payload.description !== undefined
                    ? { description: payload.description }
                    : {}),
                ...(payload.baseApi !== undefined
                    ? { baseApi: payload.baseApi }
                    : {}),
                ...(payload.free !== undefined ? { free: payload.free } : {}),
                ...(payload.type !== undefined ? { type: payload.type } : {}),
                ...(payload.status !== undefined
                    ? { status: payload.status }
                    : {}),
            },
            include: { models: true },
        });

        return {
            message: "Provider updated",
            data: { id: updated.id },
        };
    }

    async updateProviderStatus(
        id: string,
        payload: UpdateProviderStatusDto,
        user: UserPayload,
    ) {
        await this.ensureUserCanAccessCustomProvider(id, user.id);
        await this.findCustomProvider(id);

        const updated = await this.prisma.userProvider.update({
            where: { id },
            data: { status: payload.status },
            include: { models: true },
        });

        return {
            message: "Provider status updated",
            data: { id: updated.id },
        };
    }

    async deleteProvider(id: string, user: UserPayload) {
        await this.ensureUserCanAccessCustomProvider(id, user.id);
        await this.findCustomProvider(id);

        const deleted = await this.prisma.userProvider.delete({
            where: { id },
        });

        return { message: "Provider deleted", data: { id: deleted.id } };
    }

    async fetchAllProviderModels(
        providerId: string,
        query: Record<string, string>,
    ) {
        const providerEntity = await this.findProviderEntity(providerId);

        if (providerEntity.kind === "global") {
            const builder = new QueryBuilder<
                typeof this.prisma.model,
                Prisma.$ModelPayload
            >(this.prisma.model, query)
                .search(["name", "code"])
                .filter({ exacts: ["status"] })
                .rawFilter({ providerId })
                .sort()
                .paginate();

            const [data, pagination] = await Promise.all([
                builder.execute(),
                builder.countTotal(),
            ]);

            return { message: "Models fetched", data, pagination };
        }

        const builder = new QueryBuilder<
            typeof this.prisma.userModel,
            Prisma.$UserModelPayload
        >(this.prisma.userModel, query)
            .search(["name", "code"])
            .filter({ exacts: ["status"] })
            .rawFilter({ providerId })
            .sort()
            .paginate();

        const [data, pagination] = await Promise.all([
            builder.execute(),
            builder.countTotal(),
        ]);

        return { message: "Models fetched", data, pagination };
    }

    async createProviderModel(
        providerId: string,
        payload: CreateProviderModelDto,
        user: UserPayload,
    ) {
        await this.ensureUserCanAccessProvider(providerId, user.id);
        const providerEntity = await this.findProviderEntity(providerId);

        if (providerEntity.kind === "global") {
            const created = await this.prisma.model.upsert({
                where: { providerId },
                update: this.buildModelUpdateDataForGlobal(payload),
                create: {
                    name: payload.name,
                    code: payload.code,
                    maxTokens: payload.maxTokens,
                    tokenResetInterval: payload.tokenResetInterval,
                    efficiencyScore: payload.efficiencyScore,
                    bestFor: payload.bestFor ?? [],
                    status: payload.status ?? ContentStatus.ACTIVE,
                    provider: { connect: { id: providerId } },
                },
            });
            return { message: "Model created", data: { id: created.id } };
        }

        const created = await this.prisma.userModel.upsert({
            where: { providerId },
            update: this.buildModelUpdateDataForCustom(payload),
            create: {
                name: payload.name,
                code: payload.code,
                maxTokens: payload.maxTokens,
                tokenResetInterval: payload.tokenResetInterval,
                efficiencyScore: payload.efficiencyScore,
                bestFor: payload.bestFor ?? [],
                status: payload.status ?? ContentStatus.ACTIVE,
                provider: { connect: { id: providerId } },
            },
        });
        return { message: "Model created", data: { id: created.id } };
    }

    async updateProviderModel(
        modelId: string,
        payload: UpdateProviderModelDto,
        user: UserPayload,
    ) {
        const current = await this.findOwnedUserModel(modelId, user.id);

        const updated = await this.prisma.userModel.update({
            where: { id: current.id },
            data: this.buildModelUpdateDataForCustom(payload),
        });

        return { message: "Model updated", data: { id: updated.id } };
    }

    async updateProviderModelStatus(
        modelId: string,
        payload: UpdateProviderModelStatusDto,
        user: UserPayload,
    ) {
        const current = await this.findOwnedUserModel(modelId, user.id);

        const updated = await this.prisma.userModel.update({
            where: { id: current.id },
            data: { status: payload.status },
        });

        return { message: "Model status updated", data: { id: updated.id } };
    }

    async deleteProviderModel(modelId: string, user: UserPayload) {
        const current = await this.findOwnedUserModel(modelId, user.id);

        const deleted = await this.prisma.userModel.delete({
            where: { id: current.id },
        });
        return { message: "Model deleted", data: { id: deleted.id } };
    }

    private async findProviderEntity(
        providerId: string,
    ): Promise<
        | { kind: "global"; record: GlobalProvider }
        | { kind: "custom"; record: CustomProvider }
    > {
        const global = await this.prisma.provider.findUnique({
            where: { id: providerId },
            include: { model: true },
        });

        if (global) {
            return { kind: "global", record: global };
        }

        const custom = await this.prisma.userProvider.findUnique({
            where: { id: providerId },
            include: { models: true },
        });

        if (!custom) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        return { kind: "custom", record: custom };
    }

    private async findCustomProvider(providerId: string) {
        const provider = await this.prisma.userProvider.findUnique({
            where: { id: providerId },
            include: { models: true },
        });

        if (!provider) {
            throw new ApiError(
                HttpStatus.FORBIDDEN,
                "Only custom providers are modifiable",
            );
        }

        return provider;
    }

    private async findOwnedUserModel(modelId: string, userId: string) {
        const model = await this.prisma.userModel.findUnique({
            where: { id: modelId },
            include: { provider: true },
        });

        if (!model) {
            throw new ApiError(
                HttpStatus.FORBIDDEN,
                "Only user-owned models are modifiable",
            );
        }

        await this.ensureUserCanAccessCustomProvider(model.providerId, userId);

        return model;
    }

    private ensureUserContext(user: UserPayload) {
        if (!user?.id) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
    }

    private async ensureUserCanAccessProvider(
        providerId: string,
        userId: string,
    ) {
        const selection = await this.prisma.providerSelection.findFirst({
            where: {
                apiKey: { userId },
                OR: [
                    { providerIds: { has: providerId } },
                    { userProviderIds: { has: providerId } },
                ],
            },
            select: { id: true },
        });

        if (!selection) {
            throw new ApiError(HttpStatus.FORBIDDEN, "Provider access denied");
        }
    }

    private async ensureUserCanAccessCustomProvider(
        providerId: string,
        userId: string,
    ) {
        const selection = await this.prisma.providerSelection.findFirst({
            where: {
                apiKey: { userId },
                userProviderIds: { has: providerId },
            },
            select: { id: true },
        });

        if (!selection) {
            throw new ApiError(
                HttpStatus.FORBIDDEN,
                "Custom provider access denied",
            );
        }
    }

    private buildModelUpdateDataForGlobal(payload: UpdateProviderModelDto) {
        const data: Prisma.ModelUpdateInput = {
            ...(payload.name !== undefined ? { name: payload.name } : {}),
            ...(payload.code !== undefined ? { code: payload.code } : {}),
            ...(payload.maxTokens !== undefined
                ? { maxTokens: payload.maxTokens }
                : {}),
            ...(payload.tokenResetInterval !== undefined
                ? { tokenResetInterval: payload.tokenResetInterval }
                : {}),
            ...(payload.efficiencyScore !== undefined
                ? { efficiencyScore: payload.efficiencyScore }
                : {}),
            ...(payload.bestFor !== undefined
                ? { bestFor: payload.bestFor }
                : {}),
            ...(payload.status !== undefined ? { status: payload.status } : {}),
        };

        return data;
    }

    private buildModelUpdateDataForCustom(payload: UpdateProviderModelDto) {
        const data: Prisma.UserModelUpdateInput = {
            ...(payload.name !== undefined ? { name: payload.name } : {}),
            ...(payload.code !== undefined ? { code: payload.code } : {}),
            ...(payload.maxTokens !== undefined
                ? { maxTokens: payload.maxTokens }
                : {}),
            ...(payload.tokenResetInterval !== undefined
                ? { tokenResetInterval: payload.tokenResetInterval }
                : {}),
            ...(payload.efficiencyScore !== undefined
                ? { efficiencyScore: payload.efficiencyScore }
                : {}),
            ...(payload.bestFor !== undefined
                ? { bestFor: payload.bestFor }
                : {}),
            ...(payload.status !== undefined ? { status: payload.status } : {}),
        };

        return data;
    }
}
