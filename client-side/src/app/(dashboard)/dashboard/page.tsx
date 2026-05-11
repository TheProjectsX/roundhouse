"use client";

import {
    KeyIcon,
    ShieldCheckIcon,
    SparkleIcon,
    StackIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatCard } from "@/shared/components/data-display/stat-card";
import { StatusBadge } from "@/shared/components/ui/badge";
import {
    useGetApiKeysQuery,
    useGetKeysManagerQuery,
    useGetProvidersQuery,
} from "@/shared/store/api";
import { formatDate, formatNumber } from "@/shared/lib/utils";
import { routes } from "@/shared/constants/routes";

export default function DashboardPage() {
    const { data: apiKeys = [] } = useGetApiKeysQuery();
    const { data: providers = [] } = useGetProvidersQuery();
    const { data: managedKeys = [] } = useGetKeysManagerQuery();
    const totalModels = apiKeys.reduce(
        (total, item) => total + item.stats.modelCount,
        0,
    );
    const successfulRequests = apiKeys.reduce(
        (total, item) => total + item.stats.successfulRequests,
        0,
    );

    return (
        <>
            <PageHeader
                title="Overview"
                description="At-a-glance health for your API keys, providers, selected models, and routing behavior."
                actions={
                    <>
                        <Button asChild>
                            <Link href={routes.apiKeys}>Create API Key</Link>
                        </Button>
                        <Button asChild variant="secondary">
                            <Link href={routes.keys}>Manage Keys</Link>
                        </Button>
                    </>
                }
            />
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Total API Keys"
                    value={apiKeys.length}
                    icon={KeyIcon}
                />
                <StatCard
                    label="Active Providers"
                    value={providers.filter((item) => item.connected).length}
                    icon={StackIcon}
                />
                <StatCard
                    label="Selected Models"
                    value={totalModels}
                    icon={SparkleIcon}
                />
                <StatCard
                    label="Successful Requests"
                    value={successfulRequests}
                    icon={ShieldCheckIcon}
                />
            </section>
            <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <Card>
                    <CardHeader>
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">
                                Recent API Keys
                            </h2>
                            <p className="mt-1 text-sm text-(--color-text-secondary)">
                                Operational keys with provider, model, and
                                success counters.
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {apiKeys.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-col gap-3 rounded-md bg-(--color-bg-input) p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium">
                                            {item.name}
                                        </h3>
                                        <StatusBadge status={item.active} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-right font-mono text-sm">
                                    <span>
                                        {item.stats.providerCount} providers
                                    </span>
                                    <span>{item.stats.modelCount} models</span>
                                    <span>
                                        {formatNumber(
                                            item.stats.successfulRequests,
                                        )}{" "}
                                        ok
                                    </span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">
                                Readiness Checklist
                            </h2>
                            <p className="mt-1 text-sm text-(--color-text-secondary)">
                                Current configuration signals from Redux state
                                and RTK Query cache.
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ol className="grid gap-3 text-sm">
                            {[
                                `${apiKeys.length} Roundhouse keys configured`,
                                `${managedKeys.length} provider secrets stored`,
                                `${providers.filter((item) => item.connected).length} providers connected`,
                                `Last routing update ${formatDate(apiKeys[0]?.updatedAt)}`,
                            ].map((item) => (
                                <li
                                    key={item}
                                    className="flex items-center gap-3 rounded-md bg-(--color-bg-input) p-3"
                                >
                                    <span className="size-2 rounded-full bg-(--color-accent-primary)" />
                                    {item}
                                </li>
                            ))}
                        </ol>
                    </CardContent>
                </Card>
            </section>
        </>
    );
}
