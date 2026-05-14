import React from "react";
import {
    ActivityIcon,
    CaretDownIcon,
    CaretUpIcon,
    ClockIcon,
    CoinsIcon,
    CpuIcon,
    GlobeIcon,
    UsersIcon,
} from "@phosphor-icons/react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { cn, formatDate, formatNumber } from "@/shared/lib/utils";
import { StatItem } from "../../components/stat-item";
import { ReadOnlyModelsList } from "./read-only-models-list";

interface CustomProviderCardProps {
    provider: any;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

function formatCompactNumber(value: number) {
    return new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}

function getSuccessRateColor(rate: number) {
    if (rate >= 95) return "text-(--color-status-success)";
    if (rate >= 80) return "text-(--color-status-warning)";
    return "text-(--color-status-error)";
}

export function CustomProviderCard({
    provider,
    isExpanded,
    onToggleExpand,
}: CustomProviderCardProps) {
    return (
        <Card
            className={cn(
                "overflow-hidden transition-all",
                isExpanded
                    ? "ring-2 ring-(--color-accent-primary) ring-offset-0"
                    : "hover:border-(--color-accent-primary)",
            )}
        >
            <CardContent className="flex flex-col gap-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="grid size-12 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-accent-secondary)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-accent-secondary)_8%,transparent)] text-(--color-accent-secondary)">
                            <GlobeIcon size={26} weight="duotone" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-bold tracking-tight text-(--color-text-primary)">
                                    {provider.name}
                                </h2>
                                <Badge className="font-mono text-[10px]">
                                    {provider.code}
                                </Badge>
                                <StatusBadge status={provider.status} />
                                <Badge>{provider.type}</Badge>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-(--color-text-secondary)">
                                <span className="font-mono bg-(--color-bg-primary) px-1.5 py-0.5 rounded border border-(--color-border-subtle)">
                                    {provider.baseApi}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-(--color-text-secondary)">
                                {provider.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-9 gap-2 px-3"
                            onClick={onToggleExpand}
                        >
                            {isExpanded ? (
                                <>
                                    <CaretUpIcon size={16} />
                                    Hide Models
                                </>
                            ) : (
                                <>
                                    <CaretDownIcon size={16} />
                                    View Models
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-6 border-t border-(--color-border-subtle) pt-6 sm:grid-cols-3 lg:grid-cols-6">
                    <StatItem
                        icon={<UsersIcon size={14} />}
                        label="Unique Users"
                        value={formatNumber(provider.uniqueUsersCount)}
                    />
                    <StatItem
                        icon={<GlobeIcon size={14} />}
                        label="Connected APIs"
                        value={formatNumber(provider.connectedApiCount)}
                    />
                    <StatItem
                        icon={<CpuIcon size={14} />}
                        label="Active Models"
                        value={`${formatNumber(provider.activeModelsCount)}/${formatNumber(provider.modelsCount)}`}
                    />
                    <StatItem
                        icon={<CoinsIcon size={14} />}
                        label="Total Tokens"
                        value={formatCompactNumber(provider.totalTokenUsage)}
                    />
                    <StatItem
                        icon={<ActivityIcon size={14} />}
                        label="Success Rate"
                        value={`${provider.successRate.toFixed(1)}%`}
                        valueColor={getSuccessRateColor(provider.successRate)}
                    />
                    <StatItem
                        icon={<ClockIcon size={14} />}
                        label="Last Used"
                        value={formatDate(provider.lastUsedAt)}
                    />
                </div>
            </CardContent>

            {isExpanded && <ReadOnlyModelsList providerId={provider.id} />}
        </Card>
    );
}
