"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { CodeBlock } from "./code-block";

type EndpointBlockProps = {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    path: string;
    description: ReactNode;
    auth?: string;
    notes?: string[];
    requestExample?: string;
    responseExample?: string;
};

const methodClassName: Record<EndpointBlockProps["method"], string> = {
    GET: "bg-[color-mix(in_srgb,var(--color-status-info)_14%,transparent)] text-(--color-status-info) border-[color-mix(in_srgb,var(--color-status-info)_35%,transparent)]",
    POST: "bg-[color-mix(in_srgb,var(--color-status-success)_14%,transparent)] text-(--color-status-success) border-[color-mix(in_srgb,var(--color-status-success)_35%,transparent)]",
    PATCH: "bg-[color-mix(in_srgb,var(--color-status-warning)_14%,transparent)] text-(--color-status-warning) border-[color-mix(in_srgb,var(--color-status-warning)_35%,transparent)]",
    DELETE: "bg-[color-mix(in_srgb,var(--color-status-error)_14%,transparent)] text-(--color-status-error) border-[color-mix(in_srgb,var(--color-status-error)_35%,transparent)]",
};

export function EndpointBlock({
    method,
    path,
    description,
    auth,
    notes,
    requestExample,
    responseExample,
}: EndpointBlockProps) {
    const hasExamples = Boolean(requestExample || responseExample);
    const [open, setOpen] = useState(false);

    return (
        <div className="overflow-hidden rounded-md border border-(--color-border-primary) bg-(--color-bg-card)">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-border-subtle) px-4 py-3">
                <div className="flex flex-wrap items-center gap-2.5">
                    <Badge className={cn("border font-mono text-[11px] font-semibold tracking-wider", methodClassName[method])}>
                        {method}
                    </Badge>
                    <code className="rounded-sm bg-(--color-bg-primary) px-2.5 py-1 font-mono text-sm font-medium text-(--color-text-primary)">
                        {path}
                    </code>
                </div>
                {hasExamples ? (
                    <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpen((value) => !value)}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) px-3 py-1.5 text-xs font-medium text-(--color-text-secondary) transition-colors hover:text-(--color-text-primary)"
                    >
                        {open ? "Hide examples" : "View examples"}
                        <CaretDownIcon size={14} className={cn("transition-transform", open && "rotate-180")} />
                    </button>
                ) : null}
            </div>
            <div className="grid gap-3 p-4">
                <p className="text-sm leading-6 text-(--color-text-secondary)">{description}</p>
                {(auth || (notes && notes.length > 0)) ? (
                    <div className="flex flex-wrap gap-2">
                        {auth ? (
                            <span className="inline-flex items-center rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) px-2.5 py-1 text-xs text-(--color-text-secondary)">
                                Auth: <strong className="ml-1 font-medium text-(--color-text-primary)">{auth}</strong>
                            </span>
                        ) : null}
                        {notes?.map((note) => (
                            <Badge key={note}>{note}</Badge>
                        ))}
                    </div>
                ) : null}
                {open && hasExamples ? (
                    <div className="mt-1 grid gap-3">
                        {requestExample ? <CodeBlock language="json" title="Request body" code={requestExample} /> : null}
                        {responseExample ? <CodeBlock language="json" title="Response body" code={responseExample} /> : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
