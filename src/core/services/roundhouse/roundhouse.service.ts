import { checkApiKeyError } from "@/core/utils/errorChecker.util";
import { InternalResponses } from "@/core/constants/response";
import { createDevLogger } from "@/common/utils/logger";
import { PrismaClient } from "@prisma/client";

export type SelectProviderError = {
    success: false;
    code: string;
    status_code: number;
    message: string;
};

type RoundhouseProvider = {
    id: string;
    code: string;
    name: string;
    type: "OPENAI" | "ANTHROPIC" | "GEMINI" | "CUSTOM";
    baseApi: string;
    isCustom: boolean;
};

type RoundhouseModel = {
    id: string;
    code: string;
    name: string;
    status: "ACTIVE" | "INACTIVE" | "DEPRECATED" | "TESTING" | "UPCOMING";
    maxTokens: number | null;
    efficiencyScore: number | null;
    provider: RoundhouseProvider;
};

export type RoundhouseCandidate = {
    modelSelectionId: string;
    providerSelectionId: string;
    model: RoundhouseModel;
    apiKeysManagers: RoundhouseApiKeysManagerRecord[];
    score: number;
};

type RoundhouseApiKeysManagerRecord = {
    id: string;
    key: string;
    active: boolean;
    successCount: number;
};

export type RoundhouseSelectedApiKeysManager = {
    id: string;
    key: string;
};

type RoundhouseFailureResult = {
    success: false;
};

type RoundhouseSuccessResult<T> = {
    success: true;
    data: T;
};

type RoundhouseExecutionResult<T> =
    | RoundhouseFailureResult
    | RoundhouseSuccessResult<T>;

type RoundhouseExecute<T> = (
    candidate: RoundhouseCandidate,
    apiKeysManager: RoundhouseSelectedApiKeysManager,
) => Promise<RoundhouseExecutionResult<T>>;

export type SelectProviderSuccess<T> = {
    success: true;
    data: T;
    candidate: RoundhouseCandidate;
    apiKeysManager: RoundhouseSelectedApiKeysManager;
    iteration: number;
};

type SelectProviderResponse<T> = SelectProviderError | SelectProviderSuccess<T>;

export type RoundhouseFilters = {
    provider?: "OPENAI" | "ANTHROPIC" | "GEMINI" | "CUSTOM";
    modelKeys?: Set<string>;
    strategy?: "random" | "efficiency";
};

type BoundRoundhouseExecutor = <T>(
    apiKey: string,
    execute: RoundhouseExecute<T>,
    maxIterations?: number,
    filters?: RoundhouseFilters,
) => Promise<SelectProviderResponse<T>>;

type BoundRoundhouseCandidateLister = (
    apiKey: string,
    filters?: RoundhouseFilters,
) => Promise<
    SelectProviderError | { success: true; candidates: RoundhouseCandidate[] }
>;

const DEFAULT_SCORE = 0.5;
const DEFAULT_MAX_ITERATIONS = 5;
const logger = createDevLogger("roundhouse");

const buildProviderRecord = (providerSelection: {
    provider: {
        id: string;
        code: string;
        name: string;
        type: "OPENAI" | "ANTHROPIC" | "GEMINI" | "CUSTOM";
        baseApi: string;
    } | null;
    userProvider: {
        id: string;
        code: string;
        name: string;
        type: "OPENAI" | "ANTHROPIC" | "GEMINI" | "CUSTOM";
        baseApi: string;
    } | null;
}) => {
    const provider =
        providerSelection.provider ?? providerSelection.userProvider;
    if (!provider) {
        return undefined;
    }

    return {
        id: provider.id,
        code: provider.code,
        name: provider.name,
        type: provider.type,
        baseApi: provider.baseApi,
        isCustom: Boolean(providerSelection.userProvider),
    } satisfies RoundhouseProvider;
};

