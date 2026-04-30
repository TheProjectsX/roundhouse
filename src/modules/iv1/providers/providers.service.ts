import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/common/services/prisma/prisma.service";
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

type GlobalProviderListItem = Prisma.ProviderGetPayload<{
    include: {
        models: true;
        providerSelections: {
            where: { userId: string };
            select: ProviderListSelection;
        };
    };
}>;

type CustomProviderListItem = Prisma.UserProviderGetPayload<{
    include: {
        models: true;
        providerSelections: {
            where: { userId: string };
            select: ProviderListSelection;
        };
    };
}>;

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

        const sharedInclude = {
            models: true,
            providerSelections: {
                where: { userId: user.id },
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
                },
            },
        } as const;

        const globalProviders = await globalQueryBuilder
            .search(["name", "description"])
            .filter({ exacts: ["status", "type"], booleans: ["free"] })
            .sort()
            .include(sharedInclude)
            .rawFilter({
                status: { notIn: ["INACTIVE", "TESTING", "DEPRECATED"] },
            })
            .execute();

        const customProviders = await customQueryBuilder
            .search(["name", "description"])
            .filter({ exacts: ["status", "type"], booleans: ["free"] })
            .sort()
            .include(sharedInclude)
            .rawFilter({
                userId: user.id,
                status: { notIn: ["INACTIVE", "TESTING", "DEPRECATED"] },
            })
            .execute();

        const formatted = [
            ...(globalProviders as GlobalProviderListItem[]).map((provider) =>
                this.formatProviderListItem(provider, false),
            ),
            ...(customProviders as CustomProviderListItem[]).map((provider) =>
                this.formatProviderListItem(provider, true),
            ),
        ]
            .sort((a, b) => this.sortProviders(a, b, query));

        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const start = (page - 1) * limit;
        const paginated = formatted.slice(start, start + limit);
        const total = formatted.length;

        return {
            message: "Providers fetched",
            data: paginated,
            pagination: {
                page,
                limit,
                total,
                totalPage: Math.ceil(total / limit),
            },
        };
    }

    async fetchSingleProvider(id: string) {
        const provider = await this.prisma.provider.findUnique({
            where: { id },
            include: { models: { where: { status: "ACTIVE" } } },
        });

        return {
            message: "Provider fetched",
            data: provider,
        };
    }

    async fetchProviderModels(id: string) {
        const models = await this.prisma.model.findMany({
            where: { providerId: id, status: "ACTIVE" },
        });

        return {
            message: "Provider models fetched",
            data: models,
        };
    }

    private formatProviderListItem(
        provider: GlobalProviderListItem | CustomProviderListItem,
        isCustom: boolean,
    ) {
        const modelsCount = (provider.models ?? []).length;
        const activeModelsCount = (provider.models ?? []).filter(
            (model) => model.status === "ACTIVE",
        ).length;

        return {
            id: provider.id,
            name: provider.name,
            description: provider.description,
            free: provider.free,
            type: provider.type,
            status: provider.status,
            modelsCount,
            activeModelsCount,
            apiKeys: provider.providerSelections?.[0]?.apiKey,
            connected: provider.providerSelections?.length > 0,
            active: provider.providerSelections?.[0]?.active ?? false,
            isCustom,
            createdAt: provider.createdAt,
            updatedAt: provider.updatedAt,
        };
    }

    private sortProviders(
        a: { [key: string]: any },
        b: { [key: string]: any },
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
