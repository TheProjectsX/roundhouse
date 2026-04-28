import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import QueryBuilder from "@/common/utils/queryBuilder";
import { UpdateUserDto, UpdateUserStatusDto } from "./dto/body.dto";

type AdminUserDetails = Prisma.UserGetPayload<{ include: { apiKeys: true } }>;

@Injectable()
export class AdminUsersService {
    constructor(private prisma: PrismaService) {}

    async fetchAllUsers(query: Record<string, string>) {
        const queryBuilder = new QueryBuilder(this.prisma.user, query);

        const data = await queryBuilder
            .search(["name", "email"])
            .filter({ exacts: ["status"] })
            .sort()
            .paginate()
            .include({ apiKeys: true })
            .execute();

        const pagination = await queryBuilder.countTotal();

        return { message: "Users fetched", data, pagination };
    }

    async fetchSingleUser(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { apiKeys: true },
        });

        if (!user) {
            throw new ApiError(HttpStatus.NOT_FOUND, "User not found");
        }

        return { message: "User fetched", data: user as AdminUserDetails };
    }

    async updateUser(payload: UpdateUserDto) {
        const current = await this.ensureUser(payload.id);

        const updated = await this.prisma.user.update({
            where: { id: current.id },
            data: {
                ...(payload.name !== undefined ? { name: payload.name } : {}),
                ...(payload.email !== undefined
                    ? { email: payload.email }
                    : {}),
                ...(payload.avatar !== undefined
                    ? { avatar: payload.avatar }
                    : {}),
            },
        });

        return { message: "User updated", data: updated };
    }

    async updateUserStatus(payload: UpdateUserStatusDto) {
        const current = await this.ensureUser(payload.id);

        const updated = await this.prisma.user.update({
            where: { id: current.id },
            data: { status: payload.status },
        });

        return { message: "User status updated", data: updated };
    }

    async deleteUser(id: string) {
        const current = await this.ensureUser(id);
        await this.prisma.user.delete({ where: { id: current.id } });
        return { message: "User deleted" };
    }

    private async ensureUser(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new ApiError(HttpStatus.NOT_FOUND, "User not found");
        }

        return user;
    }
}
