import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import { UserPayload } from "@/common/guards/auth.guard";
import QueryBuilder from "@/common/utils/queryBuilder";
import { nanoid } from "nanoid";
import {
    CreateApiKeyDto,
    UpdateApiKeyDto,
    UpdateApiKeyStatusDto,
} from "./dto/body.dto";

type ApiKeyDetails = Prisma.ApiKeyGetPayload<{
    include: {
        providerSelections: {
            include: {
                providers: true;
                userProviders: { include: { models: true } };
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
            .include({ providerSelections: true })
            .execute();
        const pagination = await queryBuilder.countTotal();

        return { message: "API keys fetched", data, pagination };
    }

    async fetchSingleApiKey(id: string, user: UserPayload) {
        const apiKey = await this.prisma.apiKey.findFirst({
            where: { id, userId: user.id },
            include: {
                providerSelections: {
                    include: {
                        providers: true,
                        userProviders: { include: { models: true } },
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

        return { message: "API key fetched", data: apiKey as ApiKeyDetails };
    }

    async createApiKey(payload: CreateApiKeyDto, user: UserPayload) {
        const created = await this.prisma.apiKey.create({
            data: {
                name: payload.name,
                key: nanoid(32),
                user: { connect: { id: user.id } },
            },
        });

        return { message: "API key created", data: created };
    }

    async updateApiKey(payload: UpdateApiKeyDto, user: UserPayload) {
        const apiKey = await this.ensureOwnedApiKey(payload.id, user.id);

        const updated = await this.prisma.apiKey.update({
            where: { id: apiKey.id },
            data: {
                ...(payload.name !== undefined ? { name: payload.name } : {}),
                ...(payload.active !== undefined
                    ? { active: payload.active }
                    : {}),
            },
        });

        return { message: "API key updated", data: updated };
    }

    async updateApiKeyStatus(
        payload: UpdateApiKeyStatusDto,
        user: UserPayload,
    ) {
        const apiKey = await this.ensureOwnedApiKey(payload.id, user.id);

        const updated = await this.prisma.apiKey.update({
            where: { id: apiKey.id },
            data: { active: payload.active },
        });

        return { message: "API key status updated", data: updated };
    }

    async deleteApiKey(id: string, user: UserPayload) {
        const apiKey = await this.ensureOwnedApiKey(id, user.id);
        await this.prisma.apiKey.delete({ where: { id: apiKey.id } });
        return { message: "API key deleted" };
    }

    async createApiKeyProvider(
        apiKeyId: string,
        providerId: string,
        user: UserPayload,
    ) {
        const apiKey = await this.ensureOwnedApiKey(apiKeyId, user.id);
        const providerEntity = await this.resolveProviderEntity(providerId);

        const providerSelection = await this.prisma.providerSelection.create({
            data: {
                apiKeyId: apiKey.id,
                ...(providerEntity.kind === "global"
                    ? { providerIds: [providerId] }
                    : { userProviderIds: [providerId] }),
                active: true,
            } satisfies Prisma.ProviderSelectionUncheckedCreateInput,
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

        return { message: "Provider selected", data: providerSelection };
    }

    async deleteApiKeyProvider(
        apiKeyId: string,
        providerId: string,
        user: UserPayload,
    ) {
        const apiKey = await this.ensureOwnedApiKey(apiKeyId, user.id);
        const providerSelection = await this.prisma.providerSelection.findFirst(
            {
                where: {
                    apiKeyId: apiKey.id,
                    OR: [
                        { providerIds: { has: providerId } },
                        { userProviderIds: { has: providerId } },
                    ],
                },
            },
        );

        if (!providerSelection) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                "Provider selection not found",
            );
        }

        if (providerSelection.modelSelectionIds.length) {
            await this.prisma.modelSelection.deleteMany({
                where: { id: { in: providerSelection.modelSelectionIds } },
            });
        }

        await this.prisma.providerSelection.delete({
            where: { id: providerSelection.id },
        });

        return { message: "Provider deselected" };
    }

    async updateApiKeyProviderStatus(
        apiKeyId: string,
        providerId: string,
        user: UserPayload,
    ) {
        const apiKey = await this.ensureOwnedApiKey(apiKeyId, user.id);
        const providerSelection = await this.prisma.providerSelection.findFirst(
            {
                where: {
                    apiKeyId: apiKey.id,
                    OR: [
                        { providerIds: { has: providerId } },
                        { userProviderIds: { has: providerId } },
                    ],
                },
            },
        );

        if (!providerSelection) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                "Provider selection not found",
            );
        }

        const updated = await this.prisma.providerSelection.update({
            where: { id: providerSelection.id },
            data: { active: !providerSelection.active },
        });

        return { message: "Provider status updated", data: updated };
    }

    async updateApiKeyModelStatus(
        apiKeyId: string,
        modelId: string,
        user: UserPayload,
    ) {
        const apiKey = await this.ensureOwnedApiKey(apiKeyId, user.id);
        const providerSelections = await this.prisma.providerSelection.findMany(
            {
                where: { apiKeyId: apiKey.id },
                select: { id: true },
            },
        );

        const providerSelectionIds = providerSelections.map(
            (selection) => selection.id,
        );
        const modelSelection = await this.prisma.modelSelection.findFirst({
            where: {
                providerSelectionIds: { hasSome: providerSelectionIds },
                OR: [
                    { modelIds: { has: modelId } },
                    { userModelIds: { has: modelId } },
                ],
            },
        });

        if (!modelSelection) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                "Model selection not found",
            );
        }

        const updated = await this.prisma.modelSelection.update({
            where: { id: modelSelection.id },
            data: { active: !modelSelection.active },
        });

        return { message: "Model status updated", data: updated };
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
