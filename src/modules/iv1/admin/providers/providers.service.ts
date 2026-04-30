import { HttpStatus, Injectable } from "@nestjs/common";
import {
    ContentStatus,
    ProviderType,
    Prisma,
    UserProvider,
    Provider,
    Model,
    UserModel,
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
                data.map(async (p) => {
                    const modelsCount = (p.models ?? []).length;
                    const activeModelsCount = (p.models ?? []).filter(
                        (m) => m.status === "ACTIVE",
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
            data.map(async (p) => {
                const modelsCount = p.models.length;
                const activeModelsCount = p.models.filter(
                    (m) => m.status === "ACTIVE",
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

        return { message: "Providers fetched", data: formatted, pagination };
    }

    async fetchSingleProvider(id: string) {
        const provider = await this.resolveProviderEntity(id, true);
        const p = provider.record;

        const formatted = {
            id: p.id,
            name: p.name,
            description: p.description,
            free: p.free,
            type: p.type,
            status: p.status,
            models: p.models?.map((m) => ({
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

    async createProvider(payload: CreateProviderDto) {
        const created = await this.prisma.provider.create({
            data: {
                name: payload.name,
                key: this.buildProviderKey(payload.name),
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
            },
            include: { models: true },
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
                status: payload.status ?? ContentStatus.ACTIVE,
                provider: { connect: { id: providerId } },
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
            .search(["name", "description"])
            .filter({ exacts: ["status", "type"], booleans: ["free"] })
            .sort()
            .paginate()
            .include({ models: true });
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
        full?: boolean,
    ): Promise<
        | { kind: "global"; record: Provider & { models?: Model[] } }
        | { kind: "custom"; record: UserProvider & { models?: UserModel[] } }
    > {
        const global = await this.prisma.provider.findUnique({
            where: { id: providerId },
            include: full ? { models: true } : undefined,
        });

        if (global) {
            return { kind: "global", record: global };
        }

        const custom = await this.prisma.userProvider.findUnique({
            where: { id: providerId },
            include: full ? { models: true } : undefined,
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
}
