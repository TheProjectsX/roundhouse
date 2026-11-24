import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { routes } from "@/shared/constants/routes";
import { formatNumber } from "@/shared/lib/utils";

interface ApiKeyItemProps {
    item: any;
}

export function ApiKeyItem({ item }: ApiKeyItemProps) {
    return (
        <Link
            href={`${routes.apiKeys}/${item.id}`}
            className="flex flex-col gap-3 rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) p-3.5 transition-colors hover:border-(--color-border-focused) hover:bg-(--color-bg-card-hover) sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-medium text-(--color-text-primary)">
                    {item.name}
                </h3>
                <StatusBadge status={item.active} />
                {item.roundhouseMethod ? (
                    <Badge className="font-mono text-[11px]">
                        {item.roundhouseMethod}
                    </Badge>
                ) : null}
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="grid grid-cols-3 gap-4 text-right font-mono text-xs text-(--color-text-secondary)">
                    <span>{item.stats?.providerCount ?? 0} prov</span>
                    <span>{item.stats?.modelCount ?? 0} mod</span>
                    <span>{formatNumber(item.stats?.successfulRequests ?? 0)} ok</span>
                </div>
                <ArrowUpRightIcon size={15} className="shrink-0 text-(--color-text-muted)" />
            </div>
        </Link>
    );
}
