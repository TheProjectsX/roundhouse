"use client";

import React, { useMemo, useState } from "react";
import {
    CheckCircleIcon,
    CloudArrowDownIcon,
    MagnifyingGlassIcon,
    PlusIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { useGetKeysManagerQuery } from "@/shared/store/features/keysManager/keysManagerApi";
import {
    useCreateProviderModelMutation,
    useFetchUpstreamProviderModelsMutation,
} from "@/shared/store/features/providers/providersApi";
import type {
    FetchedProviderModelItem,
    ProviderListItem,
} from "@/shared/types/entities";

interface FetchModelsModalProps {
    provider: ProviderListItem;
    onClose: () => void;
}

export function FetchModelsModal({ provider, onClose }: FetchModelsModalProps) {
    const { data: vaultKeys = [] } = useGetKeysManagerQuery();
    const [fetchModels, fetchState] = useFetchUpstreamProviderModelsMutation();
    const [createModel] = useCreateProviderModelMutation();

    const defaultVaultKeyId = useMemo(() => {
        const activeKeys = vaultKeys.filter((item) => item.active);
        const match = activeKeys.find((item) => {
            const hint = item.provider?.toLowerCase();
            return (
                hint === provider.code.toLowerCase() ||
                hint === provider.type.toLowerCase()
            );
        });
        return match?.id ?? "";
    }, [vaultKeys, provider.code, provider.type]);

    const [selectedKeyId, setSelectedKeyId] = useState<string>("");
    const [manualApiKey, setManualApiKey] = useState("");
    const [search, setSearch] = useState("");
    const [fetchedModels, setFetchedModels] = useState<
        FetchedProviderModelItem[] | null
    >(null);
    const [addedCodes, setAddedCodes] = useState<Set<string>>(new Set());
    const [addingCode, setAddingCode] = useState<string | null>(null);
    const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
    const [isBulkAdding, setIsBulkAdding] = useState(false);

    const effectiveKeyId = selectedKeyId || defaultVaultKeyId;

    const filteredModels = useMemo(() => {
        if (!fetchedModels) return [];
        const term = search.trim().toLowerCase();
        if (!term) return fetchedModels;
        return fetchedModels.filter(
            (item) =>
                item.code.toLowerCase().includes(term) ||
                item.name.toLowerCase().includes(term) ||
                (item.ownedBy ?? "").toLowerCase().includes(term),
        );
    }, [fetchedModels, search]);

    const handleFetch = async () => {
        try {
            const result = await fetchModels({
                providerId: provider.id,
                apiKeyId: manualApiKey.trim()
                    ? undefined
                    : effectiveKeyId || undefined,
                apiKey: manualApiKey.trim() || undefined,
            }).unwrap();
            setFetchedModels(result);
            toast.success(`Fetched ${result.length} available models`);
        } catch (error) {
            const message =
                error &&
                typeof error === "object" &&
                "data" in error &&
                error.data &&
                typeof error.data === "object" &&
                "message" in error.data
                    ? String((error.data as { message: string }).message)
                    : "Could not fetch models from provider";
            toast.error(message);
        }
    };

    const handleAddModel = async (model: FetchedProviderModelItem) => {
        setAddingCode(model.code);
        try {
            await createModel({
                providerId: provider.id,
                body: {
                    name: model.name,
                    code: model.code,
                },
            }).unwrap();
            setAddedCodes((prev) => new Set(prev).add(model.code));
            setSelectedCodes((prev) => {
                const next = new Set(prev);
                next.delete(model.code);
                return next;
            });
            toast.success(`Added ${model.code} to ${provider.name}`);
        } catch {
            toast.error(`Could not add ${model.code}`);
        } finally {
            setAddingCode(null);
        }
    };

    const toggleSelectCode = (code: string) => {
        setSelectedCodes((prev) => {
            const next = new Set(prev);
            if (next.has(code)) {
                next.delete(code);
            } else {
                next.add(code);
            }
            return next;
        });
    };

    const selectableFiltered = useMemo(
        () =>
            filteredModels.filter(
                (m) => !m.alreadyAdded && !addedCodes.has(m.code),
            ),
        [filteredModels, addedCodes],
    );

    const handleSelectAllVisible = () => {
        setSelectedCodes(new Set(selectableFiltered.map((m) => m.code)));
    };

    const handleBulkImport = async () => {
        if (selectedCodes.size === 0 || !fetchedModels) return;
        setIsBulkAdding(true);
        let imported = 0;
        const targets = fetchedModels.filter((m) =>
            selectedCodes.has(m.code),
        );
        for (const model of targets) {
            try {
                await createModel({
                    providerId: provider.id,
                    body: { name: model.name, code: model.code },
                }).unwrap();
                imported += 1;
                setAddedCodes((prev) => new Set(prev).add(model.code));
            } catch {
                // continue importing remaining models
            }
        }
        setSelectedCodes(new Set());
        setIsBulkAdding(false);
        if (imported === 0) {
            toast.error(`Could not import any of the ${targets.length} selected models`);
        } else if (imported < targets.length) {
            toast.warning(`Imported ${imported} of ${targets.length} models`);
        } else {
            toast.success(`Imported ${imported} models`);
        }
    };

    return (
        <Modal
            onClose={onClose}
            ariaLabel={`Fetch models for ${provider.name}`}
            className="grid max-h-[88dvh] w-full max-w-3xl gap-0"
        >
            <div className="flex items-start justify-between gap-4 border-b border-(--color-border-primary) p-5">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">
                            Fetch All Models
                        </h2>
                        <Badge>{provider.type}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-(--color-text-secondary)">
                        Fetch available models from {provider.name} and select
                        which ones to add.
                    </p>
                </div>
                <Button variant="secondary" size="sm" onClick={onClose}>
                    Close
                </Button>
            </div>

            <div className="grid gap-4 border-b border-(--color-border-subtle) bg-(--color-bg-card) p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                        <label className="text-xs font-medium text-(--color-text-secondary)">
                            Vault Key (optional)
                        </label>
                        <select
                            value={effectiveKeyId}
                            onChange={(e) => setSelectedKeyId(e.target.value)}
                            disabled={Boolean(manualApiKey.trim())}
                            className="h-10 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm text-(--color-text-primary) focus:border-(--color-border-focused) focus:outline-none disabled:opacity-50"
                        >
                            <option value="">Auto-detect / No key</option>
                            {vaultKeys
                                .filter((item) => item.active)
                                .map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                        {item.provider
                                            ? ` (${item.provider})`
                                            : ""}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div className="grid gap-1.5">
                        <label className="text-xs font-medium text-(--color-text-secondary)">
                            Or paste API Key
                        </label>
                        <Input
                            type="password"
                            value={manualApiKey}
                            onChange={(e) => setManualApiKey(e.target.value)}
                            placeholder="sk-... (overrides vault key)"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-(--color-text-muted)">
                        Endpoint: <code>{provider.baseApi}</code>
                    </p>
                    <Button
                        type="button"
                        onClick={handleFetch}
                        disabled={fetchState.isLoading}
                    >
                        <CloudArrowDownIcon size={16} />
                        {fetchState.isLoading
                            ? "Fetching models..."
                            : fetchedModels
                              ? "Refresh models"
                              : "Fetch all models"}
                    </Button>
                </div>
            </div>

            <div className="grid max-h-[52dvh] gap-3 overflow-y-auto p-5">
                {fetchedModels ? (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="relative min-w-48 flex-1">
                                <MagnifyingGlassIcon
                                    size={16}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
                                />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={`Filter ${fetchedModels.length} models...`}
                                    className="pl-9"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {selectableFiltered.length > 0 ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        onClick={handleSelectAllVisible}
                                    >
                                        Select All ({selectableFiltered.length})
                                    </Button>
                                ) : null}
                                {selectedCodes.size > 0 ? (
                                    <>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                setSelectedCodes(new Set())
                                            }
                                        >
                                            Clear
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={isBulkAdding}
                                            onClick={handleBulkImport}
                                        >
                                            <PlusIcon size={14} />
                                            {isBulkAdding
                                                ? "Importing..."
                                                : `Import Selected (${selectedCodes.size})`}
                                        </Button>
                                    </>
                                ) : null}
                            </div>
                        </div>

                        {filteredModels.length === 0 ? (
                            <EmptyState
                                compact
                                title="No matching models"
                                description="Try clearing your search filter."
                            />
                        ) : (
                            <div className="grid gap-2">
                                {filteredModels.map((model) => {
                                    const isAdded =
                                        model.alreadyAdded ||
                                        addedCodes.has(model.code);
                                    const isAdding = addingCode === model.code;

                                    return (
                                        <div
                                            key={model.code}
                                            className="flex items-center justify-between gap-3 rounded-lg border border-(--color-border-primary) bg-(--color-bg-input) px-3.5 py-2.5"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                {!isAdded ? (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCodes.has(
                                                            model.code,
                                                        )}
                                                        onChange={() =>
                                                            toggleSelectCode(
                                                                model.code,
                                                            )
                                                        }
                                                        aria-label={`Select ${model.code}`}
                                                        className="size-4 shrink-0 accent-(--color-accent-primary)"
                                                    />
                                                ) : null}
                                                <div className="min-w-0">
                                                    <p className="truncate font-mono text-sm font-medium text-(--color-text-primary)">
                                                        {model.code}
                                                    </p>
                                                    {model.ownedBy ? (
                                                        <p className="text-xs text-(--color-text-muted)">
                                                            Owned by{" "}
                                                            {model.ownedBy}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                            {isAdded ? (
                                                <Badge className="shrink-0 gap-1 text-(--color-status-success)">
                                                    <CheckCircleIcon
                                                        size={14}
                                                        weight="fill"
                                                    />
                                                    Added
                                                </Badge>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    disabled={
                                                        isAdding ||
                                                        addingCode !== null
                                                    }
                                                    onClick={() =>
                                                        handleAddModel(model)
                                                    }
                                                >
                                                    <PlusIcon size={14} />
                                                    {isAdding
                                                        ? "Adding..."
                                                        : "Add model"}
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    <EmptyState
                        compact
                        title="Ready to fetch models"
                        description={`Click "Fetch all models" to load available models from this ${provider.type} provider.`}
                    />
                )}
            </div>
        </Modal>
    );
}
