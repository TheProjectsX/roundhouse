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

    async chatCompletions(req: Request) {
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
            const body = chatCompletionBodySchema.parse(
                req.body,
            ) as OpenAIChatCompletionRequest;
            const { provider, modelKeys, maxIterations } =
                resolveRoundhouseFilters(req.headers);

            if (body.stream) {
                const streamedResult = await this.executor<string[]>(
                    apiKey,
                    async (candidate) => {
                        try {
                            const chunks = await createChatCompletionStream(
                                {
                                    ...body,
                                    model: candidate.model.code,
                                },
                                {
                                    provider: candidate.model.provider.type,
                                    baseApi: candidate.model.provider.baseApi,
                                    apiKey,
                                    headers: req.headers,
                                },
                            );

                            return {
                                success: true as const,
                                data: chunks,
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
                        modelKeys,
                    },
                );

                if ("code" in streamedResult) {
                    return this.createErrorResponse(
                        streamedResult.status_code,
                        streamedResult.message,
                        streamedResult.code,
                        "invalid_request_error",
                    );
                }

                return {
                    statusCode: HttpStatus.OK,
                    stream: true,
                    chunks: streamedResult.data,
                };
            }

            const result = await this.executor(
                apiKey,
                async (candidate) => {
                    try {
                        const response = await createChatCompletion(
                            {
                                ...body,
                                model: candidate.model.code,
                            },
                            {
                                provider: candidate.model.provider.type,
                                baseApi: candidate.model.provider.baseApi,
                                apiKey,
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
                    modelKeys,
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

            const result = await this.executor(
                apiKey,
                async (candidate) => {
                    try {
                        const response = await createResponse(
                            {
                                ...body,
                                model: candidate.model.code,
                            },
                            {
                                provider: candidate.model.provider.type,
                                baseApi: candidate.model.provider.baseApi,
                                apiKey,
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
                    modelKeys,
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
