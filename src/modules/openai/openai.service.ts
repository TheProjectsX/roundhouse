import {
    createChatCompletion,
    createChatCompletionStreamWithUsage,
    createResponse,
} from "@/core/api-wrapper/service";
import {
    type BoundRoundhouseExecutor,
    createRoundhouseExecutor,
} from "@/core/services/roundhouse/roundhouse.service";
import type {
    OpenAIChatCompletionRequest,
    OpenAIResponsesRequest,
} from "@/core/models/types";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ModelSelectionService } from "@/common/services/modelSelection/model-selection.service";
import { background } from "@/common/utils/background";
import { createDevLogger } from "@/common/utils/logger";
import { toOpenAIError } from "@/core/utils/openaiError.util";
import {
    resolveRoundhouseFilters,
    resolveApiKey,
} from "@/core/utils/roundhouseRequest.util";
import { HttpStatus, Injectable } from "@nestjs/common";
import { ContentStatus } from "@prisma/client";
import type { Request } from "express";
import { ZodError } from "zod";
import {
    chatCompletionBodySchema,
    listModelsQuerySchema,
    responsesBodySchema,
} from "./openai.validation";

@Injectable()
export class OpenaiService {
    private readonly executor: BoundRoundhouseExecutor;
    private readonly logger = createDevLogger("openai.chat");

    constructor(
        private readonly prisma: PrismaService,
        private readonly modelSelectionService: ModelSelectionService,
    ) {
        this.executor = createRoundhouseExecutor(this.prisma);
    }

    private queueModelSelectionStats(
        modelSelectionId: string,
        tokenUsage: number,
        successCount = 1,
    ) {
        background.add(async () => {
            await this.modelSelectionService.updateModelSelectionStats(
                modelSelectionId,
                {
                    tokenUsage,
                    successCount,
                    lastUsedAt: new Date(),
                },
            );
        }, 1);
    }

    private toValidationMessage(error: ZodError) {
        return error.issues
            .map((issue) => {
                const path =
                    issue.path.length > 0 ? issue.path.join(".") : "body";
                return `${path}: ${issue.message}`;
            })
            .join("; ");
    }

    private createErrorResponse(
        statusCode: number,
        message: string,
        code: string,
        type: string,
    ) {
        return {
            statusCode,
            body: toOpenAIError(message, {
                code,
                type,
            }),
        };
    }

    private parseModelFilterTokens(value: string): string[] {
        return value
            .split(",")
            .map((part) => part.trim().toLowerCase())
            .filter(Boolean);
    }

    private mergeBodyModelWithModelKeys(
        bodyModel: string | undefined,
        modelKeys: Set<string> | undefined,
    ): Set<string> | undefined {
        const normalizedBodyModel = bodyModel?.trim().toLowerCase();
        if (
            !normalizedBodyModel ||
            normalizedBodyModel === "auto" ||
            normalizedBodyModel === "roundhouse"
        ) {
            return modelKeys;
        }

        const merged = modelKeys ? new Set(modelKeys) : new Set<string>();
        this.parseModelFilterTokens(normalizedBodyModel).forEach((token) =>
            merged.add(token),
        );
        return merged;
    }

    private matchesModelKeys(
        providerCode: string,
        providerType: string,
        modelCode: string,
        modelKeys: Set<string> | undefined,
    ) {
        if (!modelKeys || modelKeys.size === 0) {
            return true;
        }

        const normalizedProvider = providerCode.toLowerCase();
        const normalizedType = providerType.toLowerCase();
        const normalizedModelCode = modelCode.toLowerCase();
        const normalizedProviderKey = `${normalizedProvider}/${normalizedModelCode}`;
        const normalizedTypeKey = `${normalizedType}/${normalizedModelCode}`;

        return (
            modelKeys.has(normalizedProviderKey) ||
            modelKeys.has(normalizedTypeKey) ||
            modelKeys.has(normalizedProvider) ||
            modelKeys.has(normalizedType) ||
            modelKeys.has(normalizedModelCode)
        );
    }

