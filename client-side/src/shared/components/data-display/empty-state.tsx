import type { ReactNode } from "react";
import { InfoIcon } from "@phosphor-icons/react";
import { cn } from "@/shared/lib/utils";

interface EmptyStateProps {
    title: string;
    description?: string;
    action?: ReactNode;
    icon?: ReactNode;
    compact?: boolean;
    className?: string;
}

export function EmptyState({
    title,
    description,
    action,
    icon,
    compact = false,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "grid justify-items-center gap-3 rounded-xl border border-dashed border-(--color-border-primary) bg-[color-mix(in_srgb,var(--color-bg-card)_65%,transparent)] text-center",
                compact ? "p-5" : "p-8",
                className,
            )}
        >
            <div className="grid size-11 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-accent-primary)_12%,transparent)] text-(--color-accent-primary)">
                {icon ?? <InfoIcon size={20} weight="duotone" />}
            </div>
            <div className="grid gap-1">
                <p className="font-medium text-(--color-text-primary)">{title}</p>
                {description ? (
                    <p className="max-w-xl text-sm text-(--color-text-secondary)">
                        {description}
                    </p>
                ) : null}
            </div>
            {action ? <div>{action}</div> : null}
        </div>
    );
}
