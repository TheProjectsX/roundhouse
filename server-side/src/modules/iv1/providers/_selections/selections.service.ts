import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import { UserPayload } from "@/common/guards/auth.guard";

@Injectable()
export class ProviderSelectionsService {
    constructor(private prisma: PrismaService) {}

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
}
