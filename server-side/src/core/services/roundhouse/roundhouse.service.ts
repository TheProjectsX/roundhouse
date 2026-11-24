import { checkApiKeyError } from "@/core/utils/errorChecker.util";
import { InternalResponses } from "@/core/constants/response";
import { createDevLogger } from "@/common/utils/logger";
import { PrismaClient } from "@prisma/client";
import { decryptVaultKey } from "@/common/utils/vault-crypto";
import {
    classifyProviderError,
    type ClassifiedProviderError,
} from "@/core/utils/providerError.util";
import {
    fitsContextWindowStrict,
    fitsContextWindowWithMargin,
} from "@/core/utils/preflight.util";
import {
    acquireLease,
    canUseCandidateKey,
    getKeyHeadroomFactor,
    recordUsage,
    releaseLease,
} from "@/core/utils/ratelimit.util";
import {
    computeBanditScore,
    recordModelLatency,
} from "@/core/utils/scoring.util";
import {
    getStickyModelSelectionId,
    recordStickySession,
} from "@/core/utils/stickySession.util";
import {
    buildKeyModelCooldownKey,
    buildKeyProviderCooldownKey,
    buildModelCooldownKey,
    clearModelFailureStreak,
    formatCooldownEta,
    getSoonestCooldownExpiry,
    isOnCooldown,
    recordModelFailureStreak,
    setCooldown,
} from "@/core/utils/cooldown.util";

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
    contextWindow?: number | null;
    supportsTools?: boolean | null;
    supportsVision?: boolean | null;
    rpmLimit?: number | null;
    rpdLimit?: number | null;
    tpmLimit?: number | null;
    tpdLimit?: number | null;
    efficiencyScore: number | null;
    deletedAt?: Date | null;
    provider: RoundhouseProvider;
};

