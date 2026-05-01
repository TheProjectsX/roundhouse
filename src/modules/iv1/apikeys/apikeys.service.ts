import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import { UserPayload } from "@/common/guards/auth.guard";
import QueryBuilder from "@/common/utils/queryBuilder";
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
                provider: true;
                userProvider: true;
                providerApiKeys: true;
                models: true;
                userModels: true;
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
                        providerApiKeys: true,
                        models: true,
                        userModels: true,
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

            providerSelections.forEach((providerSelection) => {
                const providerApiKeys = providerSelection.providerApiKeys ?? [];
                providerApiKeyCount += providerApiKeys.length;
                successfulRequests += providerApiKeys.reduce(
                    (sum, providerApiKey) =>
                        sum + (providerApiKey.successCount ?? 0),
                    0,
                );

                modelCount +=
                    (providerSelection.models?.length ?? 0) +
                    (providerSelection.userModels?.length ?? 0);
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
                        provider: true,
                        userProvider: true,
                        providerApiKeys: true,
                        models: true,
                        userModels: true,
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
        const apiKey = await this.ensureOwnedApiKey(id, user.id);

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
        const apiKey = await this.ensureOwnedApiKey(id, user.id);

        const updated = await this.prisma.apiKey.update({
            where: { id: apiKey.id },
            data: { active: payload.active },
        });

        return { message: "API key status updated", data: { id: updated.id } };
    }

    async deleteApiKey(id: string, user: UserPayload) {
        const apiKey = await this.ensureOwnedApiKey(id, user.id);

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
        const providerEntity = await this.resolveProviderEntity(
            providerId,
            user.id,
        );

        const existingSelection = await this.prisma.providerSelection.findFirst(
            {
                where: {
                    apiKeyId: apiKey.id,
                    ...(providerEntity.kind === "global"
                        ? { providerId: providerEntity.id }
                        : { userProviderId: providerEntity.id }),
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

        const modelIds = await this.fetchProviderModelIds(providerEntity);

        const providerSelection = await this.prisma.providerSelection.create({
            data: {
                active: true,
                apiKeyId: apiKey.id,
                userId: user.id,
                providerId:
                    providerEntity.kind === "global"
                        ? providerEntity.id
                        : undefined,
                userProviderId:
                    providerEntity.kind === "custom"
                        ? providerEntity.id
                        : undefined,
                modelIds: providerEntity.kind === "global" ? modelIds : [],
                userModelIds: providerEntity.kind === "custom" ? modelIds : [],
                inactiveModelIds: [],
                inactiveUserModelIds: [],
            } satisfies Prisma.ProviderSelectionUncheckedCreateInput,
        });

        const providerApiKey = await this.prisma.providerApiKey.create({
            data: {
                providerSelectionId: providerSelection.id,
                key: payload.key.trim(),
                active: payload.active ?? true,
            },
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
        const selection = await this.ensureOwnedSelectionByProvider(
            apiKeyId,
            providerId,
            user.id,
        );
        const validatedModelIds = await this.validateProviderModelIds(
            selection,
            payload.modelIds,
        );

        if (selection.kind === "global") {
            const currentIds = new Set(selection.providerSelection.modelIds);
            validatedModelIds.forEach((id) => currentIds.add(id));

            const updated = await this.prisma.providerSelection.update({
                where: { id: selection.providerSelection.id },
                data: {
                    modelIds: [...currentIds],
                    inactiveModelIds:
                        selection.providerSelection.inactiveModelIds.filter(
                            (id) => !validatedModelIds.includes(id),
                        ),
                },
            });

            return { message: "Models selected", data: { id: updated.id } };
        }

        const currentIds = new Set(selection.providerSelection.userModelIds);
        validatedModelIds.forEach((id) => currentIds.add(id));

        const updated = await this.prisma.providerSelection.update({
            where: { id: selection.providerSelection.id },
            data: {
                userModelIds: [...currentIds],
                inactiveUserModelIds:
                    selection.providerSelection.inactiveUserModelIds.filter(
                        (id) => !validatedModelIds.includes(id),
                    ),
            },
        });

        return { message: "Models selected", data: { id: updated.id } };
    }

    async deselectApiKeyProviderModels(
        apiKeyId: string,
        providerId: string,
        payload: UpdateApiKeyProviderModelsDto,
        user: UserPayload,
    ) {
        const selection = await this.ensureOwnedSelectionByProvider(
            apiKeyId,
            providerId,
            user.id,
        );
        const validatedModelIds = await this.validateProviderModelIds(
            selection,
            payload.modelIds,
        );
        const targetIds = new Set(validatedModelIds);

        const updated = await this.prisma.providerSelection.update({
            where: { id: selection.providerSelection.id },
            data:
                selection.kind === "global"
                    ? {
                          modelIds: selection.providerSelection.modelIds.filter(
                              (id) => !targetIds.has(id),
                          ),
                          inactiveModelIds:
                              selection.providerSelection.inactiveModelIds.filter(
                                  (id) => !targetIds.has(id),
                              ),
                      }
                    : {
                          userModelIds:
                              selection.providerSelection.userModelIds.filter(
                                  (id) => !targetIds.has(id),
                              ),
                          inactiveUserModelIds:
                              selection.providerSelection.inactiveUserModelIds.filter(
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

        const providerSelection = await this.prisma.providerSelection.findFirst(
            {
                where: {
                    apiKeyId,
                    apiKey: { userId: user.id },
                    OR: [
                        { modelIds: { has: modelId } },
                        { userModelIds: { has: modelId } },
                    ],
                },
            },
        );

        if (!providerSelection) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                "Model selection not found",
            );
        }

        const isGlobalModel = providerSelection.modelIds.includes(modelId);
        const inactiveIds = isGlobalModel
            ? new Set(providerSelection.inactiveModelIds)
            : new Set(providerSelection.inactiveUserModelIds);

        if (payload.active) {
            inactiveIds.delete(modelId);
        } else {
            inactiveIds.add(modelId);
        }

        const updated = await this.prisma.providerSelection.update({
            where: { id: providerSelection.id },
            data: isGlobalModel
                ? { inactiveModelIds: [...inactiveIds] }
                : { inactiveUserModelIds: [...inactiveIds] },
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
        const providerSelection = await this.prisma.providerSelection.findFirst(
            {
                where: {
                    id: selectionId,
                    apiKeyId,
                    apiKey: { userId },
                },
            },
        );

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

        const providerSelection = await this.prisma.providerSelection.findFirst(
            {
                where: {
                    apiKeyId,
                    apiKey: { userId },
                    OR: [{ providerId }, { userProviderId: providerId }],
                },
                include: {
                    provider: true,
                    userProvider: true,
                },
            },
        );

        if (!providerSelection) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                "Provider selection not found",
            );
        }

        return {
            providerSelection,
            kind: providerSelection.providerId
                ? ("global" as const)
                : ("custom" as const),
        };
    }

    private async validateProviderModelIds(
        selection: Awaited<
            ReturnType<typeof this.ensureOwnedSelectionByProvider>
        >,
        modelIds: string[],
    ) {
        const uniqueModelIds = Array.from(new Set(modelIds));

        if (selection.kind === "global") {
            const providerCode = selection.providerSelection.provider?.code;
            if (!providerCode) {
                throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
            }

            const models = await this.prisma.model.findMany({
                where: {
                    id: { in: uniqueModelIds },
                    provider: providerCode,
                },
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

        const providerCode = selection.providerSelection.userProvider?.code;
        if (!providerCode) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        const models = await this.prisma.userModel.findMany({
            where: {
                id: { in: uniqueModelIds },
                provider: providerCode,
                userId: selection.providerSelection.userId,
            },
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
                const provider = selection.provider ?? selection.userProvider;
                const models = [
                    ...(selection.models ?? []).map((model) => ({
                        id: model.id,
                        name: model.name,
                        code: model.code,
                        maxTokens: model.maxTokens,
                        tokenResetInterval: model.tokenResetInterval,
                        efficiencyScore: model.efficiencyScore,
                        bestFor: model.bestFor,
                        thinking: model.thinking,
                        status: model.status,
                        active: !selection.inactiveModelIds.includes(model.id),
                        isCustom: false,
                    })),
                    ...(selection.userModels ?? []).map((model) => ({
                        id: model.id,
                        name: model.name,
                        code: model.code,
                        maxTokens: model.maxTokens,
                        tokenResetInterval: model.tokenResetInterval,
                        efficiencyScore: model.efficiencyScore,
                        bestFor: model.bestFor,
                        thinking: model.thinking,
                        status: model.status,
                        active: !selection.inactiveUserModelIds.includes(
                            model.id,
                        ),
                        isCustom: true,
                    })),
                ];

                return {
                    id: selection.id,
                    providerId: provider?.id,
                    code: provider?.code,
                    name: provider?.name,
                    description: provider?.description,
                    baseApi: provider?.baseApi,
                    free: provider?.free,
                    type: provider?.type,
                    status: provider?.status,
                    active: selection.active,
                    isCustom: Boolean(selection.userProviderId),
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

    private async resolveProviderEntity(providerId: string, userId: string) {
        const global = await this.prisma.provider.findUnique({
            where: { id: providerId },
            select: { id: true, code: true },
        });

        if (global) {
            return { kind: "global" as const, ...global };
        }

        const custom = await this.prisma.userProvider.findFirst({
            where: { id: providerId, userId },
            select: { id: true, code: true },
        });

        if (!custom) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Provider not found");
        }

        return { kind: "custom" as const, ...custom };
    }

    private async fetchProviderModelIds(
        providerEntity: Awaited<ReturnType<typeof this.resolveProviderEntity>>,
    ) {
        if (providerEntity.kind === "global") {
            const models = await this.prisma.model.findMany({
                where: { provider: providerEntity.code },
                select: { id: true },
            });
            return models.map((model) => model.id);
        }

        const models = await this.prisma.userModel.findMany({
            where: {
                provider: providerEntity.code,
            },
            select: { id: true },
        });

        return models.map((model) => model.id);
    }
}