const buildCandidates = (
    providerSelections: Array<{
        id: string;
        active: boolean;
        apiKeysManagers: Array<{
            apiKeysManager: RoundhouseApiKeysManagerRecord | null;
        }>;
        provider: {
            id: string;
            code: string;
            name: string;
            type: "OPENAI" | "ANTHROPIC" | "GEMINI" | "CUSTOM";
            baseApi: string;
        } | null;
        userProvider: {
            id: string;
            code: string;
            name: string;
            type: "OPENAI" | "ANTHROPIC" | "GEMINI" | "CUSTOM";
            baseApi: string;
        } | null;
        modelSelections: Array<{
            id: string;
            active: boolean;
            model?: Omit<RoundhouseModel, "provider"> | null;
            userModel?: Omit<RoundhouseModel, "provider"> | null;
        }>;
    }>,
    filters?: RoundhouseFilters,
): RoundhouseCandidate[] => {
    const candidates: RoundhouseCandidate[] = [];
    const allowedModelKeys = filters?.modelKeys;

    logger.log("Building candidates", {
        providerSelectionCount: providerSelections.length,
        providerFilter: filters?.provider ?? null,
        allowedModelKeysCount: allowedModelKeys?.size ?? 0,
        strategy: filters?.strategy ?? "efficiency",
    });

    for (const providerSelection of providerSelections) {
        if (!providerSelection.active) {
            continue;
        }

        const provider = buildProviderRecord(providerSelection);
        if (!provider) {
            continue;
        }

        const activeApiKeysManagers = providerSelection.apiKeysManagers
            .map((entry) => entry.apiKeysManager)
            .filter(
                (
                    apiKeysManager,
                ): apiKeysManager is RoundhouseApiKeysManagerRecord =>
                    Boolean(apiKeysManager && apiKeysManager.active),
            );
        if (activeApiKeysManagers.length === 0) {
            continue;
        }

        const selectedModels = (providerSelection.modelSelections ?? [])
            .filter((ms) => ms.active)
            .map((ms) => {
                const model = ms.model ?? ms.userModel;
                return {
                    modelSelectionId: ms.id,
                    model: { ...model, provider } as Omit<
                        RoundhouseModel,
                        "provider"
                    > & { provider: RoundhouseProvider },
                };
            });

        for (const entry of selectedModels) {
            const model = entry.model;
            if (model.status !== "ACTIVE") {
                continue;
            }

            if (filters?.provider && model.provider.type !== filters.provider) {
                continue;
            }

            if (allowedModelKeys) {
                const normalizedProvider = model.provider.code.toLowerCase();
                const normalizedType = model.provider.type.toLowerCase();
                const normalizedModelCode = model.code.toLowerCase();
                const normalizedProviderKey = `${normalizedProvider}/${normalizedModelCode}`;
                const normalizedTypeKey = `${normalizedType}/${normalizedModelCode}`;

                if (
                    !allowedModelKeys.has(normalizedProviderKey) &&
                    !allowedModelKeys.has(normalizedTypeKey) &&
                    !allowedModelKeys.has(normalizedProvider) &&
                    !allowedModelKeys.has(normalizedType) &&
                    !allowedModelKeys.has(normalizedModelCode)
                ) {
                    continue;
                }
            }

            candidates.push({
                modelSelectionId: entry.modelSelectionId,
                providerSelectionId: providerSelection.id,
                model,
                apiKeysManagers: activeApiKeysManagers,
                score: model.efficiencyScore ?? DEFAULT_SCORE,
            });
        }
    }

    if (filters?.strategy === "random") {
        for (let index = candidates.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [candidates[index], candidates[swapIndex]] = [
                candidates[swapIndex],
                candidates[index],
            ];
        }
    } else {
        candidates.sort((a, b) => b.score - a.score);
    }

    logger.log("Finished building candidates", {
        candidateCount: candidates.length,
    });

    return candidates;
};

const getApiKeyWithSelections = async (
    prisma: PrismaClient,
    apiKey: string,
) => {
    logger.log("Loading API key with selections", {
        apiKeyPreview: `${apiKey.slice(0, 6)}***`,
    });

    return prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: {
            lastErrors: true,
            providerSelections: {
                where: { active: true },
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
    });
};

type CandidatePoolResult =
    | {
          success: true;
          apiKeyId: string;
          candidates: RoundhouseCandidate[];
          excluded: Set<string>;
      }
    | {
          success: false;
          error: SelectProviderError;
      };

const getCandidatePool = async (
    prisma: PrismaClient,
    apiKey: string,
    filters?: RoundhouseFilters,
): Promise<CandidatePoolResult> => {
    const apiKeyData = await getApiKeyWithSelections(prisma, apiKey);

    const apiKeyError = checkApiKeyError(apiKeyData);
    if (apiKeyError) {
        return {
            success: false,
            error: { success: false, ...apiKeyError },
        };
    }

    if (!apiKeyData) {
        return {
            success: false,
            error: {
                success: false,
                ...InternalResponses.API_KEY_NOTFOUND,
            },
        };
    }

    const candidates = buildCandidates(apiKeyData.providerSelections, filters);

    if (candidates.length === 0) {
        const requestedFilters = Boolean(filters?.modelKeys?.size);
        return {
            success: false,
            error: {
                success: false,
                ...(requestedFilters
                    ? InternalResponses.MODEL_NOT_FOUND
                    : InternalResponses.NO_AVAILABLE_MODELS),
            },
        };
    }

    const excluded = new Set<string>(
        apiKeyData.lastErrors.map(
            (lastError: { modelId: string; apiKeysManagerId: string }) =>
                `${lastError.modelId}:${lastError.apiKeysManagerId}`,
        ),
    );

    return {
        success: true,
        apiKeyId: apiKeyData.id,
        candidates,
        excluded,
    };
};

