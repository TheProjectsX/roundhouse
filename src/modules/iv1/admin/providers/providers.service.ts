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

/* eslint-disable @typescript-eslint/no-explicit-any */

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
        const builder = this.buildGlobalProviderQuery(query);
        const [data, pagination] = await Promise.all([
            builder.execute(),
            builder.countTotal(),
        ]);

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

        return { message: "Providers fetched", data: formatted, pagination };
    }

    async fetchSingleProvider(id: string) {
        const provider = await this.resolveProviderEntity(id);
        const p = provider.record as any;

        const models =
            provider.kind === "global"
                ? p.model
                    ? [p.model]
                    : []
                : (p.models ?? []);

        const formatted = {
            id: p.id,
            name: p.name,
            description: p.description,
            free: p.free,
            type: p.type,
            status: p.status,
            models: models.map((m: any) => ({
                id: m.id,
                name: m.name,
                code: m.code,
                maxTokens: m.maxTokens,
                tokenResetInterval: m.tokenResetInterval,
                efficiencyScore: m.efficiencyScore,
                bestFor: m.bestFor,
                status: m.status,
            })),
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };

        return { message: "Provider fetched", data: formatted };
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

            return { message: "Provider created", data: { id: created.id } };
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

        return { message: "Provider created", data: { id: created.id } };
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

            return { message: "Provider updated", data: { id: updated.id } };
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

        return { message: "Provider updated", data: { id: updated.id } };
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
            return {
                message: "Provider status updated",
                data: { id: updated.id },
            };
        }

        const updated = await this.prisma.userProvider.update({
            where: { id: payload.id },
            data: { status: payload.status },
            include: { models: true },
        });

        return { message: "Provider status updated", data: { id: updated.id } };
    }

    async deleteProvider(id: string, user: UserPayload) {
        void user;
        const provider = await this.resolveProviderEntity(id);

        if (provider.kind === "global") {
            const deleted = await this.prisma.provider.delete({
                where: { id },
            });
            return { message: "Provider deleted", data: { id: deleted.id } };
        }

        const deleted = await this.prisma.userProvider.delete({
            where: { id },
        });
        return { message: "Provider deleted", data: { id: deleted.id } };
    }

    async fetchAllProviderModels(
        providerId: string,
        query: Record<string, string>,
    ) {
        const provider = await this.resolveProviderEntity(providerId);

        if (provider.kind === "global") {
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

            return { message: "Model created", data: { id: created.id } };
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

        return { message: "Model created", data: { id: created.id } };
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

            return { message: "Model updated", data: { id: updated.id } };
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

        return { message: "Model updated", data: { id: updated.id } };
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

            return {
                message: "Model status updated",
                data: { id: updated.id },
            };
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

        return { message: "Model status updated", data: { id: updated.id } };
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

            const deleted = await this.prisma.model.delete({
                where: { id: modelId },
            });
            return { message: "Model deleted", data: { id: deleted.id } };
        }

        const current = await this.prisma.userModel.findUnique({
            where: { id: modelId },
        });
        if (!current || current.providerId !== providerId) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Model not found");
        }

        const deleted = await this.prisma.userModel.delete({
            where: { id: modelId },
        });
        return { message: "Model deleted", data: { id: deleted.id } };
    }

    private buildGlobalProviderQuery(query: Record<string, string>) {
        return new QueryBuilder<
            typeof this.prisma.provider,
            Prisma.$ProviderPayload
        >(this.prisma.provider, query)
            .search(["name", "description"])
            .filter({ exacts: ["status", "type"], booleans: ["free"] })
            .sort()
            .paginate()
            .include({ model: true });
    }

    private buildCustomProviderQuery(query: Record<string, string>) {
        return new QueryBuilder<
            typeof this.prisma.userProvider,
            Prisma.$UserProviderPayload
        >(this.prisma.userProvider, query)
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