export type RoundhouseCandidate = {
    modelSelectionId: string;
    providerSelectionId: string;
    model: RoundhouseModel;
    apiKeysManagers: RoundhouseApiKeysManagerRecord[];
    score: number;
    priority: number;
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
    error?: unknown;
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
    strategy?: "random" | "efficiency" | "priority";
    retryBudgetMs?: number;
    estimatedTokens?: number;
    requireVision?: boolean;
    requireTools?: boolean;
    stickySessionKey?: string;
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
const DEFAULT_RETRY_BUDGET_MS = 45_000;
const logger = createDevLogger("roundhouse");

const buildProviderRecord = (providerSelection: {
    provider: {
        id: string;
        code: string;
        name: string;
        type: "OPENAI" | "ANTHROPIC" | "GEMINI" | "CUSTOM";
        baseApi: string;
        deletedAt?: Date | null;
    } | null;
    userProvider: {
        id: string;
        code: string;
        name: string;
        type: "OPENAI" | "ANTHROPIC" | "GEMINI" | "CUSTOM";
        baseApi: string;
    } | null;
}) => {
    if (providerSelection.provider?.deletedAt) {
        return undefined;
    }
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
            deletedAt?: Date | null;
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
            priority: number;
            successCount?: number;
            failureCount?: number;
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
            .filter((ms) => ms.active && Boolean(ms.model ?? ms.userModel))
            .map((ms) => {
                const model = (ms.model ?? ms.userModel)!;
                return {
                    modelSelectionId: ms.id,
                    priority: ms.priority,
                    successCount: ms.successCount ?? 0,
                    failureCount: ms.failureCount ?? 0,
                    model: { ...model, provider } as Omit<
                        RoundhouseModel,
                        "provider"
                    > & { provider: RoundhouseProvider },
                };
            });

        for (const entry of selectedModels) {
            const model = entry.model;
            if (model.status !== "ACTIVE" || model.deletedAt) {
                continue;
            }

            if (filters?.provider && model.provider.type !== filters.provider) {
                continue;
            }

            if (filters?.requireVision && model.supportsVision === false) {
                continue;
            }

            if (filters?.requireTools && model.supportsTools === false) {
                continue;
            }

            if (
                filters?.estimatedTokens &&
                !fitsContextWindowStrict(
                    model.contextWindow,
                    filters.estimatedTokens,
                )
            ) {
                continue;
            }

            if (
                filters?.estimatedTokens &&
                model.tpmLimit != null &&
                model.tpmLimit > 0 &&
                filters.estimatedTokens > model.tpmLimit
            ) {
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

            const useBandit =
                !filters?.strategy || filters.strategy === "efficiency";
            const score = useBandit
                ? computeBanditScore({
                      modelId: model.id,
                      efficiencyScore: model.efficiencyScore,
                      successCount: entry.successCount,
                      failureCount: entry.failureCount,
                      apiKeysManagerIds: activeApiKeysManagers.map((k) => k.id),
                      limits: model,
                      providerType: model.provider.type,
                  })
                : (model.efficiencyScore ?? DEFAULT_SCORE);

            candidates.push({
                modelSelectionId: entry.modelSelectionId,
                providerSelectionId: providerSelection.id,
                model,
                apiKeysManagers: activeApiKeysManagers,
                score,
                priority: entry.priority ?? 1,
            });
        }
    }

    const sortByEfficiency = (list: RoundhouseCandidate[]) =>
        list.sort((a, b) => b.score - a.score);

    const sortByPriority = (list: RoundhouseCandidate[]) =>
        list.sort((a, b) =>
            a.priority === b.priority
                ? b.score - a.score
                : a.priority - b.priority,
        );

    const shuffle = (list: RoundhouseCandidate[]) => {
        for (let index = list.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
        }
    };

    if (filters?.strategy === "random") {
        shuffle(candidates);
    } else if (filters?.strategy === "priority") {
        sortByPriority(candidates);
    } else {
        sortByEfficiency(candidates);
    }

    // Soft-defer models whose context window fits strictly but lacks the 1.25x safety margin.
    const estimatedTokens = filters?.estimatedTokens;
    const orderedCandidates =
        estimatedTokens && estimatedTokens > 0
            ? [
                  ...candidates.filter((c) =>
                      fitsContextWindowWithMargin(
                          c.model.contextWindow,
                          estimatedTokens,
                      ),
                  ),
                  ...candidates.filter(
                      (c) =>
                          !fitsContextWindowWithMargin(
                              c.model.contextWindow,
                              estimatedTokens,
                          ),
                  ),
              ]
            : candidates;

    // Sticky session: promote the session's last successful model to front of chain
    const stickyModelSelectionId = getStickyModelSelectionId(
        filters?.stickySessionKey,
    );
    if (stickyModelSelectionId) {
        const stickyIdx = orderedCandidates.findIndex(
            (c) => c.modelSelectionId === stickyModelSelectionId,
        );
        if (stickyIdx > 0) {
            const [stickyCandidate] = orderedCandidates.splice(stickyIdx, 1);
            orderedCandidates.unshift(stickyCandidate);
        }
    }

    logger.log("Finished building candidates", {
        candidateCount: orderedCandidates.length,
    });

    return orderedCandidates;
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
            user: {
                select: { id: true, status: true, deletedAt: true },
            },
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
          apiKeyMaxIterations?: number;
          apiKeyRoundhouseMethod?: RoundhouseFilters["strategy"];
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

    if (!apiKeyData || apiKeyData.user?.deletedAt) {
        return {
            success: false,
            error: {
                success: false,
                ...InternalResponses.API_KEY_NOTFOUND,
            },
        };
    }

    const apiKeyRoundhouseMethod =
        apiKeyData.roundhouseMethod === "RANDOM"
            ? "random"
            : apiKeyData.roundhouseMethod === "EFFICIENCY"
              ? "efficiency"
              : apiKeyData.roundhouseMethod === "PRIORITY"
                ? "priority"
                : undefined;
    const effectiveFilters = {
        ...filters,
        strategy: filters?.strategy ?? apiKeyRoundhouseMethod,
    };
    const candidates = buildCandidates(
        apiKeyData.providerSelections,
        effectiveFilters,
    );

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
        apiKeyMaxIterations: apiKeyData.maxIterations ?? undefined,
        apiKeyRoundhouseMethod,
    };
};

const createExcludedKey = (modelId: string, apiKeysManagerId: string) =>
    `${modelId}:${apiKeysManagerId}`;

