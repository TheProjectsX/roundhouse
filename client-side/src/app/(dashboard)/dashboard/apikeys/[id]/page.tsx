"use client";

import Link from "next/link";
import {
    ArrowLeftIcon,
    FloppyDiskIcon,
    FunnelIcon,
    GitBranchIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { routes } from "@/shared/constants/routes";
import { roundhouseMethodLabels } from "@/shared/lib/enum-labels";
import { cn } from "@/shared/lib/utils";
import {
    useGetApiKeyDetailQuery,
    useGetApiKeyModelSelectionsQuery,
    useRemoveApiKeyProviderSelectionMutation,
    useReorderApiKeyModelSelectionsMutation,
    useSelectApiKeyProviderMutation,
    useUpdateApiKeyMutation,
    useUpdateApiKeyModelStatusMutation,
    useUpdateApiKeyProviderStatusMutation,
    useUpdateApiKeySettingsMutation,
    useUpdateApiKeyStatusMutation,
} from "@/shared/store/features/apikeys/apikeysApi";
import { useGetKeysManagerQuery } from "@/shared/store/features/keysManager/keysManagerApi";
import { useGetProvidersQuery } from "@/shared/store/features/providers/providersApi";
import type { ApiKeyModelSelectionListItem } from "@/shared/types/entities";
import { RoundhouseMethod } from "@/shared/types/enums";
import { AddProviderSelection } from "./components/add-provider-selection";
import { ConnectClientsPanel } from "./components/connect-clients-panel";
import { CoreSettings } from "./components/core-settings";
import { ModelPriorityList } from "./components/model-priority-list";
import { ProviderSelectionCard } from "./components/provider-selection-card";
import { RoutingAnalytics } from "./components/routing-analytics";
import { SettingsSkeleton } from "./components/settings-skeleton";

const EMPTY_ORDERED_MODELS: ApiKeyModelSelectionListItem[] = [];
type DetailTab = "overview" | "providers" | "priority" | "connect";

export default function ApiKeySettingsPage() {
    const params = useParams();
    const apiKeyId = params.id as string;
    const { data: apiKey, isLoading } = useGetApiKeyDetailQuery(apiKeyId);
    const { data: providers = [], isLoading: isProvidersLoading } =
        useGetProvidersQuery();
    const { data: keyManagers = [], isLoading: isKeyManagersLoading } =
        useGetKeysManagerQuery();
    const {
        data: orderedModels = EMPTY_ORDERED_MODELS,
        isLoading: isOrderedModelsLoading,
    } = useGetApiKeyModelSelectionsQuery(apiKeyId);

    const [updateApiKey, updateApiKeyState] = useUpdateApiKeyMutation();
    const [updateSettings, updateSettingsState] =
        useUpdateApiKeySettingsMutation();
    const [selectProvider, selectProviderState] =
        useSelectApiKeyProviderMutation();
    const [removeSelection, removeSelectionState] =
        useRemoveApiKeyProviderSelectionMutation();
    const [updateProviderStatus] = useUpdateApiKeyProviderStatusMutation();
    const [updateApiKeyStatus, updateApiKeyStatusState] =
        useUpdateApiKeyStatusMutation();
    const [updateModelStatus] = useUpdateApiKeyModelStatusMutation();
    const [reorderModels, reorderModelsState] =
        useReorderApiKeyModelSelectionsMutation();

    const [activeTab, setActiveTab] = useState<DetailTab>("overview");
    const [pendingModelStatusKey, setPendingModelStatusKey] = useState<
        string | null
    >(null);
    const [pendingProviderStatusId, setPendingProviderStatusId] = useState<
        string | null
    >(null);
    const [expandedProviderId, setExpandedProviderId] = useState<string | null>(
        null,
    );
    const [confirmRemoveSelection, setConfirmRemoveSelection] = useState<{
        id: string;
        name: string;
    } | null>(null);

    const [draft, setDraft] = useState({
        name: "",
        active: true,
        maxIterations: 5,
        roundhouseMethod: RoundhouseMethod.EFFICIENCY,
    });

    const [providerToAdd, setProviderToAdd] = useState("");
    const [vaultIds, setVaultIds] = useState<string[]>([]);
    const [query, setQuery] = useState("");
    const [providerSearch, setProviderSearch] = useState("");
    const [draftedModels, setDraftedModels] = useState<typeof orderedModels>(
        [],
    );

    useEffect(() => {
        if (!apiKey) return;
        setDraft({
            name: apiKey.name,
            active: apiKey.active,
            maxIterations: apiKey.maxIterations,
            roundhouseMethod: apiKey.roundhouseMethod,
        });
    }, [apiKey]);

    useEffect(() => {
        setDraftedModels((current) =>
            current === orderedModels ? current : orderedModels,
        );
    }, [orderedModels]);

    const selectedProviderIds = useMemo(
        () =>
            new Set(
                apiKey?.providers.map((provider) => provider.providerId) ?? [],
            ),
        [apiKey?.providers],
    );

    const availableProviders = providers.filter(
        (provider) => !selectedProviderIds.has(provider.id),
    );

    const providerMatches = availableProviders.filter((provider) => {
        const term = providerSearch.trim().toLowerCase();
        if (!term) return true;
        return [
            provider.name,
            provider.code,
            provider.type,
            provider.description,
        ].some((value) =>
            String(value ?? "")
                .toLowerCase()
                .includes(term),
        );
    });

    const filteredSelections = (apiKey?.providers ?? []).filter((provider) => {
        const term = query.trim().toLowerCase();
        if (!term) return true;
        return [provider.name, provider.code, provider.type].some((value) =>
            String(value ?? "")
                .toLowerCase()
                .includes(term),
        );
    });

    const apiKeyAnalytics = useMemo(() => {
        const items = apiKey?.providers ?? [];
        return {
            providerSelections: items.length,
            activeProviders: items.filter((p) => p.active).length,
            vaultKeys: items.reduce(
                (total, p) => total + (p.apiKeysManagers?.length ?? 0),
                0,
            ),
            activeModels: items.reduce(
                (total, p) =>
                    total + (p.models?.filter((m) => m.active).length ?? 0),
                0,
            ),
        };
    }, [apiKey?.providers]);

    const hasDirtySettings = Boolean(
        apiKey &&
            (draft.name !== apiKey.name ||
                draft.active !== apiKey.active ||
                draft.maxIterations !== apiKey.maxIterations ||
                draft.roundhouseMethod !== apiKey.roundhouseMethod),
    );

    const hasDirtyPriority =
        JSON.stringify(draftedModels) !== JSON.stringify(orderedModels);

    const hasAnyDirty = hasDirtySettings || hasDirtyPriority;
    const isSaving =
        updateApiKeyState.isLoading ||
        updateSettingsState.isLoading ||
        reorderModelsState.isLoading;

    if (isLoading) return <SettingsSkeleton />;

    if (!apiKey) {
        return (
            <Card>
                <CardContent className="flex items-start gap-3 p-5">
                    <WarningCircleIcon
                        size={20}
                        className="mt-0.5 text-(--color-status-warning)"
                    />
                    <div>
                        <h1 className="font-semibold">API key not found</h1>
                        <p className="mt-1 text-sm text-(--color-text-secondary)">
                            This key may have been deleted or you may not have
                            access to it.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const handleSaveAll = async () => {
        try {
            if (hasDirtySettings) {
                await updateApiKey({
                    id: apiKey.id,
                    body: { name: draft.name, active: draft.active },
                }).unwrap();
                await updateSettings({
                    id: apiKey.id,
                    body: {
                        maxIterations: draft.maxIterations,
                        roundhouseMethod: draft.roundhouseMethod,
                    },
                }).unwrap();
            }
            if (hasDirtyPriority) {
                const items = draftedModels.map((m) => ({
                    modelSelectionId: m.modelSelectionId,
                    priority: m.priority,
                }));
                await reorderModels({
                    apiKeyId,
                    items,
                }).unwrap();
            }
            toast.success("API key configuration saved");
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not save API key settings");
        }
    };

    const handleDiscardAll = () => {
        setDraft({
            name: apiKey.name,
            active: apiKey.active,
            maxIterations: apiKey.maxIterations,
            roundhouseMethod: apiKey.roundhouseMethod,
        });
        setDraftedModels(orderedModels);
    };

    const handleToggleStatus = async () => {
        const nextActive = !draft.active;
        try {
            await updateApiKeyStatus({
                id: apiKey.id,
                active: nextActive,
            }).unwrap();
            setDraft((v) => ({ ...v, active: nextActive }));
            toast.success(nextActive ? "API key enabled" : "API key disabled");
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not update API key status");
        }
    };

    const handleAddSelection = async () => {
        try {
            await selectProvider({
                apiKeyId,
                providerId: providerToAdd,
                apiKeysManagerIds: vaultIds,
            }).unwrap();
            setProviderToAdd("");
            setVaultIds([]);
            setProviderSearch("");
            toast.success("Provider selected");
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not select provider");
        }
    };

    const tabs: Array<{ id: DetailTab; label: string }> = [
        { id: "overview", label: "Core & Analytics" },
        { id: "providers", label: `Providers (${apiKey.providers.length})` },
        { id: "priority", label: `Priority (${draftedModels.length})` },
        { id: "connect", label: "Connect Clients" },
    ];

    return (
        <>
            <PageHeader
                title={apiKey.name}
                description="Configure routing strategy, provider selections, model priority order, and client integration."
                actions={
                    <>
                        <Button asChild variant="secondary">
                            <Link href={routes.apiKeys}>
                                <ArrowLeftIcon size={16} /> Back
                            </Link>
                        </Button>
                        <Button asChild variant="secondary">
                            <Link href={`/dashboard/playground?apiKeyId=${apiKeyId}`}>
                                Test in Playground
                            </Link>
                        </Button>
                        <Button
                            disabled={!hasAnyDirty || isSaving}
                            onClick={handleSaveAll}
                        >
                            <FloppyDiskIcon size={16} />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </>
                }
            />

            {hasAnyDirty && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[color-mix(in_srgb,var(--color-status-warning)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-status-warning)_10%,transparent)] p-3 text-sm">
                    <span className="flex items-center gap-2">
                        <WarningCircleIcon size={17} /> Unsaved{" "}
                        {hasDirtySettings && hasDirtyPriority
                            ? "settings and model priority"
                            : hasDirtyPriority
                              ? "model priority"
                              : "core settings"}{" "}
                        changes staged locally.
                    </span>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleDiscardAll}
                    >
                        Discard
                    </Button>
                </div>
            )}

            <div
                role="tablist"
                aria-label="API key configuration sections"
                className="flex flex-wrap gap-1 border-b border-(--color-border-primary) pb-3"
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "rounded-sm border px-3 py-1.5 text-sm font-medium transition-colors",
                            activeTab === tab.id
                                ? "border-(--color-border-focused) bg-(--color-bg-card) text-(--color-text-primary)"
                                : "border-transparent text-(--color-text-secondary) hover:bg-(--color-bg-card-hover) hover:text-(--color-text-primary)",
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === "overview" ? (
                <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
                    <CoreSettings
                        apiKey={apiKey}
                        draft={draft}
                        onDraftChange={(updates) =>
                            setDraft((v) => ({ ...v, ...updates }))
                        }
                        onToggleStatus={handleToggleStatus}
                        isUpdatingStatus={updateApiKeyStatusState.isLoading}
                    />
                    <RoutingAnalytics analytics={apiKeyAnalytics} />
                </section>
            ) : null}

            {activeTab === "providers" ? (
                <section className="grid gap-6">
                    <AddProviderSelection
                        availableProviders={availableProviders}
                        isProvidersLoading={isProvidersLoading}
                        providerSearch={providerSearch}
                        onProviderSearchChange={setProviderSearch}
                        providerToAdd={providerToAdd}
                        onProviderToAddChange={setProviderToAdd}
                        providerMatches={providerMatches}
                        keyManagers={keyManagers}
                        isKeyManagersLoading={isKeyManagersLoading}
                        vaultIds={vaultIds}
                        onVaultIdsChange={setVaultIds}
                        onAdd={handleAddSelection}
                        isLoading={selectProviderState.isLoading}
                    />

                    <div className="grid gap-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="flex items-center gap-2 text-base font-semibold">
                                <FunnelIcon size={18} /> Provider Configuration
                            </h2>
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Filter selected providers..."
                                aria-label="Filter selected providers"
                                className="sm:max-w-xs"
                            />
                        </div>
                        {filteredSelections.length === 0 ? (
                            <EmptyState
                                title="No provider selections found"
                                description={
                                    query.trim()
                                        ? "No provider selections match the current filter."
                                        : "Add a provider selection above to attach vault keys and enable routing models."
                                }
                            />
                        ) : null}
                        {filteredSelections.map((selection) => (
                            <ProviderSelectionCard
                                key={selection.id}
                                apiKeyId={apiKeyId}
                                selection={selection}
                                keyManagers={keyManagers}
                                expanded={expandedProviderId === selection.id}
                                onToggleExpanded={() =>
                                    setExpandedProviderId((v) =>
                                        v === selection.id ? null : selection.id,
                                    )
                                }
                                onRemove={async () => {
                                    setConfirmRemoveSelection({
                                        id: selection.id,
                                        name: selection.name,
                                    });
                                }}
                                removePending={removeSelectionState.isLoading}
                                updateProviderStatus={updateProviderStatus}
                                pendingProviderStatusId={pendingProviderStatusId}
                                onPendingProviderStatusIdChange={
                                    setPendingProviderStatusId
                                }
                                updateModelStatus={updateModelStatus}
                                pendingModelStatusKey={pendingModelStatusKey}
                                onPendingModelStatusKeyChange={
                                    setPendingModelStatusKey
                                }
                            />
                        ))}
                    </div>
                </section>
            ) : null}

            {activeTab === "priority" ? (
                <Card>
                    <CardHeader>
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-semibold">
                                <GitBranchIcon size={18} /> Model Priority
                            </h2>
                            <p className="mt-1 font-mono text-xs text-(--color-text-muted)">
                                Drag rows or use the arrow buttons to set fallback
                                attempt order.
                            </p>
                            {draft.roundhouseMethod !== RoundhouseMethod.PRIORITY && (
                                <p className="mt-1.5 text-xs text-(--color-status-warning)">
                                    Note: Priority order is only used when Routing
                                    method is set to Priority (currently{" "}
                                    {roundhouseMethodLabels[draft.roundhouseMethod]}
                                    ).
                                </p>
                            )}
                        </div>
                        {draftedModels.length > 0 && (
                            <div className="flex gap-2">
                                {hasDirtyPriority && (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        disabled={reorderModelsState.isLoading}
                                        onClick={() =>
                                            setDraftedModels(orderedModels)
                                        }
                                    >
                                        Discard order
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    disabled={
                                        !hasDirtyPriority ||
                                        reorderModelsState.isLoading
                                    }
                                    onClick={async () => {
                                        const items = draftedModels.map((m) => ({
                                            modelSelectionId: m.modelSelectionId,
                                            priority: m.priority,
                                        }));
                                        try {
                                            await reorderModels({
                                                apiKeyId,
                                                items,
                                            }).unwrap();
                                            toast.success("Priority updated");
                                        } catch (err: any) {
                                            toast.error(
                                                err?.data?.message ||
                                                    "Could not update priority",
                                            );
                                        }
                                    }}
                                >
                                    <FloppyDiskIcon size={15} />
                                    {reorderModelsState.isLoading
                                        ? "Saving..."
                                        : "Save priority"}
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {isOrderedModelsLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <Skeleton key={index} className="h-14 rounded-sm" />
                            ))
                        ) : draftedModels.length === 0 ? (
                            <EmptyState
                                compact
                                title="No model priorities yet"
                                description="Add a provider selection to generate routing entries and organize model priority."
                                className="border-none bg-transparent"
                            />
                        ) : (
                            <ModelPriorityList
                                models={draftedModels}
                                onReorder={setDraftedModels}
                            />
                        )}
                    </CardContent>
                </Card>
            ) : null}

            {activeTab === "connect" ? (
                <ConnectClientsPanel apiKey={apiKey.key} />
            ) : null}

            {confirmRemoveSelection && (
                <ConfirmModal
                    title="Remove Provider Selection"
                    description={`Remove "${confirmRemoveSelection.name}" from this API key? Model routing statistics for this selection will be deleted.`}
                    confirmLabel="Remove"
                    isLoading={removeSelectionState.isLoading}
                    onConfirm={async () => {
                        try {
                            await removeSelection({
                                apiKeyId,
                                selectionId: confirmRemoveSelection.id,
                            }).unwrap();
                            toast.success("Provider removed");
                            setConfirmRemoveSelection(null);
                        } catch (err: any) {
                            toast.error(
                                err?.data?.message || "Could not remove provider",
                            );
                        }
                    }}
                    onCancel={() => setConfirmRemoveSelection(null)}
                />
            )}
        </>
    );
}
