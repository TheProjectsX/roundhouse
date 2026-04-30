import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import { UserPayload } from "@/common/guards/auth.guard";
import QueryBuilder from "@/common/utils/queryBuilder";

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    CreateApiKeyDto,
    CreateApiKeyProviderDto,
    UpdateApiKeyDto,
    UpdateApiKeyProviderModelsDto,
    UpdateApiKeyProviderModelsStatusDto,
    UpdateApiKeyStatusDto,
} from "./dto/body.dto";
import { generateApiKey } from "./apikeys.util";

type ApiKeyDetails = Prisma.ApiKeyGetPayload<{
    include: {
        providerSelections: {
            include: {
                providers: true;
                userProviders: { include: { models: true } };
                providerApiKeys: true;
                modelSelections: {
                    include: { models: true; userModels: true };
                };
            };
        };
    };
}>;

@Injectable()
export class ApikeysService {
    constructor(private prisma: PrismaService) {}

    async fetchAllApiKeys(query: Record<string, string>, user: UserPayload) {
        const queryBuilder = new QueryBuilder<
            typeof this.prisma.apiKey,
            Prisma.$ApiKeyPayload
        >(this.prisma.apiKey, query);

        const data = await queryBuilder
            .search(["name"])
            .filter({ booleans: ["active"] })
            .rawFilter({ userId: user.id })
            .sort()
            .paginate()
            .include({
                providerSelections: {
                    include: {
                        modelSelections: {
                            include: {
                                models: true,
                                userModels: true,
                            },
                        },
                        providerApiKeys: true,
                    },
                },
            })
            .execute();
        const pagination = await queryBuilder.countTotal();

        const formatted = data.map((apiKey) => {
            const providerSelections = apiKey.providerSelections ?? [];
            const providerCount = providerSelections.length;
            let providerApiKeyCount = 0;
            let successfulRequests = 0;

            let modelCount = 0;
            let usedTokens = 0;

            providerSelections.forEach((providerSelection) => {
                const providerApiKeys = providerSelection.providerApiKeys ?? [];
                providerApiKeyCount += providerApiKeys.length;
                successfulRequests += providerApiKeys.reduce(
                    (sum: number, providerApiKey) =>
                        sum + (providerApiKey.successCount ?? 0),
                    0,
                );

                const modelSelections = providerSelection.modelSelections ?? [];
                modelSelections.forEach((modelSelection) => {
                    modelCount +=
                        (modelSelection.models?.length ?? 0) +
                        (modelSelection.userModels?.length ?? 0);
                    usedTokens += modelSelection.usedTokens ?? 0;
                });
            });

            return {
                id: apiKey.id,
                name: apiKey.name,
                active: apiKey.active,
                key: apiKey.key,
                createdAt: apiKey.createdAt,
                updatedAt: apiKey.updatedAt,
                stats: {
                    providerCount,
                    providerApiKeyCount,
                    modelCount,
                    successfulRequests,
                    usedTokens,
                },
            };
        });

        return { message: "API keys fetched", data: formatted, pagination };
    }

    async fetchSingleApiKey(id: string, user: UserPayload) {
        const apiKey = await this.prisma.apiKey.findFirst({
            where: { id, userId: user.id },
            include: {
                providerSelections: {
                    include: {
                        providers: true,
                        userProviders: { include: { models: true } },
                        providerApiKeys: true,
                        modelSelections: {
                            include: { models: true, userModels: true },
                        },
                    },
                },
            },
        });

        if (!apiKey) {
            throw new ApiError(HttpStatus.NOT_FOUND, "ApiKey not found");
        }

        return {
            message: "API key fetched",
            data: this.formatApiKeyDetails(apiKey as ApiKeyDetails),
        };
    }

    async createApiKey(payload: CreateApiKeyDto, user: UserPayload) {
        const created = await this.prisma.apiKey.create({
            data: {
                name: payload.name,
                key: generateApiKey(),
                user: { connect: { id: user.id } },
            },
        });

        return { message: "API key created", data: { id: created.id } };
    }

    async updateApiKey(
        id: string,
        payload: UpdateApiKeyDto,
        user: UserPayload,
    ) {
        const apiKey = await this.prisma.apiKey.findUnique({
            where: { id, userId: user.id },
        });

        if (!apiKey) {
            throw new ApiError(HttpStatus.NOT_FOUND, "ApiKey not found");
        }

        const updated = await this.prisma.apiKey.update({
            where: { id: apiKey.id },
            data: {
                ...(payload.name !== undefined ? { name: payload.name } : {}),
                ...(payload.active !== undefined
                    ? { active: payload.active }
                    : {}),
            },
        });

        return { message: "API key updated", data: { id: updated.id } };
    }

