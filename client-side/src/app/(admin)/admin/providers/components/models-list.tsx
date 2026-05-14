import React, { useState } from "react";
import { PlusIcon, PenIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import { cn, formatNumber } from "@/shared/lib/utils";
import { ContentStatus } from "@/shared/types/enums";
import {
    useGetAdminProviderModelsQuery,
    useCreateAdminProviderModelMutation,
    useUpdateAdminProviderModelMutation,
    useUpdateAdminProviderModelStatusMutation,
    useDeleteAdminProviderModelMutation,
} from "@/shared/store/features/api/roundhouseApi";
import { CreateModelModal } from "./create-model-modal";
import { EditModelModal } from "./edit-model-modal";
import { ModelRow } from "./model-row";

interface ModelsListProps {
    providerId: string;
}

export function ModelsList({ providerId }: ModelsListProps) {
    const { data: models = [], isLoading } =
        useGetAdminProviderModelsQuery(providerId);
    const [createModel, createModelState] =
        useCreateAdminProviderModelMutation();
    const [updateModel, updateModelState] =
        useUpdateAdminProviderModelMutation();
    const [updateStatus, updateStatusState] =
        useUpdateAdminProviderModelStatusMutation();
    const [deleteModel, deleteModelState] =
        useDeleteAdminProviderModelMutation();

    const [showCreate, setShowCreate] = useState(false);
    const [editingModel, setEditingModel] = useState<any>(null);

    if (isLoading) {
        return (
            <div className="border-t border-(--color-border-subtle) bg-[color-mix(in_srgb,var(--color-bg-primary)_40%,transparent)] p-12 text-center">
                <p className="text-sm text-(--color-text-secondary)">
                    Loading models...
                </p>
            </div>
        );
    }

    const handleUpdateStatus = async (
        modelId: string,
        status: ContentStatus,
    ) => {
        try {
            await updateStatus({ modelId, status }).unwrap();
            toast.success("Model status updated");
        } catch {
            toast.error("Could not update status");
        }
    };

    const handleDeleteModel = async (modelId: string, name: string) => {
        if (!window.confirm(`Delete ${name}?`)) return;
        try {
            await deleteModel(modelId).unwrap();
            toast.success("Model deleted");
        } catch {
            toast.error("Could not delete model");
        }
    };

    return (
        <div className="border-t border-(--color-border-subtle) bg-[color-mix(in_srgb,var(--color-bg-primary)_40%,transparent)]">
            <div className="flex items-center justify-between px-6 py-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">
                    Models Catalog ({models.length})
                </h3>
                <Button
                    size="sm"
                    className="h-8 gap-1.5 px-3 text-xs"
                    onClick={() => setShowCreate(true)}
                >
                    <PlusIcon size={14} weight="bold" />
                    Add Model
                </Button>
            </div>

            <div className="px-6 pb-6">
                <div className="overflow-hidden rounded-lg border border-(--color-border-subtle) bg-(--color-bg-secondary)">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-(--color-border-subtle) bg-[color-mix(in_srgb,var(--color-bg-primary)_30%,transparent)]">
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Name
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Code
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Max Tokens
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Efficiency
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Success / Failure
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right font-semibold text-(--color-text-secondary)">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--color-border-subtle)">
                            {models.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-8 text-center text-(--color-text-muted)"
                                    >
                                        No models found for this provider.
                                    </td>
                                </tr>
                            ) : (
                                models.map((model: any) => (
                                    <ModelRow
                                        key={model.id}
                                        model={model}
                                        onUpdateStatus={handleUpdateStatus}
                                        onEdit={() => setEditingModel(model)}
                                        onDelete={handleDeleteModel}
                                        isDeleting={deleteModelState.isLoading}
                                        isUpdatingStatus={
                                            updateStatusState.isLoading
                                        }
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showCreate && (
                <CreateModelModal
                    providerId={providerId}
                    onClose={() => setShowCreate(false)}
                    createModel={createModel}
                    isLoading={createModelState.isLoading}
                />
            )}

            {editingModel && (
                <EditModelModal
                    model={editingModel}
                    onClose={() => setEditingModel(null)}
                    updateModel={updateModel}
                    isLoading={updateModelState.isLoading}
                />
            )}
        </div>
    );
}
