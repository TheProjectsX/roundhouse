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
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useGetApiKeysQuery } from "@/shared/store/features/apikeys/apikeysApi";
import { useGetKeysManagerQuery } from "@/shared/store/features/keysManager/keysManagerApi";
import { useGetProvidersQuery } from "@/shared/store/features/providers/providersApi";
import { formatDate } from "@/shared/lib/utils";
import { routes } from "@/shared/constants/routes";
import { useAppSelector } from "@/shared/store/hooks";
import { ApiKeyItem } from "./components/api-key-item";

export default function DashboardPage() {
    const user = useAppSelector((state) => state.auth.user);
    const {
        data: apiKeys = [],
        isLoading: isKeysLoading,
        isError: isKeysError,
        refetch: refetchKeys,
    } = useGetApiKeysQuery();
    const { data: providers = [], isLoading: isProvidersLoading } =
        useGetProvidersQuery();
    const { data: managedKeys = [], isLoading: isVaultLoading } =
        useGetKeysManagerQuery();

    const isLoading = isKeysLoading || isProvidersLoading || isVaultLoading;
    const activeProviders = providers.filter((item) => item.connected).length;
    const totalModels = apiKeys.reduce(
        (total, item) => total + (item.stats?.modelCount ?? 0),
        0,
    );
    const successfulRequests = apiKeys.reduce(
        (total, item) => total + (item.stats?.successfulRequests ?? 0),
        0,
    );

    const gates = [
        {
            label: "1. Key Vault",
            value: `${managedKeys.length} provider secrets stored`,
            href: routes.keys,
            ready: managedKeys.length > 0,
        },
        {
            label: "2. Providers & Models",
            value: `${activeProviders} connected · ${totalModels} models`,
            href: routes.providers,
            ready: activeProviders > 0,
        },
        {
            label: "3. Roundhouse API Keys",
            value: `${apiKeys.length} keys configured`,
            href: routes.apiKeys,
            ready: apiKeys.length > 0 && activeProviders > 0,
        },
    ];

    return (
        <>
            <PageHeader
                title="Overview"
                description="Live readiness across your Roundhouse API keys, vault secrets, and connected providers."
                actions={
                    <>
                        {managedKeys.length === 0 && !isLoading ? (
                            <>
                                <Button asChild>
                                    <Link href={routes.keys}>Add Vault Key</Link>
                                </Button>
                                <Button asChild variant="secondary">
                                    <Link href={routes.apiKeys}>Create API Key</Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button asChild>
                                    <Link href={routes.apiKeys}>Create API Key</Link>
                                </Button>
                                <Button asChild variant="secondary">
                                    <Link href={routes.keys}>Manage Key Vault</Link>
                                </Button>
                            </>
                        )}
                        {user?.role === "ADMIN" ? (
                            <Button asChild variant="ghost">
                                <Link href={routes.admin}>
                                    <ArrowSquareOutIcon size={16} />
                                    Admin Console
                                </Link>
                            </Button>
                        ) : null}
                    </>
                }
            />

            {isKeysError ? (
                <EmptyState
                    title="Could not load workspace overview"
                    description="Check your connection or backend status and try again."
                    action={
                        <Button variant="secondary" onClick={() => refetchKeys()}>
                            Retry
                        </Button>
                    }
                />
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-24 rounded-md" />
                    ))
                ) : (
                    <>
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
                    </>
                )}
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
                <Card>
                    <CardHeader>
                        <div>
                            <h2 className="text-base font-semibold tracking-tight">
                                API Key Routing Profiles
                            </h2>
                            <p className="mt-1 text-xs text-(--color-text-secondary)">
                                Select a profile to configure providers, model
                                priorities, and retry caps.
                            </p>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                            <Link href={routes.apiKeys}>
                                View all
                                <ArrowUpRightIcon size={14} />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="grid gap-2.5">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <Skeleton key={index} className="h-16 rounded-sm" />
                            ))
                        ) : apiKeys.length > 0 ? (
                            apiKeys.slice(0, 6).map((item) => (
                                <ApiKeyItem key={item.id} item={item} />
                            ))
                        ) : (
                            <EmptyState
                                compact
                                title="No API keys yet"
                                description="Create your first Roundhouse key to start configuring routing."
                                action={
                                    <Button asChild size="sm">
                                        <Link href={routes.apiKeys}>
                                            Create API Key
                                        </Link>
                                    </Button>
                                }
                                className="border-none bg-transparent"
                            />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div>
                            <h2 className="text-base font-semibold tracking-tight">
                                Readiness Gates
                            </h2>
                            <p className="mt-1 text-xs text-(--color-text-secondary)">
                                Minimum setup required for live /v1 traffic.
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-2.5">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <Skeleton key={index} className="h-16 rounded-sm" />
                            ))
                        ) : (
                            <>
                                {gates.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className="flex items-start justify-between gap-3 rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) p-3.5 transition-colors hover:border-(--color-border-focused) hover:bg-(--color-bg-card-hover)"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span
                                                className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-sm border ${
                                                    item.ready
                                                        ? "border-[color-mix(in_srgb,var(--color-status-success)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-status-success)_12%,transparent)] text-(--color-status-success)"
                                                        : "border-dashed border-[color-mix(in_srgb,var(--color-status-warning)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-status-warning)_12%,transparent)] text-(--color-status-warning)"
                                                }`}
                                            >
                                                {item.ready ? (
                                                    <CheckCircleIcon size={15} weight="fill" />
                                                ) : (
                                                    <WarningCircleIcon size={15} weight="fill" />
                                                )}
                                            </span>
                                            <div>
                                                <p className="text-sm font-medium text-(--color-text-primary)">
                                                    {item.label}
                                                </p>
                                                <p className="mt-0.5 font-mono text-xs text-(--color-text-secondary)">
                                                    {item.value}
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowUpRightIcon
                                            size={15}
                                            className="mt-1 shrink-0 text-(--color-text-muted)"
                                        />
                                    </Link>
                                ))}
                                <div className="border-t border-(--color-border-subtle) pt-3 font-mono text-xs text-(--color-text-muted)">
                                    <span suppressHydrationWarning>
                                        Last routing update:{" "}
                                        {formatDate(apiKeys[0]?.updatedAt)}
                                    </span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </section>
        </>
    );
}
