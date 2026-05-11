import type { HTMLAttributes } from "react";
import { ContentStatus, UserStatus } from "@/shared/types/enums";
import { cn } from "@/shared/lib/utils";

const statusClassName: Record<string, string> = {
    ACTIVE: "bg-[color-mix(in_srgb,var(--color-status-success)_16%,transparent)] text-[var(--color-status-success)]",
    INACTIVE: "bg-[color-mix(in_srgb,var(--color-status-inactive)_16%,transparent)] text-[var(--color-status-inactive)]",
    DEPRECATED: "bg-[color-mix(in_srgb,var(--color-status-warning)_16%,transparent)] text-[var(--color-status-warning)]",
    TESTING: "bg-[color-mix(in_srgb,var(--color-status-info)_16%,transparent)] text-[var(--color-status-info)]",
    UPCOMING: "bg-[color-mix(in_srgb,var(--color-accent-secondary)_16%,transparent)] text-[var(--color-accent-secondary)]",
    BANNED: "bg-[color-mix(in_srgb,var(--color-status-error)_16%,transparent)] text-[var(--color-status-error)]",
    PENDING: "bg-[color-mix(in_srgb,var(--color-status-warning)_16%,transparent)] text-[var(--color-status-warning)]",
};

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            className={cn(
                "inline-flex min-h-6 items-center rounded-[var(--radius-xl)] px-2.5 text-xs font-medium",
                className,
            )}
            {...props}
        />
    );
}

export function StatusBadge({ status }: { status: ContentStatus | UserStatus | boolean }) {
    const label = typeof status === "boolean" ? (status ? "ACTIVE" : "INACTIVE") : status;
    return <Badge className={statusClassName[label]}>{label.charAt(0) + label.slice(1).toLowerCase()}</Badge>;
}
