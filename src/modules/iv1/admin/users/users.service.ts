import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import QueryBuilder from "@/common/utils/queryBuilder";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { UpdateUserDto, UpdateUserStatusDto } from "./dto/body.dto";

type AdminUserDetails = Prisma.UserGetPayload<{
    include: {
        apiKeys: {
            include: {
                providerSelections: {
                    include: {
                        providerApiKeys: true;
                        modelSelections: {
                            include: {
                                models: true;
                                userModels: true;
                            };
                        };
                    };
                };
            };
        };
        userProviders: {
            include: {
                models: true;
            };
        };
        providerSelections: {
            include: {
                providerApiKeys: true;
                modelSelections: {
                    include: {
                        models: true;
                        userModels: true;
                    };
                };
            };
        };
    };
}>;

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
            .include({
                apiKeys: {
                    include: {
                        providerSelections: {
                            include: {
                                providerApiKeys: true,
                                modelSelections: true,
                            },
                        },
                    },
                },
                userProviders: {
                    include: {
                        models: true,
                    },
                },
                providerSelections: {
                    include: {
                        providerApiKeys: true,
                        modelSelections: true,
                    },
                },
            })
            .rawFilter({ role: "USER" })
            .execute();

        const pagination = await queryBuilder.countTotal();

        const formatted = data.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            avatar: u.avatar,
            status: u.status,
            stats: {
                apiKeyCount: (u.apiKeys ?? []).length,
                activeApiKeyCount: (u.apiKeys ?? []).filter(
                    (apiKey) => apiKey.active,
                ).length,
                customProviderCount: (u.userProviders ?? []).length,
                activeCustomProviderCount: (u.userProviders ?? []).filter(
                    (provider) => provider.status === "ACTIVE",
                ).length,
                providerSelectionCount: (u.providerSelections ?? []).length,
                providerApiKeyCount: (u.providerSelections ?? []).reduce(
                    (sum, selection) =>
                        sum + (selection.providerApiKeys?.length ?? 0),
                    0,
                ),
                usedTokens: (u.providerSelections ?? []).reduce(
                    (sum, selection) =>
                        sum +
                        (selection.modelSelections ?? []).reduce(
                            (selectionSum, modelSelection) =>
                                selectionSum + (modelSelection.usedTokens ?? 0),
                            0,
                        ),
                    0,
                ),
            },
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
        }));

        return { message: "Users fetched", data: formatted, pagination };
    }

    async fetchSingleUser(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                apiKeys: {
                    include: {
                        providerSelections: {
                            include: {
                                providerApiKeys: true,
                                modelSelections: {
                                    include: {
                                        models: true,
                                        userModels: true,
                                    },
                                },
                            },
                        },
                    },
                },
                userProviders: {
                    include: {
                        models: true,
                    },
                },
                providerSelections: {
                    include: {
                        providerApiKeys: true,
                        modelSelections: {
                            include: {
                                models: true,
                                userModels: true,
                            },
                        },
                    },
                },
            },
            omit: { password: true },
        });

        if (!user) {
            throw new ApiError(HttpStatus.NOT_FOUND, "User not found");
        }

        return {
            message: "User fetched",
            data: this.formatUserDetails(user as AdminUserDetails),
        };
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

    private formatUserDetails(user: AdminUserDetails) {
        const apiKeys = user.apiKeys.map((apiKey) => {
            const providerSelections = apiKey.providerSelections ?? [];
            const providerApiKeyCount = providerSelections.reduce(
                (sum, selection) =>
                    sum + (selection.providerApiKeys?.length ?? 0),
                0,
            );
            const successfulRequests = providerSelections.reduce(
                (sum, selection) =>
                    sum +
                    (selection.providerApiKeys ?? []).reduce(
                        (selectionSum, providerApiKey) =>
                            selectionSum + (providerApiKey.successCount ?? 0),
                        0,
                    ),
                0,
            );
            const usedTokens = providerSelections.reduce(
                (sum, selection) =>
                    sum +
                    (selection.modelSelections ?? []).reduce(
                        (selectionSum, modelSelection) =>
                            selectionSum + (modelSelection.usedTokens ?? 0),
                        0,
                    ),
                0,
            );
            const modelCount = providerSelections.reduce(
                (sum, selection) =>
                    sum +
                    (selection.modelSelections ?? []).reduce(
                        (selectionSum, modelSelection) =>
                            selectionSum +
                            (modelSelection.models?.length ?? 0) +
                            (modelSelection.userModels?.length ?? 0),
                        0,
                    ),
                0,
            );

            return {
                id: apiKey.id,
                name: apiKey.name,
                active: apiKey.active,
                createdAt: apiKey.createdAt,
                updatedAt: apiKey.updatedAt,
                stats: {
                    providerCount: providerSelections.length,
                    providerApiKeyCount,
                    modelCount,
                    successfulRequests,
                    usedTokens,
                },
            };
        });

        const providers = user.userProviders.map((provider) => ({
            id: provider.id,
            name: provider.name,
            description: provider.description,
            free: provider.free,
            type: provider.type,
            status: provider.status,
            modelsCount: provider.models.length,
            activeModelsCount: provider.models.filter(
                (model) => model.status === "ACTIVE",
            ).length,
            createdAt: provider.createdAt,
            updatedAt: provider.updatedAt,
        }));

        const totalProviderApiKeys = user.providerSelections.reduce(
            (sum, selection) => sum + (selection.providerApiKeys?.length ?? 0),
            0,
        );
        const totalSuccessfulRequests = user.providerSelections.reduce(
            (sum, selection) =>
                sum +
                (selection.providerApiKeys ?? []).reduce(
                    (selectionSum, providerApiKey) =>
                        selectionSum + (providerApiKey.successCount ?? 0),
                    0,
                ),
            0,
        );
        const totalUsedTokens = user.providerSelections.reduce(
            (sum, selection) =>
                sum +
                (selection.modelSelections ?? []).reduce(
                    (selectionSum, modelSelection) =>
                        selectionSum + (modelSelection.usedTokens ?? 0),
                    0,
                ),
            0,
        );

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            stats: {
                apiKeyCount: user.apiKeys.length,
                activeApiKeyCount: user.apiKeys.filter((apiKey) => apiKey.active)
                    .length,
                customProviderCount: user.userProviders.length,
                activeCustomProviderCount: user.userProviders.filter(
                    (provider) => provider.status === "ACTIVE",
                ).length,
                providerSelectionCount: user.providerSelections.length,
                providerApiKeyCount: totalProviderApiKeys,
                successfulRequests: totalSuccessfulRequests,
                usedTokens: totalUsedTokens,
            },
            apiKeys,
            providers,
        };
    }
}
