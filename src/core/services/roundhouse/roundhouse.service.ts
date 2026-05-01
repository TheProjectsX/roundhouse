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
        inactiveModelIds: string[];
        inactiveUserModelIds: string[];
        providerApiKeys: RoundhouseProviderApiKey[];
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
        models: Array<Omit<RoundhouseModel, "provider">>;
        userModels: Array<Omit<RoundhouseModel, "provider">>;
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

        const activeProviderApiKeys = providerSelection.providerApiKeys.filter(
            (providerApiKey) => providerApiKey.active,
        );
        if (activeProviderApiKeys.length === 0) {
            continue;
        }

        const selectedModels = [
            ...providerSelection.models
                .filter(
                    (model) =>
                        !providerSelection.inactiveModelIds.includes(model.id),
                )
                .map((model) => ({ ...model, provider })),
            ...providerSelection.userModels
                .filter(
                    (model) =>
                        !providerSelection.inactiveUserModelIds.includes(
                            model.id,
                        ),
                )
                .map((model) => ({ ...model, provider })),
        ];

        for (const model of selectedModels) {
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
                modelSelectionId: model.id,
                providerSelectionId: providerSelection.id,
                model,
                providerApiKeys: activeProviderApiKeys,
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
                    providerApiKeys: {
                        where: { active: true },
                    },
                    models: true,
                    userModels: true,
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
            (lastError: { modelId: string; providerApiKeyId: string }) =>
                `${lastError.modelId}:${lastError.providerApiKeyId}`,
        ),
    );

    return {
        success: true,
        apiKeyId: apiKeyData.id,
        candidates,
        excluded,
    };
};

const createExcludedKey = (modelId: string, providerApiKeyId: string) =>
    `${modelId}:${providerApiKeyId}`;

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
                    availableProviderApiKeys: candidate.providerApiKeys.filter(
                        (providerApiKey) =>
                            !excluded.has(
                                createExcludedKey(
                                    candidate.modelSelectionId,
                                    providerApiKey.id,
                                ),
                            ),
                    ),
                }))
                .filter((entry) => entry.availableProviderApiKeys.length > 0);

            if (available.length === 0) {
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
            const { candidate, availableProviderApiKeys } =
                available[selectedIndex];
            const providerApiKey = selectRandomProviderApiKey(
                availableProviderApiKeys,
            );
            const result = await execute(candidate, providerApiKey);

            if (result.success) {
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

        return {
            success: false,
            ...InternalResponses.MAX_ITERATIONS,
        };
    }) as BoundRoundhouseExecutor;
};

export type { BoundRoundhouseCandidateLister, BoundRoundhouseExecutor };
