import React, { useMemo, useState } from "react";
import { CheckCircleIcon, PlayIcon, PowerIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
    useSelectApiKeyProviderModelsMutation,
    useTestApiKeyProviderSelectionMutation,
} from "@/shared/store/features/apikeys/apikeysApi";
import { useGetProviderModelsQuery } from "@/shared/store/features/providers/providersApi";
import type { ModelTestResult } from "@/shared/types/entities";

interface ProviderModelConfiguratorProps {
    apiKeyId: string;
    selectionId: string;
    providerId: string;
    selectedModels: any[];
    updateModelStatus: any;
    pendingModelStatusKey: string | null;
    onPendingModelStatusKeyChange: (key: string | null) => void;
}

export function ProviderModelConfigurator({
    apiKeyId,
    selectionId,
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
    const [testSelection] = useTestApiKeyProviderSelectionMutation();
    const [testingModelId, setTestingModelId] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<
        Record<string, ModelTestResult>
    >({});

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
            {providerModels.length === 0 ? (
                <div className="md:col-span-2">
                    <EmptyState
                        compact
                        title="No models available"
                        description="This provider has no models to enable for routing yet."
                    />
                </div>
            ) : null}
            {providerModels.map((model) => {
                const selected = selectedById.get(model.id);
                const active = selected?.active ?? false;
                const rowKey = `${providerId}:${model.id}`;
                const modelTest = testResults[model.id];
                const isTesting = testingModelId === model.id;

                return (
                    <div
                        key={model.id}
                        className="grid gap-3 rounded-md bg-(--color-bg-input) p-3"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h4 className="truncate font-medium">
                                    {model.name}
                                </h4>
                                <p className="truncate font-mono text-xs text-(--color-text-muted)">
                                    {model.code}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    disabled={testingModelId !== null}
                                    onClick={async () => {
                                        setTestingModelId(model.id);
                                        try {
                                            const res = await testSelection({
                                                apiKeyId,
                                                selectionId,
                                                modelId: model.id,
                                            }).unwrap();
                                            setTestResults((prev) => ({
                                                ...prev,
                                                [model.id]: res,
                                            }));
                                            if (res.success) {
                                                toast.success(
                                                    `${model.code} OK (${res.latencyMs}ms)`,
                                                );
                                            } else {
                                                toast.error(
                                                    res.error ||
                                                        `${model.code} test failed`,
                                                );
                                            }
                                        } catch (err: any) {
                                            toast.error(
                                                err?.data?.message ||
                                                    "Could not test model",
                                            );
                                        } finally {
                                            setTestingModelId(null);
                                        }
                                    }}
                                >
                                    <PlayIcon size={13} weight="fill" />
                                    {isTesting ? "..." : "Test"}
                                </Button>
                                <Button
                                    type="button"
                                    variant={active ? "danger" : "success"}
                                    size="sm"
                                    title={
                                        active
                                            ? "Disable model"
                                            : "Enable model"
                                    }
                                    disabled={
                                        selectModelsState.isLoading ||
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
                                            toast.success(
                                                "Model routing updated",
                                            );
                                        } catch {
                                            toast.error(
                                                "Could not update model routing",
                                            );
                                        } finally {
                                            onPendingModelStatusKeyChange(null);
                                        }
                                    }}
                                    aria-label={
                                        active
                                            ? "Disable model"
                                            : "Enable model"
                                    }
                                >
                                    {active ? (
                                        <CheckCircleIcon
                                            size={16}
                                            weight="fill"
                                        />
                                    ) : (
                                        <PowerIcon size={16} />
                                    )}{" "}
                                    {active ? "Disable" : "Enable"}
                                </Button>
                            </div>
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
                        {modelTest && (
                            <p
                                className={`truncate font-mono text-xs ${
                                    modelTest.success
                                        ? "text-(--color-status-success)"
                                        : "text-(--color-status-error)"
                                }`}
                                title={
                                    modelTest.success
                                        ? modelTest.reply
                                        : modelTest.error
                                }
                            >
                                {modelTest.success
                                    ? `OK • ${modelTest.latencyMs}ms${modelTest.reply ? ` • ${modelTest.reply}` : ""}`
                                    : `Failed (${modelTest.latencyMs}ms): ${modelTest.error}`}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
