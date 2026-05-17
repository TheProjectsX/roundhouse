import React from "react";
import { PowerIcon, TrashIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { formatNumber } from "@/shared/lib/utils";
import { Metric } from "./metric";
import { ProviderModelConfigurator } from "./provider-model-configurator";

interface ProviderSelectionCardProps {
    apiKeyId: string;
    selection: any;
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
    const totalTokenUsage = selection.models.reduce(
        (total: number, model: any) => total + (model.stats?.tokenUsage ?? 0),
        0,
    );

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
                                    nextActive ? "Provider enabled" : "Provider disabled",
                                );
                            } catch {
                                toast.error("Could not update provider");
                            } finally {
                                onPendingProviderStatusIdChange(null);
                            }
                        }}
                        title={selection.active ? "Disable provider" : "Enable provider"}
                    >
                        <PowerIcon size={20} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove provider selection"
                        title="Remove provider selection"
                        disabled={removePending}
                        onClick={onRemove}
                    >
                        <TrashIcon size={18} />
                    </Button>
                </div>
            </CardHeader>
            {expanded && (
                <CardContent className="grid gap-5">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <Metric
                            label="Vault Keys"
                            value={selection.apiKeysManagers.length}
                        />
                        <Metric
                            label="Active Models"
                            value={selection.models.filter((m: any) => m.active).length}
                        />
                        <Metric label="Total Models" value={selection.models.length} />
                        <Metric
                            label="Token Usage"
                            value={formatNumber(totalTokenUsage)}
                        />
                    </div>
                    <ProviderModelConfigurator
                        apiKeyId={apiKeyId}
                        providerId={selection.providerId}
                        selectedModels={selection.models}
                        updateModelStatus={updateModelStatus}
                        pendingModelStatusKey={pendingModelStatusKey}
                        onPendingModelStatusKeyChange={onPendingModelStatusKeyChange}
                    />
                </CardContent>
            )}
        </Card>
    );
}
