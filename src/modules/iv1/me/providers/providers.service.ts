import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma, ContentStatus, ProviderType, User } from "@prisma/client";
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

/* eslint-disable @typescript-eslint/no-explicit-any */

@Injectable()
export class MeProvidersService {
    constructor(private prisma: PrismaService) {}

    async fetchAllProviders(query: Record<string, string>, user: UserPayload) {
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
            .rawFilter({ userId: user.id })
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
                            userProviderIds: { has: p.id },
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

    async fetchSingleProvider(id: string, user: UserPayload) {
        const provider = await this.prisma.userProvider.findUnique({
            where: { id, userId: user.id },
            include: { models: true },
        });

        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        const formatted = {
            id: provider.id,
            name: provider.name,
            description: provider.description,
            free: provider.free,
            type: provider.type,
            status: provider.status,
            models: (provider.models ?? []).map((m: any) => ({
                id: m.id,
                name: m.name,
                code: m.code,
                maxTokens: m.maxTokens,
                tokenResetInterval: m.tokenResetInterval,
                efficiencyScore: m.efficiencyScore,
                bestFor: m.bestFor,
                status: m.status,
            })),
            createdAt: provider.createdAt,
            updatedAt: provider.updatedAt,
        };

        return {
            message: "Provider fetched",
            data: formatted,
        };
    }

    async createProvider(payload: CreateProviderDto, user: UserPayload) {
        const created = await this.prisma.userProvider.create({
            data: {
                name: payload.name,
                description: payload.description,
                baseApi: payload.baseApi,
                free: payload.free ?? false,
                type: payload.type ?? ProviderType.CUSTOM,
                status: payload.status ?? ContentStatus.ACTIVE,
                user: { connect: { id: user.id } },
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
        const provider = await this.prisma.userProvider.findUnique({
            where: { id, userId: user.id },
        });

        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        const updated = await this.prisma.userProvider.update({
            where: { id: provider.id },
            data: { ...payload },
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
        const provider = await this.prisma.userProvider.findUnique({
            where: { id, userId: user.id },
        });

        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

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
        const provider = await this.prisma.userProvider.findUnique({
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
        const provider = await this.prisma.userProvider.findUnique({
            where: { id: providerId, userId: user.id },
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
            .rawFilter({ providerId: provider.id })
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
        const provider = await this.prisma.userProvider.findUnique({
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
        const model = await this.prisma.userModel.findUnique({
            where: { id: modelId, provider: { userId: user.id } },
            include: { provider: true },
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
        const model = await this.prisma.userModel.findUnique({
            where: { id: modelId, provider: { userId: user.id } },
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
        const model = await this.prisma.userModel.findUnique({
            where: { id: modelId, provider: { userId: user.id } },
        });

        if (!model) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Model not found");
        }

        const deleted = await this.prisma.userModel.delete({
            where: { id: model.id },
        });
        return { message: "Model deleted", data: { id: deleted.id } };
    }
}
