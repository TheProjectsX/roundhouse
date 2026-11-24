import { HttpStatus, Injectable } from "@nestjs/common";
import { ContentStatus, Prisma, Provider, UserProvider } from "@prisma/client";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import { UserPayload } from "@/common/guards/auth.guard";
import QueryBuilder from "@/common/utils/queryBuilder";
import { executeModelTest } from "@/core/utils/modelTest.util";
import { notDeletedWhere } from "@/common/utils/softDelete";
import { TestProviderDto } from "./dto/body.dto";

type ProviderListSelection = {
    id: true;
    active: true;
    apiKey: {
        select: {
            id: true;
            active: true;
            key: true;
        };
    };
};

type GlobalProviderListItem = Provider;
type CustomProviderListItem = UserProvider;

@Injectable()
export class ProvidersService {
    constructor(private prisma: PrismaService) {}

    async fetchAllProviders(query: Record<string, string>, user: UserPayload) {
        const globalQueryBuilder = new QueryBuilder<
            typeof this.prisma.provider,
            Prisma.$ProviderPayload
        >(this.prisma.provider, query);

        const customQueryBuilder = new QueryBuilder<
            typeof this.prisma.userProvider,
            Prisma.$UserProviderPayload
        >(this.prisma.userProvider, query);

        const globalProviders = await globalQueryBuilder
            .search(["name", "description", "code"])
            .filter({ exacts: ["status", "type"], booleans: ["free"] })
            .sort()
            .rawFilter({
                status: { notIn: ["INACTIVE", "TESTING", "DEPRECATED"] },
                AND: [notDeletedWhere()],
            })
            .execute();

        const customProviders = await customQueryBuilder
            .search(["name", "description", "code"])
            .filter({ exacts: ["status", "type"], booleans: ["free"] })
            .sort()
            .rawFilter({
                userId: user.id,
            })
            .execute();

        const formatted = [
            ...(await this.formatProviderList(
                globalProviders as GlobalProviderListItem[],
                false,
                user.id,
            )),
            ...(await this.formatProviderList(
                customProviders as CustomProviderListItem[],
                true,
                user.id,
            )),
        ].sort((a, b) => this.sortProviders(a, b, query));


        return {
            message: "Providers fetched",
            data: formatted,
        };
    }

