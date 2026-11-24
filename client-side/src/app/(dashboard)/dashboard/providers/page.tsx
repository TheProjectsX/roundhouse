"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    CheckCircleIcon,
    GlobeIcon,
    KeyIcon,
    MagnifyingGlassIcon,
    SparkleIcon,
    StackIcon,
} from "@phosphor-icons/react";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { StatCard } from "@/shared/components/data-display/stat-card";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { summarizeErrorMessage } from "@/shared/lib/utils";
import {
    useGetCatalogStatusQuery,
    useGetProvidersQuery,
    useTestProviderMutation,
} from "@/shared/store/features/providers/providersApi";
import { useGetKeysManagerQuery } from "@/shared/store/features/keysManager/keysManagerApi";
import { routes } from "@/shared/constants/routes";
import type { ProviderListItem } from "@/shared/types/entities";
import { ProviderSkeletons } from "./components/provider-skeletons";
import { ProviderCard } from "./components/provider-card";
import { ProviderModelsModal } from "./components/provider-models-modal";
import { ConnectProviderModal } from "./components/connect-provider-modal";

type GlobalProviderFilter = "all" | "connected" | "ready" | "free";

export default function ProvidersPage() {
    const { data: providers = [], isLoading, isError, refetch } = useGetProvidersQuery();
    const { data: catalogStatus } = useGetCatalogStatusQuery();
    const { data: vaultKeys = [] } = useGetKeysManagerQuery();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<GlobalProviderFilter>("all");
    const [connectProvider, setConnectProvider] =
        useState<ProviderListItem | null>(null);
    const [modelProvider, setModelProvider] = useState<ProviderListItem | null>(
        null,
    );
    const [testProvider] = useTestProviderMutation();
    const [testingProviderId, setTestingProviderId] = useState<string | null>(
        null,
    );

    const globalOnly = useMemo(
        () => providers.filter((p) => !p.isCustom),
        [providers],
    );

    const getVaultKeysCount = (provider: ProviderListItem) =>
        vaultKeys.filter((k) => {
            if (!k.active || !k.provider) return false;
            const hint = k.provider.toLowerCase();
            return (
                hint === provider.code.toLowerCase() ||
                hint === provider.type.toLowerCase()
            );
        }).length;

    const summary = useMemo(() => {
        const readyWithKey = globalOnly.filter(
            (p) => getVaultKeysCount(p) > 0,
        ).length;
        const activeModels = globalOnly.reduce(
            (sum, p) => sum + p.activeModelsCount,
            0,
        );
        const connectedRoutes = globalOnly.filter((p) => p.connected).length;
        return {
            totalProviders: globalOnly.length,
            readyWithKey,
            activeModels,
            connectedRoutes,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalOnly, vaultKeys]);

    const filteredProviders = useMemo(() => {
        const term = search.trim().toLowerCase();
        const filtered = globalOnly.filter((provider) => {
            if (filter === "connected" && !provider.connected) return false;
            if (filter === "ready" && getVaultKeysCount(provider) === 0) return false;
            if (filter === "free" && !provider.free) return false;
            if (!term) return true;
            return (
                provider.name.toLowerCase().includes(term) ||
                provider.code.toLowerCase().includes(term) ||
                provider.type.toLowerCase().includes(term) ||
                (provider.description ?? "").toLowerCase().includes(term)
            );
        });

        return [...filtered].sort((a, b) => {
            const aConnected = a.connected ? 1 : 0;
            const bConnected = b.connected ? 1 : 0;
            if (aConnected !== bConnected) return bConnected - aConnected;
            const aReady = getVaultKeysCount(a) > 0 ? 1 : 0;
            const bReady = getVaultKeysCount(b) > 0 ? 1 : 0;
            if (aReady !== bReady) return bReady - aReady;
            return b.activeModelsCount - a.activeModelsCount;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalOnly, vaultKeys, search, filter]);

    const handleTestProvider = async (provider: ProviderListItem) => {
        setTestingProviderId(provider.id);
        try {
            const res = await testProvider({
                providerId: provider.id,
            }).unwrap();
            if (res.success) {
                toast.success(
                    `${provider.name} OK (${res.model.code} • ${res.latencyMs}ms)`,
                );
            } else {
                toast.error(
                    `${provider.name} failed (${res.model.code}): ${summarizeErrorMessage(res.error, "Unknown error")}`,
                );
            }
        } catch (err: any) {
            toast.error(
                summarizeErrorMessage(
                    err?.data?.message,
                    "Could not test provider",
                ),
            );
        } finally {
            setTestingProviderId(null);
        }
    };

    const filterOptions: Array<{ id: GlobalProviderFilter; label: string }> = [
        { id: "all", label: "All" },
        { id: "connected", label: "Connected" },
        { id: "ready", label: "Has Vault Key" },
        { id: "free", label: "Free Tier" },
    ];

    return (
        <>
            <PageHeader
                title="Model Providers"
                description="Global LLM provider catalogs. Link vault keys and inspect active models."
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        {catalogStatus ? (
                            <Badge className="font-mono text-xs">
                                {catalogStatus.syncing
                                    ? "Catalog syncing..."
                                    : catalogStatus.lastSyncedAt
                                      ? `Auto-sync every ${catalogStatus.syncIntervalHours}h`
                                      : "Auto-seed active"}
                            </Badge>
                        ) : null}
                        <Button asChild variant="secondary">
                            <Link href={routes.customProviders}>
                                <GlobeIcon size={16} /> Custom Providers
                            </Link>
                        </Button>
                    </div>
                }
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Global Providers" value={summary.totalProviders} icon={StackIcon} />
                <StatCard label="Connected Keys" value={summary.connectedRoutes} icon={CheckCircleIcon} />
                <StatCard label="Ready With Vault Key" value={summary.readyWithKey} icon={KeyIcon} />
                <StatCard label="Active Models" value={summary.activeModels} icon={SparkleIcon} />
            </div>

            <div className="flex flex-col gap-3 rounded-md border border-(--color-border-primary) bg-(--color-bg-card) p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <MagnifyingGlassIcon
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
                    />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search global providers..."
                        aria-label="Search global providers"
                        className="pl-9"
                    />
                </div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter providers">
                    {filterOptions.map((option) => (
                        <Button
                            key={option.id}
                            type="button"
                            size="sm"
                            aria-pressed={filter === option.id}
                            variant={
                                filter === option.id ? "primary" : "secondary"
                            }
                            onClick={() => setFilter(option.id)}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>

            {isError ? (
                <EmptyState
                    title="Could not load providers"
                    description="Check your connection or session and retry."
                    action={
                        <Button variant="secondary" onClick={() => refetch()}>
                            Retry
                        </Button>
                    }
                />
            ) : (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {isLoading && filteredProviders.length === 0 ? (
                        <ProviderSkeletons />
                    ) : null}
                    {!isLoading && filteredProviders.length === 0 ? (
                        <div className="col-span-full">
                            <EmptyState
                                title="No matching global providers"
                                description={
                                    search || filter !== "all"
                                        ? "Try clearing your search or filter."
                                        : "Global providers will appear here automatically once seeded."
                                }
                            />
                        </div>
                    ) : null}
                    {filteredProviders.map((provider) => (
                        <ProviderCard
                            key={provider.id}
                            provider={provider}
                            vaultKeysCount={getVaultKeysCount(provider)}
                            onConnect={setConnectProvider}
                            onViewModels={setModelProvider}
                            onTest={handleTestProvider}
                            isTesting={testingProviderId === provider.id}
                        />
                    ))}
                </section>
            )}

            {connectProvider && (
                <ConnectProviderModal
                    provider={connectProvider}
                    onClose={() => setConnectProvider(null)}
                />
            )}
            {modelProvider && (
                <ProviderModelsModal
                    provider={modelProvider}
                    onClose={() => setModelProvider(null)}
                />
            )}
        </>
    );
}
