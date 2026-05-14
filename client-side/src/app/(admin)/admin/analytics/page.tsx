"use client";

import {
    ActivityIcon,
    ChartLineUpIcon,
    CoinsIcon,
    CpuIcon,
    GlobeIcon,
    PulseIcon,
    StackIcon,
    TrendDownIcon,
    TrendUpIcon,
    UsersIcon,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { useGetAdminAnalyticsQuery } from "@/shared/store/features/api/roundhouseApi";
import { cn, formatNumber } from "@/shared/lib/utils";

function formatCompactNumber(value: number) {
    return new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}

function KPI({
    label,
    value,
    icon: Icon,
    trend,
    description,
}: {
    label: string;
    value: string | number;
    icon: any;
    trend?: number;
    description?: string;
}) {
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

function MiniBarChart({
    data,
    color = "var(--color-accent-primary)",
}: {
    data: number[];
    color?: string;
}) {
    const max = Math.max(...data, 1);
    return (
        <div className="flex h-12 items-end gap-1">
            {data.map((v, i) => (
                <div
                    key={i}
                    className="w-full rounded-t-sm transition-all hover:opacity-80"
                    style={{
                        height: `${(v / max) * 100}%`,
                        backgroundColor: color,
                    }}
                />
            ))}
        </div>
    );
}

function Sparkline({
    data,
    color = "var(--color-accent-primary)",
}: {
    data: number[];
    color?: string;
}) {
    if (data.length < 2) return null;
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data
        .map((v, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((v - min) / range) * 100;
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <svg
            viewBox="0 0 100 100"
            className="h-full w-full overflow-visible"
            preserveAspectRatio="none"
        >
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-8 pb-12"
        >
            <PageHeader
                title="Analytics & Insights"
                description="Monitor platform health, usage trends, and model distribution."
            />

            {/* KPI Section */}
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Usage Trends Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-bold">Usage Trends</h2>
                            <p className="text-xs text-(--color-text-muted)">
                                Daily request volume and token consumption (last
                                30 days)
                            </p>
                        </div>
                        <ChartLineUpIcon
                            size={24}
                            className="text-(--color-text-muted)"
                        />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="relative h-64 w-full px-2">
                            <div className="absolute inset-0 z-0 opacity-10">
                                <Sparkline
                                    data={tokenUsageTrend}
                                    color="var(--color-accent-secondary)"
                                />
                            </div>
                            <div className="relative z-10 h-full">
                                <Sparkline data={totalRequestsTrend} />
                            </div>

                            {/* X-Axis labels (simple) */}
                            <div className="mt-4 flex justify-between px-1 text-[10px] font-bold text-(--color-text-muted)">
                                <span>30 days ago</span>
                                <span>Today</span>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-6">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-(--color-accent-primary)" />
                                <span className="text-xs font-medium">
                                    Requests
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-(--color-accent-secondary)" />
                                <span className="text-xs font-medium">
                                    Tokens
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Efficiency Distribution */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-bold">
                            Platform Efficiency
                        </h2>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-8 pt-4">
                        <div className="flex items-center justify-center py-4">
                            <div className="relative grid size-32 place-items-center">
                                <svg
                                    viewBox="0 0 36 36"
                                    className="size-full -rotate-90"
                                >
                                    <path
                                        className="text-(--color-bg-input)"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="text-(--color-status-success) transition-all duration-1000 ease-out"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeDasharray={`${summary?.averageSuccessRate ?? 0}, 100`}
                                        strokeLinecap="round"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-xl font-black">
                                        {(
                                            summary?.averageSuccessRate ?? 0
                                        ).toFixed(0)}
                                        %
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted)">
                                        Success
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="size-1.5 rounded-full bg-(--color-status-success)" />
                                    <span className="text-sm font-medium">
                                        Successful
                                    </span>
                                </div>
                                <span className="font-mono text-sm font-bold">
                                    {formatCompactNumber(
                                        data?.summary.totalRequests || 0,
                                    )}
                                </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-(--color-bg-input) overflow-hidden">
                                <div
                                    className="h-full bg-(--color-status-success)"
                                    style={{
                                        width: `${summary?.averageSuccessRate ?? 0}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Provider Distribution */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-bold">Operational Mix</h2>
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
                                <div
                                    key={item.label}
                                    className="group relative flex items-center gap-4 rounded-xl border border-transparent p-3 transition-all hover:border-(--color-border-subtle) hover:bg-(--color-bg-secondary)"
                                >
                                    <div className="grid size-10 place-items-center rounded-lg bg-(--color-bg-primary) text-(--color-text-secondary) group-hover:bg-(--color-accent-primary)/10 group-hover:text-(--color-accent-primary)">
                                        <item.icon size={20} weight="duotone" />
                                    </div>
                                    <div className="flex flex-1 flex-col">
                                        <span className="text-sm font-bold">
                                            {item.label}
                                        </span>
                                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-(--color-bg-input)">
                                            <div
                                                className="h-1.5 rounded-full bg-(--color-accent-primary)"
                                                style={{
                                                    width: `${(Number(item.value) / (summary?.models ?? 1)) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <span className="font-mono text-lg font-black">
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Performers */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <h2 className="text-lg font-bold">
                            Top Performing Resources
                        </h2>
                        <Badge className="px-2 py-0.5 text-[10px]">
                            SUCCESS RANK
                        </Badge>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="divide-y divide-(--color-border-subtle)">
                            {data?.topProviders.map(
                                (resource: any, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between py-4 transition-all hover:bg-(--color-bg-secondary)/50 px-2 rounded-lg"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="grid size-6 place-items-center rounded bg-(--color-bg-input) text-[10px] font-black text-(--color-text-muted)">
                                                #{index + 1}
                                            </span>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-bold tracking-tight">
                                                        {resource.name}
                                                    </span>
                                                    {resource.isCustom && (
                                                        <Badge className="h-4 bg-(--color-accent-secondary)/10 text-(--color-accent-secondary) border-none px-1.5 text-[8px] font-black uppercase">
                                                            Custom
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold text-(--color-text-muted)">
                                                    {resource.code}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-black text-(--color-status-success)">
                                                    {formatNumber(
                                                        resource.successCount,
                                                    )}
                                                </span>
                                                <span className="text-[10px] font-bold text-(--color-text-muted)">
                                                    SUCCESS
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-black">
                                                    {formatCompactNumber(
                                                        resource.tokenUsage,
                                                    )}
                                                </span>
                                                <span className="text-[10px] font-bold text-(--color-text-muted)">
                                                    TOKENS
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}
