"use client";

import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

type CodeBlockProps = {
    code: string;
    language?: string;
    className?: string;
};

const keywordSets: Record<string, Set<string>> = {
    json: new Set(["true", "false", "null"]),
    ts: new Set(["import", "from", "const", "await", "new", "return", "async"]),
    js: new Set(["import", "from", "const", "await", "new", "return", "async"]),
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
        return "text-[color:var(--color-accent-secondary)]";
    }

    if (token.startsWith('"') && token.endsWith('"')) {
        return "text-[color:var(--color-status-success)]";
    }

    if (/^\d/.test(token)) {
        return "text-[color:var(--color-status-warning)]";
    }

    if (keywords.has(token) || keywordSets.json.has(token)) {
        return "text-[color:var(--color-accent-primary)]";
    }

    if (normalized === "http" && token.endsWith(":")) {
        return "text-[color:var(--color-accent-secondary)]";
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

export function CodeBlock({ code, language = "text", className }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    return (
        <div
            className={cn(
                "overflow-hidden rounded-2xl border border-(--color-border-primary) bg-[color-mix(in_srgb,var(--color-bg-card)_82%,black_18%)] shadow-(--color-shadow)",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-3 border-b border-(--color-border-primary) px-4 py-3">
                <span className="font-mono text-xs uppercase tracking-[0.24em] text-(--color-text-muted)">
                    {language}
                </span>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                        await navigator.clipboard.writeText(code);
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1600);
                    }}
                >
                    {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                    {copied ? "Copied" : "Copy"}
                </Button>
            </div>
            <pre className="overflow-x-auto p-4 text-sm leading-6 text-(--color-text-primary)">
                <code>{highlightCode(code, language)}</code>
            </pre>
        </div>
    );
}
