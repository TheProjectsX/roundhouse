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
                    value={analytics?.users ?? 0}
                    icon={UsersIcon}
                />
                <StatCard
                    label="API Keys"
                    value={analytics?.apiKeys ?? 0}
                    icon={KeyIcon}
                />
                <StatCard
                    label="Providers"
                    value={
                        (analytics?.globalProviders ?? 0) +
                        (analytics?.customProviders ?? 0)
                    }
                    icon={StackIcon}
                />
                <StatCard
                    label="Selections"
                    value={analytics?.providerSelections ?? 0}
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
                            ["Global models", analytics?.models ?? 0],
                            ["Custom models", analytics?.userModels ?? 0],
                            [
                                "Linked vault keys",
                                analytics?.providerSelectionApiKeysManagers ??
                                    0,
                            ],
                            [
                                "Custom providers",
                                analytics?.customProviders ?? 0,
                            ],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="flex items-center justify-between rounded-md bg-(--color-bg-input) p-3 text-sm"
                            >
                                <span>{label}</span>
                                <span className="font-mono font-semibold">
                                    {value}
                                </span>
                            </div>
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
                            <div
                                key={user.id}
                                className="grid gap-3 rounded-md bg-(--color-bg-input) p-3 md:grid-cols-[1fr_auto] md:items-center"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium">
                                            {user.name}
                                        </h3>
                                        <StatusBadge status={user.status} />
                                    </div>
                                    <p className="text-sm text-(--color-text-secondary)">
                                        {user.email}
                                    </p>
                                </div>
                                <p className="font-mono text-sm">
                                    {user.stats.activeApiKeyCount}/
                                    {user.stats.apiKeyCount} active keys
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>
        </>
    );
}
