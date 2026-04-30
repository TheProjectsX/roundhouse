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
    name: string;
    type: "OPENAI" | "ANTHROPIC" | "GEMINI" | "CUSTOM";
    baseApi: string;
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
    providerApiKeys: RoundhouseProviderApiKey[];
    score: number;
};

type RoundhouseProviderApiKey = {
    id: string;
    key: string;
    active: boolean;
    successCount: number;
};

export type RoundhouseSelectedProviderApiKey = {
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
    providerApiKey: RoundhouseSelectedProviderApiKey,
) => Promise<RoundhouseExecutionResult<T>>;

export type SelectProviderSuccess<T> = {
    success: true;
    data: T;
    candidate: RoundhouseCandidate;
    providerApiKey: RoundhouseSelectedProviderApiKey;
    iteration: number;
};

type SelectProviderResponse<T> = SelectProviderError | SelectProviderSuccess<T>;

export type RoundhouseFilters = {
    provider?: "OPENAI" | "ANTHROPIC" | "GEMINI" | "CUSTOM";
    modelKeys?: Set<string>;
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

const pickModel = (candidate: {
    userModels: RoundhouseModel[];
    models: RoundhouseModel[];
}): RoundhouseModel | undefined => {
    return [...candidate.userModels, ...candidate.models].find(
        (model) => model.status === "ACTIVE",
    );
};

const buildCandidates = (
    providerSelections: Array<{
        id: string;
        active: boolean;
        providerApiKeys: RoundhouseProviderApiKey[];
        modelSelections: Array<{
            id: string;
            active: boolean;
            usedTokens: number;
            models: RoundhouseModel[];
            userModels: RoundhouseModel[];
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
    });

    for (const providerSelection of providerSelections) {
        if (!providerSelection.active) {
            logger.log("Skipping inactive provider selection", {
                providerSelectionId: providerSelection.id,
            });
            continue;
        }

        const activeProviderApiKeys = providerSelection.providerApiKeys.filter(
            (providerApiKey) => providerApiKey.active,
        );
        if (activeProviderApiKeys.length === 0) {
            logger.warn("No active provider API keys for selection", {
                providerSelectionId: providerSelection.id,
            });
            continue;
        }

        for (const modelSelection of providerSelection.modelSelections) {
            if (!modelSelection.active) {
                logger.log("Skipping inactive model selection", {
                    providerSelectionId: providerSelection.id,
                    modelSelectionId: modelSelection.id,
                });
                continue;
            }

            const model = pickModel(modelSelection);
            if (!model) {
                logger.warn("No active model found for model selection", {
                    providerSelectionId: providerSelection.id,
                    modelSelectionId: modelSelection.id,
                });
                continue;
            }

            if (filters?.provider && model.provider.type !== filters.provider) {
                logger.log("Skipping model due to provider filter mismatch", {
                    modelId: model.id,
                    modelProviderType: model.provider.type,
                    requestedProviderType: filters.provider,
                });
                continue;
            }

            if (allowedModelKeys) {
                const normalizedKey = `${model.provider.type.toLowerCase()}/${model.code.toLowerCase()}`;
                const normalizedProvider = model.provider.type.toLowerCase();
                const normalizedModelCode = model.code.toLowerCase();

                if (
                    !allowedModelKeys.has(normalizedKey) &&
                    !allowedModelKeys.has(normalizedProvider) &&
                    !allowedModelKeys.has(normalizedModelCode)
                ) {
                    logger.log("Skipping model due to model key filter mismatch", {
                        modelId: model.id,
                        normalizedKey,
                    });
                    continue;
                }
            }

            if (
                model.maxTokens !== null &&
                modelSelection.usedTokens >= model.maxTokens
            ) {
                logger.warn("Skipping model selection due to token limit", {
                    modelSelectionId: modelSelection.id,
                    usedTokens: modelSelection.usedTokens,
                    maxTokens: model.maxTokens,
                });
                continue;
            }

            candidates.push({
                modelSelectionId: modelSelection.id,
                providerSelectionId: providerSelection.id,
                model,
                providerApiKeys: activeProviderApiKeys,
                score: model.efficiencyScore ?? DEFAULT_SCORE,
            });
        }
    }

    candidates.sort((a, b) => b.score - a.score);

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
                    providers: true,
                    userProviders: true,
                    providerApiKeys: {
                        where: { active: true },
                    },
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
    logger.log("Preparing candidate pool", {
        providerFilter: filters?.provider ?? null,
        allowedModelKeysCount: filters?.modelKeys?.size ?? 0,
    });

    const apiKeyData = await getApiKeyWithSelections(prisma, apiKey);

    const apiKeyError = checkApiKeyError(apiKeyData);
    if (apiKeyError) {
        logger.warn("API key failed validation", {
            code: apiKeyError.code,
            statusCode: apiKeyError.status_code,
        });
        return {
            success: false,
            error: { success: false, ...apiKeyError },
        };
    }

    const safeApiKeyData = apiKeyData;
    if (!safeApiKeyData) {
        logger.warn("API key not found during candidate pool preparation");
        return {
            success: false,
            error: {
                success: false,
                ...InternalResponses.API_KEY_NOTFOUND,
            },
        };
    }

    const candidates = buildCandidates(
        safeApiKeyData.providerSelections,
        filters,
    );

    if (candidates.length === 0) {
        const requestedFilters = Boolean(filters?.modelKeys?.size);
        logger.warn("No available roundhouse candidates", {
            requestedFilters,
            providerSelectionCount: safeApiKeyData.providerSelections.length,
        });
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
        safeApiKeyData.lastErrors.map(
            (lastError: { modelId: string; providerApiKeyId: string }) =>
                `${lastError.modelId}:${lastError.providerApiKeyId}`,
        ),
    );

    logger.log("Candidate pool ready", {
        apiKeyId: safeApiKeyData.id,
        candidateCount: candidates.length,
        excludedCount: excluded.size,
    });

    return {
        success: true,
        apiKeyId: safeApiKeyData.id,
        candidates,
        excluded,
    };
};

const createExcludedKey = (
    modelSelectionId: string,
    providerApiKeyId: string,
) => `${modelSelectionId}:${providerApiKeyId}`;

const selectRandomProviderApiKey = (
    providerApiKeys: RoundhouseProviderApiKey[],
) => {
    const index = Math.floor(Math.random() * providerApiKeys.length);
    const providerApiKey = providerApiKeys[index];

    return {
        id: providerApiKey.id,
        key: providerApiKey.key,
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
        logger.log("Listing roundhouse candidates");
        const candidatePool = await getCandidatePool(prisma, apiKey, filters);

        if ("error" in candidatePool) {
            logger.warn("Failed to list roundhouse candidates", {
                code: candidatePool.error.code,
                statusCode: candidatePool.error.status_code,
            });
            return candidatePool.error;
        }

        logger.log("Roundhouse candidates listed", {
            candidateCount: candidatePool.candidates.length,
        });
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
        logger.log("Starting roundhouse execution", {
            maxIterations,
            providerFilter: filters?.provider ?? null,
            allowedModelKeysCount: filters?.modelKeys?.size ?? 0,
        });
        const candidatePool = await getCandidatePool(prisma, apiKey, filters);

        if ("error" in candidatePool) {
            logger.warn("Roundhouse execution aborted during candidate preparation", {
                code: candidatePool.error.code,
                statusCode: candidatePool.error.status_code,
            });
            return candidatePool.error;
        }

        const { apiKeyId, candidates, excluded } = candidatePool;
        let iteration = 0;

        while (iteration < maxIterations) {
            iteration += 1;

            logger.log("Roundhouse iteration started", {
                iteration,
                maxIterations,
                candidateCount: candidates.length,
                excludedCount: excluded.size,
            });

            let available = candidates
                .map((candidate) => {
                    const availableProviderApiKeys =
                        candidate.providerApiKeys.filter(
                            (providerApiKey) =>
                                !excluded.has(
                                    createExcludedKey(
                                        candidate.modelSelectionId,
                                        providerApiKey.id,
                                    ),
                                ),
                        );

                    return {
                        candidate,
                        availableProviderApiKeys,
                    };
                })
                .filter((entry) => entry.availableProviderApiKeys.length > 0);

            logger.log("Evaluated available provider API keys", {
                iteration,
                availableCandidateCount: available.length,
            });

            if (available.length === 0) {
                logger.warn("No available provider API keys remain, clearing exclusions", {
                    iteration,
                    excludedCount: excluded.size,
                });
                excluded.clear();

                runInBackground(
                    prisma.lastError.deleteMany({
                        where: { apiKeyId },
                    }),
                );

                available = candidates.map((candidate) => ({
                    candidate,
                    availableProviderApiKeys: [...candidate.providerApiKeys],
                }));

                if (available.length === 0) {
                    logger.warn("No candidates available after exclusion reset", {
                        iteration,
                    });
                    return {
                        success: false,
                        ...InternalResponses.NO_AVAILABLE_MODELS,
                    };
                }
            }

            const { candidate, availableProviderApiKeys } = available[0];
            const providerApiKey = selectRandomProviderApiKey(
                availableProviderApiKeys,
            );
            logger.log("Selected candidate for execution", {
                iteration,
                providerSelectionId: candidate.providerSelectionId,
                modelSelectionId: candidate.modelSelectionId,
                modelId: candidate.model.id,
                providerApiKeyId: providerApiKey.id,
                availableProviderApiKeyCount: availableProviderApiKeys.length,
            });
            const result = await execute(candidate, providerApiKey);

            if (result.success) {
                logger.log("Roundhouse execution succeeded", {
                    iteration,
                    providerSelectionId: candidate.providerSelectionId,
                    modelSelectionId: candidate.modelSelectionId,
                    providerApiKeyId: providerApiKey.id,
                });
                runInBackground(
                    prisma.lastError.deleteMany({
                        where: { apiKeyId },
                    }),
                );

                runInBackground(
                    prisma.providerApiKey.update({
                        where: { id: providerApiKey.id },
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
                    providerApiKey,
                    iteration,
                };
            }

            logger.warn("Roundhouse execution failed for selected provider API key", {
                iteration,
                providerSelectionId: candidate.providerSelectionId,
                modelSelectionId: candidate.modelSelectionId,
                providerApiKeyId: providerApiKey.id,
            });
            excluded.add(
                createExcludedKey(
                    candidate.modelSelectionId,
                    providerApiKey.id,
                ),
            );

            runInBackground(
                prisma.lastError.create({
                    data: {
                        apiKeyId,
                        modelId: candidate.modelSelectionId,
                        providerApiKeyId: providerApiKey.id,
                    },
                }),
            );
        }

        logger.warn("Roundhouse execution reached max iterations", {
            maxIterations,
            candidateCount: candidates.length,
        });
        return {
            success: false,
            ...InternalResponses.MAX_ITERATIONS,
        };
    }) as BoundRoundhouseExecutor;
};

export type { BoundRoundhouseCandidateLister, BoundRoundhouseExecutor };
