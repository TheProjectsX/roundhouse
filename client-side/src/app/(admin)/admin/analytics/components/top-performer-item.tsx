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
        <div className="flex items-center justify-between py-4 transition-all hover:bg-(--color-bg-secondary)/50 px-2 rounded-lg">
            <div className="flex items-center gap-4">
                <span className="grid size-6 place-items-center rounded bg-(--color-bg-input) text-[10px] font-black text-(--color-text-muted)">
                    #{index + 1}
                </span>
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold tracking-tight">
                            {resource.name}
                        </span>
                        {resource.isCustom && (
                            <Badge className="h-4 bg-(--color-accent-secondary)/10 text-(--color-accent-secondary) border-none px-1.5 text-[8px] font-black uppercase">
                                Custom
                            </Badge>
                        )}
                    </div>
                    <span className="text-[10px] font-bold text-(--color-text-muted)">
                        {resource.code}
                    </span>
                </div>
            </div>
            <div className="flex gap-6">
                <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-(--color-status-success)">
                        {formatNumber(resource.successCount)}
                    </span>
                    <span className="text-[10px] font-bold text-(--color-text-muted)">
                        SUCCESS
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xs font-black">
                        {formatCompactNumber(resource.tokenUsage)}
                    </span>
                    <span className="text-[10px] font-bold text-(--color-text-muted)">
                        TOKENS
                    </span>
                </div>
            </div>
        </div>
    );
}
