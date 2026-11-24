import type {
    ModelProvider,
    OpenAIChatCompletionRequest,
    OpenAICompatibleResponse,
    OpenAICompatibleUsage,
} from "../models/types";
import { callProviderChatCompletion } from "../models";
import { createProviderHttpError } from "@/core/utils/providerError.util";
import { normalizeOpenAIRequest, toSseChunks } from "./normalize";
import type { OpenAIWrapperContext } from "./service";

export type PreparedChatStream = {
    firstChunk: string;
    rest: AsyncIterable<string>;
    getUsage: () => OpenAICompatibleUsage | undefined;
    abort: () => void;
};

const DEFAULT_BASE_APIS: Record<Exclude<ModelProvider, "CUSTOM">, string> = {
    OPENAI: "https://api.openai.com/v1",
    ANTHROPIC: "https://api.anthropic.com",
    GEMINI: "https://generativelanguage.googleapis.com/v1beta",
};

const DEFAULT_FIRST_BYTE_TIMEOUT_MS = 45_000;

const normalizeBaseApi = (baseApi: string): string =>
    baseApi.endsWith("/") ? baseApi.slice(0, -1) : baseApi;

const resolveProviderFromModel = (model: string): ModelProvider => {
    const lower = model.toLowerCase();
    const [providerToken] = lower.split("/");

    if (providerToken === "openai") return "OPENAI";
    if (providerToken === "anthropic") return "ANTHROPIC";
    if (providerToken === "gemini") return "GEMINI";
    if (providerToken === "custom") return "CUSTOM";
    if (lower.startsWith("claude")) return "ANTHROPIC";
    if (lower.startsWith("gemini")) return "GEMINI";
    if (lower.startsWith("custom/")) return "CUSTOM";
    return "OPENAI";
};

const resolveModelCode = (model: string): string => {
    const trimmed = model.trim();
    const slashIndex = trimmed.indexOf("/");
    if (slashIndex <= 0 || slashIndex === trimmed.length - 1) {
        return trimmed;
    }

    const prefix = trimmed.slice(0, slashIndex).toLowerCase();
    if (
        prefix === "openai" ||
        prefix === "anthropic" ||
        prefix === "gemini" ||
        prefix === "custom"
    ) {
        return trimmed.slice(slashIndex + 1);
    }

    return trimmed;
};

