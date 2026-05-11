"use client";

import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle,
    Copy,
    FloppyDisk,
    Funnel,
    Gear,
    GitBranch,
    Key,
    Power,
    SlidersHorizontal,
    Stack,
    Trash,
    WarningCircle,
} from "@phosphor-icons/react";
import { use, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
    useDeselectApiKeyProviderModelsMutation,
    useGetApiKeyDetailQuery,
    useGetApiKeyModelSelectionsQuery,
    useGetKeysManagerQuery,
    useGetProviderModelsQuery,
    useGetProvidersQuery,
    useRemoveApiKeyProviderSelectionMutation,
    useReorderApiKeyModelSelectionsMutation,
    useSelectApiKeyProviderModelsMutation,
    useSelectApiKeyProviderMutation,
    useUpdateApiKeyMutation,
    useUpdateApiKeySettingsMutation,
    useUpdateApiKeyModelStatusMutation,
    useUpdateApiKeyProviderStatusMutation,
} from "@/shared/store/api";
import { routes } from "@/shared/constants/routes";
import { RoundhouseMethod } from "@/shared/types/enums";
import { formatDate, formatNumber } from "@/shared/lib/utils";
import type { ApiKeyModelSelectionListItem, ProviderSelectionDetail } from "@/shared/types/entities";

