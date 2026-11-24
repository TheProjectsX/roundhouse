"use client";

import {
    ArrowsClockwiseIcon,
    ArrowSquareOutIcon,
    ChartLineUpIcon,
    GaugeIcon,
    KeyIcon,
    StackIcon,
    UsersIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatCard } from "@/shared/components/data-display/stat-card";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
    useGetAdminAnalyticsQuery,
    useGetAdminUsersQuery,
    useSyncAllAdminCatalogsMutation,
} from "@/shared/store/features/admin/adminApi";
import { routes } from "@/shared/constants/routes";
import { EntityItem } from "./components/entity-item";
import { RecentUserItem } from "./components/recent-user-item";

export default function AdminDashboardPage() {
    const {
        data: analytics,
        isLoading: isAnalyticsLoading,
        isError: isAnalyticsError,
        refetch: refetchAnalytics,
    } = useGetAdminAnalyticsQuery();
    const { data: users = [], isLoading: isUsersLoading } = useGetAdminUsersQuery();
    const [syncAllCatalogs, syncAllState] = useSyncAllAdminCatalogsMutation();
    const summary = analytics?.summary;
    const providerTotal =
        (summary?.globalProviders ?? 0) + (summary?.customProviders ?? 0);

    const handleSyncCatalog = async () => {
        try {
            const res = await syncAllCatalogs().unwrap();
            const s = res.lastSummary;
            toast.success(
                s
                    ? `Catalog synced: ${s.providersSynced} providers (+${s.createdCount} new)`
                    : "Global catalog synced",
            );
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not sync global catalog");
        }
    };

    return (
        <>
            <PageHeader
                title="Admin Dashboard"
                description="Platform-wide catalog health, usage counters, and recent accounts."
                actions={
                    <>
                        <Button
                            variant="secondary"
                            disabled={syncAllState.isLoading}
                            onClick={handleSyncCatalog}
                        >
                            <ArrowsClockwiseIcon
                                size={16}
                                className={
                                    syncAllState.isLoading ? "animate-spin" : ""
                                }
                            />
                            {syncAllState.isLoading
                                ? "Syncing..."
                                : "Re-sync Catalog"}
                        </Button>
                        <Button asChild>
                            <Link href={routes.adminAnalytics}>
                                View Analytics
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

            {isAnalyticsError ? (
                <EmptyState
                    title="Could not load platform analytics"
                    description="Check your admin session or backend availability and retry."
                    action={
                        <Button variant="secondary" onClick={() => refetchAnalytics()}>
                            Retry
                        </Button>
                    }
                />
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {isAnalyticsLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-24 rounded-md" />
                    ))
                ) : (
                    <>
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
                    </>
                )}
            </section>

            <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <GaugeIcon size={17} className="text-(--color-text-secondary)" />
                            <h2 className="text-base font-semibold tracking-tight">
                                Platform Snapshot
                            </h2>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                            <Link href={routes.adminProviders}>Providers</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="grid gap-2.5">
                        {isAnalyticsLoading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <Skeleton key={index} className="h-11 rounded-sm" />
                            ))
                        ) : (
                            [
                                ["Average success rate", `${(summary?.averageSuccessRate ?? 0).toFixed(1)}%`],
                                ["Global models", summary?.models ?? 0],
                                ["Custom models", summary?.userModels ?? 0],
                                ["Total tokens", summary?.totalTokens ?? 0],
                                ["Custom providers", summary?.customProviders ?? 0],
                            ].map(([label, value]) => (
                                <EntityItem
                                    key={label as string}
                                    label={label as string}
                                    value={value}
                                />
                            ))
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <h2 className="text-base font-semibold tracking-tight">
                            Recent Users
                        </h2>
                        <Button asChild variant="ghost" size="sm">
                            <Link href={routes.adminUsers}>Manage users</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="grid gap-2.5">
                        {isUsersLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <Skeleton key={index} className="h-14 rounded-sm" />
                            ))
                        ) : users.length > 0 ? (
                            users.slice(0, 6).map((user) => (
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
