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
import { listProviderModels } from "@/core/models";
import {
    deletedOnlyWhere,
    isSoftDeleted,
    notDeletedWhere,
} from "@/common/utils/softDelete";
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

    async fetchDeletedProviders(query: Record<string, string>) {
        const builder = new QueryBuilder<
            typeof this.prisma.provider,
            Prisma.$ProviderPayload
        >(this.prisma.provider, query)
            .search(["name", "description", "code"])
            .filter({ exacts: ["status", "type"], booleans: ["free"] })
            .rawFilter(deletedOnlyWhere())
            .sort()
            .paginate();

        const [data, pagination] = await Promise.all([
            builder.execute(),
            builder.countTotal(),
        ]);

        const formatted = await Promise.all(
            data.map((provider) => this.formatProviderSummary(provider, false)),
        );

        return {
            message: "Deleted providers fetched",
            data: formatted,
            pagination,
        };
    }

    async fetchDeletedModels(query: Record<string, string>) {
        const rawFilter: Prisma.ModelWhereInput = {
            ...deletedOnlyWhere(),
            ...(query.provider ? { provider: query.provider } : {}),
        };

        const builder = new QueryBuilder<
            typeof this.prisma.model,
            Prisma.$ModelPayload
        >(this.prisma.model, query)
            .search(["name", "code", "provider"])
            .filter({ exacts: ["status"], exclude: ["provider", "providerId"] })
            .rawFilter(rawFilter)
            .include({
                providerRef: {
                    select: { id: true, name: true, code: true, deletedAt: true },
                },
            })
            .sort()
            .paginate();

        const [data, pagination] = await Promise.all([
            builder.execute(),
            builder.countTotal(),
        ]);

        const formatted = await Promise.all(
            data.map((model) => this.formatModelSummary(model, false)),
        );

        return {
            message: "Deleted models fetched",
            data: formatted,
            pagination,
        };
    }

    async createProvider(payload: CreateProviderDto) {
        const code = this.buildProviderCode(payload.name, payload.code);
        const existing = await this.prisma.provider.findUnique({
            where: { code },
            select: { id: true, deletedAt: true },
        });
        if (existing) {
            if (isSoftDeleted(existing)) {
                throw new ApiError(
                    HttpStatus.CONFLICT,
                    "A deleted provider with this code is in the bin. Restore or permanently delete it first.",
                );
            }
            throw new ApiError(
                HttpStatus.CONFLICT,
                "A provider with this code already exists.",
            );
        }

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
        if (isSoftDeleted(provider)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "Provider is in the bin. Restore it before updating.",
            );
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
        if (isSoftDeleted(provider)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "Provider is in the bin. Restore it before updating status.",
            );
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
        if (isSoftDeleted(provider)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "Provider is already in the bin",
            );
        }

        const deleted = await this.prisma.provider.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return { message: "Provider moved to bin", data: { id: deleted.id } };
    }

    async restoreProvider(id: string) {
        const provider = await this.prisma.provider.findUnique({
            where: { id },
        });

        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }
        if (!isSoftDeleted(provider)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "Provider is not in the bin",
            );
        }

        const restored = await this.prisma.provider.update({
            where: { id },
            data: { deletedAt: null },
        });
        return { message: "Provider restored", data: { id: restored.id } };
    }

    async permanentDeleteProvider(id: string) {
        const provider = await this.prisma.provider.findUnique({
            where: { id },
        });

        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        await this.prisma.$transaction(async (tx) => {
            const models = await tx.model.findMany({
                where: { provider: provider.code },
                select: { id: true },
            });
            const modelIds = models.map((m) => m.id);

            const selections = await tx.providerSelection.findMany({
                where: { providerId: id },
                select: { id: true },
            });
            const selectionIds = selections.map((s) => s.id);

            const modelSelectionFilter: Prisma.ModelSelectionWhereInput[] = [];
            if (selectionIds.length > 0) {
                modelSelectionFilter.push({
                    providerSelectionId: { in: selectionIds },
                });
            }
            if (modelIds.length > 0) {
                modelSelectionFilter.push({ modelId: { in: modelIds } });
            }

            if (modelSelectionFilter.length > 0) {
                const modelSelections = await tx.modelSelection.findMany({
                    where: { OR: modelSelectionFilter },
                    select: { id: true },
                });
                const modelSelectionIds = modelSelections.map((ms) => ms.id);

                if (modelSelectionIds.length > 0) {
                    await tx.lastError.deleteMany({
                        where: { modelId: { in: modelSelectionIds } },
                    });
                    await tx.modelSelection.deleteMany({
                        where: { id: { in: modelSelectionIds } },
                    });
                }
            }

            if (selectionIds.length > 0) {
                await tx.providerSelectionApiKeysManager.deleteMany({
                    where: { providerSelectionId: { in: selectionIds } },
                });
                await tx.providerSelection.deleteMany({
                    where: { id: { in: selectionIds } },
                });
            }

            if (modelIds.length > 0) {
                await tx.model.deleteMany({
                    where: { id: { in: modelIds } },
                });
            }

            await tx.provider.delete({
                where: { id },
            });
        });

        return { message: "Provider permanently deleted", data: { id } };
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
                .rawFilter({
                    provider: provider.record.code,
                    AND: [notDeletedWhere()],
                })
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
        if (isSoftDeleted(provider)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "Provider is in the bin. Restore it before adding models.",
            );
        }

        const existingModel = await this.prisma.model.findUnique({
            where: {
                code_provider: {
                    code: payload.code,
                    provider: provider.code,
                },
            },
            select: { id: true, deletedAt: true },
        });
        if (existingModel) {
            if (isSoftDeleted(existingModel)) {
                throw new ApiError(
                    HttpStatus.CONFLICT,
                    "A deleted model with this code is in the bin. Restore or permanently delete it first.",
                );
            }
            throw new ApiError(
                HttpStatus.CONFLICT,
                "A model with this code already exists for this provider.",
            );
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
        if (isSoftDeleted(model)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "Model is in the bin. Restore it before updating.",
            );
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
        if (isSoftDeleted(model)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "Model is in the bin. Restore it before updating status.",
            );
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
        if (isSoftDeleted(model)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "Model is already in the bin",
            );
        }

        const deleted = await this.prisma.model.update({
            where: { id: modelId },
            data: { deletedAt: new Date() },
        });

        return { message: "Model moved to bin", data: { id: deleted.id } };
    }

    async restoreProviderModel(modelId: string) {
        const model = await this.prisma.model.findUnique({
            where: { id: modelId },
            include: {
                providerRef: {
                    select: { id: true, name: true, deletedAt: true },
                },
            },
        });

        if (!model) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Model not found");
        }
        if (!isSoftDeleted(model)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "Model is not in the bin",
            );
        }
        if (isSoftDeleted(model.providerRef)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                `Restore provider "${model.providerRef.name}" before restoring this model.`,
            );
        }

        const restored = await this.prisma.model.update({
            where: { id: modelId },
            data: { deletedAt: null },
        });

        return { message: "Model restored", data: { id: restored.id } };
    }

    async permanentDeleteProviderModel(modelId: string) {
        const model = await this.prisma.model.findUnique({
            where: { id: modelId },
        });

        if (!model) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Model not found");
        }

        await this.prisma.$transaction(async (tx) => {
            const selections = await tx.modelSelection.findMany({
                where: { modelId },
                select: { id: true },
            });
            const selectionIds = selections.map((s) => s.id);

            if (selectionIds.length > 0) {
                await tx.lastError.deleteMany({
                    where: { modelId: { in: selectionIds } },
                });
                await tx.modelSelection.deleteMany({
                    where: { id: { in: selectionIds } },
                });
            }

            await tx.model.delete({
                where: { id: modelId },
            });
        });

        return { message: "Model permanently deleted", data: { id: modelId } };
    }

    private buildGlobalProviderQuery(query: Record<string, string>) {
        return new QueryBuilder<
            typeof this.prisma.provider,
            Prisma.$ProviderPayload
        >(this.prisma.provider, query)
            .search(["name", "description", "code"])
            .filter({ exacts: ["status", "type"], booleans: ["free"] })
            .rawFilter({ AND: [notDeletedWhere()] })
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
                where: {
                    provider: provider.record.code,
                    AND: [notDeletedWhere()],
                },
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
                      where: {
                          provider: provider.code,
                          AND: [notDeletedWhere()],
                      },
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
                          AND: [notDeletedWhere()],
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
            deletedAt: !isCustom ? ((provider as Provider).deletedAt ?? null) : null,
            createdAt: provider.createdAt,
            updatedAt: provider.updatedAt,
        };
    }

    async syncProviderModels(
        id: string,
        options?: { apiKey?: string; freeOnly?: boolean },
    ) {
        const provider = await this.prisma.provider.findUnique({
            where: { id },
        });

        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }
        if (isSoftDeleted(provider)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "Provider is in the bin. Restore it before syncing models.",
            );
        }

        const isOpenRouter =
            provider.code.toLowerCase().includes("openrouter") ||
            provider.baseApi.toLowerCase().includes("openrouter.ai");

        type SyncCandidate = {
            code: string;
            name: string;
            contextWindow?: number;
            maxTokens?: number;
            supportsTools?: boolean;
            supportsVision?: boolean;
        };

        let candidates: SyncCandidate[] = [];

        if (isOpenRouter) {
            const response = await fetch("https://openrouter.ai/api/v1/models");
            if (!response.ok) {
                throw new ApiError(
                    HttpStatus.BAD_GATEWAY,
                    "Failed to fetch OpenRouter catalog",
                );
            }
            const payload = (await response.json()) as {
                data?: Array<{
                    id?: string;
                    name?: string;
                    context_length?: number;
                    top_provider?: { max_completion_tokens?: number | null };
                    pricing?: { prompt?: string; completion?: string };
                    supported_parameters?: string[];
                    architecture?: {
                        input_modalities?: string[];
                        modality?: string;
                    };
                }>;
            };

            const rows = Array.isArray(payload.data) ? payload.data : [];
            candidates = rows
                .filter((row) => {
                    if (!row.id) return false;
                    if (!options?.freeOnly) return true;
                    const isFreeId = row.id.endsWith(":free");
                    const isZeroPrice =
                        row.pricing?.prompt === "0" &&
                        row.pricing?.completion === "0";
                    return isFreeId || isZeroPrice;
                })
                .map((row) => {
                    const inputModalities =
                        row.architecture?.input_modalities ?? [];
                    const modalityStr = row.architecture?.modality ?? "";
                    const supportsVision =
                        inputModalities.includes("image") ||
                        modalityStr.includes("image");
                    const supportsTools = Array.isArray(
                        row.supported_parameters,
                    )
                        ? row.supported_parameters.includes("tools")
                        : undefined;

                    return {
                        code: row.id!,
                        name: row.name || row.id!,
                        contextWindow:
                            typeof row.context_length === "number" &&
                            row.context_length > 0
                                ? row.context_length
                                : undefined,
                        maxTokens:
                            typeof row.top_provider?.max_completion_tokens ===
                                "number" &&
                            row.top_provider.max_completion_tokens > 0
                                ? row.top_provider.max_completion_tokens
                                : undefined,
                        supportsTools,
                        supportsVision,
                    };
                });
        } else {
            const upstream = await listProviderModels(provider.type, {
                baseApi: provider.baseApi,
                apiKey: options?.apiKey,
                headers: {},
                request: {
                    model: "gpt-4o-mini",
                    messages: [],
                    stream: false,
                    params: {},
                    rawBody: {},
                },
            });

            candidates = upstream.map((item) => ({
                code: item.id,
                name: item.id,
            }));
        }

        let createdCount = 0;
        let updatedCount = 0;

        for (const item of candidates) {
            const existing = await this.prisma.model.findUnique({
                where: {
                    code_provider: {
                        code: item.code,
                        provider: provider.code,
                    },
                },
                select: { id: true, deletedAt: true },
            });

            if (existing) {
                if (isSoftDeleted(existing)) {
                    continue;
                }
                await this.prisma.model.update({
                    where: { id: existing.id },
                    data: {
                        name: item.name,
                        ...(item.contextWindow !== undefined
                            ? { contextWindow: item.contextWindow }
                            : {}),
                        ...(item.maxTokens !== undefined
                            ? { maxTokens: item.maxTokens }
                            : {}),
                        ...(item.supportsTools !== undefined
                            ? { supportsTools: item.supportsTools }
                            : {}),
                        ...(item.supportsVision !== undefined
                            ? { supportsVision: item.supportsVision }
                            : {}),
                    },
                });
                updatedCount += 1;
            } else {
                await this.prisma.model.create({
                    data: {
                        name: item.name,
                        code: item.code,
                        provider: provider.code,
                        contextWindow: item.contextWindow,
                        maxTokens: item.maxTokens,
                        supportsTools: item.supportsTools,
                        supportsVision: item.supportsVision,
                        status: ContentStatus.ACTIVE,
                    },
                });
                createdCount += 1;
            }
        }

        return {
            message: "Provider models synced",
            data: {
                syncedCount: candidates.length,
                createdCount,
                updatedCount,
            },
        };
    }

    private buildProviderCode(name: string, code?: string) {
        return (code ?? name)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }
}
