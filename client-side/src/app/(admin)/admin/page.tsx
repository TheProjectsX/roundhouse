"use client";

import {
    ArrowSquareOutIcon,
    ArrowUpRightIcon,
    GaugeIcon,
    ChartLineUpIcon,
    KeyIcon,
    StackIcon,
    UsersIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatCard } from "@/shared/components/data-display/stat-card";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
    useGetAdminAnalyticsQuery,
    useGetAdminUsersQuery,
} from "@/shared/store/features/admin/adminApi";
import { routes } from "@/shared/constants/routes";
import { formatNumber } from "@/shared/lib/utils";
import { EntityItem } from "./components/entity-item";
import { RecentUserItem } from "./components/recent-user-item";

export default function AdminDashboardPage() {
    const { data: analytics } = useGetAdminAnalyticsQuery();
    const { data: users = [], isLoading: isUsersLoading } = useGetAdminUsersQuery();
    const summary = analytics?.summary;
    const providerTotal =
        (summary?.globalProviders ?? 0) + (summary?.customProviders ?? 0);

    return (
        <>
            <PageHeader
                title="Admin Dashboard"
                description="Platform-wide entities, provider health, and user activity."
                actions={
                    <>
                        <Button asChild>
                            <Link href={routes.adminAnalytics}>
                                View Analytics
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
            <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <Card className="overflow-hidden border-(--color-border-subtle) bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-accent-secondary)_16%,transparent),transparent_50%),linear-gradient(180deg,color-mix(in_srgb,var(--color-bg-card)_92%,transparent),var(--color-bg-secondary))]">
                    <CardContent className="grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                        <div className="grid gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge>Admin Control</Badge>
                                <span className="text-xs uppercase tracking-[0.18em] text-(--color-text-muted)">
                                    Platform operations
                                </span>
                            </div>
                            <div className="grid gap-2">
                                <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
                                    One place to monitor growth, catalog health,
                                    and user activity across the platform.
                                </h2>
                                <p className="max-w-2xl text-sm leading-6 text-(--color-text-secondary)">
                                    Keep an eye on providers, total requests,
                                    model inventory, and account activity while
                                    retaining quick access to the standard user
                                    workspace.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button asChild>
                                    <Link href={routes.adminProviders}>
                                        Review Providers
                                        <ArrowUpRightIcon size={18} />
                                    </Link>
                                </Button>
                                <Button asChild variant="secondary">
                                    <Link href={routes.adminUsers}>
                                        Manage Users
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-3 rounded-2xl border border-(--color-border-primary) bg-[color-mix(in_srgb,var(--color-bg-primary)_78%,transparent)] p-4">
                            {[
                                {
                                    label: "Platform requests",
                                    value: formatNumber(summary?.totalRequests ?? 0),
                                },
                                {
                                    label: "Success rate",
                                    value: `${(summary?.averageSuccessRate ?? 0).toFixed(1)}%`,
                                },
                                {
                                    label: "Provider catalog",
                                    value: formatNumber(providerTotal),
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
                                Command Priorities
                            </h2>
                            <p className="mt-1 text-sm text-(--color-text-secondary)">
                                The fastest checks for overall platform health.
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {[
                            {
                                label: "User growth",
                                value: `${formatNumber(summary?.users ?? 0)} total accounts`,
                            },
                            {
                                label: "Catalog coverage",
                                value: `${formatNumber(summary?.models ?? 0)} standard + ${formatNumber(summary?.userModels ?? 0)} custom models`,
                            },
                            {
                                label: "Token consumption",
                                value: `${formatNumber(summary?.totalTokens ?? 0)} cumulative tokens`,
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
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Users"
                    value={summary?.users ?? 0}
                    icon={UsersIcon}
                />
                <StatCard
                    label="API Keys"
                    value={summary?.apiKeys ?? 0}
                    icon={KeyIcon}
                />
                <StatCard
                    label="Providers"
                    value={providerTotal}
                    icon={StackIcon}
                />
                <StatCard
                    label="Requests"
                    value={summary?.totalRequests ?? 0}
                    icon={ChartLineUpIcon}
                />
            </section>
            <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <GaugeIcon size={18} className="text-(--color-accent-primary)" />
                            <h2 className="font-semibold tracking-tight">
                                Platform Snapshot
                            </h2>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {[
                            ["Global models", summary?.models ?? 0],
                            ["Custom models", summary?.userModels ?? 0],
                            ["Total Tokens", summary?.totalTokens ?? 0],
                            ["Custom providers", summary?.customProviders ?? 0],
                        ].map(([label, value]) => (
                            <EntityItem
                                key={label}
                                label={label as string}
                                value={value}
                            />
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <h2 className="font-semibold tracking-tight">
                            Recent Users
                        </h2>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {isUsersLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <Skeleton key={index} className="h-18 rounded-xl" />
                            ))
                        ) : users.length > 0 ? (
                            users.map((user) => (
                                <RecentUserItem key={user.id} user={user} />
                            ))
                        ) : (
                            <EmptyState
                                compact
                                title="No recent users"
                                description="New accounts will appear here once user activity begins."
                                className="border-none bg-transparent"
                            />
                        )}
                    </CardContent>
                </Card>
            </section>
        </>
    );
}