export default function ApiKeySettingsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: apiKeyId } = use(params);
    const { data: apiKey, isLoading } = useGetApiKeyDetailQuery(apiKeyId);
    const { data: providers = [] } = useGetProvidersQuery();
    const { data: keyManagers = [] } = useGetKeysManagerQuery();
    const { data: orderedModels = [] } =
        useGetApiKeyModelSelectionsQuery(apiKeyId);
    const [updateApiKey, updateApiKeyState] = useUpdateApiKeyMutation();
    const [updateSettings, updateSettingsState] =
        useUpdateApiKeySettingsMutation();
    const [selectProvider, selectProviderState] =
        useSelectApiKeyProviderMutation();
    const [removeSelection, removeSelectionState] =
        useRemoveApiKeyProviderSelectionMutation();
    const [updateProviderStatus, updateProviderStatusState] =
        useUpdateApiKeyProviderStatusMutation();
    const [updateModelStatus, updateModelStatusState] =
        useUpdateApiKeyModelStatusMutation();
    const [reorderModels, reorderModelsState] =
        useReorderApiKeyModelSelectionsMutation();

    const [draft, setDraft] = useState({
        name: "",
        active: true,
        maxIterations: 3,
        roundhouseMethod: RoundhouseMethod.EFFICIENCY,
    });
    const [expandedProviderId, setExpandedProviderId] = useState<string | null>(
        null,
    );
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
        setDraftedModels(orderedModels);
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
    const selectedProvider = availableProviders.find(
        (provider) => provider.id === providerToAdd,
    );
    const filteredSelections = (apiKey?.providers ?? []).filter((provider) => {
        const term = query.trim().toLowerCase();
        if (!term) return true;
        return [provider.name, provider.code, provider.type].some((value) =>
            String(value ?? "")
                .toLowerCase()
                .includes(term),
        );
    });
    const hasDirtySettings = Boolean(
        apiKey &&
        (draft.name !== apiKey.name ||
            draft.active !== apiKey.active ||
            draft.maxIterations !== apiKey.maxIterations ||
            draft.roundhouseMethod !== apiKey.roundhouseMethod),
    );

    if (isLoading) {
        return <SettingsSkeleton />;
    }

    if (!apiKey) {
        return (
            <Card>
                <CardContent className="flex items-start gap-3 pt-5">
                    <WarningCircle
                        size={22}
                        className="text-[var(--color-status-warning)]"
                    />
                    <div>
                        <h1 className="font-semibold">API key not found</h1>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                            This key may have been deleted or you may not have
                            access to it.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <PageHeader
                title={apiKey.name}
                description="Configure routing behavior, selected providers, active models, priorities, and provider credentials for this API key."
                actions={
                    <>
                        <Button asChild variant="secondary">
                            <Link href={routes.apiKeys}>
                                <ArrowLeft size={18} /> Back
                            </Link>
                        </Button>
                        <Button
                            disabled={
                                !hasDirtySettings ||
                                updateApiKeyState.isLoading ||
                                updateSettingsState.isLoading
                            }
                            onClick={async () => {
                                try {
                                    await updateApiKey({
                                        id: apiKey.id,
                                        body: {
                                            name: draft.name,
                                            active: draft.active,
                                        },
                                    }).unwrap();
                                    await updateSettings({
                                        id: apiKey.id,
                                        body: {
                                            maxIterations: draft.maxIterations,
                                            roundhouseMethod:
                                                draft.roundhouseMethod,
                                        },
                                    }).unwrap();
                                    toast.success("API key settings saved");
                                } catch {
                                    toast.error(
                                        "Could not save API key settings",
                                    );
                                }
                            }}
                        >
                            <FloppyDisk size={18} /> Save Changes
                        </Button>
                    </>
                }
            />

            {hasDirtySettings ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--color-status-warning)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-status-warning)_10%,transparent)] p-3 text-sm">
                    <span className="flex items-center gap-2">
                        <WarningCircle size={18} /> Unsaved changes are staged
                        locally.
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
            ) : null}

            <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
                <Card>
                    <CardHeader>
                        <h2 className="flex items-center gap-2 font-semibold">
                            <Gear size={20} /> Core Settings
                        </h2>
                        <StatusBadge status={draft.active} />
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <label className="grid gap-2 text-sm font-medium">
                            Name
                            <Input
                                value={draft.name}
                                onChange={(event) =>
                                    setDraft((value) => ({
                                        ...value,
                                        name: event.target.value,
                                    }))
                                }
                            />
                        </label>
                        <label className="grid gap-2 text-sm font-medium">
                            API key
                            <div className="flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-3">
                                <code className="min-w-0 flex-1 truncate font-mono text-sm font-semibold">
                                    {apiKey.key}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Copy API key"
                                    onClick={async () => {
                                        await navigator.clipboard.writeText(
                                            apiKey.key,
                                        );
                                        toast.success("API key copied");
                                    }}
                                >
                                    <Copy size={18} />
                                </Button>
                            </div>
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="grid gap-2 text-sm font-medium">
                                Max iterations
                                <Input
                                    type="number"
                                    min={1}
                                    value={draft.maxIterations}
                                    onChange={(event) =>
                                        setDraft((value) => ({
                                            ...value,
                                            maxIterations: Math.max(
                                                1,
                                                Number(event.target.value) || 1,
                                            ),
                                        }))
                                    }
                                />
                            </label>
                            <label className="grid gap-2 text-sm font-medium">
                                Routing method
                                <select
                                    value={draft.roundhouseMethod}
                                    onChange={(event) =>
                                        setDraft((value) => ({
                                            ...value,
                                            roundhouseMethod: event.target
                                                .value as RoundhouseMethod,
                                        }))
                                    }
                                    className="min-h-10 rounded-[var(--radius-md)] border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-3 text-sm outline-none"
                                >
                                    {Object.values(RoundhouseMethod).map(
                                        (method) => (
                                            <option key={method} value={method}>
                                                {method}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </label>
                        </div>
                        <label className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-bg-input)] p-3 text-sm font-medium">
                            Active routing
                            <input
                                type="checkbox"
                                checked={draft.active}
                                onChange={(event) =>
                                    setDraft((value) => ({
                                        ...value,
                                        active: event.target.checked,
                                    }))
                                }
                                className="size-4 accent-[var(--color-accent-primary)]"
                            />
                        </label>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div>
                            <h2 className="flex items-center gap-2 font-semibold">
                                <Stack size={20} /> Add Provider Selection
                            </h2>
                            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                                Connect one provider to this API key using one
                                or more vault keys.
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-5">
                        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-semibold">
                                        1. Choose Provider
                                    </h3>
                                    <Badge>
                                        {availableProviders.length} available
                                    </Badge>
                                </div>
                                <Input
                                    value={providerSearch}
                                    onChange={(event) =>
                                        setProviderSearch(event.target.value)
                                    }
                                    placeholder="Search providers"
                                />
                                <div className="grid max-h-[330px] gap-2 overflow-y-auto pr-1 grow">
                                    {providerMatches.map((provider) => {
                                        const selected =
                                            provider.id === providerToAdd;
                                        return (
                                            <button
                                                key={provider.id}
                                                type="button"
                                                className={`grid cursor-pointer gap-2 rounded-[var(--radius-md)] border p-3 text-left transition-colors ${
                                                    selected
                                                        ? "border-[var(--color-accent-primary)] bg-[color-mix(in_srgb,var(--color-accent-primary)_12%,transparent)]"
                                                        : "border-[var(--color-border-primary)] bg-[var(--color-bg-input)] hover:bg-[var(--color-bg-card-hover)]"
                                                }`}
                                                onClick={() =>
                                                    setProviderToAdd(
                                                        provider.id,
                                                    )
                                                }
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold">
                                                            {provider.name}
                                                        </p>
                                                        <p className="mt-1 truncate font-mono text-xs text-[var(--color-text-muted)]">
                                                            {provider.code}
                                                        </p>
                                                    </div>
                                                    {selected ? (
                                                        <CheckCircle
                                                            size={20}
                                                            weight="fill"
                                                            className="text-[var(--color-accent-primary)]"
                                                        />
                                                    ) : (
                                                        <StatusBadge
                                                            status={
                                                                provider.status
                                                            }
                                                        />
                                                    )}
                                                </div>
                                                <p className="line-clamp-2 text-xs text-[var(--color-text-secondary)]">
                                                    {provider.description ??
                                                        provider.type}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge>
                                                        {provider.type}
                                                    </Badge>
                                                    <Badge>
                                                        {
                                                            provider.activeModelsCount
                                                        }
                                                        /{provider.modelsCount}{" "}
                                                        models
                                                    </Badge>
                                                    {provider.isCustom ? (
                                                        <Badge>Custom</Badge>
                                                    ) : (
                                                        <Badge>Global</Badge>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {providerMatches.length === 0 ? (
                                        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-primary)] p-4 text-sm text-[var(--color-text-secondary)]">
                                            No unselected providers match this
                                            filter.
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-semibold">
                                        2. Attach Vault Keys
                                    </h3>
                                    <Badge>{vaultIds.length} selected</Badge>
                                </div>
                                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] p-3">
                                    {selectedProvider ? (
                                        <div className="flex items-start gap-3">
                                            <div className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--color-accent-primary)_14%,transparent)] text-[var(--color-accent-primary)]">
                                                <Stack
                                                    size={20}
                                                    weight="duotone"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <Badge className="max-w-full bg-[color-mix(in_srgb,var(--color-accent-primary)_12%,transparent)] text-[var(--color-accent-primary)]">
                                                    {selectedProvider.name}
                                                </Badge>
                                                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                                                    Models are created
                                                    automatically after
                                                    selection.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[var(--color-text-secondary)]">
                                            Select a provider to enable
                                            vault-key assignment.
                                        </p>
                                    )}
                                </div>
                                <div className="grid max-h-[258px] gap-2 overflow-y-auto pr-1">
                                    {keyManagers.map((key) => {
                                        const checked = vaultIds.includes(
                                            key.id,
                                        );
                                        return (
                                            <label
                                                key={key.id}
                                                className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border p-3 transition-colors ${
                                                    checked
                                                        ? "border-[var(--color-accent-primary)] bg-[color-mix(in_srgb,var(--color-accent-primary)_12%,transparent)]"
                                                        : "border-[var(--color-border-primary)] bg-[var(--color-bg-input)] hover:bg-[var(--color-bg-card-hover)]"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(event) => {
                                                        setVaultIds(
                                                            (current) =>
                                                                event.target
                                                                    .checked
                                                                    ? [
                                                                          ...current,
                                                                          key.id,
                                                                      ]
                                                                    : current.filter(
                                                                          (
                                                                              id,
                                                                          ) =>
                                                                              id !==
                                                                              key.id,
                                                                      ),
                                                        );
                                                    }}
                                                    className="mt-1 size-4 accent-[var(--color-accent-primary)]"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Key size={16} />
                                                        <p className="truncate text-sm font-semibold">
                                                            {key.name}
                                                        </p>
                                                        <StatusBadge
                                                            status={key.active}
                                                        />
                                                    </div>
                                                    <p className="mt-1 truncate font-mono text-xs text-[var(--color-text-muted)]">
                                                        {key.key}
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <Badge className="bg-[color-mix(in_srgb,var(--color-accent-secondary)_12%,transparent)] text-[var(--color-accent-secondary)]">
                                                            {key.provider ??
                                                                "Unassigned provider"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                    {keyManagers.length === 0 ? (
                                        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-primary)] p-4 text-sm text-[var(--color-text-secondary)]">
                                            Add provider keys in Key Vault
                                            before selecting a provider.
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 border-t border-[var(--color-border-subtle)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                Provider selection creates the provider group,
                                links selected vault keys, and seeds model
                                routing entries.
                            </p>
                            <Button
                                className="sm:min-w-40"
                                disabled={
                                    !providerToAdd ||
                                    vaultIds.length === 0 ||
                                    selectProviderState.isLoading
                                }
                                onClick={async () => {
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
                                        toast.error(
                                            "Could not select provider",
                                        );
                                    }
                                }}
                            >
                                Add Selection
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <Funnel size={20} /> Provider Configuration
                    </h2>
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Filter providers"
                        className="sm:max-w-xs"
                    />
                </div>
                {filteredSelections.map((selection) => (
                    <ProviderSelectionCard
                        key={selection.id}
                        apiKeyId={apiKeyId}
                        selection={selection}
                        expanded={expandedProviderId === selection.id}
                        onToggleExpanded={() =>
                            setExpandedProviderId((value) =>
                                value === selection.id ? null : selection.id,
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
                        updateProviderStatusPending={
                            updateProviderStatusState.isLoading
                        }
                        updateModelStatus={updateModelStatus}
                        updateModelStatusPending={
                            updateModelStatusState.isLoading
                        }
                    />
                ))}
            </section>

            <Card>
                <CardHeader>
                    <div>
                        <h2 className="flex items-center gap-2 font-semibold">
                            <SlidersHorizontal size={20} /> Model Status
                        </h2>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                            Enable or disable individual model selections
                            without removing them from the provider group.
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-3">
                    {orderedModels.map((item) => (
                        <div
                            key={item.modelSelectionId}
                            className="grid gap-3 rounded-[var(--radius-md)] bg-[var(--color-bg-input)] p-3 md:grid-cols-[1fr_auto] md:items-center"
                        >
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-medium">
                                        {item.model.name}
                                    </h3>
                                    <StatusBadge status={item.active} />
                                    <Badge>{item.provider.name}</Badge>
                                </div>
                                <p className="mt-1 truncate font-mono text-xs text-[var(--color-text-muted)]">
                                    {item.model.code}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {(item.model.bestFor?.length
                                        ? item.model.bestFor
                                        : ["General"]
                                    ).map((tag) => (
                                        <Badge key={tag}>{tag}</Badge>
                                    ))}
                                    {item.model.thinking ? (
                                        <Badge>Thinking</Badge>
                                    ) : null}
                                </div>
                            </div>
                            <Button
                                variant={item.active ? "secondary" : "primary"}
                                size="sm"
                                disabled={updateModelStatusState.isLoading}
                                onClick={async () => {
                                    try {
                                        await updateModelStatus({
                                            apiKeyId,
                                            modelId: item.model.id,
                                            active: !item.active,
                                        }).unwrap();
                                        toast.success(
                                            item.active
                                                ? "Model disabled"
                                                : "Model enabled",
                                        );
                                    } catch {
                                        toast.error(
                                            "Could not update model status",
                                        );
                                    }
                                }}
                            >
                                <Power size={16} />{" "}
                                {item.active ? "Disable" : "Enable"}
                            </Button>
                        </div>
                    ))}
                    {orderedModels.length === 0 ? (
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            No model selections yet. Add a provider selection to
                            manage model status.
                        </p>
                    ) : null}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div>
                        <h2 className="flex items-center gap-2 font-semibold mb-0.5">
                            <GitBranch size={20} /> Model Priority
                        </h2>
                        <p className="font-mono text-xs text-[var(--color-text-muted)]">
                            Change your model priority by dragging and moving the models.
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
                                    const items = draftedModels.map(
                                        (model) => ({
                                            modelSelectionId:
                                                model.modelSelectionId,
                                            priority: model.priority,
                                        }),
                                    );
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
                                <FloppyDisk size={16} />
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
                    {draftedModels.length === 0 ? (
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            No model selections yet. Add a provider selection to
                            generate model routing entries.
                        </p>
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

function ModelPriorityList({
    models,
    onReorder,
}: {
    models: ApiKeyModelSelectionListItem[];
    onReorder: (models: ApiKeyModelSelectionListItem[]) => void;
}) {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDragEnter = (e: React.DragEvent, targetId: string) => {
        if (draggedId && draggedId !== targetId) {
            setDragOverId(targetId);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (e.currentTarget === e.target) {
            setDragOverId(null);
        }
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) {
            setDraggedId(null);
            setDragOverId(null);
            return;
        }

        const draggedIndex = models.findIndex(
            (m) => m.modelSelectionId === draggedId,
        );
        const targetIndex = models.findIndex(
            (m) => m.modelSelectionId === targetId,
        );

        if (draggedIndex === -1 || targetIndex === -1) {
            setDraggedId(null);
            setDragOverId(null);
            return;
        }

        const newModels = [...models];
        const [movedItem] = newModels.splice(draggedIndex, 1);
        newModels.splice(targetIndex, 0, movedItem);

        // Update priorities based on new order
        const reorderedModels = newModels.map((model, index) => ({
            ...model,
            priority: index + 1,
        }));

        onReorder(reorderedModels);
        setDraggedId(null);
        setDragOverId(null);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };

    return (
        <div className="grid gap-2">
            {models.map((item, index) => (
                <div
                    key={item.modelSelectionId}
                    draggable
                    onDragStart={(e) =>
                        handleDragStart(e, item.modelSelectionId)
                    }
                    onDragOver={handleDragOver}
                    onDragEnter={(e) =>
                        handleDragEnter(e, item.modelSelectionId)
                    }
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, item.modelSelectionId)}
                    onDragEnd={handleDragEnd}
                    className={`grid gap-3 rounded-[var(--radius-md)] bg-[var(--color-bg-input)] p-3 md:grid-cols-[40px_1fr_auto] md:items-center cursor-move transition-all ${
                        draggedId === item.modelSelectionId
                            ? "opacity-50 scale-95"
                            : ""
                    } ${dragOverId === item.modelSelectionId ? "ring-2 ring-[var(--color-accent-primary)] scale-102" : ""}`}
                >
                    <div className="flex items-center justify-center text-[var(--color-text-muted)]">
                        <span className="text-sm font-semibold">
                            {index + 1}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-medium">{item.model.name}</h3>
                        <p className="font-mono text-xs text-[var(--color-text-muted)]">
                            {item.provider.name} / {item.model.code}
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                        <Badge>
                            {formatNumber(item.stats.successCount)} ok
                        </Badge>
                        <Badge>
                            {formatNumber(item.stats.failureCount)} fail
                        </Badge>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ProviderSelectionCard({
    apiKeyId,
    selection,
    expanded,
    onToggleExpanded,
    onRemove,
    removePending,
    updateProviderStatus,
    updateProviderStatusPending,
    updateModelStatus,
    updateModelStatusPending,
}: {
    apiKeyId: string;
    selection: ProviderSelectionDetail;
    expanded: boolean;
    onToggleExpanded: () => void;
    onRemove: () => void;
    removePending: boolean;
    updateProviderStatus: ReturnType<
        typeof useUpdateApiKeyProviderStatusMutation
    >[0];
    updateProviderStatusPending: boolean;
    updateModelStatus: ReturnType<typeof useUpdateApiKeyModelStatusMutation>[0];
    updateModelStatusPending: boolean;
}) {
    return (
        <Card>
            <CardHeader>
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{selection.name}</h3>
                        <StatusBadge status={selection.active} />
                        <Badge>{selection.type}</Badge>
                        {selection.isCustom ? (
                            <Badge>Custom</Badge>
                        ) : (
                            <Badge>Global</Badge>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {selection.description ?? selection.baseApi}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onToggleExpanded}
                    >
                        {expanded ? "Collapse" : "Configure"}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={
                            selection.active
                                ? "Disable provider selection"
                                : "Enable provider selection"
                        }
                        disabled={updateProviderStatusPending}
                        onClick={async () => {
                            try {
                                await updateProviderStatus({
                                    apiKeyId,
                                    providerId: selection.providerId,
                                    active: !selection.active,
                                }).unwrap();
                                toast.success(
                                    selection.active
                                        ? "Provider disabled"
                                        : "Provider enabled",
                                );
                            } catch {
                                toast.error("Could not update provider");
                            }
                        }}
                    >
                        <Power size={18} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove provider selection"
                        disabled={removePending}
                        onClick={onRemove}
                    >
                        <Trash size={18} />
                    </Button>
                </div>
            </CardHeader>
            {expanded ? (
                <CardContent className="grid gap-5">
                    <div className="grid gap-3 md:grid-cols-3">
                        <Metric
                            label="Vault Keys"
                            value={selection.apiKeysManagers.length}
                        />
                        <Metric
                            label="Active Models"
                            value={
                                selection.models.filter((model) => model.active)
                                    .length
                            }
                        />
                        <Metric
                            label="Total Models"
                            value={selection.models.length}
                        />
                    </div>
                    <ProviderModelConfigurator
                        apiKeyId={apiKeyId}
                        providerId={selection.providerId}
                        selectedModels={selection.models}
                        updateModelStatus={updateModelStatus}
                        updateModelStatusPending={updateModelStatusPending}
                    />
                </CardContent>
            ) : null}
        </Card>
    );
}

function ProviderModelConfigurator({
    apiKeyId,
    providerId,
    selectedModels,
    updateModelStatus,
    updateModelStatusPending,
}: {
    apiKeyId: string;
    providerId: string;
    selectedModels: ProviderSelectionDetail["models"];
    updateModelStatus: ReturnType<typeof useUpdateApiKeyModelStatusMutation>[0];
    updateModelStatusPending: boolean;
}) {
    const { data: providerModels = [], isLoading } =
        useGetProviderModelsQuery(providerId);
    const [selectModels, selectModelsState] =
        useSelectApiKeyProviderModelsMutation();
    const [deselectModels, deselectModelsState] =
        useDeselectApiKeyProviderModelsMutation();
    const selectedById = useMemo(
        () => new Map(selectedModels.map((model) => [model.id, model])),
        [selectedModels],
    );

    if (isLoading) {
        return (
            <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-28" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {providerModels.map((model) => {
                const selected = selectedById.get(model.id);
                const active = selected?.active ?? false;
                return (
                    <div
                        key={model.id}
                        className="grid gap-3 rounded-[var(--radius-md)] bg-[var(--color-bg-input)] p-3"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h4 className="truncate font-medium">
                                    {model.name}
                                </h4>
                                <p className="truncate font-mono text-xs text-[var(--color-text-muted)]">
                                    {model.code}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant={active ? "secondary" : "primary"}
                                size="sm"
                                disabled={
                                    selectModelsState.isLoading ||
                                    deselectModelsState.isLoading ||
                                    updateModelStatusPending
                                }
                                onClick={async () => {
                                    try {
                                        if (!selected) {
                                            await selectModels({
                                                apiKeyId,
                                                providerId,
                                                modelIds: [model.id],
                                            }).unwrap();
                                        } else {
                                            await updateModelStatus({
                                                apiKeyId,
                                                modelId: model.id,
                                                active: !active,
                                            }).unwrap();
                                        }
                                        toast.success(
                                            "Model selection updated",
                                        );
                                    } catch {
                                        toast.error(
                                            "Could not update model selection",
                                        );
                                    }
                                }}
                                aria-label={
                                    active ? "Disable model" : "Enable model"
                                }
                            >
                                {active ? (
                                    <CheckCircle size={16} weight="fill" />
                                ) : (
                                    <Power size={16} />
                                )}{" "}
                                {active ? "Active" : "Inactive"}
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(model.bestFor?.length
                                ? model.bestFor
                                : ["General"]
                            ).map((item) => (
                                <Badge key={item}>{item}</Badge>
                            ))}
                            {model.thinking ? <Badge>Thinking</Badge> : null}
                        </div>
                        {selected ? (
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={deselectModelsState.isLoading}
                                onClick={async () => {
                                    try {
                                        await deselectModels({
                                            apiKeyId,
                                            providerId,
                                            modelIds: [model.id],
                                        }).unwrap();
                                        toast.success("Model deselected");
                                    } catch {
                                        toast.error("Could not deselect model");
                                    }
                                }}
                            >
                                Remove from Routing
                            </Button>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-input)] p-3">
            <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
            <p className="mt-1 font-mono text-lg font-semibold">{value}</p>
        </div>
    );
}

function SettingsSkeleton() {
    return (
        <>
            <div className="flex justify-between gap-4">
                <div className="grid gap-3">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
                <Skeleton className="h-80" />
                <Skeleton className="h-80" />
            </section>
            <Skeleton className="h-96" />
        </>
    );
}
