import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import QueryBuilder from "@/common/utils/queryBuilder";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { UpdateUserDto, UpdateUserStatusDto } from "./dto/body.dto";

type AdminUserDetails = Prisma.UserGetPayload<{ include: { apiKeys: true } }>;

@Injectable()
export class AdminUsersService {
    constructor(private prisma: PrismaService) {}

    async fetchAllUsers(query: Record<string, string>) {
        const queryBuilder = new QueryBuilder<
            typeof this.prisma.user,
            Prisma.$UserPayload
        >(this.prisma.user, query);

        const data = await queryBuilder
            .search(["name", "email"])
            .filter({ exacts: ["status"] })
            .sort()
            .paginate()
            .include({ apiKeys: true })
            .execute();

        const pagination = await queryBuilder.countTotal();

        const formatted = (data as any[]).map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            status: u.status,
            apiKeyCount: (u.apiKeys ?? []).length,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
        }));

        return { message: "Users fetched", data: formatted, pagination };
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

        return { message: "User updated", data: { id: updated.id } };
    }

    async updateUserStatus(payload: UpdateUserStatusDto) {
        const current = await this.ensureUser(payload.id);

        const updated = await this.prisma.user.update({
            where: { id: current.id },
            data: { status: payload.status },
        });

        return { message: "User status updated", data: { id: updated.id } };
    }

    async deleteUser(id: string) {
        const current = await this.ensureUser(id);
        const deleted = await this.prisma.user.delete({
            where: { id: current.id },
        });
        return { message: "User deleted", data: { id: deleted.id } };
    }

    private async ensureUser(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new ApiError(HttpStatus.NOT_FOUND, "User not found");
        }

        return user;
    }
}
