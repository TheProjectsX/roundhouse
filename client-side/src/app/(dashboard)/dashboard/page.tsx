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
import {
    useGetApiKeysQuery,
    useGetKeysManagerQuery,
    useGetProvidersQuery,
} from "@/shared/store/features/api/roundhouseApi";
import { formatDate } from "@/shared/lib/utils";
import { routes } from "@/shared/constants/routes";
import { ApiKeyItem } from "./components/api-key-item";
import { ReadinessItem } from "./components/readiness-item";

export default function DashboardPage() {
    const { data: apiKeys = [] } = useGetApiKeysQuery();
    const { data: providers = [] } = useGetProvidersQuery();
    const { data: managedKeys = [] } = useGetKeysManagerQuery();
    const totalModels = apiKeys.reduce(
        (total, item) => total + (item.stats?.modelCount ?? 0),
        0,
    );
    const successfulRequests = apiKeys.reduce(
        (total, item) => total + (item.stats?.successfulRequests ?? 0),
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
                            <ApiKeyItem key={item.id} item={item} />
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
                            ].map((item, index) => (
                                <ReadinessItem
                                    key={index}
                                    item={
                                        index === 3 ? (
                                            <span suppressHydrationWarning>
                                                Last routing update{" "}
                                                {formatDate(apiKeys[0]?.updatedAt)}
                                            </span>
                                        ) : (
                                            item
                                        )
                                    }
                                />
                            ))}
                        </ol>
                    </CardContent>
                </Card>
            </section>
        </>
    );
}
