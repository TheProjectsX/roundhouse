"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    PaperPlaneRightIcon,
    SparkleIcon,
    StopIcon,
    TrashIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { useGetApiKeysQuery } from "@/shared/store/features/apikeys/apikeysApi";
import { appConfig } from "@/shared/constants/config";

type ChatEntry = {
    id: string;
    role: "user" | "assistant";
    content: string;
    meta?: {
        model?: string;
        ttftMs?: number;
        totalMs?: number;
        tokens?: number;
        surface?: "openai" | "anthropic";
    };
};

type SurfaceMode = "openai" | "anthropic";
type StrategyOverride = "default" | "efficiency" | "priority" | "random";

function PlaygroundContent() {
    const searchParams = useSearchParams();
    const initialKeyId = searchParams.get("apiKeyId") ?? "";

    const { data: apiKeys = [], isLoading: isKeysLoading } =
        useGetApiKeysQuery();
    const [selectedKeyId, setSelectedKeyId] = useState(initialKeyId);
    const [surface, setSurface] = useState<SurfaceMode>("openai");
    const [strategy, setStrategy] = useState<StrategyOverride>("default");
    const [modelInput, setModelInput] = useState("auto");
    const [streamEnabled, setStreamEnabled] = useState(true);
    const [sessionId, setSessionId] = useState(
        () => `pg-${Math.random().toString(36).slice(2, 8)}`,
    );
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState<ChatEntry[]>([]);
    const [isSending, setIsSending] = useState(false);

    const abortRef = useRef<AbortController | null>(null);
    const listEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!selectedKeyId && apiKeys.length > 0) {
            const active = apiKeys.find((k) => k.active) ?? apiKeys[0];
            setSelectedKeyId(active.id);
        }
    }, [apiKeys, selectedKeyId]);

    useEffect(() => {
        listEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const selectedApiKey = useMemo(
        () => apiKeys.find((k) => k.id === selectedKeyId),
        [apiKeys, selectedKeyId],
    );

    const baseUrl = useMemo(() => {
        const raw =
            appConfig.apiBaseUrl ||
            (typeof window !== "undefined"
                ? window.location.origin
                : "http://localhost:5000");
        return raw.replace(/\/+$/, "");
    }, []);

    const handleStop = () => {
        abortRef.current?.abort();
        abortRef.current = null;
        setIsSending(false);
    };

    const handleClear = () => {
        handleStop();
        setMessages([]);
        setSessionId(`pg-${Math.random().toString(36).slice(2, 8)}`);
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = prompt.trim();
        if (!trimmed || isSending) return;
        if (!selectedApiKey) {
            toast.error("Select an API key first");
            return;
        }

        const userMsg: ChatEntry = {
            id: `u_${Date.now()}`,
            role: "user",
            content: trimmed,
        };
        const assistantId = `a_${Date.now()}`;
        const history = [...messages, userMsg];
        setMessages([
            ...history,
            {
                id: assistantId,
                role: "assistant",
                content: "",
                meta: { surface },
            },
        ]);
        setPrompt("");
        setIsSending(true);

        const controller = new AbortController();
        abortRef.current = controller;
        const startedAt = performance.now();
        let ttftMs: number | undefined;
        let servedModel: string | undefined;
        let totalTokens: number | undefined;

        const endpoint =
            surface === "openai"
                ? `${baseUrl}/v1/chat/completions`
                : `${baseUrl}/v1/messages`;

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "x-roundhouse-session": sessionId,
        };

        if (surface === "openai") {
            headers.Authorization = `Bearer ${selectedApiKey.key}`;
        } else {
            headers["x-api-key"] = selectedApiKey.key;
        }

        if (strategy !== "default") {
            headers["x-roundhouse-method"] = strategy;
        }

        const payload =
            surface === "openai"
                ? {
                      model: modelInput.trim() || "auto",
                      stream: streamEnabled,
                      messages: history.map((m) => ({
                          role: m.role,
                          content: m.content,
                      })),
                  }
                : {
                      model: modelInput.trim() || "auto",
                      max_tokens: 1024,
                      stream: streamEnabled,
                      messages: history.map((m) => ({
                          role: m.role,
                          content: m.content,
                      })),
                  };

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            if (!response.ok) {
                const errJson = (await response.json().catch(() => ({}))) as {
                    error?: { message?: string };
                    message?: string;
                };
                throw new Error(
                    errJson.error?.message ||
                        errJson.message ||
                        `Request failed (${response.status})`,
                );
            }

            if (streamEnabled && response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                let accumulated = "";

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const events = buffer.replace(/\r\n/g, "\n").split("\n\n");
                    buffer = events.pop() ?? "";

                    for (const block of events) {
                        const dataLines = block
                            .split("\n")
                            .filter((line) => line.startsWith("data:"))
                            .map((line) => line.slice(5).trim());

                        for (const raw of dataLines) {
                            if (!raw || raw === "[DONE]") continue;
                            try {
                                const parsed = JSON.parse(raw) as {
                                    error?: { message?: string };
                                    model?: string;
                                    choices?: Array<{
                                        delta?: { content?: string };
                                    }>;
                                    usage?: { total_tokens?: number };
                                    message?: { model?: string };
                                    delta?: { text?: string };
                                };

                                if (parsed.error?.message) {
                                    throw new Error(parsed.error.message);
                                }

                                if (parsed.model) {
                                    servedModel = parsed.model;
                                } else if (parsed.message?.model) {
                                    servedModel = parsed.message.model;
                                }

                                if (parsed.usage?.total_tokens) {
                                    totalTokens = parsed.usage.total_tokens;
                                }

                                const deltaText =
                                    parsed.choices?.[0]?.delta?.content ??
                                    parsed.delta?.text ??
                                    "";

                                if (deltaText) {
                                    if (ttftMs === undefined) {
                                        ttftMs = Math.round(
                                            performance.now() - startedAt,
                                        );
                                    }
                                    accumulated += deltaText;
                                    setMessages((prev) =>
                                        prev.map((m) =>
                                            m.id === assistantId
                                                ? {
                                                      ...m,
                                                      content: accumulated,
                                                      meta: {
                                                          ...m.meta,
                                                          model: servedModel,
                                                          ttftMs,
                                                      },
                                                  }
                                                : m,
                                        ),
                                    );
                                }
                            } catch (parseErr) {
                                if (
                                    parseErr instanceof Error &&
                                    parseErr.message !== "Unexpected end of JSON input"
                                ) {
                                    // ignore partial/non-JSON SSE frames unless it's an explicit error
                                }
                            }
                        }
                    }
                }

                const totalMs = Math.round(performance.now() - startedAt);
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId
                            ? {
                                  ...m,
                                  meta: {
                                      ...m.meta,
                                      model: servedModel,
                                      ttftMs,
                                      totalMs,
                                      tokens: totalTokens,
                                  },
                              }
                            : m,
                    ),
                );
            } else {
                const json = (await response.json()) as {
                    model?: string;
                    choices?: Array<{ message?: { content?: string } }>;
                    content?: Array<{ type?: string; text?: string }>;
                    usage?: {
                        total_tokens?: number;
                        input_tokens?: number;
                        output_tokens?: number;
                    };
                };

                const totalMs = Math.round(performance.now() - startedAt);
                const text =
                    surface === "openai"
                        ? (json.choices?.[0]?.message?.content ?? "")
                        : (json.content
                              ?.filter((b) => b.type === "text")
                              .map((b) => b.text ?? "")
                              .join("\n") ?? "");

                const tokens =
                    json.usage?.total_tokens ??
                    (json.usage?.input_tokens != null &&
                    json.usage?.output_tokens != null
                        ? json.usage.input_tokens + json.usage.output_tokens
                        : undefined);

                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId
                            ? {
                                  ...m,
                                  content: text || "(empty response)",
                                  meta: {
                                      surface,
                                      model: json.model,
                                      totalMs,
                                      tokens,
                                  },
                              }
                            : m,
                    ),
                );
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                toast.info("Stream stopped");
            } else {
                const msg =
                    error instanceof Error
                        ? error.message
                        : "Playground request failed";
                toast.error(msg);
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId && !m.content
                            ? { ...m, content: `Error: ${msg}` }
                            : m,
                    ),
                );
            }
        } finally {
            abortRef.current = null;
            setIsSending(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Playground"
                description="Test live SSE streaming, Anthropic /v1/messages, sticky sessions, and Roundhouse failover."
                actions={
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleClear}
                        disabled={messages.length === 0 && !isSending}
                    >
                        <TrashIcon size={16} /> Clear Chat
                    </Button>
                }
            />

            <div className="grid gap-5 xl:grid-cols-[320px_1fr] xl:items-start">
                <Card>
                    <CardHeader>
                        <h2 className="flex items-center gap-2 font-semibold">
                            <SparkleIcon size={18} /> Request Config
                        </h2>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <label className="grid gap-1.5 text-sm font-medium">
                            API Key
                            <select
                                value={selectedKeyId}
                                onChange={(e) =>
                                    setSelectedKeyId(e.target.value)
                                }
                                disabled={isKeysLoading}
                                className="h-10 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm outline-none"
                            >
                                {apiKeys.length === 0 ? (
                                    <option value="">No API keys found</option>
                                ) : null}
                                {apiKeys.map((k) => (
                                    <option key={k.id} value={k.id}>
                                        {k.name} {!k.active ? "(inactive)" : ""}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="grid gap-1.5 text-sm font-medium">
                            API Surface
                            <div className="grid grid-cols-2 gap-1.5">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        surface === "openai"
                                            ? "primary"
                                            : "secondary"
                                    }
                                    onClick={() => setSurface("openai")}
                                >
                                    OpenAI /v1
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        surface === "anthropic"
                                            ? "primary"
                                            : "secondary"
                                    }
                                    onClick={() => setSurface("anthropic")}
                                >
                                    Anthropic
                                </Button>
                            </div>
                        </div>

                        <label className="grid gap-1.5 text-sm font-medium">
                            Model
                            <Input
                                value={modelInput}
                                onChange={(e) => setModelInput(e.target.value)}
                                placeholder="auto"
                            />
                        </label>

                        <label className="grid gap-1.5 text-sm font-medium">
                            Routing Strategy
                            <select
                                value={strategy}
                                onChange={(e) =>
                                    setStrategy(
                                        e.target.value as StrategyOverride,
                                    )
                                }
                                className="h-9 rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm outline-none focus:border-(--color-border-focused)"
                            >
                                <option value="default">API Key Default</option>
                                <option value="efficiency">
                                    Efficiency (Deterministic)
                                </option>
                                <option value="priority">Priority</option>
                                <option value="random">Random</option>
                            </select>
                        </label>

                        <label className="flex items-center justify-between gap-2 text-sm font-medium">
                            <span>Stream SSE</span>
                            <input
                                type="checkbox"
                                checked={streamEnabled}
                                onChange={(e) =>
                                    setStreamEnabled(e.target.checked)
                                }
                                className="size-4 accent-(--color-accent-primary)"
                            />
                        </label>

                        <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg-input) p-2.5 text-xs text-(--color-text-muted)">
                            Session: <code className="font-mono">{sessionId}</code>
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex h-[min(70dvh,640px)] flex-col">
                    <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-5">
                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                            {messages.length === 0 ? (
                                <EmptyState
                                    title="Ready to test"
                                    description="Send a message to test live SSE streaming, deterministic routing, and automatic failover."
                                />
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col gap-1.5 ${
                                            msg.role === "user"
                                                ? "items-end"
                                                : "items-start"
                                        }`}
                                    >
                                        <div
                                            className={`max-w-[85%] whitespace-pre-wrap rounded-sm px-3.5 py-2.5 text-sm ${
                                                msg.role === "user"
                                                    ? "border border-(--color-accent-primary) bg-(--color-accent-primary) text-(--color-text-inverse)"
                                                    : "border border-(--color-border-primary) bg-(--color-bg-input) text-(--color-text-primary)"
                                            }`}
                                        >
                                            {msg.content || (
                                                <span className="text-(--color-text-muted)">
                                                    Streaming...
                                                </span>
                                            )}
                                        </div>
                                        {msg.role === "assistant" && msg.meta ? (
                                            <div className="flex flex-wrap gap-1.5 text-xs text-(--color-text-muted)">
                                                {msg.meta.model ? (
                                                    <Badge className="font-mono">
                                                        {msg.meta.model}
                                                    </Badge>
                                                ) : null}
                                                {msg.meta.ttftMs != null ? (
                                                    <Badge className="font-mono">
                                                        TTFT {msg.meta.ttftMs}ms
                                                    </Badge>
                                                ) : null}
                                                {msg.meta.totalMs != null ? (
                                                    <Badge className="font-mono">
                                                        {msg.meta.totalMs}ms
                                                    </Badge>
                                                ) : null}
                                                {msg.meta.tokens != null ? (
                                                    <Badge className="font-mono">
                                                        {msg.meta.tokens} tok
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                ))
                            )}
                            <div ref={listEndRef} />
                        </div>

                        <form
                            onSubmit={handleSend}
                            className="flex items-end gap-2 border-t border-(--color-border-subtle) pt-4"
                        >
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        void handleSend();
                                    }
                                }}
                                rows={2}
                                aria-label="Prompt message"
                                placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"
                                className="min-h-11 flex-1 resize-none rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) px-3 py-2 text-sm outline-none focus:border-(--color-border-focused)"
                            />
                            {isSending ? (
                                <Button
                                    type="button"
                                    variant="danger:outline"
                                    onClick={handleStop}
                                >
                                    <StopIcon size={16} weight="fill" /> Stop
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={!prompt.trim() || !selectedApiKey}
                                >
                                    <PaperPlaneRightIcon size={16} weight="fill" />
                                    Send
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

export default function PlaygroundPage() {
    return (
        <Suspense
            fallback={
                <div className="grid gap-4">
                    <div className="h-10 w-48 animate-pulse rounded-sm bg-(--color-bg-card)" />
                    <div className="h-96 animate-pulse rounded-md bg-(--color-bg-card)" />
                </div>
            }
        >
            <PlaygroundContent />
        </Suspense>
    );
}
