import { HttpStatus, Injectable } from "@nestjs/common";
import {
    ContentStatus,
    Prisma,
    ProviderType,
    UserProvider,
    Provider,
} from "@prisma/client";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import QueryBuilder from "@/common/utils/queryBuilder";
import {
    CreateProviderDto,
    CreateProviderModelDto,
    UpdateProviderDto,
    UpdateProviderModelDto,
    UpdateProviderModelStatusDto,
    UpdateProviderStatusDto,
} from "./dto/body.dto";

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
                data.map(async (provider) =>
                    this.formatProviderSummary(provider, true),
                ),
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
            data.map(async (provider) =>
                this.formatProviderSummary(provider, false),
            ),
        );

        return { message: "Providers fetched", data: formatted, pagination };
    }

    async fetchSingleProvider(id: string) {
        const provider = await this.resolveProviderEntity(id);
        const models = await this.fetchModelsForProvider(provider);

        return {
            message: "Provider fetched",
            data: {
                id: provider.record.id,
                code: provider.record.code,
                name: provider.record.name,
                description: provider.record.description,
                baseApi: provider.record.baseApi,
                free: provider.record.free,
                type: provider.record.type,
                status: provider.record.status,
                isCustom: provider.kind === "custom",
                models: models.map((model) => ({
                    id: model.id,
                    name: model.name,
                    code: model.code,
                    maxTokens: model.maxTokens,
                    tokenResetInterval: model.tokenResetInterval,
                    efficiencyScore: model.efficiencyScore,
                    bestFor: model.bestFor,
                    thinking: model.thinking,
                    status: model.status,
                })),
                createdAt: provider.record.createdAt,
                updatedAt: provider.record.updatedAt,
            },
        };
    }

    async createProvider(payload: CreateProviderDto) {
        const code = this.buildProviderCode(payload.name, payload.code);
        const created = await this.prisma.provider.create({
            data: {
                name: payload.name,
                code,
                description: payload.description,
                baseApi: payload.baseApi ?? "",
                free: payload.free ?? false,
                type: payload.type ?? ProviderType.OPENAI,
                status: payload.status ?? ContentStatus.ACTIVE,
            },
        });

        return { message: "Provider created", data: { id: created.id } };
    }

    async updateProvider(id: string, payload: UpdateProviderDto) {
        const provider = await this.prisma.provider.findUnique({
            where: { id },
        });

        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        const updated = await this.prisma.provider.update({
            where: { id },
            data: {
                ...payload,
                ...(payload.code || payload.name
                    ? {
                          code: this.buildProviderCode(
                              payload.name ?? provider.name,
                              payload.code ?? provider.code,
                          ),
                      }
                    : {}),
            },
        });

        return { message: "Provider updated", data: { id: updated.id } };
    }

    async updateProviderStatus(id: string, payload: UpdateProviderStatusDto) {
        const provider = await this.prisma.provider.findUnique({
            where: { id },
        });
        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        const updated = await this.prisma.provider.update({
            where: { id },
            data: { status: payload.status },
        });

        return { message: "Provider status updated", data: { id: updated.id } };
    }

    async deleteProvider(id: string) {
        const provider = await this.prisma.provider.findUnique({
            where: { id },
        });

        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        const deleted = await this.prisma.provider.delete({
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
                .rawFilter({ provider: provider.record.code })
                .sort()
                .paginate();

            const [data, pagination] = await Promise.all([
                builder.execute(),
                builder.countTotal(),
            ]);

            const enriched = await Promise.all(
                data.map((model) => this.formatModelSummary(model, false)),
            );

            return { message: "Models fetched", data: enriched, pagination };
        }

        const builder = new QueryBuilder<
            typeof this.prisma.userModel,
            Prisma.$UserModelPayload
        >(this.prisma.userModel, query)
            .search(["name", "code"])
            .filter({ exacts: ["status"] })
            .rawFilter({
                provider: provider.record.code,
                userId: provider.record.userId,
            })
            .sort()
            .paginate();

        const [data, pagination] = await Promise.all([
            builder.execute(),
            builder.countTotal(),
        ]);

        const enriched = await Promise.all(
            data.map((model) => this.formatModelSummary(model, true)),
        );

        return { message: "Models fetched", data: enriched, pagination };
    }

    private async formatModelSummary(model: any, isCustom: boolean) {
        const stats = await this.prisma.modelSelection.aggregate({
            where: isCustom ? { userModelId: model.id } : { modelId: model.id },
            _sum: {
                tokenUsage: true,
                successCount: true,
                failureCount: true,
            },
            _max: {
                lastUsedAt: true,
            },
        });

        const totalSuccess = stats._sum.successCount || 0;
        const totalFailure = stats._sum.failureCount || 0;
        const totalRequests = totalSuccess + totalFailure;
        const successRate =
            totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 0;

        return {
            ...model,
            totalTokenUsage: stats._sum.tokenUsage || 0,
            totalSuccessCount: totalSuccess,
            totalFailureCount: totalFailure,
            successRate,
            lastUsedAt: stats._max.lastUsedAt,
        };
    }

    async createProviderModel(
        providerId: string,
        payload: CreateProviderModelDto,
    ) {
        const provider = await this.prisma.provider.findUnique({
            where: { id: providerId },
        });
        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        const created = await this.prisma.model.create({
            data: {
                name: payload.name,
                code: payload.code,
                maxTokens: payload.maxTokens,
                tokenResetInterval: payload.tokenResetInterval,
                efficiencyScore: payload.efficiencyScore,
                bestFor: payload.bestFor ?? [],
                thinking: payload.thinking ?? false,
                status: payload.status ?? ContentStatus.ACTIVE,
                provider: provider.code,
            },
        });

        return { message: "Model created", data: { id: created.id } };
    }

    async updateProviderModel(
        modelId: string,
        payload: UpdateProviderModelDto,
    ) {
        const model = await this.prisma.model.findUnique({
            where: { id: modelId },
        });

        if (!model) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Model not found");
        }

        const updated = await this.prisma.model.update({
            where: { id: modelId },
            data: { ...payload },
        });

        return { message: "Model updated", data: { id: updated.id } };
    }

    async updateProviderModelStatus(
        modelId: string,
        payload: UpdateProviderModelStatusDto,
    ) {
        const model = await this.prisma.model.findUnique({
            where: { id: modelId },
        });

        if (!model) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Model not found");
        }

        const updated = await this.prisma.model.update({
            where: { id: modelId },
            data: { status: payload.status },
        });

        return { message: "Model status updated", data: { id: updated.id } };
    }

    async deleteProviderModel(modelId: string) {
        const model = await this.prisma.model.findUnique({
            where: { id: modelId },
        });

        if (!model) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Model not found");
        }

        const deleted = await this.prisma.model.delete({
            where: { id: modelId },
        });

        return { message: "Model deleted", data: { id: deleted.id } };
    }

    private buildGlobalProviderQuery(query: Record<string, string>) {
        return new QueryBuilder<
            typeof this.prisma.provider,
            Prisma.$ProviderPayload
        >(this.prisma.provider, query)
            .search(["name", "description", "code"])
            .filter({ exacts: ["status", "type"], booleans: ["free"] })
            .sort()
            .paginate();
    }

    private buildCustomProviderQuery(query: Record<string, string>) {
        return new QueryBuilder<
            typeof this.prisma.userProvider,
            Prisma.$UserProviderPayload
        >(this.prisma.userProvider, query)
            .search(["name", "description", "code"])
            .filter({
                exacts: ["status", "type"],
                booleans: ["free"],
                exclude: ["customOnly"],
            })
            .sort()
            .paginate();
    }

    private async resolveProviderEntity(
        providerId: string,
    ): Promise<
        | { kind: "global"; record: Provider }
        | { kind: "custom"; record: UserProvider }
    > {
        const global = await this.prisma.provider.findFirst({
            where: {
                id: providerId,
            },
        });

        if (global) {
            return { kind: "global", record: global };
        }

        const custom = await this.prisma.userProvider.findFirst({
            where: {
                id: providerId,
            },
        });

        if (!custom) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        return { kind: "custom", record: custom };
    }

    private async fetchModelsForProvider(
        provider:
            | { kind: "global"; record: Provider }
            | { kind: "custom"; record: UserProvider },
    ) {
        if (provider.kind === "global") {
            return this.prisma.model.findMany({
                where: { provider: provider.record.code },
            });
        }

        return this.prisma.userModel.findMany({
            where: {
                provider: provider.record.code,
                userId: provider.record.userId,
            },
        });
    }

    private async formatProviderSummary(
        provider: Provider | UserProvider,
        isCustom: boolean,
    ) {
        const [
            modelsCount,
            activeModelsCount,
            connectedApiCount,
            stats,
            uniqueUsers,
        ] = await Promise.all([
            isCustom
                ? this.prisma.userModel.count({
                      where: {
                          provider: provider.code,
                          userId: (provider as UserProvider).userId,
                      },
                  })
                : this.prisma.model.count({
                      where: { provider: provider.code },
                  }),
            isCustom
                ? this.prisma.userModel.count({
                      where: {
                          provider: provider.code,
                          userId: (provider as UserProvider).userId,
                          status: ContentStatus.ACTIVE,
                      },
                  })
                : this.prisma.model.count({
                      where: {
                          provider: provider.code,
                          status: ContentStatus.ACTIVE,
                      },
                  }),
            this.prisma.providerSelection.count({
                where: isCustom
                    ? { userProviderId: provider.id }
                    : { providerId: provider.id },
            }),
            this.prisma.modelSelection.aggregate({
                where: {
                    providerSelection: isCustom
                        ? { userProviderId: provider.id }
                        : { providerId: provider.id },
                },
                _sum: {
                    tokenUsage: true,
                    successCount: true,
                    failureCount: true,
                },
                _max: {
                    lastUsedAt: true,
                },
            }),
            this.prisma.providerSelection.groupBy({
                by: ["userId"],
                where: isCustom
                    ? { userProviderId: provider.id }
                    : { providerId: provider.id },
            }),
        ]);

        const totalSuccess = stats._sum.successCount || 0;
        const totalFailure = stats._sum.failureCount || 0;
        const totalRequests = totalSuccess + totalFailure;
        const successRate =
            totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 0;

        return {
            id: provider.id,
            code: provider.code,
            name: provider.name,
            description: provider.description,
            baseApi: provider.baseApi,
            free: provider.free,
            type: provider.type,
            status: provider.status,
            modelsCount,
            activeModelsCount,
            connectedApiCount,
            totalTokenUsage: stats._sum.tokenUsage || 0,
            totalSuccessCount: totalSuccess,
            totalFailureCount: totalFailure,
            successRate,
            uniqueUsersCount: uniqueUsers.length,
            lastUsedAt: stats._max.lastUsedAt,
            isCustom,
            createdAt: provider.createdAt,
            updatedAt: provider.updatedAt,
        };
    }

    private buildProviderCode(name: string, code?: string) {
        return (code ?? name)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }
}