const createExcludedKey = (modelId: string, apiKeysManagerId: string) =>
    `${modelId}:${apiKeysManagerId}`;

const selectRandomApiKeysManager = (
    apiKeysManagers: RoundhouseApiKeysManagerRecord[],
) => {
    const index = Math.floor(Math.random() * apiKeysManagers.length);
    const apiKeysManager = apiKeysManagers[index];

    return {
        id: apiKeysManager.id,
        key: apiKeysManager.key,
    };
};

const runInBackground = (promise: Promise<unknown>) => {
    void promise.catch(() => undefined);
};

export const createListRoundhouseCandidates = (prisma: PrismaClient) => {
    return async (
        apiKey: string,
        filters?: RoundhouseFilters,
    ): Promise<
        | SelectProviderError
        | { success: true; candidates: RoundhouseCandidate[] }
    > => {
        const candidatePool = await getCandidatePool(prisma, apiKey, filters);

        if ("error" in candidatePool) {
            return candidatePool.error;
        }

        return {
            success: true,
            candidates: candidatePool.candidates,
        };
    };
};

export const createRoundhouseExecutor = (prisma: PrismaClient) => {
    return (async <T>(
        apiKey: string,
        execute: RoundhouseExecute<T>,
        maxIterations = DEFAULT_MAX_ITERATIONS,
        filters?: RoundhouseFilters,
    ): Promise<SelectProviderResponse<T>> => {
        const candidatePool = await getCandidatePool(prisma, apiKey, filters);

        if ("error" in candidatePool) {
            return candidatePool.error;
        }

        const { apiKeyId, candidates, excluded } = candidatePool;
        let iteration = 0;

        while (iteration < maxIterations) {
            iteration += 1;

            let available = candidates
                .map((candidate) => ({
                    candidate,
                    availableApiKeysManagers: candidate.apiKeysManagers.filter(
                        (apiKeysManager) =>
                            !excluded.has(
                                createExcludedKey(
                                    candidate.modelSelectionId,
                                    apiKeysManager.id,
                                ),
                            ),
                    ),
                }))
                .filter((entry) => entry.availableApiKeysManagers.length > 0);

            if (available.length === 0) {
                excluded.clear();

                runInBackground(
                    prisma.lastError.deleteMany({
                        where: { apiKeyId },
                    }),
                );

                available = candidates.map((candidate) => ({
                    candidate,
                    availableApiKeysManagers: [...candidate.apiKeysManagers],
                }));

                if (available.length === 0) {
                    return {
                        success: false,
                        ...InternalResponses.NO_AVAILABLE_MODELS,
                    };
                }
            }

            const selectedIndex =
                filters?.strategy === "random"
                    ? Math.floor(Math.random() * available.length)
                    : 0;
            const { candidate, availableApiKeysManagers } =
                available[selectedIndex];
            const apiKeysManager = selectRandomApiKeysManager(
                availableApiKeysManagers,
            );
            const result = await execute(candidate, apiKeysManager);

            if (result.success) {
                runInBackground(
                    prisma.lastError.deleteMany({
                        where: { apiKeyId },
                    }),
                );

                runInBackground(
                    prisma.apiKeysManager.update({
                        where: { id: apiKeysManager.id },
                        data: {
                            successCount: {
                                increment: 1,
                            },
                        },
                    }),
                );

                return {
                    success: true,
                    data: result.data,
                    candidate,
                    apiKeysManager,
                    iteration,
                };
            }

            excluded.add(
                createExcludedKey(
                    candidate.modelSelectionId,
                    apiKeysManager.id,
                ),
            );

            runInBackground(
                prisma.lastError.create({
                    data: {
                        apiKeyId,
                        modelId: candidate.modelSelectionId,
                        apiKeysManagerId: apiKeysManager.id,
                    },
                }),
            );
        }

        return {
            success: false,
            ...InternalResponses.MAX_ITERATIONS,
        };
    }) as BoundRoundhouseExecutor;
};

export type { BoundRoundhouseCandidateLister, BoundRoundhouseExecutor };
