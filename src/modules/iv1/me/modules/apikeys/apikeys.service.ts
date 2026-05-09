import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import { UserPayload } from "@/common/guards/auth.guard";
import QueryBuilder from "@/common/utils/queryBuilder";
import {
    CreateApiKeysManagerDto,
    UpdateApiKeysManagerDto,
} from "./dto/body.dto";

@Injectable()
export class ApikeysManagerService {
    constructor(private prisma: PrismaService) {}

    async fetchAllApiKeys(query: Record<string, string>, user: UserPayload) {
        const queryBuilder = new QueryBuilder(
            this.prisma.apiKeysManager,
            query,
        );

        const data = await queryBuilder
            .search(["name"])
            .filter({ booleans: ["active"] })
            .rawFilter({ userId: user.id })
            .sort()
            .paginate()
            .execute();

        const pagination = await queryBuilder.countTotal();

        return { message: "ApiKey managers fetched", data, pagination };
    }

    async createApiKey(payload: CreateApiKeysManagerDto, user: UserPayload) {
        const created = await this.prisma.apiKeysManager.create({
            data: {
                ...payload,
                user: { connect: { id: user.id } },
            },
        });

        return { message: "ApiKey manager created", data: { id: created.id } };
    }

    async updateApiKey(
        id: string,
        payload: UpdateApiKeysManagerDto,
        user: UserPayload,
    ) {
        const entity = await this.prisma.apiKeysManager.findFirst({
            where: { id, userId: user.id },
        });

        if (!entity) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                "ApiKey manager not found",
            );
        }

        const updated = await this.prisma.apiKeysManager.update({
            where: { id: entity.id },
            data: {
                ...payload,
            },
        });

        return { message: "ApiKey manager updated", data: { id: updated.id } };
    }

    async deleteApiKey(id: string, user: UserPayload) {
        const entity = await this.prisma.apiKeysManager.findFirst({
            where: { id, userId: user.id },
        });

        if (!entity) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                "ApiKey manager not found",
            );
        }

        const deleted = await this.prisma.apiKeysManager.delete({
            where: { id: entity.id },
        });

        return { message: "ApiKey manager deleted", data: { id: deleted.id } };
    }
}
