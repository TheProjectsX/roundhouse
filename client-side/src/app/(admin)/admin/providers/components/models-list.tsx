import React, { useState } from "react";
import { PlusIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { Button } from "@/shared/components/ui/button";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { toast } from "sonner";
import { ContentStatus } from "@/shared/types/enums";
import {
    useCreateAdminProviderModelMutation,
    useDeleteAdminProviderModelMutation,
    useGetAdminProviderModelsQuery,
    useUpdateAdminProviderModelMutation,
    useUpdateAdminProviderModelStatusMutation,
} from "@/shared/store/features/admin/adminApi";
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
    const [confirmDelete, setConfirmDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);

    if (isLoading) {
        return (
            <div className="border-t border-(--color-border-subtle) bg-(--color-bg-secondary) p-8 text-center">
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
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not update status");
        }
    };

    const handleDeleteModel = async (modelId: string, name: string) => {
        setConfirmDelete({ id: modelId, name });
    };

    const confirmDeleteModel = async () => {
        if (!confirmDelete) return;
        try {
            await deleteModel(confirmDelete.id).unwrap();
            toast.success("Model deleted");
            setConfirmDelete(null);
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not delete model");
        }
    };

    return (
        <div className="border-t border-(--color-border-subtle) bg-(--color-bg-secondary)">
            <div className="flex items-center justify-between px-5 py-3.5">
                <h3 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-(--color-text-muted)">
                    Models Catalog ({models.length})
                </h3>
                <Button size="sm" onClick={() => setShowCreate(true)}>
                    <PlusIcon size={14} weight="bold" />
                    Add Model
                </Button>
            </div>

            <div className="px-5 pb-5">
                <div className="overflow-x-auto rounded-sm border border-(--color-border-primary) bg-(--color-bg-primary)">
                    <table className="w-full min-w-170 text-left text-sm">
                        <thead>
                            <tr className="border-b border-(--color-border-primary) bg-(--color-bg-card) font-mono text-[11px] uppercase tracking-wider text-(--color-text-muted)">
                                <th className="px-4 py-2.5 font-medium">Name</th>
                                <th className="px-4 py-2.5 font-medium">Code</th>
                                <th className="px-4 py-2.5 font-medium">Max Tokens</th>
                                <th className="px-4 py-2.5 font-medium">Efficiency</th>
                                <th className="px-4 py-2.5 font-medium">Success / Failure</th>
                                <th className="px-4 py-2.5 font-medium">Status</th>
                                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--color-border-subtle)">
                            {models.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6">
                                        <EmptyState
                                            compact
                                            title="No models found"
                                            description="Add a model to this provider to start exposing it in the global catalog."
                                            className="border-none bg-transparent"
                                        />
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

            {confirmDelete && (
                <ConfirmModal
                    title="Delete Global Model"
                    description={`Delete "${confirmDelete.name}" from this global provider catalog?`}
                    isLoading={deleteModelState.isLoading}
                    onConfirm={confirmDeleteModel}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </div>
    );
}
