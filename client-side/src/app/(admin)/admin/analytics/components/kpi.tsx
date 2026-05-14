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
        <Card className="overflow-hidden border-(--color-border-subtle) bg-(--color-bg-secondary)/50 backdrop-blur-sm transition-all hover:border-(--color-accent-primary)/50 hover:shadow-lg">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-(--color-text-muted)">
                            {label}
                        </span>
                        <h3 className="text-2xl font-black tracking-tight text-(--color-text-primary)">
                            {value}
                        </h3>
                    </div>
                    <div className="grid size-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-accent-primary)_10%,transparent)] text-(--color-accent-primary)">
                        <Icon size={24} weight="duotone" />
                    </div>
                </div>
                {description && (
                    <div className="mt-4 flex items-center gap-2">
                        {trend !== undefined && (
                            <div
                                className={cn(
                                    "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
                                    trend >= 0
                                        ? "bg-(--color-status-success)/10 text-(--color-status-success)"
                                        : "bg-(--color-status-error)/10 text-(--color-status-error)",
                                )}
                            >
                                {trend >= 0 ? (
                                    <TrendUpIcon size={12} weight="bold" />
                                ) : (
                                    <TrendDownIcon size={12} weight="bold" />
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
