import React from "react";
import { StatusBadge } from "@/shared/components/ui/badge";
import { cn, formatNumber } from "@/shared/lib/utils";
import { ContentStatus } from "@/shared/types/enums";

function formatCompactNumber(value: number) {
    return new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}

interface ReadOnlyModelRowProps {
    model: any;
}

export function ReadOnlyModelRow({ model }: ReadOnlyModelRowProps) {
    return (
        <tr className="transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_2%,transparent)]">
            <td className="px-4 py-3 font-medium">
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            "size-1.5 rounded-full",
                            model.status === ContentStatus.ACTIVE
                                ? "bg-(--color-status-success) shadow-[0_0_8px_var(--color-status-success)]"
                                : "bg-(--color-text-muted)",
                        )}
                    />
                    {model.name}
                </div>
            </td>
            <td className="px-4 py-3 text-xs font-mono text-(--color-text-secondary)">
                {model.code}
            </td>
            <td className="px-4 py-3 text-(--color-text-secondary)">
                {model.maxTokens
                    ? formatCompactNumber(model.maxTokens)
                    : "Unlimited"}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-(--color-bg-primary)">
                        <div
                            className="h-full bg-(--color-accent-secondary)"
                            style={{
                                width: `${(model.efficiencyScore ?? 0) * 100}%`,
                            }}
                        />
                    </div>
                    <span className="text-xs font-bold">
                        {((model.efficiencyScore ?? 0) * 100).toFixed(0)}%
                    </span>
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-(--color-status-success)">
                        {formatNumber(model.totalSuccessCount)}
                    </span>
                    <span className="text-(--color-text-muted)">/</span>
                    <span className="font-mono text-xs font-bold text-(--color-status-error)">
                        {formatNumber(model.totalFailureCount)}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3 text-right">
                <StatusBadge status={model.status} />
            </td>
        </tr>
    );
}
