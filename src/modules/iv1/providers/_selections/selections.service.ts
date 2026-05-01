import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import { UserPayload } from "@/common/guards/auth.guard";
import {
    CreateProviderApiKeyDto,
    UpdateProviderApiKeyDto,
    UpdateProviderApiKeyStatusDto,
} from "@/modules/iv1/apikeys/dto/body.dto";

@Injectable()
export class ProviderSelectionsService {
    constructor(private prisma: PrismaService) {}

    async createProviderApiKeyByProviderSelection(
        providerSelectionId: string,
        payload: CreateProviderApiKeyDto,
        user: UserPayload,
    ) {
        const providerSelection = await this.ensureOwnedProviderSelectionById(
            providerSelectionId,
            user.id,
        );

        const created = await this.prisma.providerApiKey.create({
            data: {
                providerSelectionId: providerSelection.id,
                key: payload.key.trim(),
                active: payload.active ?? true,
            },
        });

        return {
            message: "Provider API key created",
            data: this.formatProviderApiKey(created),
        };
    }

    async deleteProviderSelectionById(
        providerSelectionId: string,
        user: UserPayload,
    ) {
        const providerSelection = await this.ensureOwnedProviderSelectionById(
            providerSelectionId,
            user.id,
        );

        const deleted = await this.prisma.providerSelection.delete({
            where: { id: providerSelection.id },
        });

        return { message: "Provider deselected", data: { id: deleted.id } };
    }

    async updateProviderSelectionStatusById(
        providerSelectionId: string,
        user: UserPayload,
    ) {
        const providerSelection = await this.ensureOwnedProviderSelectionById(
            providerSelectionId,
            user.id,
        );

        const updated = await this.prisma.providerSelection.update({
            where: { id: providerSelection.id },
            data: { active: !providerSelection.active },
        });

        return { message: "Provider status updated", data: { id: updated.id } };
    }

    async updateProviderApiKeyById(
        providerApiKeyId: string,
        payload: UpdateProviderApiKeyDto,
        user: UserPayload,
    ) {
        const providerApiKey = await this.ensureOwnedProviderApiKeyById(
            providerApiKeyId,
            user.id,
        );

        const updated = await this.prisma.providerApiKey.update({
            where: { id: providerApiKey.id },
            data: {
                ...(payload.key !== undefined
                    ? { key: payload.key.trim() }
                    : {}),
                ...(payload.active !== undefined
                    ? { active: payload.active }
                    : {}),
            },
        });

        return {
            message: "Provider API key updated",
            data: this.formatProviderApiKey(updated),
        };
    }

    async updateProviderApiKeyStatusById(
        providerApiKeyId: string,
        payload: UpdateProviderApiKeyStatusDto,
        user: UserPayload,
    ) {
        const providerApiKey = await this.ensureOwnedProviderApiKeyById(
            providerApiKeyId,
            user.id,
        );

        const updated = await this.prisma.providerApiKey.update({
            where: { id: providerApiKey.id },
            data: { active: payload.active },
        });

        return {
            message: "Provider API key status updated",
            data: this.formatProviderApiKey(updated),
        };
    }

    async deleteProviderApiKeyById(
        providerApiKeyId: string,
        user: UserPayload,
    ) {
        const providerApiKey = await this.ensureOwnedProviderApiKeyById(
            providerApiKeyId,
            user.id,
        );

        await this.prisma.providerApiKey.delete({
            where: { id: providerApiKey.id },
        });

        return {
            message: "Provider API key deleted",
            data: { id: providerApiKey.id },
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

    private async ensureOwnedProviderSelectionById(
        providerSelectionId: string,
        userId: string,
    ) {
        const providerSelection = await this.prisma.providerSelection.findFirst(
            {
                where: {
                    id: providerSelectionId,
                    apiKey: {
                        userId,
                    },
                },
                include: {
                    providerApiKeys: true,
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

    private async ensureOwnedProviderApiKeyById(
        providerApiKeyId: string,
        userId: string,
    ) {
        const providerApiKey = await this.prisma.providerApiKey.findFirst({
            where: {
                id: providerApiKeyId,
                providerSelection: {
                    apiKey: {
                        userId,
                    },
                },
            },
        });

        if (!providerApiKey) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                "Provider API key not found",
            );
        }

        return providerApiKey;
    }
}
