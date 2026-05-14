import React from "react";
import { cn } from "@/shared/lib/utils";

interface StatItemProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    valueColor?: string;
}

export function StatItem({
    icon,
    label,
    value,
    valueColor,
}: StatItemProps) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-(--color-text-muted)">
                {icon}
                <span className="text-[10px] font-medium uppercase tracking-wider">
                    {label}
                </span>
            </div>
            <p
                className={cn(
                    "text-sm font-bold tracking-tight",
                    valueColor ?? "text-(--color-text-primary)",
                )}
            >
                {value}
            </p>
        </div>
    );
}