const selectBestApiKeysManager = (
    apiKeysManagers: RoundhouseApiKeysManagerRecord[],
    model: RoundhouseModel,
    now: number,
) => {
    let bestHeadroom = -1;
    let bestPool: RoundhouseApiKeysManagerRecord[] = [];

    for (const manager of apiKeysManagers) {
        const headroom = getKeyHeadroomFactor(
            manager.id,
            model.id,
            model,
            model.provider.type,
            now,
        );
        if (headroom > bestHeadroom + 0.01) {
            bestHeadroom = headroom;
            bestPool = [manager];
        } else if (Math.abs(headroom - bestHeadroom) <= 0.01) {
            bestPool.push(manager);
        }
    }

    const pool = bestPool.length > 0 ? bestPool : apiKeysManagers;
    const index = Math.floor(Math.random() * pool.length);
    const apiKeysManager = pool[index];

    return {
        id: apiKeysManager.id,
        key: decryptVaultKey(apiKeysManager.key),
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
    return (async <T,>(
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
        const effectiveMaxIterations =
            maxIterations ??
            candidatePool.apiKeyMaxIterations ??
            DEFAULT_MAX_ITERATIONS;
        const effectiveStrategy =
            filters?.strategy ?? candidatePool.apiKeyRoundhouseMethod;
        const retryBudgetMs = filters?.retryBudgetMs ?? DEFAULT_RETRY_BUDGET_MS;
        const startedAt = Date.now();
        const skipProviders = new Set<string>();
        const skipModels = new Set<string>();
        const cooldownKeysChecked = new Set<string>();
        let lastClassifiedError: ClassifiedProviderError | null = null;
        let rateLimitedByLedger = false;
        let iteration = 0;

        while (iteration < effectiveMaxIterations) {
            if (
                iteration >= 2 &&
                retryBudgetMs > 0 &&
                Date.now() - startedAt >= retryBudgetMs
            ) {
                logger.warn("Wall-clock retry budget exceeded", {
                    iteration,
                    elapsedMs: Date.now() - startedAt,
                    retryBudgetMs,
                });
                break;
            }

            iteration += 1;
            const now = Date.now();

            let available = candidates
                .filter(
                    (candidate) =>
                        !skipProviders.has(candidate.model.provider.id) &&
                        !skipModels.has(candidate.model.id),
                )
                .filter((candidate) => {
                    const modelCooldownKey = buildModelCooldownKey(
                        candidate.model.id,
                    );
                    cooldownKeysChecked.add(modelCooldownKey);
                    return !isOnCooldown(modelCooldownKey, now);
                })
                .map((candidate) => ({
                    candidate,
                    availableApiKeysManagers: candidate.apiKeysManagers.filter(
                        (apiKeysManager) => {
                            if (
                                excluded.has(
                                    createExcludedKey(
                                        candidate.modelSelectionId,
                                        apiKeysManager.id,
                                    ),
                                )
                            ) {
                                return false;
                            }

                            const keyProviderCooldownKey =
                                buildKeyProviderCooldownKey(
                                    apiKeysManager.id,
                                    candidate.model.provider.id,
                                );
                            const keyModelCooldownKey =
                                buildKeyModelCooldownKey(
                                    apiKeysManager.id,
                                    candidate.modelSelectionId,
                                );
                            cooldownKeysChecked.add(keyProviderCooldownKey);
                            cooldownKeysChecked.add(keyModelCooldownKey);

                            const withinLedger = canUseCandidateKey(
                                apiKeysManager.id,
                                candidate.model.id,
                                candidate.model,
                                filters?.estimatedTokens ?? 0,
                                candidate.model.provider.type,
                                now,
                            );
                            if (!withinLedger) {
                                rateLimitedByLedger = true;
                            }

                            return (
                                !isOnCooldown(keyProviderCooldownKey, now) &&
                                !isOnCooldown(keyModelCooldownKey, now) &&
                                withinLedger
                            );
                        },
                    ),
                }))
                .filter((entry) => entry.availableApiKeysManagers.length > 0);

            if (available.length === 0 && excluded.size > 0) {
                excluded.clear();

                runInBackground(
                    prisma.lastError.deleteMany({
                        where: { apiKeyId },
                    }),
                );

                available = candidates
                    .filter(
                        (candidate) =>
                            !skipProviders.has(candidate.model.provider.id) &&
                            !skipModels.has(candidate.model.id),
                    )
                    .filter(
                        (candidate) =>
                            !isOnCooldown(
                                buildModelCooldownKey(candidate.model.id),
                                now,
                            ),
                    )
                    .map((candidate) => ({
                        candidate,
                        availableApiKeysManagers:
                            candidate.apiKeysManagers.filter(
                                (apiKeysManager) =>
                                    !isOnCooldown(
                                        buildKeyProviderCooldownKey(
                                            apiKeysManager.id,
                                            candidate.model.provider.id,
                                        ),
                                        now,
                                    ) &&
                                    !isOnCooldown(
                                        buildKeyModelCooldownKey(
                                            apiKeysManager.id,
                                            candidate.modelSelectionId,
                                        ),
                                        now,
                                    ) &&
                                    canUseCandidateKey(
                                        apiKeysManager.id,
                                        candidate.model.id,
                                        candidate.model,
                                        filters?.estimatedTokens ?? 0,
                                        candidate.model.provider.type,
                                        now,
                                    ),
                            ),
                    }))
                    .filter(
                        (entry) => entry.availableApiKeysManagers.length > 0,
                    );
            }

            if (available.length === 0) {
                const soonestExpiry = getSoonestCooldownExpiry(
                    Array.from(cooldownKeysChecked),
                    now,
                );
                const eta = formatCooldownEta(soonestExpiry, now);
                const etaSuffix = eta ? ` Soonest reset ${eta}.` : "";

                if (lastClassifiedError?.category === "context_too_large") {
                    return {
                        success: false,
                        code: "RH413",
                        status_code: 413,
                        message: `Prompt exceeds the context window of all available models.${etaSuffix}`,
                    };
                }

                if (
                    soonestExpiry !== null ||
                    rateLimitedByLedger ||
                    lastClassifiedError?.category === "rate_limit"
                ) {
                    return {
                        success: false,
                        code: "RH429",
                        status_code: 429,
                        message: `All candidate models/keys are currently rate-limited or cooling down.${etaSuffix}`,
                    };
                }

                if (lastClassifiedError) {
                    return {
                        success: false,
                        code: "RH502",
                        status_code: lastClassifiedError.status || 502,
                        message: `All candidate models failed. Last error: ${lastClassifiedError.message}`,
                    };
                }

                return {
                    success: false,
                    ...InternalResponses.NO_AVAILABLE_MODELS,
                };
            }

            const selectedIndex =
                effectiveStrategy === "random"
                    ? Math.floor(Math.random() * available.length)
                    : 0;
            const { candidate, availableApiKeysManagers } =
                available[selectedIndex];
            const apiKeysManager = selectBestApiKeysManager(
                availableApiKeysManagers,
                candidate.model,
                now,
            );
            const leaseId = acquireLease(
                apiKeysManager.id,
                candidate.model.id,
                filters?.estimatedTokens ?? 0,
                now,
            );
            const attemptStartedAt = Date.now();
            let result: RoundhouseExecutionResult<T>;
            try {
                result = await execute(candidate, apiKeysManager);
            } finally {
                releaseLease(leaseId);
            }

            if (result.success) {
                recordModelLatency(
                    candidate.model.id,
                    Date.now() - attemptStartedAt,
                );
                recordStickySession(
                    filters?.stickySessionKey,
                    candidate.modelSelectionId,
                );
                recordUsage(
                    apiKeysManager.id,
                    candidate.model.id,
                    filters?.estimatedTokens ?? 0,
                );
                clearModelFailureStreak(candidate.model.id);

                runInBackground(
                    prisma.lastError.deleteMany({
                        where: {
                            apiKeyId,
                            modelId: candidate.modelSelectionId,
                            apiKeysManagerId: apiKeysManager.id,
                        },
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

            const classified = classifyProviderError(
                "error" in result ? result.error : undefined,
            );
            lastClassifiedError = classified;
            const failureTime = Date.now();

            if (classified.cooldownScope === "key_provider") {
                setCooldown(
                    buildKeyProviderCooldownKey(
                        apiKeysManager.id,
                        candidate.model.provider.id,
                    ),
                    classified.cooldownMs,
                    classified.category,
                    failureTime,
                );
            } else if (classified.cooldownScope === "model") {
                setCooldown(
                    buildModelCooldownKey(candidate.model.id),
                    classified.cooldownMs,
                    classified.category,
                    failureTime,
                );
                skipModels.add(candidate.model.id);
            } else if (classified.cooldownScope === "request_provider") {
                skipProviders.add(candidate.model.provider.id);
            } else if (classified.cooldownScope === "key_model") {
                setCooldown(
                    buildKeyModelCooldownKey(
                        apiKeysManager.id,
                        candidate.modelSelectionId,
                    ),
                    classified.cooldownMs,
                    classified.category,
                    failureTime,
                );
            }

            if (classified.category !== "context_too_large") {
                recordModelFailureStreak(candidate.model.id, failureTime);
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

            runInBackground(
                prisma.modelSelection.update({
                    where: { id: candidate.modelSelectionId },
                    data: {
                        failureCount: {
                            increment: 1,
                        },
                    },
                }),
            );
        }

        if (lastClassifiedError) {
            return {
                success: false,
                code: "RH301",
                status_code:
                    lastClassifiedError.category === "rate_limit"
                        ? 429
                        : lastClassifiedError.status || 409,
                message: `Maximum roundhouse attempts reached. Last error: ${lastClassifiedError.message}`,
            };
        }

        return {
            success: false,
            ...InternalResponses.MAX_ITERATIONS,
        };
    }) as BoundRoundhouseExecutor;
};

export type { BoundRoundhouseCandidateLister, BoundRoundhouseExecutor };