    async updateApiKeyStatus(
        id: string,
        payload: UpdateApiKeyStatusDto,
        user: UserPayload,
    ) {
        const apiKey = await this.prisma.apiKey.findUnique({
            where: { id, userId: user.id },
        });

        if (!apiKey) {
            throw new ApiError(HttpStatus.NOT_FOUND, "ApiKey not found");
        }

        const updated = await this.prisma.apiKey.update({
            where: { id: apiKey.id },
            data: { active: payload.active },
        });

        return { message: "API key status updated", data: { id: updated.id } };
    }

    async deleteApiKey(id: string, user: UserPayload) {
        const apiKey = await this.prisma.apiKey.findUnique({
            where: { id, userId: user.id },
        });

        if (!apiKey) {
            throw new ApiError(HttpStatus.NOT_FOUND, "ApiKey not found");
        }

        const deleted = await this.prisma.apiKey.delete({
            where: { id: apiKey.id },
        });
        return { message: "API key deleted", data: { id: deleted.id } };
    }

    async createApiKeyProvider(
        apiKeyId: string,
        providerId: string,
        payload: CreateApiKeyProviderDto,
        user: UserPayload,
    ) {
        const apiKey = await this.ensureOwnedApiKey(apiKeyId, user.id);

        const providerEntity = await this.resolveProviderEntity(providerId);
        const existingSelection = await this.prisma.providerSelection.findFirst(
            {
                where: {
                    apiKeyId: apiKey.id,
                    OR: [
                        { providerIds: { has: providerId } },
                        { userProviderIds: { has: providerId } },
                    ],
                },
                select: { id: true },
            },
        );

        if (existingSelection) {
            throw new ApiError(
                HttpStatus.CONFLICT,
                "Provider already selected for this API key",
            );
        }

        const providerSelection = await this.prisma.providerSelection.create({
            data: {
                active: true,
                apiKey: { connect: { id: apiKey.id } },
                user: { connect: { id: user.id } },
                ...(providerEntity.kind === "global"
                    ? { providers: { connect: { id: providerEntity.id } } }
                    : {
                          userProviders: { connect: { id: providerEntity.id } },
                      }),
            },
        });

        const providerApiKey = await this.prisma.providerApiKey.create({
            data: {
                providerSelectionId: providerSelection.id,
                key: payload.key.trim(),
                active: payload.active ?? true,
            },
        });

        const modelIds = await this.fetchProviderModelIds(
            providerEntity.kind,
            providerId,
        );

        const modelSelection = await this.prisma.modelSelection.create({
            data: {
                providerSelectionIds: [providerSelection.id],
                ...(providerEntity.kind === "global"
                    ? { modelIds }
                    : { userModelIds: modelIds }),
                active: true,
            } satisfies Prisma.ModelSelectionUncheckedCreateInput,
        });

        await this.prisma.providerSelection.update({
            where: { id: providerSelection.id },
            data: { modelSelectionIds: [modelSelection.id] },
        });

        return {
            message: "Provider selected",
            data: {
                id: providerSelection.id,
                providerApiKeyId: providerApiKey.id,
            },
        };
    }

    async deleteApiKeySelection(
        apiKeyId: string,
        selectionId: string,
        user: UserPayload,
    ) {
        await this.ensureOwnedApiKey(apiKeyId, user.id);

        const providerSelection = await this.ensureOwnedProviderSelection(
            apiKeyId,
            selectionId,
            user.id,
        );

        if (providerSelection.modelSelectionIds.length) {
            await this.prisma.modelSelection.deleteMany({
                where: { id: { in: providerSelection.modelSelectionIds } },
            });
        }

        const deleted = await this.prisma.providerSelection.delete({
            where: { id: providerSelection.id },
        });

        return { message: "Provider deselected", data: { id: deleted.id } };
    }

    async selectApiKeyProviderModels(
        apiKeyId: string,
        providerId: string,
        payload: UpdateApiKeyProviderModelsDto,
        user: UserPayload,
    ) {
        const { providerSelection, kind } =
            await this.ensureOwnedSelectionByProvider(
                apiKeyId,
                providerId,
                user.id,
            );
        const modelSelection = this.getPrimaryModelSelection(providerSelection);
        const validatedModelIds = await this.validateProviderModelIds(
            kind,
            providerId,
            payload.modelIds,
        );

        const uniqueModelIds = Array.from(
            new Set([
                ...(kind === "global"
                    ? modelSelection.modelIds
                    : modelSelection.userModelIds),
                ...validatedModelIds,
            ]),
        );

        const updated = await this.prisma.modelSelection.update({
            where: { id: modelSelection.id },
            data:
                kind === "global"
                    ? { modelIds: uniqueModelIds }
                    : { userModelIds: uniqueModelIds },
        });

        return { message: "Models selected", data: { id: updated.id } };
    }

