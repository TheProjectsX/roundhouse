import React, { useMemo, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { Button } from "@/shared/components/ui/button";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { Input } from "@/shared/components/ui/input";
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
    const [modelSearch, setModelSearch] = useState("");
    const [editingModel, setEditingModel] = useState<any>(null);
    const [confirmDelete, setConfirmDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);

    const filteredModels = useMemo(() => {
        const term = modelSearch.trim().toLowerCase();
        if (!term) return models;
        return models.filter(
            (m: any) =>
                m.name.toLowerCase().includes(term) ||
                m.code.toLowerCase().includes(term),
        );
    }, [models, modelSearch]);

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
            toast.success("Model moved to bin");
            setConfirmDelete(null);
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not move model to bin");
        }
    };

    return (
        <div className="border-t border-(--color-border-subtle) bg-(--color-bg-secondary)">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <h3 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-(--color-text-muted)">
                    Models Catalog ({filteredModels.length}/{models.length})
                </h3>
                <div className="flex items-center gap-2">
                    {models.length > 0 ? (
                        <div className="relative w-52">
                            <MagnifyingGlassIcon
                                size={14}
                                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
                            />
                            <Input
                                value={modelSearch}
                                onChange={(e) => setModelSearch(e.target.value)}
                                placeholder="Filter models..."
                                aria-label="Filter provider models"
                                className="h-8 pl-8 text-xs"
                            />
                        </div>
                    ) : null}
                    <Button size="sm" onClick={() => setShowCreate(true)}>
                        <PlusIcon size={14} weight="bold" />
                        Add Model
                    </Button>
                </div>
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
                            {filteredModels.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6">
                                        <EmptyState
                                            compact
                                            title={
                                                modelSearch
                                                    ? "No matching models"
                                                    : "No models found"
                                            }
                                            description={
                                                modelSearch
                                                    ? "Try clearing your model filter."
                                                    : "Add a model to this provider to start exposing it in the global catalog."
                                            }
                                            className="border-none bg-transparent"
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filteredModels.map((model: any) => (
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
                    title="Move Global Model to Bin"
                    description={`Move "${confirmDelete.name}" to the bin? It will become unusable across routing and tests while keeping all usage analytics. You can restore it anytime from the Bin.`}
                    confirmLabel="Move to Bin"
                    isLoading={deleteModelState.isLoading}
                    onConfirm={confirmDeleteModel}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </div>
    );
}
