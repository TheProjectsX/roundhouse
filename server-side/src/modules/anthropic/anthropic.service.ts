import { HttpStatus, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { z, ZodError } from "zod";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ModelSelectionService } from "@/common/services/modelSelection/model-selection.service";
import { background } from "@/common/utils/background";
import { createDevLogger } from "@/common/utils/logger";
import { createChatCompletion } from "@/core/api-wrapper/service";
import {
    toAnthropicError,
    toAnthropicMessageResponse,
    toAnthropicSseEvents,
    toOpenAIChatRequest,
    type AnthropicMessagesRequest,
} from "@/core/api-wrapper/anthropic";
import {
    type BoundRoundhouseExecutor,
    createRoundhouseExecutor,
} from "@/core/services/roundhouse/roundhouse.service";
import {
    estimateRequestTokens,
    requestHasImages,
    requestRequiresTools,
} from "@/core/utils/preflight.util";
import {
    resolveApiKey,
    resolveRoundhouseFilters,
} from "@/core/utils/roundhouseRequest.util";
import { deriveSessionKey } from "@/core/utils/stickySession.util";

const anthropicMessagesBodySchema = z
    .object({
        model: z.string().optional(),
        max_tokens: z.number().int().positive().optional(),
        system: z
            .union([
                z.string(),
                z.array(z.object({ type: z.literal("text"), text: z.string() }).passthrough()),
            ])
            .optional(),
        messages: z.array(z.any()).min(1, "messages must be a non-empty array"),
        tools: z.array(z.any()).optional(),
        tool_choice: z.any().optional(),
        temperature: z.number().optional(),
        top_p: z.number().optional(),
        stop_sequences: z.array(z.string()).optional(),
        stream: z.boolean().optional(),
    })
    .passthrough();

@Injectable()
export class AnthropicService {
    private readonly executor: BoundRoundhouseExecutor;
    private readonly logger = createDevLogger("anthropic.messages");

    constructor(
        private readonly prisma: PrismaService,
        private readonly modelSelectionService: ModelSelectionService,
    ) {
        this.executor = createRoundhouseExecutor(this.prisma);
    }

    private queueModelSelectionStats(
        modelSelectionId: string,
        tokenUsage: number,
    ) {
        background.add(async () => {
            await this.modelSelectionService.updateModelSelectionStats(
                modelSelectionId,
                {
                    tokenUsage,
                    successCount: 1,
                    lastUsedAt: new Date(),
                },
            );
        }, 1);
    }

    private mergeBodyModelWithModelKeys(
        bodyModel: string | undefined,
        modelKeys: Set<string> | undefined,
    ): Set<string> | undefined {
        const normalized = bodyModel?.trim().toLowerCase();
        if (!normalized || normalized === "auto" || normalized === "roundhouse") {
            return modelKeys;
        }

        // Ignore Claude client default model aliases when no explicit provider prefix is given
        // unless the user specifically configured a model matching that code.
        const merged = modelKeys ? new Set(modelKeys) : new Set<string>();
        normalized
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean)
            .forEach((token) => merged.add(token));
        return merged;
    }

    async messages(req: Request) {
        const startedAt = Date.now();
        const apiKey = resolveApiKey(req);
        if (!apiKey) {
            return {
                statusCode: HttpStatus.UNAUTHORIZED,
                body: toAnthropicError(
                    "authentication_error",
                    "Missing API key. Use x-api-key or Authorization: Bearer <key>.",
                ),
            };
        }

        try {
            const parsed = anthropicMessagesBodySchema.parse(
                req.body,
            ) as AnthropicMessagesRequest;
            const openAIRequest = toOpenAIChatRequest(parsed);

            const { provider, modelKeys, maxIterations, strategy } =
                resolveRoundhouseFilters(req.headers);
            const mergedModelKeys = this.mergeBodyModelWithModelKeys(
                parsed.model,
                modelKeys,
            );
            const estimatedTokens = estimateRequestTokens(
                openAIRequest.messages,
                openAIRequest.tools,
                parsed.max_tokens,
            );
            const requireVision = requestHasImages(openAIRequest.messages);
            const requireTools = requestRequiresTools(
                openAIRequest.tools,
                openAIRequest.tool_choice,
            );
            const stickySessionKey = deriveSessionKey(
                apiKey,
                openAIRequest.messages,
                req.headers,
            );

            const result = await this.executor(
                apiKey,
                async (candidate, apiKeysManager) => {
                    try {
                        const response = await createChatCompletion(
                            {
                                ...openAIRequest,
                                stream: false,
                                model: `${candidate.model.provider.type.toLowerCase()}/${candidate.model.code}`,
                            },
                            {
                                baseApi: candidate.model.provider.baseApi,
                                apiKey: apiKeysManager.key,
                                headers: req.headers,
                            },
                        );
                        return {
                            success: true as const,
                            data: response,
                        };
                    } catch (error) {
                        this.logger.warn("anthropic provider call failed", {
                            modelSelectionId: candidate.modelSelectionId,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : "Unknown error",
                        });
                        return {
                            success: false as const,
                            error,
                        };
                    }
                },
                maxIterations,
                {
                    provider,
                    modelKeys: mergedModelKeys,
                    strategy,
                    estimatedTokens,
                    requireVision,
                    requireTools,
                    stickySessionKey,
                },
            );

            if ("code" in result) {
                return {
                    statusCode: result.status_code,
                    body: toAnthropicError(
                        result.status_code === 429
                            ? "rate_limit_error"
                            : "invalid_request_error",
                        result.message,
                    ),
                };
            }

            const tokenUsage = result.data.usage?.total_tokens ?? 0;
            this.queueModelSelectionStats(
                result.candidate.modelSelectionId,
                tokenUsage,
            );

            this.logger.log("anthropic messages succeeded", {
                totalDurationMs: Date.now() - startedAt,
                modelSelectionId: result.candidate.modelSelectionId,
                tokenUsage,
            });

            if (parsed.stream) {
                return {
                    statusCode: HttpStatus.OK,
                    stream: true as const,
                    events: toAnthropicSseEvents(result.data, parsed.model),
                };
            }

            return {
                statusCode: HttpStatus.OK,
                body: toAnthropicMessageResponse(result.data, parsed.model),
            };
        } catch (error) {
            if (error instanceof ZodError) {
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    body: toAnthropicError(
                        "invalid_request_error",
                        error.issues
                            .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
                            .join("; "),
                    ),
                };
            }

            return {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                body: toAnthropicError("api_error", "Unexpected server error."),
            };
        }
    }

    countTokens(req: Request) {
        const apiKey = resolveApiKey(req);
        if (!apiKey) {
            return {
                statusCode: HttpStatus.UNAUTHORIZED,
                body: toAnthropicError(
                    "authentication_error",
                    "Missing API key.",
                ),
            };
        }

        try {
            const parsed = anthropicMessagesBodySchema.parse(
                req.body,
            ) as AnthropicMessagesRequest;
            const openAIRequest = toOpenAIChatRequest(parsed);
            const inputTokens = estimateRequestTokens(
                openAIRequest.messages,
                openAIRequest.tools,
                0,
            );
            return {
                statusCode: HttpStatus.OK,
                body: { input_tokens: inputTokens },
            };
        } catch (error) {
            if (error instanceof ZodError) {
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    body: toAnthropicError(
                        "invalid_request_error",
                        "Invalid count_tokens payload.",
                    ),
                };
            }
            return {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                body: toAnthropicError("api_error", "Unexpected server error."),
            };
        }
    }
}
