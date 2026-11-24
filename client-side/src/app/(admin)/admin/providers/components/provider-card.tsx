import React from "react";
import {
    ActivityIcon,
    CaretDownIcon,
    CaretUpIcon,
    ClockIcon,
    CoinsIcon,
    CpuIcon,
    GlobeIcon,
    PenIcon,
    StackIcon,
    TrashIcon,
    UsersIcon,
} from "@phosphor-icons/react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { contentStatusLabels } from "@/shared/lib/enum-labels";
import { ContentStatus } from "@/shared/types/enums";
import { cn, formatDate, formatNumber } from "@/shared/lib/utils";
import { StatItem } from "../../components/stat-item";
import { ModelsList } from "./models-list";

interface ProviderCardProps {
    provider: any;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onStatusChange: (id: string, status: ContentStatus) => Promise<void>;
    onEdit: () => void;
    onDelete: (id: string, name: string) => Promise<void>;
    isUpdatingStatus: boolean;
    isDeleting: boolean;
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

export function ProviderCard({
    provider,
    isExpanded,
    onToggleExpand,
    onStatusChange,
    onEdit,
    onDelete,
    isUpdatingStatus,
    isDeleting,
}: ProviderCardProps) {
    return (
        <Card
            className={cn(
                "overflow-hidden transition-colors",
                isExpanded
                    ? "border-(--color-border-focused)"
                    : "hover:border-(--color-border-focused)",
            )}
        >
            <CardContent className="flex flex-col gap-5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="grid size-10 place-items-center rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) text-(--color-text-secondary)">
                            <StackIcon size={18} />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-base font-semibold tracking-tight text-(--color-text-primary)">
                                    {provider.name}
                                </h2>
                                <StatusBadge status={provider.status} />
                                <Badge className="font-mono text-[11px]">{provider.type}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-(--color-text-secondary)">
                                {provider.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onToggleExpand}
                        >
                            {isExpanded ? (
                                <>
                                    <CaretUpIcon size={14} />
                                    Hide Models
                                </>
                            ) : (
                                <>
                                    <CaretDownIcon size={14} />
                                    View Models
                                </>
                            )}
                        </Button>
                        <select
                            value={provider.status}
                            aria-label={`Status for ${provider.name}`}
                            disabled={isUpdatingStatus}
                            className="h-8 rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) px-2.5 text-xs font-medium text-(--color-text-primary) outline-none focus:border-(--color-border-focused)"
                            onChange={(event) =>
                                onStatusChange(provider.id, event.target.value as ContentStatus)
                            }
                        >
                            {Object.values(ContentStatus).map((status) => (
                                <option key={status} value={status}>
                                    {contentStatusLabels[status]}
                                </option>
                            ))}
                        </select>
                        <Button
                            variant="secondary"
                            size="icon"
                            aria-label="Edit provider"
                            disabled={isUpdatingStatus}
                            onClick={onEdit}
                        >
                            <PenIcon size={15} />
                        </Button>

                        <div className="ml-1 border-l border-(--color-border-subtle) pl-2">
                            <Button
                                variant="danger:outline"
                                size="icon"
                                aria-label="Delete provider"
                                disabled={isDeleting}
                                onClick={() => onDelete(provider.id, provider.name)}
                            >
                                <TrashIcon size={15} />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-(--color-border-subtle) pt-5 sm:grid-cols-3 lg:grid-cols-6">
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

            {isExpanded && <ModelsList providerId={provider.id} />}
        </Card>
    );
}
