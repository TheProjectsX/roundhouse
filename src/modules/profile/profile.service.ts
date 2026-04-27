import { UserPayload } from "@/common/guards/auth.guard";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { UpdateProfileDto } from "./dto/body.dto";
import { deleteFile } from "@/common/services/files/delete_file";

@Injectable()
export class ProfileService {
    constructor(private prisma: PrismaService) {}

    async getProfile(user: UserPayload) {
        const prisma = this.prisma as any;
        const profile = await prisma.user.findUnique({
            where: {
                id: user.id,
            },
            select: {
                id: true,
                email: true,
                status: true,
                name: true,
                avatar: true,
            },
        });

        return {
            message: "User profile fetched successfully",
            data: profile,
        };
    }

    async updateProfile(payload: UpdateProfileDto, user: UserPayload) {
        const prisma = this.prisma as any;
        const currentUser = await prisma.user.findUnique({
            where: { id: user.id },
        });

        await prisma.user.update({
            where: { id: user.id },
            data: {
                name: payload.name,
                avatar: payload.avatar,
            },
        });

        // Delete Avatar
        if (currentUser?.avatar && currentUser.avatar !== payload.avatar) {
            await deleteFile(currentUser.avatar);
        }

        return {
            message: "Profile updated successfully",
        };
    }
}
