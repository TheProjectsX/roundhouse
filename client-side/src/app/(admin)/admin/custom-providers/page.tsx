"use client";

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
import { useState } from "react";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import {
    useGetAdminProvidersQuery,
    useGetAdminProviderModelsQuery,
} from "@/shared/store/features/api/roundhouseApi";
import { ContentStatus } from "@/shared/types/enums";
import { cn, formatDate, formatNumber } from "@/shared/lib/utils";

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

function StatItem({
    icon,
    label,
    value,
    valueColor,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    valueColor?: string;
}) {
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

export default function CustomProvidersPage() {
    const { data: providers = [] } = useGetAdminProvidersQuery({
        customOnly: true,
    });
    const [expandedProviderId, setExpandedProviderId] = useState<string | null>(
        null,
    );

    return (
        <>
            <PageHeader
                title="Custom Providers"
                description="Monitor providers created by platform users. Admins have read-only access to user-created resources."
            />

            <section className="grid gap-6">
                {providers.length === 0 ? (
                    <Card>
                        <CardContent className="flex h-40 items-center justify-center text-(--color-text-muted)">
                            No custom providers found.
                        </CardContent>
                    </Card>
                ) : (
                    providers.map((provider: any) => (
                        <Card
                            key={provider.id}
                            className={cn(
                                "overflow-hidden transition-all",
                                expandedProviderId === provider.id
                                    ? "ring-2 ring-(--color-accent-primary) ring-offset-0"
                                    : "hover:border-(--color-accent-primary)",
                            )}
                        >
                            <CardContent className="flex flex-col gap-6 p-6">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="grid size-12 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-accent-secondary)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-accent-secondary)_8%,transparent)] text-(--color-accent-secondary)">
                                            <GlobeIcon
                                                size={26}
                                                weight="duotone"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-lg font-bold tracking-tight text-(--color-text-primary)">
                                                    {provider.name}
                                                </h2>
                                                <Badge className="font-mono text-[10px]">
                                                    {provider.code}
                                                </Badge>
                                                <StatusBadge
                                                    status={provider.status}
                                                />
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
                                            onClick={() =>
                                                setExpandedProviderId(
                                                    expandedProviderId ===
                                                        provider.id
                                                        ? null
                                                        : provider.id,
                                                )
                                            }
                                        >
                                            {expandedProviderId ===
                                            provider.id ? (
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
                                        value={formatNumber(
                                            provider.uniqueUsersCount,
                                        )}
                                    />
                                    <StatItem
                                        icon={<GlobeIcon size={14} />}
                                        label="Connected APIs"
                                        value={formatNumber(
                                            provider.connectedApiCount,
                                        )}
                                    />
                                    <StatItem
                                        icon={<CpuIcon size={14} />}
                                        label="Active Models"
                                        value={`${formatNumber(provider.activeModelsCount)}/${formatNumber(provider.modelsCount)}`}
                                    />
                                    <StatItem
                                        icon={<CoinsIcon size={14} />}
                                        label="Total Tokens"
                                        value={formatCompactNumber(
                                            provider.totalTokenUsage,
                                        )}
                                    />
                                    <StatItem
                                        icon={<ActivityIcon size={14} />}
                                        label="Success Rate"
                                        value={`${provider.successRate.toFixed(1)}%`}
                                        valueColor={getSuccessRateColor(
                                            provider.successRate,
                                        )}
                                    />
                                    <StatItem
                                        icon={<ClockIcon size={14} />}
                                        label="Last Used"
                                        value={formatDate(provider.lastUsedAt)}
                                    />
                                </div>
                            </CardContent>

                            {expandedProviderId === provider.id && (
                                <ModelsList providerId={provider.id} />
                            )}
                        </Card>
                    ))
                )}
            </section>
        </>
    );
}

function ModelsList({ providerId }: { providerId: string }) {
    const { data: models = [], isLoading } =
        useGetAdminProviderModelsQuery(providerId);

    if (isLoading) {
        return (
            <div className="border-t border-(--color-border-subtle) bg-[color-mix(in_srgb,var(--color-bg-primary)_40%,transparent)] p-12 text-center">
                <p className="text-sm text-(--color-text-secondary)">
                    Loading models...
                </p>
            </div>
        );
    }

    return (
        <div className="border-t border-(--color-border-subtle) bg-[color-mix(in_srgb,var(--color-bg-primary)_40%,transparent)]">
            <div className="flex items-center justify-between px-6 py-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">
                    Models Catalog ({models.length})
                </h3>
            </div>

            <div className="px-6 pb-6">
                <div className="overflow-hidden rounded-lg border border-(--color-border-subtle) bg-(--color-bg-secondary)">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-(--color-border-subtle) bg-[color-mix(in_srgb,var(--color-bg-primary)_30%,transparent)]">
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Name
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Code
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Max Tokens
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Efficiency
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Success / Failure
                                </th>
                                <th className="px-4 py-3 text-right font-semibold text-(--color-text-secondary)">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--color-border-subtle)">
                            {models.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center text-(--color-text-muted)"
                                    >
                                        No models found for this provider.
                                    </td>
                                </tr>
                            ) : (
                                models.map((model: any) => (
                                    <tr
                                        key={model.id}
                                        className="transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_2%,transparent)]"
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={cn(
                                                        "size-1.5 rounded-full",
                                                        model.status ===
                                                            ContentStatus.ACTIVE
                                                            ? "bg-(--color-status-success) shadow-[0_0_8px_var(--color-status-success)]"
                                                            : "bg-(--color-text-muted)",
                                                    )}
                                                />
                                                {model.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono text-(--color-text-secondary)">
                                            {model.code}
                                        </td>
                                        <td className="px-4 py-3 text-(--color-text-secondary)">
                                            {model.maxTokens
                                                ? formatCompactNumber(
                                                      model.maxTokens,
                                                  )
                                                : "Unlimited"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-(--color-bg-primary)">
                                                    <div
                                                        className="h-full bg-(--color-accent-secondary)"
                                                        style={{
                                                            width: `${(model.efficiencyScore ?? 0) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold">
                                                    {(
                                                        (model.efficiencyScore ??
                                                            0) * 100
                                                    ).toFixed(0)}
                                                    %
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-xs font-bold text-(--color-status-success)">
                                                    {formatNumber(
                                                        model.totalSuccessCount,
                                                    )}
                                                </span>
                                                <span className="text-(--color-text-muted)">
                                                    /
                                                </span>
                                                <span className="font-mono text-xs font-bold text-(--color-status-error)">
                                                    {formatNumber(
                                                        model.totalFailureCount,
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <StatusBadge
                                                status={model.status}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
