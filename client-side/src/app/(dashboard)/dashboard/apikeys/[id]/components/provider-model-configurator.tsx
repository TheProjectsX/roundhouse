import React, { useMemo } from "react";
import { CheckCircleIcon, PowerIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
    useDeselectApiKeyProviderModelsMutation,
    useGetProviderModelsQuery,
    useSelectApiKeyProviderModelsMutation,
} from "@/shared/store/features/api/roundhouseApi";

interface ProviderModelConfiguratorProps {
    apiKeyId: string;
    providerId: string;
    selectedModels: any[];
    updateModelStatus: any;
    pendingModelStatusKey: string | null;
    onPendingModelStatusKeyChange: (key: string | null) => void;
}

export function ProviderModelConfigurator({
    apiKeyId,
    providerId,
    selectedModels,
    updateModelStatus,
    pendingModelStatusKey,
    onPendingModelStatusKeyChange,
}: ProviderModelConfiguratorProps) {
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
                const rowKey = `${providerId}:${model.id}`;
                
                return (
                    <div
                        key={model.id}
                        className="grid gap-3 rounded-md bg-(--color-bg-input) p-3"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h4 className="truncate font-medium">
                                    {model.name}
                                </h4>
                                <p className="truncate font-mono text-xs text-(--color-text-muted)">
                                    {model.code}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant={active ? "danger" : "success"}
                                size="sm"
                                title={active ? "Disable model" : "Enable model"}
                                disabled={
                                    selectModelsState.isLoading ||
                                    deselectModelsState.isLoading ||
                                    pendingModelStatusKey === rowKey
                                }
                                onClick={async () => {
                                    onPendingModelStatusKeyChange(rowKey);
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
                                        toast.success("Model selection updated");
                                    } catch {
                                        toast.error("Could not update model selection");
                                    } finally {
                                        onPendingModelStatusKeyChange(null);
                                    }
                                }}
                                aria-label={active ? "Disable model" : "Enable model"}
                            >
                                {active ? (
                                    <CheckCircleIcon size={16} weight="fill" />
                                ) : (
                                    <PowerIcon size={16} />
                                )}{" "}
                                {active ? "Disable" : "Enable"}
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(model.bestFor?.length
                                ? model.bestFor
                                : ["General"]
                            ).map((item: string) => (
                                <Badge key={item}>{item}</Badge>
                            ))}
                            {model.thinking ? <Badge>Thinking</Badge> : null}
                        </div>
                        {selected && (
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
                        )}
                    </div>
                );
            })}
        </div>
    );
}
