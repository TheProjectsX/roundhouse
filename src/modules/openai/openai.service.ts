import {
    createChatCompletion,
    createChatCompletionStream,
    createResponse,
} from "@/core/api-wrapper/service";
import {
    type BoundRoundhouseCandidateLister,
    type BoundRoundhouseExecutor,
    createListRoundhouseCandidates,
    createRoundhouseExecutor,
} from "@/core/services/roundhouse/roundhouse.service";
import type {
    OpenAIChatCompletionRequest,
    OpenAIResponsesRequest,
} from "@/core/models/types";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { createDevLogger } from "@/common/utils/logger";
import { toOpenAIError } from "@/core/utils/openaiError.util";
import {
    resolveApiKey,
    resolveRoundhouseFilters,
} from "@/core/utils/roundhouseRequest.util";
import { HttpStatus, Injectable } from "@nestjs/common";
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
    private readonly listRoundhouseCandidates: BoundRoundhouseCandidateLister;
    private readonly logger = createDevLogger("openai.chat");

    constructor(private readonly prisma: PrismaService) {
        this.executor = createRoundhouseExecutor(this.prisma);
        this.listRoundhouseCandidates = createListRoundhouseCandidates(
            this.prisma,
        );
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

            const { provider, modelKeys, maxIterations } =
                resolveRoundhouseFilters(req.headers);
            const mergedModelKeys = this.mergeBodyModelWithModelKeys(
                body.model,
                modelKeys,
            );
            this.logger.log("chatCompletions filters resolved", {
                provider: provider ?? null,
                maxIterations: maxIterations ?? null,
                mergedModelKeysCount: mergedModelKeys?.size ?? 0,
                requestedModel: body.model ?? null,
            });

            if (body.stream) {
                const streamSelectionStartedAt = Date.now();
                const streamedResult = await this.executor<string[]>(
                    apiKey,
                    async (candidate, providerApiKey) => {
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
                                    providerApiKeyId: providerApiKey.id,
                                },
                            );
                            const chunks = await createChatCompletionStream(
                                {
                                    ...body,
                                    model: `${candidate.model.provider.type.toLowerCase()}/${candidate.model.code}`,
                                },
                                {
                                    baseApi: candidate.model.provider.baseApi,
                                    apiKey: providerApiKey.key,
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
                                    chunkCount: chunks.length,
                                },
                            );

                            return {
                                success: true as const,
                                data: chunks,
                            };
                        } catch (error) {
                            this.logger.warn(
                                "chatCompletions stream provider call failed",
                                {
                                    durationMs:
                                        Date.now() - providerCallStartedAt,
                                    providerSelectionId:
                                        candidate.providerSelectionId,
                                    modelSelectionId:
                                        candidate.modelSelectionId,
                                    providerApiKeyId: providerApiKey.id,
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

                this.logger.log("chatCompletions stream request succeeded", {
                    totalDurationMs: Date.now() - startedAt,
                    chunkCount: streamedResult.data.length,
                });
                return {
                    statusCode: HttpStatus.OK,
                    stream: true,
                    chunks: streamedResult.data,
                };
            }

            const selectionStartedAt = Date.now();
            const result = await this.executor(
                apiKey,
                async (candidate, providerApiKey) => {
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
                                providerApiKeyId: providerApiKey.id,
                            },
                        );
                        this.logger.log(
                            "chatCompletions provider call request",
                            {
                                ...body,
                                model: `${candidate.model.provider.type.toLowerCase()}/${candidate.model.code}`,

                                baseApi: candidate.model.provider.baseApi,
                                apiKey: providerApiKey.key,
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
                                apiKey: providerApiKey.key,
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
                                providerApiKeyId: providerApiKey.id,
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
                                providerApiKeyId: providerApiKey.id,
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

            this.logger.log("chatCompletions request succeeded", {
                totalDurationMs: Date.now() - startedAt,
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
        const apiKey = resolveApiKey(req);
        if (!apiKey) {
            return this.createErrorResponse(
                HttpStatus.UNAUTHORIZED,
                "Missing API key. Use Authorization: Bearer <key>.",
                "api_key_missing",
                "authentication_error",
            );
        }

        try {
            const body = responsesBodySchema.parse(
                req.body,
            ) as OpenAIResponsesRequest;
            const { provider, modelKeys, maxIterations } =
                resolveRoundhouseFilters(req.headers);
            const mergedModelKeys = this.mergeBodyModelWithModelKeys(
                body.model,
                modelKeys,
            );

            const result = await this.executor(
                apiKey,
                async (candidate, providerApiKey) => {
                    try {
                        const response = await createResponse(
                            {
                                ...body,
                                model: `${candidate.model.provider.type.toLowerCase()}/${candidate.model.code}`,
                            },
                            {
                                baseApi: candidate.model.provider.baseApi,
                                apiKey: providerApiKey.key,
                                headers: req.headers,
                            },
                        );

                        return {
                            success: true as const,
                            data: response,
                        };
                    } catch {
                        return {
                            success: false as const,
                        };
                    }
                },
                maxIterations,
                {
                    provider,
                    modelKeys: mergedModelKeys,
                },
            );

            if ("code" in result) {
                return this.createErrorResponse(
                    result.status_code,
                    result.message,
                    result.code,
                    "invalid_request_error",
                );
            }

            return {
                statusCode: HttpStatus.OK,
                body: result.data,
            };
        } catch (error) {
            if (error instanceof ZodError) {
                return this.createErrorResponse(
                    HttpStatus.BAD_REQUEST,
                    `Validation failed: ${this.toValidationMessage(error)}`,
                    "validation_error",
                    "invalid_request_error",
                );
            }

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

        const apiKey = resolveApiKey(req, { allowQueryApiKey: true });
        if (!apiKey) {
            return this.createErrorResponse(
                HttpStatus.UNAUTHORIZED,
                "Missing API key. Use query `apiKey`, `X-API-Key`, or Authorization Bearer.",
                "api_key_missing",
                "authentication_error",
            );
        }

        const { provider, modelKeys } = resolveRoundhouseFilters(req.headers);
        const result = await this.listRoundhouseCandidates(apiKey, {
            provider,
            modelKeys,
        });

        if ("code" in result) {
            return this.createErrorResponse(
                result.status_code,
                result.message,
                result.code,
                "invalid_request_error",
            );
        }

        const unique = new Map<
            string,
            { id: string; object: "model"; created: number; owned_by: string }
        >();

        result.candidates.forEach((candidate) => {
            const providerKey = candidate.model.provider.type.toLowerCase();
            const modelId = `${providerKey}/${candidate.model.code}`;
            if (!unique.has(modelId)) {
                unique.set(modelId, {
                    id: modelId,
                    object: "model",
                    created: Math.floor(Date.now() / 1000),
                    owned_by: providerKey,
                });
            }
        });

        return {
            statusCode: HttpStatus.OK,
            body: {
                object: "list",
                data: [...unique.values()],
            },
        };
    }
}
