import React from "react";
import { StatusBadge } from "@/shared/components/ui/badge";
import { formatNumber } from "@/shared/lib/utils";

interface ApiKeyItemProps {
    item: any;
}

export function ApiKeyItem({ item }: ApiKeyItemProps) {
    return (
        <div className="flex flex-col gap-3 rounded-md bg-(--color-bg-input) p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <div className="flex items-center gap-2">
                    <h3 className="font-medium">{item.name}</h3>
                    <StatusBadge status={item.active} />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-right font-mono text-sm">
                <span>{item.stats?.providerCount ?? 0} providers</span>
                <span>{item.stats?.modelCount ?? 0} models</span>
                <span>{formatNumber(item.stats?.successfulRequests ?? 0)} ok</span>
            </div>
        </div>
    );
}
