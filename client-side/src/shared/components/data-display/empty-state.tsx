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
                "grid justify-items-center gap-3 rounded-md border border-dashed border-(--color-border-primary) bg-(--color-bg-secondary) text-center",
                compact ? "p-5" : "p-8",
                className,
            )}
        >
            <div className="grid size-9 place-items-center rounded-sm border border-(--color-border-primary) bg-(--color-bg-card) text-(--color-text-secondary)">
                {icon ?? <InfoIcon size={18} weight="regular" />}
            </div>
            <div className="grid gap-1">
                <p className="text-sm font-medium text-(--color-text-primary)">{title}</p>
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
