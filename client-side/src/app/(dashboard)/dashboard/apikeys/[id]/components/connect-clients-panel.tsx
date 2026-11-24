"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, CopyIcon, EyeIcon, EyeSlashIcon, TerminalWindowIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { appConfig } from "@/shared/constants/config";

interface ConnectClientsPanelProps {
    apiKey: string;
}

type ClientTab = "claude" | "codex" | "cursor" | "openai-sdk" | "curl";

export function ConnectClientsPanel({ apiKey }: ConnectClientsPanelProps) {
    const [activeTab, setActiveTab] = useState<ClientTab>("claude");
    const [copied, setCopied] = useState(false);
    const [revealKey, setRevealKey] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        };
    }, []);

    const baseUrl = useMemo(() => {
        const raw =
            appConfig.apiBaseUrl ||
            (typeof window !== "undefined" ? window.location.origin : "http://localhost:5000");
        return raw.replace(/\/+$/, "");
    }, []);

    const displayKey = useMemo(() => {
        if (revealKey || !apiKey || apiKey.length <= 15) return apiKey;
        return `${apiKey.slice(0, 11)}****${apiKey.slice(-4)}`;
    }, [apiKey, revealKey]);

    const buildSnippets = (token: string): Record<
        ClientTab,
        { label: string; badge: string; note: string; code: string }
    > => ({
        claude: {
            label: "Claude Code",
            badge: "/v1/messages",
            note: "Uses Roundhouse's Anthropic Messages API endpoint with automatic tool-call rescue and failover.",
            code: `export ANTHROPIC_BASE_URL="${baseUrl}"
export ANTHROPIC_API_KEY="${token}"
claude`,
        },
        codex: {
            label: "Codex CLI",
            badge: "/v1/responses",
            note: "Points OpenAI Codex CLI at Roundhouse's /v1 Responses & Chat Completions router.",
            code: `export OPENAI_BASE_URL="${baseUrl}/v1"
export OPENAI_API_KEY="${token}"
codex`,
        },
        cursor: {
            label: "Cursor / Cline",
            badge: "OpenAI-Compatible",
            note: "Paste these settings into Cursor, Cline, Roo Code, or Continue.dev.",
            code: `Base URL: ${baseUrl}/v1
API Key:  ${token}
Model:    auto`,
        },
        "openai-sdk": {
            label: "OpenAI SDK",
            badge: "TypeScript / JS",
            note: "Drop-in replacement for the official OpenAI SDK with incremental SSE streaming.",
            code: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${baseUrl}/v1",
  apiKey: "${token}",
});

const stream = await client.chat.completions.create({
  model: "auto",
  stream: true,
  messages: [{ role: "user", content: "Hello Roundhouse!" }],
});`,
        },
        curl: {
            label: "cURL",
            badge: "SSE Stream",
            note: "Quick terminal check with sticky session header.",
            code: `curl -N "${baseUrl}/v1/chat/completions" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -H "x-roundhouse-session: my-dev-session" \\
  -d '{
    "model": "auto",
    "stream": true,
    "messages": [{"role": "user", "content": "Say hi!"}]
  }'`,
        },
    });

    const displaySnippets = useMemo(
        () => buildSnippets(displayKey),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [displayKey, baseUrl],
    );
    const copySnippets = useMemo(
        () => buildSnippets(apiKey),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [apiKey, baseUrl],
    );

    const current = displaySnippets[activeTab];
    const currentCopy = copySnippets[activeTab];

    const handleCopy = async () => {
        await navigator.clipboard.writeText(currentCopy.code);
        setCopied(true);
        toast.success(`${current.label} snippet copied`);
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => setCopied(false), 1800);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="flex items-center gap-2 text-base font-semibold">
                            <TerminalWindowIcon size={18} /> Connect Clients
                        </h2>
                        <p className="mt-1 text-xs text-(--color-text-secondary)">
                            Drop-in configuration for coding agents and SDKs using this API key.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            size="xs"
                            variant="secondary"
                            onClick={() => setRevealKey((v) => !v)}
                        >
                            {revealKey ? <EyeSlashIcon size={13} /> : <EyeIcon size={13} />}
                            {revealKey ? "Mask key" : "Reveal key"}
                        </Button>
                        <Badge className="font-mono">{current.badge}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-3">
                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Client integration snippets">
                    {(Object.keys(displaySnippets) as ClientTab[]).map((tab) => (
                        <Button
                            key={tab}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab}
                            size="sm"
                            variant={activeTab === tab ? "primary" : "secondary"}
                            onClick={() => setActiveTab(tab)}
                        >
                            {displaySnippets[tab].label}
                        </Button>
                    ))}
                </div>
                <p className="text-xs text-(--color-text-muted)">
                    {current.note}
                </p>
                <div className="relative rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) p-3.5">
                    <Button
                        type="button"
                        size="xs"
                        variant="secondary"
                        onClick={handleCopy}
                        className="absolute right-2.5 top-2.5"
                    >
                        {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
                        {copied ? "Copied" : "Copy"}
                    </Button>
                    <pre className="overflow-x-auto pr-20 font-mono text-xs leading-relaxed text-(--color-text-primary)">
                        <code>{current.code}</code>
                    </pre>
                </div>
            </CardContent>
        </Card>
    );
}
