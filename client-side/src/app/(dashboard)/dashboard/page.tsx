"use client";

import {
    ArrowSquareOutIcon,
    ArrowUpRightIcon,
    CheckCircleIcon,
    KeyIcon,
    ShieldCheckIcon,
    SparkleIcon,
    StackIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatCard } from "@/shared/components/data-display/stat-card";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { Badge } from "@/shared/components/ui/badge";
import {
    useGetApiKeysQuery,
} from "@/shared/store/features/apikeys/apikeysApi";
import { useGetKeysManagerQuery } from "@/shared/store/features/keysManager/keysManagerApi";
import { useGetProvidersQuery } from "@/shared/store/features/providers/providersApi";
import { formatDate } from "@/shared/lib/utils";
import { routes } from "@/shared/constants/routes";
import { useAppSelector } from "@/shared/store/hooks";
import { ApiKeyItem } from "./components/api-key-item";
import { ReadinessItem } from "./components/readiness-item";

export default function DashboardPage() {
    const user = useAppSelector((state) => state.auth.user);
    const { data: apiKeys = [] } = useGetApiKeysQuery();
    const { data: providers = [] } = useGetProvidersQuery();
    const { data: managedKeys = [] } = useGetKeysManagerQuery();
    const activeProviders = providers.filter((item) => item.connected).length;
    const connectedKeys = managedKeys.filter((item) => item.active).length;
    const readyChecks = [
        `${apiKeys.length} Roundhouse keys configured`,
        `${managedKeys.length} provider secrets stored`,
        `${activeProviders} providers connected`,
        `Last routing update ${formatDate(apiKeys[0]?.updatedAt)}`,
    ];
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
                        {user?.role === "ADMIN" ? (
                            <Button asChild variant="ghost">
                                <Link href={routes.admin}>
                                    <ArrowSquareOutIcon size={18} />
                                    Admin Dashboard
                                </Link>
                            </Button>
                        ) : null}
                    </>
                }
            />
            <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
                <Card className="overflow-hidden border-(--color-border-subtle) bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-accent-primary)_18%,transparent),transparent_48%),linear-gradient(180deg,color-mix(in_srgb,var(--color-bg-card)_92%,transparent),var(--color-bg-secondary))]">
                    <CardContent className="grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                        <div className="grid gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge>Workspace Status</Badge>
                                <span className="text-xs uppercase tracking-[0.18em] text-(--color-text-muted)">
                                    {user?.role === "ADMIN"
                                        ? "Admin access enabled"
                                        : "User workspace"}
                                </span>
                            </div>
                            <div className="grid gap-2">
                                <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-(--color-text-primary) sm:text-3xl">
                                    Keep your routing stack healthy, connected,
                                    and ready for live traffic.
                                </h2>
                                <p className="max-w-2xl text-sm leading-6 text-(--color-text-secondary)">
                                    Review API keys, vault coverage, selected
                                    models, and provider readiness from one
                                    place before requests hit production.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button asChild>
                                    <Link href={routes.providers}>
                                        Review Providers
                                        <ArrowUpRightIcon size={18} />
                                    </Link>
                                </Button>
                                <Button asChild variant="secondary">
                                    <Link href={routes.settings}>
                                        Open Settings
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-3 rounded-2xl border border-(--color-border-primary) bg-[color-mix(in_srgb,var(--color-bg-primary)_78%,transparent)] p-4">
                            {[
                                {
                                    label: "Connected vault keys",
                                    value: connectedKeys,
                                    tone:
                                        connectedKeys > 0
                                            ? "text-(--color-status-success)"
                                            : "text-(--color-status-warning)",
                                },
                                {
                                    label: "Live providers",
                                    value: activeProviders,
                                    tone:
                                        activeProviders > 0
                                            ? "text-(--color-accent-primary)"
                                            : "text-(--color-status-warning)",
                                },
                                {
                                    label: "Model selections",
                                    value: totalModels,
                                    tone: "text-(--color-text-primary)",
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center justify-between rounded-xl border border-(--color-border-subtle) bg-(--color-bg-card) px-4 py-3"
                                >
                                    <span className="text-sm text-(--color-text-secondary)">
                                        {item.label}
                                    </span>
                                    <span className={`font-mono text-lg font-bold ${item.tone}`}>
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
                                Readiness Summary
                            </h2>
                            <p className="mt-1 text-sm text-(--color-text-secondary)">
                                A quick pass on the minimum pieces needed for
                                successful routing.
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {[
                            {
                                label: "Access readiness",
                                value: `${managedKeys.length} secrets stored / ${activeProviders} active providers`,
                                ready:
                                    managedKeys.length > 0 &&
                                    activeProviders > 0,
                            },
                            {
                                label: "Routing inventory",
                                value: `${apiKeys.length} keys / ${totalModels} models`,
                                ready: apiKeys.length > 0 && totalModels > 0,
                            },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="flex items-start gap-3 rounded-xl border border-(--color-border-subtle) bg-(--color-bg-card) p-4"
                            >
                                <div
                                    className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${
                                        item.ready
                                            ? "bg-[color-mix(in_srgb,var(--color-status-success)_14%,transparent)] text-(--color-status-success)"
                                            : "bg-[color-mix(in_srgb,var(--color-status-warning)_14%,transparent)] text-(--color-status-warning)"
                                    }`}
                                >
                                    {item.ready ? (
                                        <CheckCircleIcon size={18} weight="fill" />
                                    ) : (
                                        <WarningCircleIcon size={18} weight="fill" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-(--color-text-primary)">
                                        {item.label}
                                    </p>
                                    <p className="mt-1 text-sm text-(--color-text-secondary)">
                                        {item.value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Total API Keys"
                    value={apiKeys.length}
                    icon={KeyIcon}
                />
                <StatCard
                    label="Active Providers"
                    value={activeProviders}
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
                                Your most recent routing profiles with
                                operational counters and status context.
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {apiKeys.length > 0 ? (
                            apiKeys.map((item) => (
                                <ApiKeyItem key={item.id} item={item} />
                            ))
                        ) : (
                            <EmptyState
                                compact
                                title="No API keys yet"
                                description="Create your first key to start defining routing behavior."
                                className="border-none bg-transparent"
                            />
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">
                                Readiness Checklist
                            </h2>
                            <p className="mt-1 text-sm text-(--color-text-secondary)">
                                Current configuration signals from your cached
                                workspace state.
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ol className="grid gap-3 text-sm">
                            {readyChecks.map((item, index) => (
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
