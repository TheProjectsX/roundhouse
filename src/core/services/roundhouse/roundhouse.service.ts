import { checkApiKeyError } from "@/core/utils/errorChecker.util";
import { InternalResponses } from "@/core/constants/response";
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
    model: RoundhouseModel;
    score: number;
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
) => Promise<RoundhouseExecutionResult<T>>;

export type SelectProviderSuccess<T> = {
    success: true;
    data: T;
    candidate: RoundhouseCandidate;
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
        active: boolean;
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

    for (const providerSelection of providerSelections) {
        if (!providerSelection.active) {
            continue;
        }

        for (const modelSelection of providerSelection.modelSelections) {
            if (!modelSelection.active) {
                continue;
            }

            const model = pickModel(modelSelection);
            if (!model) {
                continue;
            }

            if (filters?.provider && model.provider.type !== filters.provider) {
                continue;
            }

            if (allowedModelKeys) {
                const normalizedKey = `${model.provider.type.toLowerCase()}/${model.code.toLowerCase()}`;

                if (!allowedModelKeys.has(normalizedKey)) {
                    continue;
                }
            }

            if (
                model.maxTokens !== null &&
                modelSelection.usedTokens >= model.maxTokens
            ) {
                continue;
            }

            candidates.push({
                modelSelectionId: modelSelection.id,
                model,
                score: model.efficiencyScore ?? DEFAULT_SCORE,
            });
        }
    }

    candidates.sort((a, b) => b.score - a.score);

    return candidates;
};

const getApiKeyWithSelections = async (
    prisma: PrismaClient,
    apiKey: string,
) => {
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

    const safeApiKeyData = apiKeyData;
    if (!safeApiKeyData) {
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
        return {
            success: false,
            error: {
                success: false,
                ...InternalResponses.NO_AVAILABLE_MODELS,
            },
        };
    }

    const excluded = new Set<string>(
        safeApiKeyData.lastErrors.map(
            (lastError: { modelId: string }) => lastError.modelId,
        ),
    );

    return {
        success: true,
        apiKeyId: safeApiKeyData.id,
        candidates,
        excluded,
    };
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

            let available = candidates.filter(
                (candidate) => !excluded.has(candidate.modelSelectionId),
            );

            if (available.length === 0) {
                excluded.clear();

                await prisma.lastError.deleteMany({
                    where: { apiKeyId },
                });

                available = [...candidates];

                if (available.length === 0) {
                    return {
                        success: false,
                        ...InternalResponses.NO_AVAILABLE_MODELS,
                    };
                }
            }

            const candidate = available[0];
            const result = await execute(candidate);

            if (result.success) {
                await prisma.lastError.deleteMany({
                    where: { apiKeyId },
                });

                return {
                    success: true,
                    data: result.data,
                    candidate,
                    iteration,
                };
            }

            excluded.add(candidate.modelSelectionId);

            await prisma.lastError.create({
                data: {
                    apiKeyId,
                    modelId: candidate.modelSelectionId,
                },
            });
        }

        return {
            success: false,
            ...InternalResponses.MAX_ITERATIONS,
        };
    }) as BoundRoundhouseExecutor;
};

export type { BoundRoundhouseCandidateLister, BoundRoundhouseExecutor };
