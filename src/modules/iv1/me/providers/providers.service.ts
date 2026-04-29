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

/* eslint-disable @typescript-eslint/no-explicit-any */

@Injectable()
export class MeProvidersService {
    constructor(private prisma: PrismaService) {}

    async fetchAllProviders(query: Record<string, string>) {
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
            message: "Custom providers fetched",
            data: formatted,
            pagination,
        };
    }

    async fetchSingleProvider(id: string, user: UserPayload) {
        void user;
        const customProvider = await this.prisma.userProvider.findUnique({
            where: { id },
            include: { models: true },
        });

        if (!customProvider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        const formatted = {
            id: customProvider.id,
            name: customProvider.name,
            description: customProvider.description,
            free: customProvider.free,
            type: customProvider.type,
            status: customProvider.status,
            models: (customProvider.models ?? []).map((m: any) => ({
                id: m.id,
                name: m.name,
                code: m.code,
                maxTokens: m.maxTokens,
                tokenResetInterval: m.tokenResetInterval,
                efficiencyScore: m.efficiencyScore,
                bestFor: m.bestFor,
                status: m.status,
            })),
            createdAt: customProvider.createdAt,
            updatedAt: customProvider.updatedAt,
        };

        return {
            message: "Provider fetched",
            data: formatted,
        };
    }

    async createProvider(payload: CreateProviderDto, user: UserPayload) {
        void user;

        const created = await this.prisma.userProvider.create({
            data: {
                name: payload.name,
                description: payload.description,
                baseApi: payload.baseApi,
                free: payload.free ?? false,
                type: payload.type ?? ProviderType.CUSTOM,
                status: payload.status ?? ContentStatus.ACTIVE,
                models: payload.model
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
                                  payload.model.status ?? ContentStatus.ACTIVE,
                          },
                      }
                    : undefined,
            },
            include: { models: true },
        });

        return {
            message: "Provider created",
            data: { id: created.id },
        };
    }

    async updateProvider(payload: UpdateProviderDto, user: UserPayload) {
        void user;
        const provider = await this.findCustomProvider(payload.id);

        const updated = await this.prisma.userProvider.update({
            where: { id: provider.id },
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

        return {
            message: "Provider updated",
            data: { id: updated.id },
        };
    }

    async updateProviderStatus(
        payload: UpdateProviderStatusDto,
        user: UserPayload,
    ) {
        void user;
        await this.findCustomProvider(payload.id);

        const updated = await this.prisma.userProvider.update({
            where: { id: payload.id },
            data: { status: payload.status },
            include: { models: true },
        });

        return {
            message: "Provider status updated",
            data: { id: updated.id },
        };
    }

    async deleteProvider(id: string, user: UserPayload) {
        void user;
        await this.findCustomProvider(id);

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
        void user;
        await this.findCustomProvider(providerId);

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
        await this.findCustomProvider(providerId);

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
                status: payload.status ?? ContentStatus.ACTIVE,
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
        await this.findCustomProvider(providerId);

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
        await this.findCustomProvider(providerId);

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
        await this.findCustomProvider(providerId);

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

    private async findCustomProvider(providerId: string) {
        const provider = await this.prisma.userProvider.findUnique({
            where: { id: providerId },
            include: { models: true },
        });

        if (!provider) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        return provider;
    }

    private buildModelUpdateData(payload: UpdateProviderModelDto) {
        const data: Prisma.UserModelUpdateInput = {
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

        return data;
    }
}
