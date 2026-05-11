import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import QueryBuilder from "@/common/utils/queryBuilder";
import { UpdateUserDto, UpdateUserStatusDto } from "./dto/body.dto";

type AdminUserDetails = Omit<
    Prisma.UserGetPayload<{
        include: {
            apiKeys: {
                include: {
                    providerSelections: {
                        include: {
                            provider: true;
                            userProvider: true;
                            apiKeysManagers: {
                                include: { apiKeysManager: true };
                            };
                            modelSelections: {
                                include: { model: true; userModel: true };
                            };
                        };
                    };
                };
            };
            userProviders: true;
            providerSelections: {
                include: {
                    provider: true;
                    userProvider: true;
                    apiKeysManagers: {
                        include: { apiKeysManager: true };
                    };
                    modelSelections: {
                        include: { model: true; userModel: true };
                    };
                };
            };
        };
    }>,
    "password"
>;

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
                                provider: true,
                                userProvider: true,
                                apiKeysManagers: {
                                    include: { apiKeysManager: true },
                                },
                                modelSelections: {
                                    include: { model: true, userModel: true },
                                },
                            },
                        },
                    },
                },
                userProviders: true,
                providerSelections: {
                    include: {
                        provider: true,
                        userProvider: true,
                        apiKeysManagers: {
                            include: { apiKeysManager: true },
                        },
                        modelSelections: {
                            include: { model: true, userModel: true },
                        },
                    },
                },
            })
            .rawFilter({ role: "USER" })
            .execute();

        const pagination = await queryBuilder.countTotal();

        const formatted = await Promise.all(
            data.map(async (user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                status: user.status,
                stats: {
                    apiKeyCount: (user.apiKeys ?? []).length,
                    activeApiKeyCount: (user.apiKeys ?? []).filter(
                        (apiKey) => apiKey.active,
                    ).length,
                    customProviderCount: (user.userProviders ?? []).length,
                    activeCustomProviderCount: (
                        user.userProviders ?? []
                    ).filter((provider) => provider.status === "ACTIVE").length,
                    providerSelectionCount: (user.providerSelections ?? [])
                        .length,
                    apiKeysManagerCount: (user.providerSelections ?? []).reduce(
                        (sum, selection) =>
                            sum + (selection.apiKeysManagers?.length ?? 0),
                        0,
                    ),
                    selectedModelCount: (user.providerSelections ?? []).reduce(
                        (sum, selection) =>
                            sum + (selection.modelSelections?.length ?? 0),
                        0,
                    ),
                },
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            })),
        );

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
                                provider: true,
                                userProvider: true,
                                apiKeysManagers: {
                                    include: { apiKeysManager: true },
                                },
                                modelSelections: {
                                    include: { model: true, userModel: true },
                                },
                            },
                        },
                    },
                },
                userProviders: true,
                providerSelections: {
                    include: {
                        provider: true,
                        userProvider: true,
                        apiKeysManagers: {
                            include: { apiKeysManager: true },
                        },
                        modelSelections: {
                            include: { model: true, userModel: true },
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
            data: await this.formatUserDetails(user as AdminUserDetails),
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

    private async formatUserDetails(user: AdminUserDetails) {
        const apiKeys = user.apiKeys.map((apiKey) => {
            const providerSelections = apiKey.providerSelections ?? [];
            const apiKeysManagerCount = providerSelections.reduce(
                (sum, selection) =>
                    sum + (selection.apiKeysManagers?.length ?? 0),
                0,
            );
            const successfulRequests = providerSelections.reduce(
                (sum, selection) =>
                    sum +
                    (selection.apiKeysManagers ?? []).reduce(
                        (selectionSum, managerEntry) =>
                            selectionSum +
                            (managerEntry.apiKeysManager?.successCount ?? 0),
                        0,
                    ),
                0,
            );
            const modelCount = providerSelections.reduce(
                (sum, selection) =>
                    sum + (selection.modelSelections?.length ?? 0),
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
                    apiKeysManagerCount,
                    modelCount,
                    successfulRequests,
                },
            };
        });

        const providers = await Promise.all(
            user.userProviders.map(async (provider) => {
                const [modelsCount, activeModelsCount] = await Promise.all([
                    this.prisma.userModel.count({
                        where: {
                            provider: provider.code,
                            userId: user.id,
                        },
                    }),
                    this.prisma.userModel.count({
                        where: {
                            provider: provider.code,
                            userId: user.id,
                            status: "ACTIVE",
                        },
                    }),
                ]);

                return {
                    id: provider.id,
                    code: provider.code,
                    name: provider.name,
                    description: provider.description,
                    free: provider.free,
                    type: provider.type,
                    status: provider.status,
                    modelsCount,
                    activeModelsCount,
                    createdAt: provider.createdAt,
                    updatedAt: provider.updatedAt,
                };
            }),
        );

        const totalApiKeysManagers = user.providerSelections.reduce(
            (sum, selection) => sum + (selection.apiKeysManagers?.length ?? 0),
            0,
        );
        const totalSuccessfulRequests = user.providerSelections.reduce(
            (sum, selection) =>
                sum +
                (selection.apiKeysManagers ?? []).reduce(
                    (selectionSum, managerEntry) =>
                        selectionSum +
                        (managerEntry.apiKeysManager?.successCount ?? 0),
                    0,
                ),
            0,
        );
        const totalSelectedModels = user.providerSelections.reduce(
            (sum, selection) => sum + (selection.modelSelections?.length ?? 0),
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
                activeApiKeyCount: user.apiKeys.filter(
                    (apiKey) => apiKey.active,
                ).length,
                customProviderCount: user.userProviders.length,
                activeCustomProviderCount: user.userProviders.filter(
                    (provider) => provider.status === "ACTIVE",
                ).length,
                providerSelectionCount: user.providerSelections.length,
                apiKeysManagerCount: totalApiKeysManagers,
                successfulRequests: totalSuccessfulRequests,
                selectedModelCount: totalSelectedModels,
            },
            apiKeys,
            providers,
        };
    }
}