    async deselectApiKeyProviderModels(
        apiKeyId: string,
        providerId: string,
        payload: UpdateApiKeyProviderModelsDto,
        user: UserPayload,
    ) {
        const { providerSelection, kind } =
            await this.ensureOwnedSelectionByProvider(
                apiKeyId,
                providerId,
                user.id,
            );
        const modelSelection = this.getPrimaryModelSelection(providerSelection);
        const validatedModelIds = await this.validateProviderModelIds(
            kind,
            providerId,
            payload.modelIds,
        );
        const targetIds = new Set(validatedModelIds);

        const updated = await this.prisma.modelSelection.update({
            where: { id: modelSelection.id },
            data:
                kind === "global"
                    ? {
                          modelIds: modelSelection.modelIds.filter(
                              (id) => !targetIds.has(id),
                          ),
                      }
                    : {
                          userModelIds: modelSelection.userModelIds.filter(
                              (id) => !targetIds.has(id),
                          ),
                      },
        });

        return { message: "Models deselected", data: { id: updated.id } };
    }

    async updateApiKeyProviderStatus(
        apiKeyId: string,
        providerId: string,
        payload: UpdateApiKeyProviderModelsStatusDto,
        user: UserPayload,
    ) {
        const { providerSelection } = await this.ensureOwnedSelectionByProvider(
            apiKeyId,
            providerId,
            user.id,
        );

        const updated = await this.prisma.providerSelection.update({
            where: { id: providerSelection.id },
            data: { active: payload.active },
        });

        return { message: "Provider status updated", data: { id: updated.id } };
    }

    async updateApiKeyModelStatus(
        apiKeyId: string,
        modelId: string,
        payload: UpdateApiKeyProviderModelsStatusDto,
        user: UserPayload,
    ) {
        await this.ensureOwnedApiKey(apiKeyId, user.id);

        const modelSelection = await this.prisma.modelSelection.findFirst({
            where: {
                providerSelections: {
                    some: {
                        apiKeyId,
                        apiKey: { userId: user.id },
                    },
                },
                OR: [{ modelIds: { has: modelId } }, { userModelIds: { has: modelId } }],
            },
        });

        if (!modelSelection) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Model selection not found");
        }

        const updated = await this.prisma.modelSelection.update({
            where: { id: modelSelection.id },
            data: { active: payload.active },
        });

