import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import { UserPayload } from "@/common/guards/auth.guard";

@Injectable()
export class ModelsService {
    constructor(private prisma: PrismaService) {}

    async updateApiKeyModelSelectionStatus(modelId: string, user: UserPayload) {
        const modelSelection = await this.prisma.modelSelection.findFirst({
            where: {
                OR: [{ modelId }, { userModelId: modelId }],
                providerSelection: { apiKey: { userId: user.id } },
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

        return { message: "Model status updated", data: { id: updated.id } };
    }

    private async ensureOwnedSelectionByModelId(
        modelId: string,
        userId: string,
    ) {
        const modelSelection = await this.prisma.modelSelection.findFirst({
            where: {
                OR: [{ modelId: modelId }, { userModelId: modelId }],
                providerSelection: { apiKey: { userId } },
            },
        });

        if (!modelSelection) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                "Model selection not found",
            );
        }

        return modelSelection;
    }
}
