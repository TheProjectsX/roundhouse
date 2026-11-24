import React from "react";
import { TrendUpIcon, TrendDownIcon } from "@phosphor-icons/react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

interface KPIProps {
    label: string;
    value: string | number;
    icon: any;
    trend?: number;
    description?: string;
}

export function KPI({
    label,
    value,
    icon: Icon,
    trend,
    description,
}: KPIProps) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
                            {label}
                        </span>
                        <h3 className="mt-1 font-mono text-2xl font-bold tracking-tight text-(--color-text-primary)">
                            {value}
                        </h3>
                    </div>
                    <div className="grid size-8 place-items-center rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) text-(--color-text-secondary)">
                        <Icon size={16} />
                    </div>
                </div>
                {description && (
                    <div className="mt-3 flex items-center gap-2 border-t border-(--color-border-subtle) pt-2.5">
                        {trend !== undefined && (
                            <div
                                className={cn(
                                    "flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 font-mono text-[11px] font-bold",
                                    trend >= 0
                                        ? "bg-[color-mix(in_srgb,var(--color-status-success)_12%,transparent)] text-(--color-status-success)"
                                        : "bg-[color-mix(in_srgb,var(--color-status-error)_12%,transparent)] text-(--color-status-error)",
                                )}
                            >
                                {trend >= 0 ? (
                                    <TrendUpIcon size={11} weight="bold" />
                                ) : (
                                    <TrendDownIcon size={11} weight="bold" />
                                )}
                                {Math.abs(trend)}%
                            </div>
                        )}
                        <span className="text-xs text-(--color-text-muted)">
                            {description}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
