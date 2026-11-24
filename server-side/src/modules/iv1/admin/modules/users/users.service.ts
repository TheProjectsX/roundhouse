import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ApiError } from "@/common/errors/api_error";
import QueryBuilder from "@/common/utils/queryBuilder";
import {
    deletedOnlyWhere,
    isSoftDeleted,
    notDeletedWhere,
} from "@/common/utils/softDelete";
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

    private readonly userListInclude = {
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
    } satisfies Prisma.UserInclude;

    private formatUserListItem(user: AdminUserDetails & { deletedAt?: Date | null }) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            status: user.status,
            deletedAt: user.deletedAt ?? null,
            stats: {
                apiKeyCount: (user.apiKeys ?? []).length,
                activeApiKeyCount: (user.apiKeys ?? []).filter(
                    (apiKey) => apiKey.active,
                ).length,
                customProviderCount: (user.userProviders ?? []).length,
                activeCustomProviderCount: (
                    user.userProviders ?? []
                ).filter((provider) => provider.status === "ACTIVE").length,
                providerSelectionCount: (user.providerSelections ?? []).length,
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
        };
    }

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
            .include(this.userListInclude)
            .rawFilter({ role: "USER", AND: [notDeletedWhere()] })
            .execute();

        const pagination = await queryBuilder.countTotal();

        return {
            message: "Users fetched",
            data: data.map((user) =>
                this.formatUserListItem(user as AdminUserDetails & { deletedAt?: Date | null }),
            ),
            pagination,
        };
    }

    async fetchDeletedUsers(query: Record<string, string>) {
        const queryBuilder = new QueryBuilder<
            typeof this.prisma.user,
            Prisma.$UserPayload
        >(this.prisma.user, query);

        const data = await queryBuilder
            .search(["name", "email"])
            .filter({ exacts: ["status"] })
            .sort()
            .paginate()
            .include(this.userListInclude)
            .rawFilter({ role: "USER", ...deletedOnlyWhere() })
            .execute();

        const pagination = await queryBuilder.countTotal();

        return {
            message: "Deleted users fetched",
            data: data.map((user) =>
                this.formatUserListItem(user as AdminUserDetails & { deletedAt?: Date | null }),
            ),
            pagination,
        };
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
        if (isSoftDeleted(current)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "User is in the bin. Restore the user before updating.",
            );
        }

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
        if (isSoftDeleted(current)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "User is in the bin. Restore the user before updating status.",
            );
        }

        const updated = await this.prisma.user.update({
            where: { id: current.id },
            data: { status: payload.status },
        });

        return { message: "User status updated", data: { id: updated.id } };
    }

    async deleteUser(id: string) {
        const current = await this.ensureUser(id);
        if (isSoftDeleted(current)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "User is already in the bin",
            );
        }
        const deleted = await this.prisma.user.update({
            where: { id: current.id },
            data: { deletedAt: new Date() },
        });
        return { message: "User moved to bin", data: { id: deleted.id } };
    }

    async restoreUser(id: string) {
        const current = await this.ensureUser(id);
        if (!isSoftDeleted(current)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "User is not in the bin",
            );
        }
        const restored = await this.prisma.user.update({
            where: { id: current.id },
            data: { deletedAt: null },
        });
        return { message: "User restored", data: { id: restored.id } };
    }

    async permanentDeleteUser(id: string) {
        const current = await this.ensureUser(id);

        await this.prisma.$transaction(async (tx) => {
            const [apiKeys, apiKeysManagers, userModels, providerSelections] =
                await Promise.all([
                    tx.apiKey.findMany({
                        where: { userId: current.id },
                        select: { id: true },
                    }),
                    tx.apiKeysManager.findMany({
                        where: { userId: current.id },
                        select: { id: true },
                    }),
                    tx.userModel.findMany({
                        where: { userId: current.id },
                        select: { id: true },
                    }),
                    tx.providerSelection.findMany({
                        where: { userId: current.id },
                        select: { id: true },
                    }),
                ]);

            const apiKeyIds = apiKeys.map((k) => k.id);
            const apiKeysManagerIds = apiKeysManagers.map((km) => km.id);
            const userModelIds = userModels.map((um) => um.id);
            const selectionIds = providerSelections.map((ps) => ps.id);

            const msFilters: Prisma.ModelSelectionWhereInput[] = [];
            if (selectionIds.length > 0) {
                msFilters.push({ providerSelectionId: { in: selectionIds } });
            }
            if (userModelIds.length > 0) {
                msFilters.push({ userModelId: { in: userModelIds } });
            }

            let modelSelectionIds: string[] = [];
            if (msFilters.length > 0) {
                const modelSelections = await tx.modelSelection.findMany({
                    where: { OR: msFilters },
                    select: { id: true },
                });
                modelSelectionIds = modelSelections.map((ms) => ms.id);
            }

            const lastErrorFilters: Prisma.LastErrorWhereInput[] = [];
            if (apiKeyIds.length > 0) {
                lastErrorFilters.push({ apiKeyId: { in: apiKeyIds } });
            }
            if (apiKeysManagerIds.length > 0) {
                lastErrorFilters.push({
                    apiKeysManagerId: { in: apiKeysManagerIds },
                });
            }
            if (modelSelectionIds.length > 0) {
                lastErrorFilters.push({ modelId: { in: modelSelectionIds } });
            }
            if (lastErrorFilters.length > 0) {
                await tx.lastError.deleteMany({
                    where: { OR: lastErrorFilters },
                });
            }

            const psKmFilters: Prisma.ProviderSelectionApiKeysManagerWhereInput[] =
                [];
            if (selectionIds.length > 0) {
                psKmFilters.push({
                    providerSelectionId: { in: selectionIds },
                });
            }
            if (apiKeysManagerIds.length > 0) {
                psKmFilters.push({
                    apiKeysManagerId: { in: apiKeysManagerIds },
                });
            }
            if (psKmFilters.length > 0) {
                await tx.providerSelectionApiKeysManager.deleteMany({
                    where: { OR: psKmFilters },
                });
            }

            if (modelSelectionIds.length > 0) {
                await tx.modelSelection.deleteMany({
                    where: { id: { in: modelSelectionIds } },
                });
            }
            if (selectionIds.length > 0) {
                await tx.providerSelection.deleteMany({
                    where: { id: { in: selectionIds } },
                });
            }

            await tx.userModel.deleteMany({ where: { userId: current.id } });
            await tx.userProvider.deleteMany({ where: { userId: current.id } });
            await tx.apiKeysManager.deleteMany({
                where: { userId: current.id },
            });
            await tx.apiKey.deleteMany({ where: { userId: current.id } });
            await tx.user.delete({ where: { id: current.id } });
        });

        return {
            message: "User permanently deleted",
            data: { id: current.id },
        };
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
