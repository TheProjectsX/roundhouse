import React from "react";
import {
    CheckCircleIcon,
    KeyIcon,
    StackIcon,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";

interface AddProviderSelectionProps {
    availableProviders: any[];
    providerSearch: string;
    onProviderSearchChange: (value: string) => void;
    providerToAdd: string;
    onProviderToAddChange: (id: string) => void;
    providerMatches: any[];
    keyManagers: any[];
    vaultIds: string[];
    onVaultIdsChange: (ids: string[]) => void;
    onAdd: () => Promise<void>;
    isLoading: boolean;
}

export function AddProviderSelection({
    availableProviders,
    providerSearch,
    onProviderSearchChange,
    providerToAdd,
    onProviderToAddChange,
    providerMatches,
    keyManagers,
    vaultIds,
    onVaultIdsChange,
    onAdd,
    isLoading,
}: AddProviderSelectionProps) {
    const selectedProvider = availableProviders.find(
        (p) => p.id === providerToAdd,
    );

    return (
        <Card>
            <CardHeader>
                <div>
                    <h2 className="flex items-center gap-2 font-semibold">
                        <StackIcon size={20} /> Add Provider Selection
                    </h2>
                    <p className="mt-1 text-sm text-(--color-text-secondary)">
                        Connect one provider to this API key using one or more vault keys.
                    </p>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    {/* Step 1: Choose Provider */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold">1. Choose Provider</h3>
                            <Badge>{availableProviders.length} available</Badge>
                        </div>
                        <Input
                            value={providerSearch}
                            onChange={(e) => onProviderSearchChange(e.target.value)}
                            placeholder="Search providers"
                        />
                        <div className="grid max-h-82.5 gap-2 overflow-y-auto pr-1 grow">
                            {providerMatches.map((provider) => {
                                const selected = provider.id === providerToAdd;
                                return (
                                    <button
                                        key={provider.id}
                                        type="button"
                                        className={`grid cursor-pointer gap-2 rounded-md border p-3 text-left transition-colors ${
                                            selected
                                                ? "border-(--color-accent-primary) bg-[color-mix(in_srgb,var(--color-accent-primary)_12%,transparent)]"
                                                : "border-(--color-border-primary) bg-(--color-bg-input) hover:bg-(--color-bg-card-hover)"
                                        }`}
                                        onClick={() => onProviderToAddChange(provider.id)}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold">
                                                    {provider.name}
                                                </p>
                                                <p className="mt-1 truncate font-mono text-xs text-(--color-text-muted)">
                                                    {provider.code}
                                                </p>
                                            </div>
                                            {selected ? (
                                                <CheckCircleIcon
                                                    size={20}
                                                    weight="fill"
                                                    className="text-(--color-accent-primary)"
                                                />
                                            ) : (
                                                <StatusBadge status={provider.status} />
                                            )}
                                        </div>
                                        <p className="line-clamp-2 text-xs text-(--color-text-secondary)">
                                            {provider.description ?? provider.type}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge>{provider.type}</Badge>
                                            <Badge>
                                                {provider.activeModelsCount}/
                                                {provider.modelsCount} models
                                            </Badge>
                                            <Badge>
                                                {provider.isCustom ? "Custom" : "Global"}
                                            </Badge>
                                        </div>
                                    </button>
                                );
                            })}
                            {providerMatches.length === 0 && (
                                <div className="rounded-md border border-dashed border-(--color-border-primary) p-4 text-sm text-(--color-text-secondary)">
                                    No unselected providers match this filter.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Attach Vault Keys */}
                    <div className="grid gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold">2. Attach Vault Keys</h3>
                            <Badge>{vaultIds.length} selected</Badge>
                        </div>
                        <div className="rounded-md border border-(--color-border-primary) bg-(--color-bg-input) p-3">
                            {selectedProvider ? (
                                <div className="flex items-start gap-3">
                                    <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[color-mix(in_srgb,var(--color-accent-primary)_14%,transparent)] text-(--color-accent-primary)">
                                        <StackIcon size={20} weight="duotone" />
                                    </div>
                                    <div className="min-w-0">
                                        <Badge className="max-w-full bg-[color-mix(in_srgb,var(--color-accent-primary)_12%,transparent)] text-(--color-accent-primary)">
                                            {selectedProvider.name}
                                        </Badge>
                                        <p className="mt-1 text-xs text-(--color-text-secondary)">
                                            Models are created automatically after selection.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-(--color-text-secondary)">
                                    Select a provider to enable vault-key assignment.
                                </p>
                            )}
                        </div>
                        <div className="grid max-h-64.5 gap-2 overflow-y-auto pr-1">
                            {keyManagers.map((key) => {
                                const checked = vaultIds.includes(key.id);
                                return (
                                    <div
                                        key={key.id}
                                        className={`flex items-start gap-3 rounded-md border p-3 transition-colors ${
                                            checked
                                                ? "border-(--color-accent-primary) bg-[color-mix(in_srgb,var(--color-accent-primary)_12%,transparent)]"
                                                : "border-(--color-border-primary) bg-(--color-bg-input) hover:bg-(--color-bg-card-hover)"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            id={`vault-key-${key.id}`}
                                            onChange={(e) => {
                                                onVaultIdsChange(
                                                    e.target.checked
                                                        ? [...vaultIds, key.id]
                                                        : vaultIds.filter((id) => id !== key.id),
                                                );
                                            }}
                                            className="mt-1 size-4 cursor-pointer accent-(--color-accent-primary)"
                                        />
                                        <label
                                            htmlFor={`vault-key-${key.id}`}
                                            className="min-w-0 flex-1 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                <KeyIcon size={16} />
                                                <p className="truncate text-sm font-semibold">
                                                    {key.name}
                                                </p>
                                                <StatusBadge status={key.active} />
                                            </div>
                                            <p className="mt-1 truncate font-mono text-xs text-(--color-text-muted)">
                                                {key.key}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <Badge className="bg-[color-mix(in_srgb,var(--color-accent-secondary)_12%,transparent)] text-(--color-accent-secondary)">
                                                    {key.provider ?? "Unassigned provider"}
                                                </Badge>
                                            </div>
                                        </label>
                                    </div>
                                );
                            })}
                            {keyManagers.length === 0 && (
                                <div className="rounded-md border border-dashed border-(--color-border-primary) p-4 text-sm text-(--color-text-secondary)">
                                    Add provider keys in Key Vault before selecting a provider.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-(--color-border-subtle) pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-(--color-text-secondary)">
                        Provider selection creates the provider group, links selected vault keys, and seeds model routing entries.
                    </p>
                    <Button
                        className="sm:min-w-40"
                        disabled={!providerToAdd || vaultIds.length === 0 || isLoading}
                        onClick={onAdd}
                    >
                        Add Selection
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
