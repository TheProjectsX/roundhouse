import { HttpStatus, Injectable } from "@nestjs/common";
import { ContentStatus, Prisma, Provider, UserProvider } from "@prisma/client";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import { UserPayload } from "@/common/guards/auth.guard";
import QueryBuilder from "@/common/utils/queryBuilder";

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
            })
            .execute();

        const customProviders = await customQueryBuilder
            .search(["name", "description", "code"])
            .filter({ exacts: ["status", "type"], booleans: ["free"] })
            .sort()
            .rawFilter({
                userId: user.id,
                status: { notIn: ["INACTIVE", "TESTING", "DEPRECATED"] },
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

        // const page = Number(query.page) || 1;
        // const limit = Number(query.limit) || 10;
        // const start = (page - 1) * limit;
        // const paginated = formatted.slice(start, start + limit);
        // const total = formatted.length;

        return {
            message: "Providers fetched",
            data: formatted,
            // pagination: {
            //     page,
            //     limit,
            //     total,
            //     totalPage: Math.ceil(total / limit),
            // },
        };
    }

    async fetchSingleProvider(id: string, user: UserPayload) {
        const globalProvider = await this.prisma.provider.findFirst({
            where: {
                id,
                status: { not: ContentStatus.INACTIVE },
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

        const models = [
            ...(globalProvider
                ? (
                      await this.prisma.model.findMany({
                          where: {
                              provider: globalProvider.code,
                              status: ContentStatus.ACTIVE,
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
                          where: { provider: provider.code },
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
            modelsCount,
            activeModelsCount,
            apiKeys: providerSelections?.[0]?.apiKey,
            connected: providerSelections.length > 0,
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
