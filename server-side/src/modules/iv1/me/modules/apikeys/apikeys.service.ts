import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import { UserPayload } from "@/common/guards/auth.guard";
import QueryBuilder from "@/common/utils/queryBuilder";
import { BcryptService } from "@/common/utils/bcrypt.service";
import {
    CreateApiKeysManagerDto,
    UnlockApiKeysDto,
    UpdateApiKeysManagerDto,
} from "./dto/body.dto";

@Injectable()
export class ApikeysManagerService {
    constructor(
        private prisma: PrismaService,
        private bcryptService: BcryptService,
    ) {}

    private maskApiKey(value: string): string {
        if (!value) {
            return value;
        }

        const visibleChars = 4;
        if (value.length <= visibleChars * 2) {
            return "*".repeat(value.length);
        }

        return `${value.slice(0, visibleChars)}*****${value.slice(-visibleChars)}`;
    }

    private isPlainObject(item: unknown): item is Record<string, unknown> {
        return (
            item !== null &&
            typeof item === "object" &&
            item.constructor === Object
        );
    }

    private censorApiKeys(item: unknown): unknown {
        if (Array.isArray(item)) {
            return item.map((entry) => this.censorApiKeys(entry));
        }

        if (this.isPlainObject(item)) {
            return Object.fromEntries(
                Object.entries(item).map(([key, value]) => {
                    if (key === "key" && typeof value === "string") {
                        return [key, this.maskApiKey(value)];
                    }

                    return [key, this.censorApiKeys(value)];
                }),
            );
        }

        return item;
    }

    async fetchAllApiKeys(query: Record<string, string>, user: UserPayload) {
        const queryBuilder = new QueryBuilder(
            this.prisma.apiKeysManager,
            query,
        );

        const data = await queryBuilder
            .search(["name"])
            .filter({ booleans: ["active"] })
            .rawFilter({ userId: user.id })
            .omit({ userId: true })
            .sort()
            .paginate()
            .execute();

        const pagination = await queryBuilder.countTotal();
        const censoredData = this.censorApiKeys(data);

        return { message: "Api Keys fetched", data: censoredData, pagination };
    }

    async unlockApiKeys(payload: UnlockApiKeysDto, user: UserPayload) {
        if (!payload.password) {
            throw new ApiError(HttpStatus.BAD_REQUEST, "Password is required");
        }

        const userData = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { password: true },
        });

        if (!userData?.password) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Unauthorized Request");
        }

        const passwordMatched = await this.bcryptService.compare(
            payload.password,
            userData.password,
        );

        if (!passwordMatched) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Incorrect Password");
        }

        const data = await this.prisma.apiKeysManager.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                key: true,
            },
        });

        return { message: "Api Keys unlocked", data };
    }

    async createApiKey(payload: CreateApiKeysManagerDto, user: UserPayload) {
        const created = await this.prisma.apiKeysManager.create({
            data: {
                ...payload,
                user: { connect: { id: user.id } },
            },
        });

        return { message: "Api Key created", data: { id: created.id } };
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
            throw new ApiError(HttpStatus.NOT_FOUND, "Api Key not found");
        }

        const updated = await this.prisma.apiKeysManager.update({
            where: { id: entity.id },
            data: {
                ...payload,
            },
        });

        return { message: "Api Key updated", data: { id: updated.id } };
    }

    async deleteApiKey(id: string, user: UserPayload) {
        const entity = await this.prisma.apiKeysManager.findFirst({
            where: { id, userId: user.id },
        });

        if (!entity) {
            throw new ApiError(HttpStatus.NOT_FOUND, "Api Key not found");
        }

        const deleted = await this.prisma.apiKeysManager.delete({
            where: { id: entity.id },
        });

        return { message: "Api Key deleted", data: { id: deleted.id } };
    }
}
