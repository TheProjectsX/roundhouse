import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma, ContentStatus, ProviderType } from "@prisma/client";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import { UserPayload } from "@/common/guards/auth.guard";
import QueryBuilder from "@/common/utils/queryBuilder";
import {
    CreateProviderDto,
    CreateProviderModelDto,
    UpdateProviderDto,
    UpdateProviderModelDto,
    UpdateProviderModelStatusDto,
    UpdateProviderStatusDto,
} from "@/modules/iv1/providers/dto/body.dto";

@Injectable()
export class MeProvidersService {
    constructor(private prisma: PrismaService) {}

    async fetchAllProviders(query: Record<string, string>, user: UserPayload) {
        const queryBuilder = new QueryBuilder<
            typeof this.prisma.userProvider,
            Prisma.$UserProviderPayload
        >(this.prisma.userProvider, query);

        const data = await queryBuilder
            .search(["name", "description", "code"])
            .filter({ exacts: ["status", "type"], booleans: ["free"] })
            .sort()
            .paginate()
            .rawFilter({ userId: user.id })
            .execute();

        const pagination = await queryBuilder.countTotal();

        const formatted = await Promise.all(
            data.map(async (provider) => {
                const [modelsCount, activeModelsCount, connectedApiCount] =
                    await Promise.all([
                        this.prisma.userModel.count({
                            where: {
                                provider: provider.code,
                                userId: user.id,
                            },
                        }),
                        this.prisma.userModel.count({
                            where: {
                                provider: provider.code,
                                userId: user.id,
                                status: ContentStatus.ACTIVE,
                            },
                        }),
                        this.prisma.providerSelection.count({
                            where: {
                                userProviderId: provider.id,
                            },
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
                    connectedApiCount,
                    createdAt: provider.createdAt,
                    updatedAt: provider.updatedAt,
                };
            }),
        );

        return {
            message: "Providers fetched",
            data: formatted,
            pagination,
        };
    }

    async fetchSingleProvider(id: string, user: UserPayload) {
        const provider = await this.prisma.userProvider.findFirst({
            where: {
                userId: user.id,
                id,
            },
        });

        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        const models = await this.prisma.userModel.findMany({
            where: {
                provider: provider.code,
                userId: user.id,
            },
        });

        return {
            message: "Provider fetched",
            data: {
                id: provider.id,
                code: provider.code,
                name: provider.name,
                description: provider.description,
                baseApi: provider.baseApi,
                free: provider.free,
                type: provider.type,
                status: provider.status,
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
                createdAt: provider.createdAt,
                updatedAt: provider.updatedAt,
            },
        };
    }

    async createProvider(payload: CreateProviderDto, user: UserPayload) {
        const created = await this.prisma.userProvider.create({
            data: {
                name: payload.name,
                code: this.buildProviderCode(payload.name, payload.code),
                description: payload.description,
                baseApi: payload.baseApi,
                free: payload.free ?? false,
                type: payload.type ?? ProviderType.CUSTOM,
                status: payload.status ?? ContentStatus.ACTIVE,
                user: { connect: { id: user.id } },
            },
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
        const provider = await this.prisma.userProvider.findFirst({
            where: { id, userId: user.id },
        });

        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        const updated = await this.prisma.userProvider.update({
            where: { id: provider.id },
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
        const provider = await this.prisma.userProvider.findFirst({
            where: { id, userId: user.id },
        });

        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        const updated = await this.prisma.userProvider.update({
            where: { id },
            data: { status: payload.status },
        });

        return {
            message: "Provider status updated",
            data: { id: updated.id },
        };
    }

    async deleteProvider(id: string, user: UserPayload) {
        const provider = await this.prisma.userProvider.findFirst({
            where: { id, userId: user.id },
        });

        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        const deleted = await this.prisma.userProvider.delete({
            where: { id },
        });

        return { message: "Provider deleted", data: { id: deleted.id } };
    }

    async fetchAllProviderModels(
        providerId: string,
        query: Record<string, string>,
        user: UserPayload,
    ) {
        const provider = await this.prisma.userProvider.findFirst({
            where: {
                userId: user.id,
                id: providerId,
            },
        });

        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        const builder = new QueryBuilder<
            typeof this.prisma.userModel,
            Prisma.$UserModelPayload
        >(this.prisma.userModel, query)
            .search(["name", "code"])
            .filter({ exacts: ["status"] })
            .rawFilter({
                provider: provider.code,
                userId: user.id,
            })
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
        const provider = await this.prisma.userProvider.findFirst({
            where: { id: providerId, userId: user.id },
        });

        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        const created = await this.prisma.userModel.create({
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
                user: { connect: { id: user.id } },
            },
        });
        return { message: "Model created", data: { id: created.id } };
    }

    async updateProviderModel(
        modelId: string,
        payload: UpdateProviderModelDto,
        user: UserPayload,
    ) {
        const model = await this.prisma.userModel.findFirst({
            where: { id: modelId, userId: user.id },
        });

        if (!model) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Model not found");
        }

        const updated = await this.prisma.userModel.update({
            where: { id: model.id },
            data: {
                ...payload,
            },
        });

        return { message: "Model updated", data: { id: updated.id } };
    }

    async updateProviderModelStatus(
        modelId: string,
        payload: UpdateProviderModelStatusDto,
        user: UserPayload,
    ) {
        const model = await this.prisma.userModel.findFirst({
            where: { id: modelId, userId: user.id },
        });

        if (!model) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Model not found");
        }

        const updated = await this.prisma.userModel.update({
            where: { id: model.id },
            data: { status: payload.status },
        });

        return { message: "Model status updated", data: { id: updated.id } };
    }

    async deleteProviderModel(modelId: string, user: UserPayload) {
        const model = await this.prisma.userModel.findFirst({
            where: { id: modelId, userId: user.id },
        });

        if (!model) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Model not found");
        }

        const deleted = await this.prisma.userModel.delete({
            where: { id: model.id },
        });
        return { message: "Model deleted", data: { id: deleted.id } };
    }

    private buildProviderCode(name: string, code?: string) {
        return (code ?? name)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }
}
