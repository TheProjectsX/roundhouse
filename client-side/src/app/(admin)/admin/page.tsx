"use client";

import {
    ChartLineUpIcon,
    KeyIcon,
    StackIcon,
    UsersIcon,
} from "@phosphor-icons/react";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatCard } from "@/shared/components/data-display/stat-card";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import {
    useGetAdminAnalyticsQuery,
    useGetAdminUsersQuery,
} from "@/shared/store/features/api/roundhouseApi";
import { StatusBadge } from "@/shared/components/ui/badge";
import { EntityItem } from "./components/entity-item";
import { RecentUserItem } from "./components/recent-user-item";

export default function AdminDashboardPage() {
    const { data: analytics } = useGetAdminAnalyticsQuery();
    const { data: users = [] } = useGetAdminUsersQuery();

    return (
        <>
            <PageHeader
                title="Admin Dashboard"
                description="Platform-wide entities, provider health, and user activity."
            />
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Users"
                    value={analytics?.summary.users ?? 0}
                    icon={UsersIcon}
                />
                <StatCard
                    label="API Keys"
                    value={analytics?.summary.apiKeys ?? 0}
                    icon={KeyIcon}
                />
                <StatCard
                    label="Providers"
                    value={
                        (analytics?.summary.globalProviders ?? 0) +
                        (analytics?.summary.customProviders ?? 0)
                    }
                    icon={StackIcon}
                />
                <StatCard
                    label="Requests"
                    value={analytics?.summary.totalRequests ?? 0}
                    icon={ChartLineUpIcon}
                />
            </section>
            <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <Card>
                    <CardHeader>
                        <h2 className="font-semibold tracking-tight">
                            Entity Distribution
                        </h2>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {[
                            ["Global models", analytics?.summary.models ?? 0],
                            ["Custom models", analytics?.summary.userModels ?? 0],
                            [
                                "Total Tokens",
                                analytics?.summary.totalTokens ?? 0,
                            ],
                            [
                                "Custom providers",
                                analytics?.summary.customProviders ?? 0,
                            ],
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
                        {users.map((user) => (
                            <RecentUserItem key={user.id} user={user} />
                        ))}
                    </CardContent>
                </Card>
            </section>
        </>
    );
}
