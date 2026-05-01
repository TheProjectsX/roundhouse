import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import { UserPayload } from "@/common/guards/auth.guard";

@Injectable()
export class ModelsService {
    constructor(private prisma: PrismaService) {}

    async updateApiKeyModelSelectionStatus(modelId: string, user: UserPayload) {
        const providerSelection = await this.ensureOwnedSelectionByModelId(
            modelId,
            user.id,
        );

        const isGlobalModel = providerSelection.modelIds.includes(modelId);
        const inactiveIds = new Set(
            isGlobalModel
                ? providerSelection.inactiveModelIds
                : providerSelection.inactiveUserModelIds,
        );

        if (inactiveIds.has(modelId)) {
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

    private async ensureOwnedSelectionByModelId(
        modelId: string,
        userId: string,
    ) {
        const providerSelection = await this.prisma.providerSelection.findFirst(
            {
                where: {
                    apiKey: {
                        userId,
                    },
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

        return providerSelection;
    }
}
