"use client";

import {
    ActivityIcon,
    ChartLineUpIcon,
    CoinsIcon,
    CpuIcon,
    GlobeIcon,
    PulseIcon,
    StackIcon,
    UsersIcon,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { useGetAdminAnalyticsQuery } from "@/shared/store/features/api/roundhouseApi";
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
                                Daily request volume and token consumption (last 30 days)
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

                            <div className="mt-4 flex justify-between px-1 text-[10px] font-bold text-(--color-text-muted)">
                                <span>30 days ago</span>
                                <span>Today</span>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-6">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-(--color-accent-primary)" />
                                <span className="text-xs font-medium">Requests</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-(--color-accent-secondary)" />
                                <span className="text-xs font-medium">Tokens</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Efficiency Distribution */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-bold">Platform Efficiency</h2>
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
                                        {(summary?.averageSuccessRate ?? 0).toFixed(0)}%
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
                                    <span className="text-sm font-medium">Successful</span>
                                </div>
                                <span className="font-mono text-sm font-bold">
                                    {formatCompactNumber(data?.summary.totalRequests || 0)}
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
                                <OperationalMixItem
                                    key={item.label}
                                    label={item.label}
                                    value={item.value}
                                    icon={item.icon}
                                    totalModels={summary?.models ?? 1}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Performers */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <h2 className="text-lg font-bold">Top Performing Resources</h2>
                        <Badge className="px-2 py-0.5 text-[10px]">SUCCESS RANK</Badge>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="divide-y divide-(--color-border-subtle)">
                            {data?.topProviders.map((resource: any, index: number) => (
                                <TopPerformerItem
                                    key={index}
                                    resource={resource}
                                    index={index}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}
