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
                            <StackIcon size={26} weight="duotone" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-bold tracking-tight text-(--color-text-primary)">
                                    {provider.name}
                                </h2>
                                <StatusBadge status={provider.status} />
                                <Badge>{provider.type}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-(--color-text-secondary)">
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
                        <div className="h-6 w-px bg-(--color-border-subtle) mx-1" />
                        <select
                            value={provider.status}
                            disabled={isUpdatingStatus}
                            className="h-9 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-xs font-medium text-(--color-text-primary) outline-none transition-colors hover:border-(--color-accent-primary) focus:border-(--color-accent-primary)"
                            onChange={(event) =>
                                onStatusChange(provider.id, event.target.value as ContentStatus)
                            }
                        >
                            {Object.values(ContentStatus).map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                        <Button
                            variant="primary:outline"
                            size="icon"
                            aria-label="Edit provider"
                            disabled={isUpdatingStatus}
                            onClick={onEdit}
                        >
                            <PenIcon size={18} />
                        </Button>

                        <Button
                            variant="danger:outline"
                            size="icon"
                            aria-label="Delete provider"
                            disabled={isDeleting}
                            onClick={() => onDelete(provider.id, provider.name)}
                        >
                            <TrashIcon size={18} />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-t border-(--color-border-subtle) pt-6 sm:grid-cols-3 lg:grid-cols-6">
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
