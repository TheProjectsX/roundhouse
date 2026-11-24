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
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
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
    const { data, isLoading, isError, refetch } = useGetAdminAnalyticsQuery();

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <PageHeader
                    title="Analytics"
                    description="Request volume, token consumption, success rates, and provider distribution."
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-28 rounded-md" />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col gap-6">
                <PageHeader title="Analytics" />
                <EmptyState
                    title="Could not load analytics"
                    description="Check your admin session or backend connection and retry."
                    action={
                        <Button variant="secondary" onClick={() => refetch()}>
                            Retry
                        </Button>
                    }
                />
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
        <div className="flex flex-col gap-6 pb-8">
            <PageHeader
                title="Analytics"
                description={`Tracking ${dailyTrend.length} days of request volume, token consumption, and provider efficiency.`}
                actions={
                    <>
                        <Button asChild variant="secondary">
                            <Link href={routes.admin}>
                                Back to Dashboard
                            </Link>
                        </Button>
                        <Button asChild variant="secondary">
                            <Link href={routes.dashboard}>
                                <ArrowSquareOutIcon size={16} />
                                User Dashboard
                            </Link>
                        </Button>
                    </>
                }
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KPI
                    label="Total Tokens"
                    value={formatCompactNumber(summary?.totalTokens ?? 0)}
                    icon={CoinsIcon}
                    description="Cumulative consumption"
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
                    label="Avg. Success Rate"
                    value={`${(summary?.averageSuccessRate ?? 0).toFixed(1)}%`}
                    icon={ActivityIcon}
                    description="Platform-wide reliability"
                />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <Card>
                    <CardHeader>
                        <div className="flex w-full items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-semibold tracking-tight">
                                    Daily Request Trend
                                </h2>
                                <p className="mt-1 text-xs text-(--color-text-secondary)">
                                    Request volume across the captured window.
                                </p>
                            </div>
                            <PulseIcon size={18} className="text-(--color-text-muted)" />
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-5">
                        <div className="rounded-sm border border-(--color-border-primary) bg-(--color-bg-primary) p-4">
                            <div className="h-40">
                                <Sparkline
                                    data={totalRequestsTrend}
                                    label="Daily request volume trend"
                                    color="var(--color-text-primary)"
                                />
                            </div>
                            <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-(--color-text-muted)">
                                <span>{dailyTrend[0]?.date ?? "Start"}</span>
                                <span>Peak: {formatNumber(maxRequests)}</span>
                                <span>{dailyTrend[dailyTrend.length - 1]?.date ?? "Latest"}</span>
                            </div>
                        </div>
                        <div className="grid gap-3">
                            {trendRows.length > 0 ? (
                                trendRows.map((item) => {
                                    const width =
                                        maxRequests > 0
                                            ? Math.max(
                                                  6,
                                                  (item.requests / maxRequests) *
                                                      100,
                                              )
                                            : 6;

                                    return (
                                        <div key={item.date} className="grid gap-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-mono text-(--color-text-secondary)">
                                                    {item.date}
                                                </span>
                                                <span className="font-mono font-medium text-(--color-text-primary)">
                                                    {formatNumber(item.requests)} req
                                                </span>
                                            </div>
                                            <div className="h-1.5 rounded-sm bg-(--color-bg-input)">
                                                <div
                                                    className="h-full rounded-sm bg-(--color-accent-primary)"
                                                    style={{ width: `${width}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <EmptyState
                                    compact
                                    title="No daily request data yet"
                                    description="Request metrics will appear once API traffic is recorded."
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex w-full items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-semibold tracking-tight">
                                    Token Consumption
                                </h2>
                                <p className="mt-1 text-xs text-(--color-text-secondary)">
                                    Token demand for the same reporting window.
                                </p>
                            </div>
                            <LightningIcon size={18} className="text-(--color-text-muted)" />
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="rounded-sm border border-(--color-border-primary) bg-(--color-bg-primary) p-4">
                            <div className="h-40">
                                <Sparkline
                                    data={tokenUsageTrend}
                                    label="Daily token consumption trend"
                                    color="var(--color-accent-secondary)"
                                />
                            </div>
                            <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-(--color-text-muted)">
                                <span>{dailyTrend[0]?.date ?? "Start"}</span>
                                <span>{dailyTrend[dailyTrend.length - 1]?.date ?? "Latest"}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-sm border border-(--color-border-subtle) bg-(--color-bg-secondary) p-3.5">
                            <span className="text-xs text-(--color-text-secondary)">
                                Total tracked tokens
                            </span>
                            <span className="font-mono text-base font-bold text-(--color-text-primary)">
                                {formatCompactNumber(summary?.totalTokens ?? 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <h2 className="text-base font-semibold tracking-tight">
                            Operational Mix
                        </h2>
                    </CardHeader>
                    <CardContent className="grid gap-4">
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
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <h2 className="text-base font-semibold tracking-tight">
                            Top Performing Providers
                        </h2>
                        <Badge className="font-mono text-[11px]">
                            Success Rank
                        </Badge>
                    </CardHeader>
                    <CardContent>
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
                                <EmptyState
                                    compact
                                    title="No provider rankings yet"
                                    description="Top provider rankings will appear after requests complete."
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