async function* iterateSseEvents(
    body: ReadableStream<Uint8Array>,
    onUsage: (usage: OpenAICompatibleUsage) => void,
): AsyncGenerator<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const normalized = buffer.replace(/\r\n/g, "\n");
            const parts = normalized.split("\n\n");
            buffer = parts.pop() ?? "";

            for (const part of parts) {
                const trimmed = part.trim();
                if (!trimmed) {
                    continue;
                }

                if (trimmed.startsWith(":")) {
                    continue;
                }

                const dataLines = trimmed
                    .split("\n")
                    .filter((line) => line.startsWith("data:"))
                    .map((line) => line.slice(5).trim());

                for (const payload of dataLines) {
                    if (!payload) {
                        continue;
                    }

                    if (payload === "[DONE]") {
                        yield "data: [DONE]\n\n";
                        return;
                    }

                    try {
                        const parsed = JSON.parse(payload) as {
                            error?: { message?: string };
                            usage?: OpenAICompatibleUsage;
                        };
                        if (parsed.error) {
                            throw new Error(
                                parsed.error.message ||
                                    "In-band provider stream error",
                            );
                        }
                        if (parsed.usage) {
                            onUsage(parsed.usage);
                        }
                    } catch (err) {
                        if (
                            err instanceof Error &&
                            err.message.includes("provider stream error")
                        ) {
                            throw err;
                        }
                    }

                    yield `data: ${payload}\n\n`;
                }
            }
        }

        const trailing = buffer.trim();
        if (trailing) {
            const dataLines = trailing
                .split("\n")
                .filter((line) => line.startsWith("data:"))
                .map((line) => line.slice(5).trim());
            for (const payload of dataLines) {
                if (payload) {
                    yield `data: ${payload}\n\n`;
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
}

const pullFirstChunk = async (
    generator: AsyncGenerator<string>,
    timeoutMs: number,
    controller: AbortController,
): Promise<{
    firstChunk: string;
    rest: AsyncIterable<string>;
}> => {
    const timer = setTimeout(() => {
        controller.abort(new Error("Upstream stream first-byte timeout"));
    }, timeoutMs);

    try {
        const first = await generator.next();
        if (first.done || !first.value) {
            throw new Error("Upstream stream ended with empty completion");
        }

        const rest: AsyncIterable<string> = {
            [Symbol.asyncIterator]() {
                return generator;
            },
        };

        return {
            firstChunk: first.value,
            rest,
        };
    } catch (error) {
        await generator.return(undefined).catch(() => undefined);
        throw error;
    } finally {
        clearTimeout(timer);
    }
};

export const openChatCompletionStream = async (
    body: OpenAIChatCompletionRequest,
    context: OpenAIWrapperContext = {},
    firstByteTimeoutMs = DEFAULT_FIRST_BYTE_TIMEOUT_MS,
): Promise<PreparedChatStream> => {
    const request = normalizeOpenAIRequest(body);
    const provider = context.provider ?? resolveProviderFromModel(request.model);
    request.model = resolveModelCode(request.model);
    const baseApi =
        context.baseApi ??
        (provider === "CUSTOM"
            ? (() => {
                  throw new Error("A custom provider requires `baseApi`.");
              })()
            : DEFAULT_BASE_APIS[provider]);

    let usage: OpenAICompatibleUsage | undefined;
    const controller = new AbortController();

    if (provider === "OPENAI" || provider === "CUSTOM") {
        const endpoint =
            provider === "OPENAI"
                ? `${normalizeBaseApi(baseApi)}/chat/completions`
                : normalizeBaseApi(baseApi);

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
        };
        if (context.apiKey) {
            headers.Authorization = `Bearer ${context.apiKey}`;
        }

        const timer = setTimeout(() => {
            controller.abort(new Error("Upstream stream connection timeout"));
        }, firstByteTimeoutMs);

        let response: Response;
        try {
            response = await fetch(endpoint, {
                method: "POST",
                headers,
                signal: controller.signal,
                body: JSON.stringify({
                    model: request.model,
                    messages: request.messages,
                    tools: request.tools,
                    tool_choice: request.tool_choice,
                    stream: true,
                    ...request.params,
                }),
            });
        } finally {
            clearTimeout(timer);
        }

        if (!response.ok) {
            const errorBody = (await response.json().catch(() => ({}))) as {
                error?: { message?: string };
            };
            throw createProviderHttpError(
                response,
                errorBody?.error?.message ||
                    "Upstream streaming API request failed",
            );
        }

        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("text/event-stream") && response.body) {
            const generator = iterateSseEvents(response.body, (u) => {
                usage = u;
            });
            const { firstChunk, rest } = await pullFirstChunk(
                generator,
                firstByteTimeoutMs,
                controller,
            );

            return {
                firstChunk,
                rest,
                getUsage: () => usage,
                abort: () => controller.abort(),
            };
        }

        const data = (await response.json()) as OpenAICompatibleResponse;
        usage = data.usage;
        const chunks = toSseChunks({
            id: data.id,
            created: data.created ?? Math.floor(Date.now() / 1000),
            model: data.model || request.model,
            content:
                typeof data.choices?.[0]?.message?.content === "string"
                    ? data.choices[0].message.content
                    : "",
            toolCalls: data.choices?.[0]?.message?.tool_calls,
            finishReason: data.choices?.[0]?.finish_reason ?? null,
            usage: data.usage,
            raw: data,
        });

        async function* emitStatic() {
            for (const chunk of chunks.slice(1)) {
                yield chunk;
            }
        }

        return {
            firstChunk: chunks[0] ?? "data: [DONE]\n\n",
            rest: emitStatic(),
            getUsage: () => usage,
            abort: () => controller.abort(),
        };
    }

    const response = await callProviderChatCompletion(provider, {
        apiKey: context.apiKey,
        baseApi,
        headers: {},
        request: { ...request, stream: false },
    });
    usage = response.usage;
    const chunks = toSseChunks(response);

    async function* emitFallbackChunks() {
        for (const chunk of chunks.slice(1)) {
            yield chunk;
        }
    }

    return {
        firstChunk: chunks[0] ?? "data: [DONE]\n\n",
        rest: emitFallbackChunks(),
        getUsage: () => usage,
        abort: () => controller.abort(),
    };
};
