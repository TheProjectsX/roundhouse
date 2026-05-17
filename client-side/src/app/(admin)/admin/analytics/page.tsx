"use client";

import {
    ActivityIcon,
    ArrowSquareOutIcon,
    CoinsIcon,
    CpuIcon,
    GlobeIcon,
    LightningIcon,
    PulseIcon,
    StackIcon,
    UsersIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { routes } from "@/shared/constants/routes";
import { useGetAdminAnalyticsQuery } from "@/shared/store/features/admin/adminApi";
import { formatNumber } from "@/shared/lib/utils";
import { KPI } from "./components/kpi";
import { Sparkline } from "./components/sparkline";
import { OperationalMixItem } from "./components/operational-mix-item";
import { TopPerformerItem } from "./components/top-performer-item";

function formatCompactNumber(value: number) {
    return new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}

export default function AdminAnalyticsPage() {
    const { data, isLoading } = useGetAdminAnalyticsQuery();

    if (isLoading) {
        return (
            <div className="flex flex-col gap-8">
                <PageHeader title="Analytics" description="..." />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="h-32 animate-pulse rounded-2xl bg-(--color-bg-secondary)"
                        />
                    ))}
                </div>
            </div>
        );
    }

    const summary = data?.summary;
    const dailyTrend = data?.dailyTrend ?? [];

    const totalRequestsTrend = dailyTrend.map((d) => d.requests);
    const tokenUsageTrend = dailyTrend.map((d) => d.tokens);
    const maxRequests = Math.max(...totalRequestsTrend, 0);
    const trendRows = dailyTrend.slice(-7);
    const topProviders = data?.topProviders ?? [];

    return (
        <div className="flex flex-col gap-8 pb-12">
            <PageHeader
                title="Analytics"
                description="Monitor demand, efficiency, provider mix, and platform throughput in a cleaner executive view."
                actions={
                    <>
                        <Button asChild>
                            <Link href={routes.admin}>
                                Back to Dashboard
                            </Link>
                        </Button>
                        <Button asChild variant="secondary">
                            <Link href={routes.dashboard}>
                                <ArrowSquareOutIcon size={18} />
                                User Dashboard
                            </Link>
                        </Button>
                    </>
                }
            />
            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Card className="overflow-hidden border-(--color-border-subtle) bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-accent-primary)_15%,transparent),transparent_46%),linear-gradient(180deg,color-mix(in_srgb,var(--color-bg-card)_95%,transparent),var(--color-bg-secondary))]">
                    <CardContent className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                        <div className="grid gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge>Executive Snapshot</Badge>
                                <span className="text-xs uppercase tracking-[0.18em] text-(--color-text-muted)">
                                    Last {dailyTrend.length || 0} tracked days
                                </span>
                            </div>
                            <div className="grid gap-2">
                                <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
                                    The platform is processing requests across a
                                    shared provider and model inventory with
                                    measurable efficiency.
                                </h2>
                                <p className="max-w-2xl text-sm leading-6 text-(--color-text-secondary)">
                                    Use this view for the high-level read:
                                    request volume, success rate, token burn,
                                    and which providers are carrying the most
                                    load.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-3 rounded-2xl border border-(--color-border-primary) bg-[color-mix(in_srgb,var(--color-bg-primary)_78%,transparent)] p-4">
                            {[
                                {
                                    label: "Average success rate",
                                    value: `${(summary?.averageSuccessRate ?? 0).toFixed(1)}%`,
                                },
                                {
                                    label: "Total token usage",
                                    value: formatCompactNumber(summary?.totalTokens ?? 0),
                                },
                                {
                                    label: "Tracked request volume",
                                    value: formatCompactNumber(summary?.totalRequests ?? 0),
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center justify-between rounded-xl border border-(--color-border-subtle) bg-(--color-bg-card) px-4 py-3"
                                >
                                    <span className="text-sm text-(--color-text-secondary)">
                                        {item.label}
                                    </span>
                                    <span className="font-mono text-lg font-bold text-(--color-text-primary)">
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">
                                Trend Notes
                            </h2>
                            <p className="mt-1 text-sm text-(--color-text-secondary)">
                                Quick reading cues for operators and admins.
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {[
                            {
                                label: "User base",
                                value: `${formatNumber(summary?.users ?? 0)} registered accounts`,
                            },
                            {
                                label: "Provider catalog",
                                value: `${formatNumber((summary?.globalProviders ?? 0) + (summary?.customProviders ?? 0))} total providers`,
                            },
                            {
                                label: "Model inventory",
                                value: `${formatNumber((summary?.models ?? 0) + (summary?.userModels ?? 0))} models available`,
                            },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="rounded-xl border border-(--color-border-subtle) bg-(--color-bg-card) p-4"
                            >
                                <p className="font-medium text-(--color-text-primary)">
                                    {item.label}
                                </p>
                                <p className="mt-1 text-sm text-(--color-text-secondary)">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <KPI
                    label="Total Tokens"
                    value={formatCompactNumber(summary?.totalTokens ?? 0)}
                    icon={CoinsIcon}
                    description="Total consumption"
                />
                <KPI
                    label="Active Users"
                    value={formatNumber(summary?.users ?? 0)}
                    icon={UsersIcon}
                    description="Registered accounts"
                />
                <KPI
                    label="Total Requests"
                    value={formatCompactNumber(summary?.totalRequests ?? 0)}
                    icon={PulseIcon}
                    description="API interactions"
                />
                <KPI
                    label="Avg. Efficiency"
                    value={`${(summary?.averageSuccessRate ?? 0).toFixed(1)}%`}
                    icon={ActivityIcon}
                    description="Platform-wide success rate"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight">
                                    Daily Request Trend
                                </h2>
                                <p className="mt-1 text-sm text-(--color-text-secondary)">
                                    Request volume across the full captured period.
                                </p>
                            </div>
                            <div className="grid size-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-accent-primary)_10%,transparent)] text-(--color-accent-primary)">
                                <PulseIcon size={20} weight="duotone" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-5">
                        <div className="rounded-2xl border border-(--color-border-primary) bg-[color-mix(in_srgb,var(--color-bg-primary)_60%,transparent)] p-4">
                            <div className="h-44">
                                <Sparkline
                                    data={totalRequestsTrend}
                                    color="var(--color-accent-primary)"
                                />
                            </div>
                            <div className="mt-4 flex items-center justify-between text-xs text-(--color-text-muted)">
                                <span>Start</span>
                                <span>Latest</span>
                            </div>
                        </div>
                        <div className="grid gap-3">
                            {trendRows.length > 0 ? (
                                trendRows.map((item) => {
                                    const width =
                                        maxRequests > 0
                                            ? Math.max(
                                                  8,
                                                  (item.requests / maxRequests) *
                                                      100,
                                              )
                                            : 8;

                                    return (
                                        <div
                                            key={item.date}
                                            className="grid gap-2"
                                        >
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-(--color-text-secondary)">
                                                    {item.date}
                                                </span>
                                                <span className="font-mono font-medium text-(--color-text-primary)">
                                                    {formatNumber(item.requests)} requests
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full bg-(--color-bg-input)">
                                                <div
                                                    className="h-full rounded-full bg-(--color-accent-primary)"
                                                    style={{ width: `${width}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="rounded-xl border border-dashed border-(--color-border-primary) p-6 text-sm text-(--color-text-secondary)">
                                    Daily request data is not available yet.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight">
                                    Token Consumption
                                </h2>
                                <p className="mt-1 text-sm text-(--color-text-secondary)">
                                    Overlay of token demand for the same reporting window.
                                </p>
                            </div>
                            <div className="grid size-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-accent-secondary)_10%,transparent)] text-(--color-accent-secondary)">
                                <LightningIcon size={20} weight="duotone" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-5">
                        <div className="rounded-2xl border border-(--color-border-primary) bg-[color-mix(in_srgb,var(--color-bg-primary)_60%,transparent)] p-4">
                            <div className="h-44">
                                <Sparkline
                                    data={tokenUsageTrend}
                                    color="var(--color-accent-secondary)"
                                />
                            </div>
                            <div className="mt-4 flex items-center justify-between text-xs text-(--color-text-muted)">
                                <span>Start</span>
                                <span>Latest</span>
                            </div>
                        </div>
                        <div className="rounded-xl border border-(--color-border-subtle) bg-(--color-bg-card) p-4">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm text-(--color-text-secondary)">
                                    Total tracked token usage
                                </span>
                                <span className="font-mono text-lg font-bold text-(--color-text-primary)">
                                    {formatCompactNumber(summary?.totalTokens ?? 0)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold tracking-tight">
                            Operational Mix
                        </h2>
                    </CardHeader>
                    <CardContent className="grid gap-6 pt-2">
                        <div className="grid gap-4">
                            {[
                                {
                                    label: "Global Providers",
                                    value: summary?.globalProviders,
                                    icon: StackIcon,
                                },
                                {
                                    label: "Custom Providers",
                                    value: summary?.customProviders,
                                    icon: GlobeIcon,
                                },
                                {
                                    label: "Standard Models",
                                    value: summary?.models,
                                    icon: CpuIcon,
                                },
                                {
                                    label: "Custom Models",
                                    value: summary?.userModels,
                                    icon: CpuIcon,
                                },
                            ].map((item) => (
                                <OperationalMixItem
                                    key={item.label}
                                    label={item.label}
                                    value={item.value}
                                    icon={item.icon}
                                    totalModels={
                                        (summary?.models ?? 0) +
                                            (summary?.userModels ?? 0) || 1
                                    }
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <h2 className="text-lg font-semibold tracking-tight">
                            Top Performing Providers
                        </h2>
                        <Badge className="px-2 py-0.5 text-[10px]">
                            Success Rank
                        </Badge>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="divide-y divide-(--color-border-subtle)">
                            {topProviders.length > 0 ? (
                                topProviders.map((resource: any, index: number) => (
                                    <TopPerformerItem
                                        key={index}
                                        resource={resource}
                                        index={index}
                                    />
                                ))
                            ) : (
                                <div className="rounded-xl border border-dashed border-(--color-border-primary) p-6 text-sm text-(--color-text-secondary)">
                                    Top provider rankings are not available yet.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
