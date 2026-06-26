"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { CodeBlock } from "./code-block";

type EndpointBlockProps = {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    path: string;
    description: string;
    auth?: string;
    notes?: string[];
    requestExample?: string;
    responseExample?: string;
};

const methodClassName: Record<EndpointBlockProps["method"], string> = {
    GET: "bg-[color-mix(in_srgb,var(--color-status-info)_16%,transparent)] text-(--color-status-info)",
    POST: "bg-[color-mix(in_srgb,var(--color-status-success)_16%,transparent)] text-(--color-status-success)",
    PATCH: "bg-[color-mix(in_srgb,var(--color-status-warning)_16%,transparent)] text-(--color-status-warning)",
    DELETE: "bg-[color-mix(in_srgb,var(--color-status-error)_16%,transparent)] text-(--color-status-error)",
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
    const [open, setOpen] = useState(false);

    return (
        <Card className="overflow-hidden">
            <CardHeader className="items-start">
                <div className="flex flex-1 flex-wrap items-center gap-3">
                    <Badge className={cn("font-mono text-[10px] tracking-[0.24em]", methodClassName[method])}>{method}</Badge>
                    <code className="rounded-md bg-[color-mix(in_srgb,var(--color-bg-primary)_72%,var(--color-accent-secondary)_8%)] px-2 py-1 text-sm text-(--color-text-primary)">
                        {path}
                    </code>
                </div>
                <button
                    type="button"
                    onClick={() => setOpen((value) => !value)}
                    className="inline-flex items-center gap-1 text-sm text-(--color-text-secondary) transition-colors hover:text-(--color-text-primary)"
                >
                    Details
                    <CaretDownIcon size={16} className={cn("transition-transform", open && "rotate-180")} />
                </button>
            </CardHeader>
            <CardContent className="grid gap-4">
                <p className="text-sm text-(--color-text-secondary)">{description}</p>
                <div className="flex flex-wrap gap-2 text-xs text-(--color-text-muted)">
                    {auth ? <Badge>Auth: {auth}</Badge> : null}
                    {notes?.map((note) => <Badge key={note}>{note}</Badge>)}
                </div>
                {open ? (
                    <div className="grid gap-4">
                        {requestExample ? <CodeBlock language="json" code={requestExample} /> : null}
                        {responseExample ? <CodeBlock language="json" code={responseExample} /> : null}
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
