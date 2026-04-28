import { HttpStatus, Injectable } from "@nestjs/common";
import { ModelStatus, ModelType, Prisma } from "@prisma/client";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import QueryBuilder from "@/common/utils/queryBuilder";
import { UserPayload } from "@/common/guards/auth.guard";
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
export class AdminProvidersService {
    constructor(private prisma: PrismaService) {}

    async fetchAllProviders(query: Record<string, string>) {
        if (query.customOnly) {
            const builder = this.buildCustomProviderQuery(query);
            const [data, pagination] = await Promise.all([
                builder.execute(),
                builder.countTotal(),
            ]);

            return { message: "Providers fetched", data, pagination };
        }

        const builder = this.buildGlobalProviderQuery(query);
        const [data, pagination] = await Promise.all([
            builder.execute(),
            builder.countTotal(),
        ]);

        return { message: "Providers fetched", data, pagination };
    }

    async fetchSingleProvider(id: string) {
        const provider = await this.resolveProviderEntity(id);
        return { message: "Provider fetched", data: provider.record };
    }

    async createProvider(payload: CreateProviderDto, user: UserPayload) {
        void user;

        if (payload.type === ModelType.CUSTOM) {
            const created = await this.prisma.userProvider.create({
                data: {
                    name: payload.name,
                    description: payload.description,
                    baseApi: payload.baseApi,
                    free: payload.free ?? false,
                    type: ModelType.CUSTOM,
                    status: payload.status ?? ModelStatus.ACTIVE,
                    models: payload.model
                        ? {
                              create: {
                                  name: payload.model.name,
                                  code: payload.model.code,
                                  maxTokens: payload.model.maxTokens,
                                  tokenResetInterval:
                                      payload.model.tokenResetInterval,
                                  efficiencyScore:
                                      payload.model.efficiencyScore,
                                  bestFor: payload.model.bestFor ?? [],
                                  status:
                                      payload.model.status ??
                                      ModelStatus.ACTIVE,
                              },
                          }
                        : undefined,
                },
                include: { models: true },
            });

            return { message: "Provider created", data: created };
        }

        const created = await this.prisma.provider.create({
            data: {
                name: payload.name,
                key: this.buildProviderKey(payload.name),
                description: payload.description,
                baseApi: payload.baseApi ?? "",
                free: payload.free ?? false,
                type: payload.type ?? ModelType.OPENAI,
                status: payload.status ?? ModelStatus.ACTIVE,
                model: payload.model
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
                                  payload.model.status ?? ModelStatus.ACTIVE,
                          },
                      }
                    : undefined,
            },
            include: { model: true },
        });

        return { message: "Provider created", data: created };
    }

    async updateProvider(payload: UpdateProviderDto, user: UserPayload) {
        void user;
        const provider = await this.resolveProviderEntity(payload.id);

        if (provider.kind === "global") {
            const updated = await this.prisma.provider.update({
                where: { id: payload.id },
                data: {
                    ...(payload.name !== undefined
                        ? { name: payload.name }
                        : {}),
                    ...(payload.description !== undefined
                        ? { description: payload.description }
                        : {}),
                    ...(payload.baseApi !== undefined
                        ? { baseApi: payload.baseApi }
                        : {}),
                    ...(payload.free !== undefined
                        ? { free: payload.free }
                        : {}),
                    ...(payload.type !== undefined
                        ? { type: payload.type }
                        : {}),
                    ...(payload.status !== undefined
                        ? { status: payload.status }
                        : {}),
                },
                include: { model: true },
            });

            return { message: "Provider updated", data: updated };
        }

        const updated = await this.prisma.userProvider.update({
            where: { id: payload.id },
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

        return { message: "Provider updated", data: updated };
    }

    async updateProviderStatus(
        payload: UpdateProviderStatusDto,
        user: UserPayload,
    ) {
        void user;
        const provider = await this.resolveProviderEntity(payload.id);

        if (provider.kind === "global") {
            const updated = await this.prisma.provider.update({
                where: { id: payload.id },
                data: { status: payload.status },
                include: { model: true },
            });
            return { message: "Provider status updated", data: updated };
        }

        const updated = await this.prisma.userProvider.update({
            where: { id: payload.id },
            data: { status: payload.status },
            include: { models: true },
        });

        return { message: "Provider status updated", data: updated };
    }

    async deleteProvider(id: string, user: UserPayload) {
        void user;
        const provider = await this.resolveProviderEntity(id);

        if (provider.kind === "global") {
            await this.prisma.provider.delete({ where: { id } });
            return { message: "Provider deleted" };
        }

        await this.prisma.userProvider.delete({ where: { id } });
        return { message: "Provider deleted" };
    }

    async fetchAllProviderModels(
        providerId: string,
        query: Record<string, string>,
    ) {
        const provider = await this.resolveProviderEntity(providerId);

        if (provider.kind === "global") {
            const builder = new QueryBuilder(this.prisma.model, query)
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

        const builder = new QueryBuilder(this.prisma.userModel, query)
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
        void user;
        const provider = await this.resolveProviderEntity(providerId);

        if (provider.kind === "global") {
            const created = await this.prisma.model.upsert({
                where: { providerId },
                update: this.buildModelUpdateData({
                    ...payload,
                    modelId: providerId,
                }),
                create: {
                    name: payload.name,
                    code: payload.code,
                    maxTokens: payload.maxTokens,
                    tokenResetInterval: payload.tokenResetInterval,
                    efficiencyScore: payload.efficiencyScore,
                    bestFor: payload.bestFor ?? [],
                    status: payload.status ?? ModelStatus.ACTIVE,
                    provider: { connect: { id: providerId } },
                },
            });

            return { message: "Model created", data: created };
        }

        const created = await this.prisma.userModel.upsert({
            where: { providerId },
            update: this.buildModelUpdateData({
                ...payload,
                modelId: providerId,
            }),
            create: {
                name: payload.name,
                code: payload.code,
                maxTokens: payload.maxTokens,
                tokenResetInterval: payload.tokenResetInterval,
                efficiencyScore: payload.efficiencyScore,
                bestFor: payload.bestFor ?? [],
                status: payload.status ?? ModelStatus.ACTIVE,
                provider: { connect: { id: providerId } },
            },
        });

        return { message: "Model created", data: created };
    }

    async updateProviderModel(
        providerId: string,
        modelId: string,
        payload: UpdateProviderModelDto,
        user: UserPayload,
    ) {
        void user;
        const provider = await this.resolveProviderEntity(providerId);

        if (provider.kind === "global") {
            const current = await this.prisma.model.findUnique({
                where: { id: modelId },
            });
            if (!current || current.providerId !== providerId) {
                throw new ApiError(HttpStatus.NOT_FOUND, "Model not found");
            }

            const updated = await this.prisma.model.update({
                where: { id: modelId },
                data: this.buildModelUpdateData(payload),
            });

            return { message: "Model updated", data: updated };
        }

        const current = await this.prisma.userModel.findUnique({
            where: { id: modelId },
        });
        if (!current || current.providerId !== providerId) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Model not found");
        }

        const updated = await this.prisma.userModel.update({
            where: { id: modelId },
            data: this.buildModelUpdateData(payload),
        });

        return { message: "Model updated", data: updated };
    }

    async updateProviderModelStatus(
        providerId: string,
        payload: UpdateProviderModelStatusDto,
        user: UserPayload,
    ) {
        void user;
        const provider = await this.resolveProviderEntity(providerId);

        if (provider.kind === "global") {
            const current = await this.prisma.model.findUnique({
                where: { id: payload.modelId },
            });
            if (!current || current.providerId !== providerId) {
                throw new ApiError(HttpStatus.NOT_FOUND, "Model not found");
            }

            const updated = await this.prisma.model.update({
                where: { id: payload.modelId },
                data: { status: payload.status },
            });

            return { message: "Model status updated", data: updated };
        }

        const current = await this.prisma.userModel.findUnique({
            where: { id: payload.modelId },
        });
        if (!current || current.providerId !== providerId) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Model not found");
        }

        const updated = await this.prisma.userModel.update({
            where: { id: payload.modelId },
            data: { status: payload.status },
        });

        return { message: "Model status updated", data: updated };
    }

    async deleteProviderModel(
        providerId: string,
        modelId: string,
        user: UserPayload,
    ) {
        void user;
        const provider = await this.resolveProviderEntity(providerId);

        if (provider.kind === "global") {
            const current = await this.prisma.model.findUnique({
                where: { id: modelId },
            });
            if (!current || current.providerId !== providerId) {
                throw new ApiError(HttpStatus.NOT_FOUND, "Model not found");
            }

            await this.prisma.model.delete({ where: { id: modelId } });
            return { message: "Model deleted" };
        }

        const current = await this.prisma.userModel.findUnique({
            where: { id: modelId },
        });
        if (!current || current.providerId !== providerId) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Model not found");
        }

        await this.prisma.userModel.delete({ where: { id: modelId } });
        return { message: "Model deleted" };
    }

    private buildGlobalProviderQuery(query: Record<string, string>) {
        return new QueryBuilder(this.prisma.provider, query)
            .search(["name", "description"])
            .filter({ exacts: ["status", "type"], booleans: ["free"] })
            .sort()
            .paginate()
            .include({ model: true });
    }

    private buildCustomProviderQuery(query: Record<string, string>) {
        return new QueryBuilder(this.prisma.userProvider, query)
            .search(["name", "description"])
            .filter({ exacts: ["status", "type"], booleans: ["free"] })
            .sort()
            .paginate()
            .include({ models: true });
    }

    private async resolveProviderEntity(
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

    private buildProviderKey(name: string) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    private buildModelUpdateData(payload: UpdateProviderModelDto) {
        return {
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
    }
}