    async fetchSingleProvider(id: string, user: UserPayload) {
        const globalProvider = await this.prisma.provider.findFirst({
            where: {
                id,
                status: { not: ContentStatus.INACTIVE },
                AND: [notDeletedWhere()],
            },
        });

        const customProvider = await this.prisma.userProvider.findFirst({
            where: {
                userId: user.id,
                id,
                status: { not: ContentStatus.INACTIVE },
            },
        });

        if (!globalProvider && !customProvider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        const providers = [
            ...(globalProvider
                ? [await this.formatSingleProvider(globalProvider, false)]
                : []),
            ...(customProvider
                ? [await this.formatSingleProvider(customProvider, true)]
                : []),
        ];

        return {
            message: "Provider fetched",
            data: providers.length === 1 ? providers[0] : providers,
        };
    }

    async fetchProviderModels(id: string, user: UserPayload) {
        const globalProvider = await this.prisma.provider.findFirst({
            where: {
                id,
                status: { not: ContentStatus.INACTIVE },
                AND: [notDeletedWhere()],
            },
        });

        const customProvider = await this.prisma.userProvider.findFirst({
            where: {
                userId: user.id,
                id,
            },
        });

        if (!globalProvider && !customProvider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        const models = [
            ...(globalProvider
                ? (
                      await this.prisma.model.findMany({
                          where: {
                              provider: globalProvider.code,
                              status: ContentStatus.ACTIVE,
                              AND: [notDeletedWhere()],
                          },
                      })
                  ).map((model) => ({ ...model, isCustom: false }))
                : []),
            ...(customProvider
                ? (
                      await this.prisma.userModel.findMany({
                          where: {
                              provider: customProvider.code,
                              userId: user.id,
                              status: ContentStatus.ACTIVE,
                          },
                      })
                  ).map((model) => ({ ...model, isCustom: true }))
                : []),
        ];

        return {
            message: "Provider models fetched",
            data: models,
        };
    }

    async testProvider(
        id: string,
        payload: TestProviderDto,
        user: UserPayload,
    ) {
        const globalProvider = await this.prisma.provider.findFirst({
            where: {
                id,
                status: { not: ContentStatus.INACTIVE },
                AND: [notDeletedWhere()],
            },
        });
        const customProvider = globalProvider
            ? null
            : await this.prisma.userProvider.findFirst({
                  where: { id, userId: user.id },
              });

        const provider = globalProvider ?? customProvider;
        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        let targetModel: { id: string; name: string; code: string } | null =
            null;

        if (payload.modelId) {
            targetModel = globalProvider
                ? await this.prisma.model.findFirst({
                      where: {
                          id: payload.modelId,
                          provider: globalProvider.code,
                          AND: [notDeletedWhere()],
                      },
                      select: { id: true, name: true, code: true },
                  })
                : await this.prisma.userModel.findFirst({
                      where: {
                          id: payload.modelId,
                          provider: customProvider!.code,
                          userId: user.id,
                      },
                      select: { id: true, name: true, code: true },
                  });

            if (!targetModel) {
                throw new ApiError(
                    HttpStatus.NOT_FOUND,
                    "Model not found for this provider",
                );
            }
        } else {
            const activeModels = globalProvider
                ? await this.prisma.model.findMany({
                      where: {
                          provider: globalProvider.code,
                          status: ContentStatus.ACTIVE,
                          AND: [notDeletedWhere()],
                      },
                      select: { id: true, name: true, code: true },
                  })
                : await this.prisma.userModel.findMany({
                      where: {
                          provider: customProvider!.code,
                          userId: user.id,
                          status: ContentStatus.ACTIVE,
                      },
                      select: { id: true, name: true, code: true },
                  });

            if (activeModels.length === 0) {
                throw new ApiError(
                    HttpStatus.BAD_REQUEST,
                    "No active models available for this provider to test",
                );
            }

            targetModel =
                activeModels[Math.floor(Math.random() * activeModels.length)];
        }

        let vaultKey: { id: string; name: string; key: string } | null = null;

        if (payload.apiKeyId) {
            vaultKey = await this.prisma.apiKeysManager.findFirst({
                where: { id: payload.apiKeyId, userId: user.id },
                select: { id: true, name: true, key: true },
            });
        } else {
            // 1. Prefer a vault key already linked to this provider via a ProviderSelection
            const selectionWithKey =
                await this.prisma.providerSelection.findFirst({
                    where: {
                        userId: user.id,
                        ...(globalProvider
                            ? { providerId: provider.id }
                            : { userProviderId: provider.id }),
                        apiKeysManagers: {
                            some: {
                                apiKeysManager: { active: true },
                            },
                        },
                    },
                    include: {
                        apiKeysManagers: {
                            where: { apiKeysManager: { active: true } },
                            include: {
                                apiKeysManager: {
                                    select: { id: true, name: true, key: true },
                                },
                            },
                        },
                    },
                });

            vaultKey =
                selectionWithKey?.apiKeysManagers[0]?.apiKeysManager ?? null;

            // 2. Otherwise match case-insensitively against provider code, type, or name
            if (!vaultKey) {
                const activeKeys = await this.prisma.apiKeysManager.findMany({
                    where: { userId: user.id, active: true },
                    select: {
                        id: true,
                        name: true,
                        key: true,
                        provider: true,
                    },
                });

                const targets = new Set([
                    provider.code.toLowerCase(),
                    provider.type.toLowerCase(),
                    provider.name.toLowerCase(),
                ]);

                const matched =
                    activeKeys.find(
                        (k) =>
                            k.provider &&
                            targets.has(k.provider.trim().toLowerCase()),
                    ) ??
                    activeKeys.find((k) => !k.provider?.trim()) ??
                    null;

                if (matched) {
                    vaultKey = {
                        id: matched.id,
                        name: matched.name,
                        key: matched.key,
                    };
                }
            }
        }

        if (!vaultKey) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "No active Vault Key found for this provider. Add one in Key Vault or select a key.",
            );
        }

        const result = await executeModelTest({
            provider: {
                id: provider.id,
                name: provider.name,
                code: provider.code,
                type: provider.type,
                baseApi: provider.baseApi,
            },
            model: targetModel,
            vaultKey,
        });

        return {
            message: result.success
                ? "Provider test succeeded"
                : "Provider test failed",
            data: result,
        };
    }

