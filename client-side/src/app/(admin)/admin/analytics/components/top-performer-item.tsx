import React from "react";
import { Badge } from "@/shared/components/ui/badge";
import { formatNumber } from "@/shared/lib/utils";

function formatCompactNumber(value: number) {
    return new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}

interface TopPerformerItemProps {
    resource: any;
    index: number;
}

export function TopPerformerItem({ resource, index }: TopPerformerItemProps) {
    return (
        <div className="flex items-center justify-between rounded-sm px-2 py-3.5 transition-colors hover:bg-(--color-bg-secondary)">
            <div className="flex items-center gap-3.5">
                <span className="grid size-6 place-items-center rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) font-mono text-[11px] font-semibold text-(--color-text-muted)">
                    #{index + 1}
                </span>
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold tracking-tight">
                            {resource.name}
                        </span>
                        {resource.isCustom && (
                            <Badge className="text-[11px] uppercase">
                                Custom
                            </Badge>
                        )}
                    </div>
                    <span className="font-mono text-[11px] text-(--color-text-muted)">
                        {resource.code}
                    </span>
                </div>
            </div>
            <div className="flex gap-6 font-mono">
                <div className="flex flex-col items-end">
                    <span className="text-xs font-semibold text-(--color-status-success)">
                        {formatNumber(resource.successCount)}
                    </span>
                    <span className="text-[11px] text-(--color-text-muted)">
                        SUCCESS
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xs font-semibold">
                        {formatCompactNumber(resource.tokenUsage)}
                    </span>
                    <span className="text-[11px] text-(--color-text-muted)">
                        TOKENS
                    </span>
                </div>
            </div>
        </div>
    );
}
