"use client";

import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

type CodeBlockProps = {
    code: string;
    language?: string;
    title?: string;
    className?: string;
};

const keywordSets: Record<string, Set<string>> = {
    json: new Set(["true", "false", "null"]),
    ts: new Set(["import", "from", "const", "await", "new", "return", "async"]),
    js: new Set(["import", "from", "const", "await", "new", "return", "async"]),
    python: new Set(["from", "import", "True", "False", "None", "await", "async"]),
    bash: new Set(["curl"]),
    http: new Set(["GET", "POST", "PATCH", "DELETE", "Authorization", "Content-Type"]),
};

const tokenPattern =
    /("(?:\\.|[^"])*"\s*:)|("(?:\\.|[^"])*")|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_][A-Za-z0-9_-]*\b)|(\/\/.*$|#.*$)/gm;

function getTokenClass(token: string, language: string) {
    const normalized = language.toLowerCase();
    const keywords = keywordSets[normalized] ?? new Set<string>();

    if (token.startsWith("//") || token.startsWith("#")) {
        return "text-(--color-text-muted)";
    }

    if (/^".*":$/.test(token.trim())) {
        return "text-(--color-accent-secondary)";
    }

    if (token.startsWith('"') && token.endsWith('"')) {
        return "text-(--color-status-success)";
    }

    if (/^\d/.test(token)) {
        return "text-(--color-status-warning)";
    }

    if (keywords.has(token) || keywordSets.json.has(token)) {
        return "text-(--color-accent-primary)";
    }

    if (normalized === "http" && token.endsWith(":")) {
        return "text-(--color-accent-secondary)";
    }

    return "text-(--color-text-primary)";
}

function highlightCode(code: string, language: string) {
    const lines = code.split("\n");

    return lines.map((line, lineIndex) => {
        const parts: ReactNode[] = [];
        let lastIndex = 0;
        const matches = line.matchAll(tokenPattern);

        for (const match of matches) {
            const value = match[0];
            const index = match.index ?? 0;

            if (index > lastIndex) {
                parts.push(<span key={`${lineIndex}-${lastIndex}`}>{line.slice(lastIndex, index)}</span>);
            }

            parts.push(
                <span key={`${lineIndex}-${index}`} className={getTokenClass(value, language)}>
                    {value}
                </span>,
            );
            lastIndex = index + value.length;
        }

        if (lastIndex < line.length) {
            parts.push(<span key={`${lineIndex}-tail`}>{line.slice(lastIndex)}</span>);
        }

        return (
            <span key={lineIndex}>
                {parts}
                {lineIndex < lines.length - 1 ? "\n" : null}
            </span>
        );
    });
}

export function CodeBlock({ code, language = "text", title, className }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    return (
        <div
            className={cn(
                "overflow-hidden rounded-md border border-(--color-border-primary) bg-(--color-bg-primary)",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-3 border-b border-(--color-border-primary) bg-(--color-bg-card) px-4 py-2">
                <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-(--color-text-muted)">
                        {language}
                    </span>
                    {title ? (
                        <span className="text-xs text-(--color-text-secondary)">· {title}</span>
                    ) : null}
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={async () => {
                        await navigator.clipboard.writeText(code);
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1600);
                    }}
                >
                    {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                    {copied ? "Copied" : "Copy"}
                </Button>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 text-(--color-text-primary)">
                <code>{highlightCode(code, language)}</code>
            </pre>
        </div>
    );
}
