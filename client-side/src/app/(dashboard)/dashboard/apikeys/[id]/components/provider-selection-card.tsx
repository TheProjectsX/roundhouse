import React, { useEffect, useState } from "react";
import { KeyIcon, PlayIcon, PowerIcon, TrashIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { formatNumber } from "@/shared/lib/utils";
import {
    useTestApiKeyProviderSelectionMutation,
    useUpdateApiKeySelectionKeysMutation,
} from "@/shared/store/features/apikeys/apikeysApi";
import type { ModelTestResult } from "@/shared/types/entities";
import { Metric } from "./metric";
import { ProviderModelConfigurator } from "./provider-model-configurator";

interface ProviderSelectionCardProps {
    apiKeyId: string;
    selection: any;
    keyManagers: any[];
    expanded: boolean;
    onToggleExpanded: () => void;
    onRemove: () => Promise<void>;
    removePending: boolean;
    updateProviderStatus: any;
    pendingProviderStatusId: string | null;
    onPendingProviderStatusIdChange: (id: string | null) => void;
    updateModelStatus: any;
    pendingModelStatusKey: string | null;
    onPendingModelStatusKeyChange: (key: string | null) => void;
}

export function ProviderSelectionCard({
    apiKeyId,
    selection,
    keyManagers,
    expanded,
    onToggleExpanded,
    onRemove,
    removePending,
    updateProviderStatus,
    pendingProviderStatusId,
    onPendingProviderStatusIdChange,
    updateModelStatus,
    pendingModelStatusKey,
    onPendingModelStatusKeyChange,
}: ProviderSelectionCardProps) {
    const [editingKeys, setEditingKeys] = useState(false);
    const [selectedVaultIds, setSelectedVaultIds] = useState<string[]>(() =>
        selection.apiKeysManagers.map((k: any) => k.id),
    );
    const [updateSelectionKeys, updateSelectionKeysState] =
        useUpdateApiKeySelectionKeysMutation();
    const [testSelection, testSelectionState] =
        useTestApiKeyProviderSelectionMutation();
    const [testResult, setTestResult] = useState<ModelTestResult | null>(null);

    useEffect(() => {
        setSelectedVaultIds(selection.apiKeysManagers.map((k: any) => k.id));
    }, [selection.apiKeysManagers]);

    const totalTokenUsage = selection.models.reduce(
        (total: number, model: any) => total + (model.stats?.tokenUsage ?? 0),
        0,
    );

    const handleSaveKeys = async () => {
        if (selectedVaultIds.length === 0) {
            toast.error("Select at least one vault key");
            return;
        }
        try {
            await updateSelectionKeys({
                apiKeyId,
                selectionId: selection.id,
                apiKeysManagerIds: selectedVaultIds,
            }).unwrap();
            setEditingKeys(false);
            toast.success("Vault keys updated");
        } catch {
            toast.error("Could not update vault keys");
        }
    };

    return (
        <Card>
            <CardHeader>
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{selection.name}</h3>
                        <StatusBadge status={selection.active} />
                        <Badge>{selection.type}</Badge>
                        <Badge>{selection.isCustom ? "Custom" : "Global"}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-(--color-text-secondary)">
                        {selection.description ?? selection.baseApi}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={testSelectionState.isLoading}
                        title="Test provider with a random active model"
                        onClick={async () => {
                            try {
                                const res = await testSelection({
                                    apiKeyId,
                                    selectionId: selection.id,
                                }).unwrap();
                                setTestResult(res);
                                if (res.success) {
                                    toast.success(
                                        `Test passed (${res.model.code} • ${res.latencyMs}ms)`,
                                    );
                                } else {
                                    toast.error(
                                        res.error || "Provider test failed",
                                    );
                                }
                            } catch (err: any) {
                                const msg =
                                    err?.data?.message ||
                                    "Could not run provider test";
                                toast.error(msg);
                            }
                        }}
                    >
                        <PlayIcon size={14} weight="fill" />
                        {testSelectionState.isLoading ? "Testing..." : "Test"}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={onToggleExpanded}>
                        {expanded ? "Collapse" : "Configure"}
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className={`${
                            selection.active
                                ? "text-(--color-status-error)"
                                : "text-(--color-status-success)"
                        } p-2`}
                        disabled={pendingProviderStatusId === selection.id}
                        onClick={async () => {
                            const nextActive = !selection.active;
                            onPendingProviderStatusIdChange(selection.id);
                            try {
                                await updateProviderStatus({
                                    apiKeyId,
                                    providerId: selection.providerId,
                                    active: nextActive,
                                }).unwrap();
                                toast.success(
                                    nextActive
                                        ? "Provider enabled"
                                        : "Provider disabled",
                                );
                            } catch {
                                toast.error("Could not update provider");
                            } finally {
                                onPendingProviderStatusIdChange(null);
                            }
                        }}
                        title={
                            selection.active
                                ? "Disable provider"
                                : "Enable provider"
                        }
                    >
                        <PowerIcon size={18} />
                    </Button>
                    <div className="ml-2 pl-2 border-l border-(--color-border-subtle)">
                        <Button
                            variant="danger:outline"
                            size="icon"
                            aria-label="Remove provider selection"
                            title="Remove provider selection"
                            disabled={removePending}
                            onClick={onRemove}
                        >
                            <TrashIcon size={16} />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            {testResult && (
                <div
                    className={`mx-5 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs ${
                        testResult.success
                            ? "border-[color-mix(in_srgb,var(--color-status-success)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-status-success)_10%,transparent)]"
                            : "border-[color-mix(in_srgb,var(--color-status-error)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-status-error)_10%,transparent)]"
                    }`}
                >
                    <div className="min-w-0">
                        <span className="font-semibold">
                            {testResult.success ? "Test Passed" : "Test Failed"}
                        </span>{" "}
                        <span className="font-mono">
                            ({testResult.model.code} • {testResult.latencyMs}ms)
                        </span>
                        {testResult.success && testResult.reply ? (
                            <span className="ml-2 text-(--color-text-secondary)">
                                Reply: {testResult.reply}
                            </span>
                        ) : null}
                        {!testResult.success && testResult.error ? (
                            <span className="ml-2 text-(--color-status-error)">
                                {testResult.error}
                            </span>
                        ) : null}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setTestResult(null)}
                    >
                        Dismiss
                    </Button>
                </div>
            )}
            {expanded && (
                <CardContent className="grid gap-5">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <Metric
                            label="Vault Keys"
                            value={selection.apiKeysManagers.length}
                        />
                        <Metric
                            label="Active Models"
                            value={
                                selection.models.filter((m: any) => m.active)
                                    .length
                            }
                        />
                        <Metric
                            label="Total Models"
                            value={selection.models.length}
                        />
                        <Metric
                            label="Token Usage"
                            value={formatNumber(totalTokenUsage)}
                        />
                    </div>

                    <div className="grid gap-3 rounded-lg border border-(--color-border-subtle) bg-(--color-bg-input) p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="flex items-center gap-2 text-sm font-semibold">
                                <KeyIcon size={16} /> Attached Vault Keys
                            </h4>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    if (editingKeys) {
                                        setSelectedVaultIds(
                                            selection.apiKeysManagers.map(
                                                (k: any) => k.id,
                                            ),
                                        );
                                    }
                                    setEditingKeys((v) => !v);
                                }}
                            >
                                {editingKeys ? "Cancel" : "Manage Vault Keys"}
                            </Button>
                        </div>

                        {!editingKeys ? (
                            <div className="flex flex-wrap gap-2">
                                {selection.apiKeysManagers.map((km: any) => (
                                    <div
                                        key={km.id}
                                        className="flex items-center gap-2 rounded-md border border-(--color-border-primary) bg-(--color-bg-card) px-3 py-1.5 text-xs"
                                    >
                                        <span className="font-medium">
                                            {km.name ?? "Vault Key"}
                                        </span>
                                        <code className="font-mono text-(--color-text-muted)">
                                            {km.maskedKey}
                                        </code>
                                        <StatusBadge status={km.active} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                <div className="grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">
                                    {keyManagers.map((km) => {
                                        const checked =
                                            selectedVaultIds.includes(km.id);
                                        return (
                                            <label
                                                key={km.id}
                                                className={`flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 text-xs transition-colors ${
                                                    checked
                                                        ? "border-(--color-accent-primary) bg-[color-mix(in_srgb,var(--color-accent-primary)_10%,transparent)]"
                                                        : "border-(--color-border-primary) bg-(--color-bg-card)"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(e) => {
                                                        setSelectedVaultIds(
                                                            e.target.checked
                                                                ? [
                                                                      ...selectedVaultIds,
                                                                      km.id,
                                                                  ]
                                                                : selectedVaultIds.filter(
                                                                      (id) =>
                                                                          id !==
                                                                          km.id,
                                                                  ),
                                                        );
                                                    }}
                                                    className="mt-0.5 size-4 accent-(--color-accent-primary)"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="truncate font-semibold">
                                                            {km.name}
                                                        </span>
                                                        <StatusBadge
                                                            status={km.active}
                                                        />
                                                    </div>
                                                    <p className="mt-0.5 truncate font-mono text-(--color-text-muted)">
                                                        {km.key}
                                                    </p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={
                                            selectedVaultIds.length === 0 ||
                                            updateSelectionKeysState.isLoading
                                        }
                                        onClick={handleSaveKeys}
                                    >
                                        {updateSelectionKeysState.isLoading
                                            ? "Saving..."
                                            : "Save Vault Keys"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <ProviderModelConfigurator
                        apiKeyId={apiKeyId}
                        selectionId={selection.id}
                        providerId={selection.providerId}
                        selectedModels={selection.models}
                        updateModelStatus={updateModelStatus}
                        pendingModelStatusKey={pendingModelStatusKey}
                        onPendingModelStatusKeyChange={
                            onPendingModelStatusKeyChange
                        }
                    />
                </CardContent>
            )}
        </Card>
    );
}