    async chatCompletions(req: Request) {
        const startedAt = Date.now();
        this.logger.log("chatCompletions request started", {
            stream: Boolean(req.body?.stream),
        });

        const apiKey = resolveApiKey(req);
        if (!apiKey) {
            this.logger.warn("chatCompletions missing API key");
            return this.createErrorResponse(
                HttpStatus.UNAUTHORIZED,
                "Missing API key. Use Authorization: Bearer <key>.",
                "api_key_missing",
                "authentication_error",
            );
        }

        try {
            const validationStartedAt = Date.now();
            const body = chatCompletionBodySchema.parse(
                req.body,
            ) as OpenAIChatCompletionRequest;
            this.logger.log("chatCompletions body validated", {
                durationMs: Date.now() - validationStartedAt,
                stream: Boolean(body.stream),
                messageCount: body.messages?.length ?? 0,
            });

            const { provider, modelKeys, maxIterations, strategy } =
                resolveRoundhouseFilters(req.headers);
            const mergedModelKeys = this.mergeBodyModelWithModelKeys(
                body.model,
                modelKeys,
            );
            this.logger.log("chatCompletions filters resolved", {
                provider: provider ?? null,
                maxIterations: maxIterations ?? null,
                strategy,
                mergedModelKeysCount: mergedModelKeys?.size ?? 0,
                requestedModel: body.model ?? null,
            });

            if (body.stream) {
                const streamSelectionStartedAt = Date.now();
                const streamedResult = await this.executor<{
                    chunks: string[];
                    usage?: { total_tokens: number };
                }>(
                    apiKey,
                    async (candidate, apiKeysManager) => {
                        const providerCallStartedAt = Date.now();

                        try {
                            this.logger.log(
                                "chatCompletions stream provider call started",
                                {
                                    providerSelectionId:
                                        candidate.providerSelectionId,
                                    modelSelectionId:
                                        candidate.modelSelectionId,
                                    modelId: candidate.model.id,
                                    providerType: candidate.model.provider.type,
                                    apiKeysManagerId: apiKeysManager.id,
                                },
                            );
                            const streamResponse =
                                await createChatCompletionStreamWithUsage(
                                    {
                                        ...body,
                                        model: `${candidate.model.provider.type.toLowerCase()}/${candidate.model.code}`,
                                    },
                                    {
                                        baseApi:
                                            candidate.model.provider.baseApi,
                                        apiKey: apiKeysManager.key,
                                        headers: req.headers,
                                    },
                                );
                            this.logger.log(
                                "chatCompletions stream provider call succeeded",
                                {
                                    durationMs:
                                        Date.now() - providerCallStartedAt,
                                    providerSelectionId:
                                        candidate.providerSelectionId,
                                    modelSelectionId:
                                        candidate.modelSelectionId,
                                    chunkCount: streamResponse.chunks.length,
                                },
                            );

                            return {
                                success: true as const,
                                data: streamResponse,
                            };
                        } catch (error) {
                            console.error(error);
                            this.logger.warn(
                                "chatCompletions stream provider call failed",
                                {
                                    durationMs:
                                        Date.now() - providerCallStartedAt,
                                    providerSelectionId:
                                        candidate.providerSelectionId,
                                    modelSelectionId:
                                        candidate.modelSelectionId,
                                    apiKeysManagerId: apiKeysManager.id,
                                    error:
                                        error instanceof Error
                                            ? error.message
                                            : "Unknown error",
                                },
                            );
                            return {
                                success: false as const,
                            };
                        }
                    },
                    maxIterations,
                    {
                        provider,
                        modelKeys: mergedModelKeys,
                        strategy,
                    },
                );
                this.logger.log("chatCompletions stream selection finished", {
                    durationMs: Date.now() - streamSelectionStartedAt,
                });

                if ("code" in streamedResult) {
                    this.logger.warn(
                        "chatCompletions stream returned roundhouse error",
                        {
                            code: streamedResult.code,
                            statusCode: streamedResult.status_code,
                            totalDurationMs: Date.now() - startedAt,
                        },
                    );
                    return this.createErrorResponse(
                        streamedResult.status_code,
                        streamedResult.message,
                        streamedResult.code,
                        "invalid_request_error",
                    );
                }

                const tokenUsage = streamedResult.data.usage?.total_tokens ?? 0;

                this.queueModelSelectionStats(
                    streamedResult.candidate.modelSelectionId,
                    tokenUsage,
                );

                this.logger.log("chatCompletions stream request succeeded", {
                    totalDurationMs: Date.now() - startedAt,
                    chunkCount: streamedResult.data.chunks.length,
                    tokenUsage,
                });
                return {
                    statusCode: HttpStatus.OK,
                    stream: true,
                    chunks: streamedResult.data.chunks,
                };
            }

            const selectionStartedAt = Date.now();
            const result = await this.executor(
                apiKey,
                async (candidate, apiKeysManager) => {
                    const providerCallStartedAt = Date.now();

                    try {
                        this.logger.log(
                            "chatCompletions provider call started",
                            {
                                providerSelectionId:
                                    candidate.providerSelectionId,
                                modelSelectionId: candidate.modelSelectionId,
                                modelId: candidate.model.id,
                                providerType: candidate.model.provider.type,
                                apiKeysManagerId: apiKeysManager.id,
                            },
                        );
                        this.logger.log(
                            "chatCompletions provider call request",
                            {
                                ...body,
                                model: `${candidate.model.provider.type.toLowerCase()}/${candidate.model.code}`,

                                baseApi: candidate.model.provider.baseApi,
                                apiKey: apiKeysManager.key,
                                headers: req.headers,
                            },
                        );
                        const response = await createChatCompletion(
                            {
                                ...body,
                                model: `${candidate.model.provider.type.toLowerCase()}/${candidate.model.code}`,
                            },
                            {
                                baseApi: candidate.model.provider.baseApi,
                                apiKey: apiKeysManager.key,
                                headers: req.headers,
                            },
                        );
                        this.logger.log(
                            "chatCompletions provider call succeeded",
                            {
                                durationMs: Date.now() - providerCallStartedAt,
                                providerSelectionId:
                                    candidate.providerSelectionId,
                                modelSelectionId: candidate.modelSelectionId,
                                apiKeysManagerId: apiKeysManager.id,
                            },
                        );

                        return {
                            success: true as const,
                            data: response,
                        };
                    } catch (error) {
                        this.logger.warn(
                            "chatCompletions provider call failed",
                            {
                                durationMs: Date.now() - providerCallStartedAt,
                                providerSelectionId:
                                    candidate.providerSelectionId,
                                modelSelectionId: candidate.modelSelectionId,
                                apiKeysManagerId: apiKeysManager.id,
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : "Unknown error",
                            },
                        );
                        return {
                            success: false as const,
                        };
                    }
                },
                maxIterations,
                {
                    provider,
                    modelKeys: mergedModelKeys,
                    strategy,
                },
            );
            this.logger.log("chatCompletions selection finished", {
                durationMs: Date.now() - selectionStartedAt,
            });

            if ("code" in result) {
                this.logger.warn("chatCompletions returned roundhouse error", {
                    code: result.code,
                    statusCode: result.status_code,
                    totalDurationMs: Date.now() - startedAt,
                });
                return this.createErrorResponse(
                    result.status_code,
                    result.message,
                    result.code,
                    "invalid_request_error",
                );
            }

            const tokenUsage = result.data.usage?.total_tokens ?? 0;
            this.queueModelSelectionStats(
                result.candidate.modelSelectionId,
                tokenUsage,
            );

            this.logger.log("chatCompletions request succeeded", {
                totalDurationMs: Date.now() - startedAt,
                modelSelectionId: result.candidate.modelSelectionId,
                tokenUsage,
            });
            return {
                statusCode: HttpStatus.OK,
                body: result.data,
            };
        } catch (error) {
            if (error instanceof ZodError) {
                this.logger.warn("chatCompletions validation failed", {
                    totalDurationMs: Date.now() - startedAt,
                    error: this.toValidationMessage(error),
                });
                return this.createErrorResponse(
                    HttpStatus.BAD_REQUEST,
                    `Validation failed: ${this.toValidationMessage(error)}`,
                    "validation_error",
                    "invalid_request_error",
                );
            }

            this.logger.error("chatCompletions unexpected server error", {
                totalDurationMs: Date.now() - startedAt,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return this.createErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Unexpected server error.",
                "internal_error",
                "server_error",
            );
        }
    }

    async responses(req: Request) {
        const startedAt = Date.now();
        this.logger.log("responses request started");

        const apiKey = resolveApiKey(req);
        if (!apiKey) {
            this.logger.warn("responses missing API key");
            return this.createErrorResponse(
                HttpStatus.UNAUTHORIZED,
                "Missing API key. Use Authorization: Bearer <key>.",
                "api_key_missing",
                "authentication_error",
            );
        }

        try {
            const validationStartedAt = Date.now();
            const body = responsesBodySchema.parse(
                req.body,
            ) as OpenAIResponsesRequest;
            this.logger.log("responses body validated", {
                durationMs: Date.now() - validationStartedAt,
                requestedModel: body.model ?? null,
            });
            const { provider, modelKeys, maxIterations, strategy } =
                resolveRoundhouseFilters(req.headers);
            const mergedModelKeys = this.mergeBodyModelWithModelKeys(
                body.model,
                modelKeys,
            );
            this.logger.log("responses filters resolved", {
                provider: provider ?? null,
                maxIterations: maxIterations ?? null,
                strategy,
                mergedModelKeysCount: mergedModelKeys?.size ?? 0,
                requestedModel: body.model ?? null,
            });

            const selectionStartedAt = Date.now();
            const result = await this.executor(
                apiKey,
                async (candidate, apiKeysManager) => {
                    const providerCallStartedAt = Date.now();

                    try {
                        this.logger.log("responses provider call started", {
                            providerSelectionId: candidate.providerSelectionId,
                            modelSelectionId: candidate.modelSelectionId,
                            modelId: candidate.model.id,
                            providerType: candidate.model.provider.type,
                            apiKeysManagerId: apiKeysManager.id,
                        });
                        const response = await createResponse(
                            {
                                ...body,
                                model: `${candidate.model.provider.type.toLowerCase()}/${candidate.model.code}`,
                            },
                            {
                                baseApi: candidate.model.provider.baseApi,
                                apiKey: apiKeysManager.key,
                                headers: req.headers,
                            },
                        );
                        this.logger.log("responses provider call succeeded", {
                            durationMs: Date.now() - providerCallStartedAt,
                            providerSelectionId: candidate.providerSelectionId,
                            modelSelectionId: candidate.modelSelectionId,
                            apiKeysManagerId: apiKeysManager.id,
                        });

                        return {
                            success: true as const,
                            data: response,
                        };
                    } catch (error) {
                        this.logger.warn("responses provider call failed", {
                            durationMs: Date.now() - providerCallStartedAt,
                            providerSelectionId: candidate.providerSelectionId,
                            modelSelectionId: candidate.modelSelectionId,
                            apiKeysManagerId: apiKeysManager.id,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : "Unknown error",
                        });
                        return {
                            success: false as const,
                        };
                    }
                },
                maxIterations,
                {
                    provider,
                    modelKeys: mergedModelKeys,
                    strategy,
                },
            );
            this.logger.log("responses selection finished", {
                durationMs: Date.now() - selectionStartedAt,
            });

            if ("code" in result) {
                this.logger.warn("responses returned roundhouse error", {
                    code: result.code,
                    statusCode: result.status_code,
                    totalDurationMs: Date.now() - startedAt,
                });
                return this.createErrorResponse(
                    result.status_code,
                    result.message,
                    result.code,
                    "invalid_request_error",
                );
            }

            const tokenUsage = result.data.usage?.total_tokens ?? 0;
            this.queueModelSelectionStats(
                result.candidate.modelSelectionId,
                tokenUsage,
            );

            this.logger.log("responses request succeeded", {
                totalDurationMs: Date.now() - startedAt,
                modelSelectionId: result.candidate.modelSelectionId,
                tokenUsage,
            });
            return {
                statusCode: HttpStatus.OK,
                body: result.data,
            };
        } catch (error) {
            if (error instanceof ZodError) {
                this.logger.warn("responses validation failed", {
                    totalDurationMs: Date.now() - startedAt,
                    error: this.toValidationMessage(error),
                });
                return this.createErrorResponse(
                    HttpStatus.BAD_REQUEST,
                    `Validation failed: ${this.toValidationMessage(error)}`,
                    "validation_error",
                    "invalid_request_error",
                );
            }

            this.logger.error("responses unexpected server error", {
                totalDurationMs: Date.now() - startedAt,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return this.createErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Unexpected server error.",
                "internal_error",
                "server_error",
            );
        }
    }

    async models(req: Request) {
        try {
            listModelsQuerySchema.parse(req.query);
        } catch (error) {
            if (error instanceof ZodError) {
                return this.createErrorResponse(
                    HttpStatus.BAD_REQUEST,
                    `Validation failed: ${this.toValidationMessage(error)}`,
                    "validation_error",
                    "invalid_request_error",
                );
            }
        }

        const { provider, modelKeys, strategy } = resolveRoundhouseFilters(
            req.headers,
        );
        const roundhouseCreated = Math.floor(Date.now() / 1000);
        const providers = await this.prisma.provider.findMany({
            where: {
                status: ContentStatus.ACTIVE,
                ...(provider ? { type: provider } : {}),
            },
            select: {
                code: true,
                type: true,
            },
        });

        const providerMap = new Map(
            providers.map((item) => [item.code, item.type] as const),
        );

        const models = await this.prisma.model.findMany({
            where: {
                status: ContentStatus.ACTIVE,
                provider: {
                    in: providers.map((item) => item.code),
                },
            },
            select: {
                code: true,
                provider: true,
                createdAt: true,
            },
            orderBy:
                strategy === "random"
                    ? undefined
                    : [{ provider: "asc" }, { code: "asc" }],
        });

        const data = models
            .filter((model) => {
                const providerType = providerMap.get(model.provider);
                if (!providerType) {
                    return false;
                }

                return this.matchesModelKeys(
                    model.provider,
                    providerType,
                    model.code,
                    modelKeys,
                );
            })
            .map((model) => {
                const providerType = providerMap
                    .get(model.provider)!
                    .toLowerCase();

                return {
                    id: `${providerType}/${model.code}`,
                    object: "model" as const,
                    created: Math.floor(model.createdAt.getTime() / 1000),
                    owned_by: providerType,
                };
            });
        const roundhouseModels = ["roundhouse", "auto"].map((id) => ({
            id,
            object: "model" as const,
            created: roundhouseCreated,
            owned_by: "roundhouse",
        }));

        return {
            statusCode: HttpStatus.OK,
            body: {
                object: "list",
                data: [...roundhouseModels, ...data],
            },
        };
    }
}
