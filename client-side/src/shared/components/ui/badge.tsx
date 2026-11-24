import type { HTMLAttributes } from "react";
import { ContentStatus, UserStatus } from "@/shared/types/enums";
import { cn } from "@/shared/lib/utils";

const statusClassName: Record<string, string> = {
    ACTIVE: "border-[color-mix(in_srgb,var(--color-status-success)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-status-success)_12%,transparent)] text-(--color-status-success)",
    INACTIVE:
        "border-dashed border-(--color-border-primary) bg-transparent text-(--color-status-inactive)",
    DEPRECATED:
        "border-dashed border-[color-mix(in_srgb,var(--color-status-warning)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-status-warning)_12%,transparent)] text-(--color-status-warning)",
    TESTING:
        "border-[color-mix(in_srgb,var(--color-status-info)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-status-info)_12%,transparent)] text-(--color-status-info)",
    UPCOMING:
        "border-dashed border-[color-mix(in_srgb,var(--color-accent-secondary)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-accent-secondary)_12%,transparent)] text-(--color-accent-secondary)",
    BANNED: "border-[color-mix(in_srgb,var(--color-status-error)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-status-error)_12%,transparent)] text-(--color-status-error)",
    PENDING:
        "border-dashed border-[color-mix(in_srgb,var(--color-status-warning)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-status-warning)_12%,transparent)] text-(--color-status-warning)",
};

export function Badge({
    className,
    ...props
}: HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            className={cn(
                "inline-flex max-w-full items-center gap-1 rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) px-2 py-0.5 text-[11px] font-medium leading-tight tracking-wide text-(--color-text-secondary) whitespace-nowrap",
                className,
            )}
            {...props}
        />
    );
}

export function StatusBadge({
    status,
}: {
    status: ContentStatus | UserStatus | boolean;
}) {
    const label =
        typeof status === "boolean" ? (status ? "ACTIVE" : "INACTIVE") : status;
    return (
        <Badge className={cn("font-mono text-[11px] uppercase tracking-wider", statusClassName[label])}>
            {label.charAt(0) + label.slice(1).toLowerCase()}
        </Badge>
    );
}
