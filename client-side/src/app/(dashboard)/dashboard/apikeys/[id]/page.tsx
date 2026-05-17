"use client";

import Link from "next/link";
import {
    ArrowLeftIcon,
    FloppyDiskIcon,
    FunnelIcon,
    GitBranchIcon,
    SlidersHorizontalIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { StatusBadge } from "@/shared/components/ui/badge";
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
import { routes } from "@/shared/constants/routes";
import { RoundhouseMethod } from "@/shared/types/enums";
import type { ApiKeyModelSelectionListItem } from "@/shared/types/entities";
import { SettingsSkeleton } from "./components/settings-skeleton";
import { CoreSettings } from "./components/core-settings";
import { RoutingAnalytics } from "./components/routing-analytics";
import { AddProviderSelection } from "./components/add-provider-selection";
import { ProviderSelectionCard } from "./components/provider-selection-card";
import { ModelPriorityList } from "./components/model-priority-list";

const EMPTY_ORDERED_MODELS: ApiKeyModelSelectionListItem[] = [];

export default function ApiKeySettingsPage() {
    const params = useParams();
    const apiKeyId = params.id as string;
    const { data: apiKey, isLoading } = useGetApiKeyDetailQuery(apiKeyId);
    const { data: providers = [], isLoading: isProvidersLoading } = useGetProvidersQuery();
    const { data: keyManagers = [], isLoading: isKeyManagersLoading } = useGetKeysManagerQuery();
    const { data: orderedModels = EMPTY_ORDERED_MODELS, isLoading: isOrderedModelsLoading } =
        useGetApiKeyModelSelectionsQuery(apiKeyId);

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

    const [pendingModelStatusKey, setPendingModelStatusKey] = useState<
        string | null
    >(null);
    const [pendingProviderStatusId, setPendingProviderStatusId] = useState<
        string | null
    >(null);
    const [expandedProviderId, setExpandedProviderId] = useState<string | null>(
        null,
    );

    const [draft, setDraft] = useState({
        name: "",
        active: true,
        maxIterations: 3,
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
        const providers = apiKey?.providers ?? [];
        return {
            providerSelections: providers.length,
            activeProviders: providers.filter((p) => p.active).length,
            vaultKeys: providers.reduce(
                (total, p) => total + (p.apiKeysManagers?.length ?? 0),
                0,
            ),
            activeModels: providers.reduce(
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

    if (isLoading) return <SettingsSkeleton />;

    if (!apiKey) {
        return (
            <Card>
                <CardContent className="flex items-start gap-3 pt-5">
                    <WarningCircleIcon
                        size={22}
                        className="text-(--color-status-warning)"
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

    const handleSaveSettings = async () => {
        try {
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
            toast.success("API key settings saved");
        } catch {
            toast.error("Could not save API key settings");
        }
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
        } catch {
            toast.error("Could not update API key status");
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
        } catch {
            toast.error("Could not select provider");
        }
    };

    return (
        <>
            <PageHeader
                title={apiKey.name}
                description="Configure routing behavior, selected providers, active models, priorities, and provider credentials for this API key."
                actions={
                    <>
                        <Button asChild variant="secondary">
                            <Link href={routes.apiKeys}>
                                <ArrowLeftIcon size={18} /> Back
                            </Link>
                        </Button>
                        <Button
                            disabled={
                                !hasDirtySettings ||
                                updateApiKeyState.isLoading ||
                                updateSettingsState.isLoading
                            }
                            onClick={handleSaveSettings}
                        >
                            <FloppyDiskIcon size={18} /> Save Changes
                        </Button>
                    </>
                }
            />

            {hasDirtySettings && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[color-mix(in_srgb,var(--color-status-warning)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-status-warning)_10%,transparent)] p-3 text-sm">
                    <span className="flex items-center gap-2">
                        <WarningCircleIcon size={18} /> Unsaved changes are
                        staged locally.
                    </span>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                            setDraft({
                                name: apiKey.name,
                                active: apiKey.active,
                                maxIterations: apiKey.maxIterations,
                                roundhouseMethod: apiKey.roundhouseMethod,
                            })
                        }
                    >
                        Discard
                    </Button>
                </div>
            )}

            <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr] xl:items-start">
                <div className="grid gap-5">
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
                </div>

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
            </section>

            <section className="grid gap-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <FunnelIcon size={20} /> Provider Configuration
                    </h2>
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Filter providers"
                        className="sm:max-w-xs"
                    />
                </div>
                {filteredSelections.length === 0 ? (
                    <EmptyState
                        title="No provider selections found"
                        description={
                            query.trim()
                                ? "No provider selections match the current filter."
                                : "Add a provider selection to attach vault keys and generate routing models."
                        }
                    />
                ) : null}
                {filteredSelections.map((selection) => (
                    <ProviderSelectionCard
                        key={selection.id}
                        apiKeyId={apiKeyId}
                        selection={selection}
                        expanded={expandedProviderId === selection.id}
                        onToggleExpanded={() =>
                            setExpandedProviderId((v) =>
                                v === selection.id ? null : selection.id,
                            )
                        }
                        onRemove={async () => {
                            if (
                                !window.confirm(
                                    `Remove ${selection.name} from this API key?`,
                                )
                            )
                                return;
                            try {
                                await removeSelection({
                                    apiKeyId,
                                    selectionId: selection.id,
                                }).unwrap();
                                toast.success("Provider removed");
                            } catch {
                                toast.error("Could not remove provider");
                            }
                        }}
                        removePending={removeSelectionState.isLoading}
                        updateProviderStatus={updateProviderStatus}
                        pendingProviderStatusId={pendingProviderStatusId}
                        onPendingProviderStatusIdChange={
                            setPendingProviderStatusId
                        }
                        updateModelStatus={updateModelStatus}
                        pendingModelStatusKey={pendingModelStatusKey}
                        onPendingModelStatusKeyChange={setPendingModelStatusKey}
                    />
                ))}
            </section>

            <Card>
                <CardHeader>
                    <div>
                        <h2 className="flex items-center gap-2 font-semibold mb-0.5">
                            <GitBranchIcon size={20} /> Model Priority
                        </h2>
                        <p className="font-mono text-xs text-(--color-text-muted)">
                            Change your model priority by dragging and moving
                            the models.
                        </p>
                    </div>
                    {draftedModels.length > 0 && (
                        <div className="flex gap-2">
                            <Button
                                size={"sm"}
                                disabled={
                                    JSON.stringify(draftedModels) ===
                                        JSON.stringify(orderedModels) ||
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
                                    } catch {
                                        toast.error(
                                            "Could not update priority",
                                        );
                                    }
                                }}
                            >
                                <FloppyDiskIcon size={16} />
                                {reorderModelsState.isLoading
                                    ? "Saving..."
                                    : "Save changes"}
                            </Button>
                            {JSON.stringify(draftedModels) !==
                                JSON.stringify(orderedModels) && (
                                <Button
                                    size={"sm"}
                                    variant="danger"
                                    disabled={reorderModelsState.isLoading}
                                    onClick={() =>
                                        setDraftedModels(orderedModels)
                                    }
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                    )}
                </CardHeader>
                <CardContent className="grid gap-3">
                    {isOrderedModelsLoading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} className="h-16 rounded-xl" />
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
        </>
    );
}
