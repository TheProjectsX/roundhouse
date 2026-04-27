import { Request, Response } from "express";
import { ZodError } from "zod";
import {
    createChatCompletion,
    createChatCompletionStream,
    createResponse,
} from "@/core/api-wrapper/service";
import {
    createPrismaRoundhouseService,
} from "@/core/services/roundhouse/prisma.adapter";
import { toOpenAIError } from "@/core/utils/openaiError.util";
import {
    resolveApiKey,
    resolveRoundhouseFilters,
} from "@/core/utils/roundhouseRequest.util";
import { prisma } from "@/lib/prisma";
import {
    chatCompletionBodySchema,
    listModelsQuerySchema,
    responsesBodySchema,
} from "./openai.validation";

const roundhouse = createPrismaRoundhouseService(prisma);

const sendRoundhouseError = (
    res: Response,
    code: string,
    message: string,
    statusCode: number,
) => {
    return res.status(statusCode).json(
        toOpenAIError(message, {
            code,
            type: "invalid_request_error",
        }),
    );
};

const sendValidationError = (res: Response, error: ZodError) => {
    const details = error.issues
        .map((issue) => {
            const path = issue.path.length > 0 ? issue.path.join(".") : "body";
            return `${path}: ${issue.message}`;
        })
        .join("; ");

    return res.status(400).json(
        toOpenAIError(`Validation failed: ${details}`, {
            code: "validation_error",
            type: "invalid_request_error",
        }),
    );
};

export const chatCompletions = async (req: Request, res: Response) => {
    const apiKey = resolveApiKey(req);
    if (!apiKey) {
        return res.status(401).json(
            toOpenAIError("Missing API key. Use Authorization: Bearer <key>.", {
                code: "api_key_missing",
                type: "authentication_error",
            }),
        );
    }

    try {
        const body = chatCompletionBodySchema.parse(req.body);
        const { provider, modelKeys, maxIterations } = resolveRoundhouseFilters(
            req.headers,
        );

        if (body.stream) {
            const streamedResult = await roundhouse.selectProvider<string[]>(
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

            if (!streamedResult.success) {
                return sendRoundhouseError(
                    res,
                    streamedResult.code,
                    streamedResult.message,
                    streamedResult.status_code,
                );
            }

            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.flushHeaders();
            res.write(streamedResult.data.join(""));
            return res.end();
        }

        const result = await roundhouse.selectProvider(
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

        if (!result.success) {
            return sendRoundhouseError(
                res,
                result.code,
                result.message,
                result.status_code,
            );
        }

        return res.json(result.data);
    } catch (error) {
        if (error instanceof ZodError) {
            return sendValidationError(res, error);
        }

        return res.status(500).json(
            toOpenAIError("Unexpected server error.", {
                code: "internal_error",
                type: "server_error",
            }),
        );
    }
};

export const responses = async (req: Request, res: Response) => {
    const apiKey = resolveApiKey(req);
    if (!apiKey) {
        return res.status(401).json(
            toOpenAIError("Missing API key. Use Authorization: Bearer <key>.", {
                code: "api_key_missing",
                type: "authentication_error",
            }),
        );
    }

    try {
        const body = responsesBodySchema.parse(req.body);
        const { provider, modelKeys, maxIterations } = resolveRoundhouseFilters(
            req.headers,
        );

        const result = await roundhouse.selectProvider(
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

        if (!result.success) {
            return sendRoundhouseError(
                res,
                result.code,
                result.message,
                result.status_code,
            );
        }

        return res.json(result.data);
    } catch (error) {
        if (error instanceof ZodError) {
            return sendValidationError(res, error);
        }

        return res.status(500).json(
            toOpenAIError("Unexpected server error.", {
                code: "internal_error",
                type: "server_error",
            }),
        );
    }
};

export const models = async (req: Request, res: Response) => {
    try {
        listModelsQuerySchema.parse(req.query);
    } catch (error) {
        if (error instanceof ZodError) {
            return sendValidationError(res, error);
        }
    }

    const apiKey = resolveApiKey(req, { allowQueryApiKey: true });
    if (!apiKey) {
        return res.status(401).json(
            toOpenAIError(
                "Missing API key. Use query `apiKey`, `X-API-Key`, or Authorization Bearer.",
                {
                    code: "api_key_missing",
                    type: "authentication_error",
                },
            ),
        );
    }

    const { provider, modelKeys } = resolveRoundhouseFilters(req.headers);
    const result = await roundhouse.listRoundhouseCandidates(apiKey, {
        provider,
        modelKeys,
    });

    if (!result.success) {
        return sendRoundhouseError(
            res,
            result.code,
            result.message,
            result.status_code,
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

    return res.json({
        object: "list",
        data: [...unique.values()],
    });
};