        return { message: "Model status updated", data: { id: updated.id } };
    }

    private async ensureOwnedApiKey(id: string, userId: string) {
        const apiKey = await this.prisma.apiKey.findFirst({
            where: { id, userId },
        });

        if (!apiKey) {
            throw new ApiError(HttpStatus.NOT_FOUND, "ApiKey not found");
        }

        return apiKey;
    }

    private async ensureOwnedProviderSelection(
        apiKeyId: string,
        selectionId: string,
        userId: string,
    ) {
        const providerSelection = await this.prisma.providerSelection.findFirst({
            where: {
                id: selectionId,
                apiKeyId,
                apiKey: { userId },
            },
            include: {
                modelSelections: true,
            },
        });

        if (!providerSelection) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                "Provider selection not found",
            );
        }

        return providerSelection;
    }

    private async ensureOwnedSelectionByProvider(
        apiKeyId: string,
        providerId: string,
        userId: string,
    ) {
        await this.ensureOwnedApiKey(apiKeyId, userId);

        const providerSelection = await this.prisma.providerSelection.findFirst({
            where: {
                apiKeyId,
                apiKey: { userId },
                OR: [
                    { providerIds: { has: providerId } },
                    { userProviderIds: { has: providerId } },
                ],
            },
            include: {
                modelSelections: true,
            },
        });

        if (!providerSelection) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                "Provider selection not found",
            );
        }

        return {
            providerSelection,
            kind:
                providerSelection.providerIds.includes(providerId) &&
                !providerSelection.userProviderIds.includes(providerId)
                    ? ("global" as const)
                    : ("custom" as const),
        };
    }

    private getPrimaryModelSelection(providerSelection: {
        modelSelections: Array<{
            id: string;
            modelIds: string[];
            userModelIds: string[];
            active: boolean;
        }>;
    }) {
        const modelSelection = providerSelection.modelSelections?.[0];

        if (!modelSelection) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Model selection not found");
        }

        return modelSelection;
    }

    private async validateProviderModelIds(
        kind: "global" | "custom",
        providerId: string,
        modelIds: string[],
    ) {
        const uniqueModelIds = Array.from(new Set(modelIds));

        if (kind === "global") {
            const models = await this.prisma.model.findMany({
                where: { id: { in: uniqueModelIds }, providerId },
                select: { id: true },
            });

            if (models.length !== uniqueModelIds.length) {
                throw new ApiError(
                    HttpStatus.BAD_REQUEST,
                    "One or more models do not belong to this provider",
                );
            }

            return models.map((model) => model.id);
        }

        const models = await this.prisma.userModel.findMany({
            where: { id: { in: uniqueModelIds }, providerId },
            select: { id: true },
        });

        if (models.length !== uniqueModelIds.length) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "One or more models do not belong to this provider",
            );
        }

        return models.map((model) => model.id);
    }

    private formatApiKeyDetails(apiKey: ApiKeyDetails) {
        return {
            id: apiKey.id,
            name: apiKey.name,
            active: apiKey.active,
            key: apiKey.key,
            createdAt: apiKey.createdAt,
            updatedAt: apiKey.updatedAt,
            providers: apiKey.providerSelections.map((selection) => {
                const globalProvider = selection.providers?.[0];
                const customProvider = selection.userProviders?.[0];
                const provider = globalProvider ?? customProvider;
                const models = selection.modelSelections.flatMap(
                    (modelSelection) => [
                        ...(modelSelection.models ?? []).map((model) => ({
                            id: model.id,
                            name: model.name,
                            code: model.code,
                            maxTokens: model.maxTokens,
                            tokenResetInterval: model.tokenResetInterval,
                            efficiencyScore: model.efficiencyScore,
                            bestFor: model.bestFor,
                            status: model.status,
                            active: modelSelection.active,
                            usedTokens: modelSelection.usedTokens,
                            isCustom: false,
                        })),
                        ...(modelSelection.userModels ?? []).map((model) => ({
                            id: model.id,
                            name: model.name,
                            code: model.code,
                            maxTokens: model.maxTokens,
                            tokenResetInterval: model.tokenResetInterval,
                            efficiencyScore: model.efficiencyScore,
                            bestFor: model.bestFor,
                            status: model.status,
                            active: modelSelection.active,
                            usedTokens: modelSelection.usedTokens,
                            isCustom: true,
                        })),
                    ],
                );

                return {
                    id: selection.id,
                    providerId: provider?.id,
                    name: provider?.name,
                    description: provider?.description,
                    baseApi: provider?.baseApi,
                    free: provider?.free,
                    type: provider?.type,
                    status: provider?.status,
                    active: selection.active,
                    isCustom: !!customProvider,
                    providerApiKeys: selection.providerApiKeys.map(
                        (providerApiKey) =>
                            this.formatProviderApiKey(providerApiKey),
                    ),
                    models,
                    createdAt: selection.createdAt,
                    updatedAt: selection.updatedAt,
                };
            }),
        };
    }

    private formatProviderApiKey(providerApiKey: {
        id: string;
        key: string;
        active: boolean;
        successCount: number;
        createdAt: Date;
        updatedAt: Date;
    }) {
        return {
            id: providerApiKey.id,
            maskedKey: this.maskProviderApiKey(providerApiKey.key),
            active: providerApiKey.active,
            successCount: providerApiKey.successCount,
            createdAt: providerApiKey.createdAt,
            updatedAt: providerApiKey.updatedAt,
        };
    }

    private maskProviderApiKey(key: string) {
        if (key.length <= 8) {
            return `${key.slice(0, 2)}***${key.slice(-2)}`;
        }

        return `${key.slice(0, 4)}***${key.slice(-4)}`;
    }

    private async resolveProviderEntity(providerId: string) {
        const global = await this.prisma.provider.findUnique({
            where: { id: providerId },
            select: { id: true },
        });

        if (global) {
            return { kind: "global" as const, id: global.id };
        }

        const custom = await this.prisma.userProvider.findUnique({
            where: { id: providerId },
            select: { id: true },
        });

        if (!custom) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        return { kind: "custom" as const, id: custom.id };
    }

    private async fetchProviderModelIds(
        kind: "global" | "custom",
        providerId: string,
    ) {
        if (kind === "global") {
            const models = await this.prisma.model.findMany({
                where: { providerId },
                select: { id: true },
            });
            return models.map((model) => model.id);
        }

        const models = await this.prisma.userModel.findMany({
            where: { providerId },
            select: { id: true },
        });
        return models.map((model) => model.id);
    }
}
