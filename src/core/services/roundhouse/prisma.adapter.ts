import {
    createRoundhouseService,
    type RoundhouseDataSource,
    type RoundhouseService,
} from "./roundhouse.service";

type PrismaLike = {
    apiKey: {
        findUnique: (args: any) => Promise<any>;
    };
    lastError: {
        deleteMany: (args: any) => Promise<any>;
        create: (args: any) => Promise<any>;
    };
};

export const createPrismaRoundhouseDataSource = (
    prisma: PrismaLike,
): RoundhouseDataSource => {
    return {
        getApiKeyWithSelections: async (apiKey: string) => {
            return prisma.apiKey.findUnique({
                where: { key: apiKey },
                include: {
                    lastErrors: true,
                    providerSelections: {
                        where: { active: true },
                        include: {
                            providers: true,
                            userProviders: true,
                            modelSelections: {
                                where: {
                                    active: true,
                                },
                                include: {
                                    models: {
                                        include: {
                                            provider: true,
                                        },
                                    },
                                    userModels: {
                                        include: {
                                            provider: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
        },
        clearLastErrors: async (apiKeyId: string) => {
            await prisma.lastError.deleteMany({
                where: { apiKeyId },
            });
        },
        addLastError: async (apiKeyId: string, modelSelectionId: string) => {
            await prisma.lastError.create({
                data: {
                    apiKeyId,
                    modelId: modelSelectionId,
                },
            });
        },
    };
};

export const createPrismaRoundhouseService = (
    prisma: PrismaLike,
): RoundhouseService => {
    return createRoundhouseService(createPrismaRoundhouseDataSource(prisma));
};