    private async formatProviderList(
        providers: Array<GlobalProviderListItem | CustomProviderListItem>,
        isCustom: boolean,
        userId: string,
    ) {
        return Promise.all(
            providers.map(async (provider) =>
                this.formatProviderListItem(provider, isCustom, userId),
            ),
        );
    }

    private async formatProviderListItem(
        provider: GlobalProviderListItem | CustomProviderListItem,
        isCustom: boolean,
        userId: string,
    ) {
        const [modelsCount, activeModelsCount, providerSelections] =
            await Promise.all([
                isCustom
                    ? this.prisma.userModel.count({
                          where: {
                              provider: provider.code,
                              userId,
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
                              userId,
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
                this.prisma.providerSelection.findMany({
                    where: {
                        userId,
                        ...(isCustom
                            ? { userProviderId: provider.id }
                            : { providerId: provider.id }),
                    },
                    select: {
                        id: true,
                        active: true,
                        apiKey: {
                            select: {
                                id: true,
                                active: true,
                                key: true,
                            },
                        },
                    } satisfies ProviderListSelection,
                }),
            ]);

        return {
            id: provider.id,
            code: provider.code,
            name: provider.name,
            description: provider.description,
            free: provider.free,
            type: provider.type,
            status: provider.status,
            baseApi: provider.baseApi,
            modelsCount,
            activeModelsCount,
            apiKeys: providerSelections?.[0]?.apiKey,
            connected: providerSelections.length > 0,
            connectedApiCount: providerSelections.length,
            active: providerSelections?.[0]?.active ?? false,
            isCustom,
            createdAt: provider.createdAt,
            updatedAt: provider.updatedAt,
        };
    }

    private async formatSingleProvider(
        provider: Provider | UserProvider,
        isCustom: boolean,
    ) {
        const models = isCustom
            ? await this.prisma.userModel.findMany({
                  where: {
                      provider: provider.code,
                      userId: (provider as UserProvider).userId,
                      status: ContentStatus.ACTIVE,
                  },
              })
            : await this.prisma.model.findMany({
                  where: {
                      provider: provider.code,
                      status: ContentStatus.ACTIVE,
                      AND: [notDeletedWhere()],
                  },
              });

        return {
            id: provider.id,
            code: provider.code,
            name: provider.name,
            description: provider.description,
            baseApi: provider.baseApi,
            free: provider.free,
            type: provider.type,
            status: provider.status,
            isCustom,
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
                isCustom,
            })),
            createdAt: provider.createdAt,
            updatedAt: provider.updatedAt,
        };
    }

    private sortProviders(
        a: { [key: string]: unknown },
        b: { [key: string]: unknown },
        query: Record<string, string>,
    ) {
        const order = (query.order ?? "").split(",").filter(Boolean);

        if (query.sort) {
            order.push(query.sort === "newest" ? "-createdAt" : "createdAt");
        }

        const sortFields = order.length ? order : ["-createdAt"];

        for (const field of sortFields) {
            const direction = field.startsWith("-") ? -1 : 1;
            const key = field.startsWith("-") ? field.slice(1) : field;
            const aValue = a[key];
            const bValue = b[key];

            if (aValue == null && bValue == null) continue;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            const normalizedA =
                aValue instanceof Date ? aValue.getTime() : aValue;
            const normalizedB =
                bValue instanceof Date ? bValue.getTime() : bValue;

            if (normalizedA < normalizedB) return -1 * direction;
            if (normalizedA > normalizedB) return 1 * direction;
        }

        return 0;
    }
}
