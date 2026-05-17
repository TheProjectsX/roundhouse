"use client";

import { useState } from "react";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import {
    useCreateCustomProviderMutation,
    useDeleteCustomProviderMutation,
    useGetProvidersQuery,
    useUpdateCustomProviderStatusMutation,
} from "@/shared/store/features/providers/providersApi";
import { ContentStatus } from "@/shared/types/enums";
import type { ProviderListItem } from "@/shared/types/entities";
import { CreateProviderModal } from "./components/create-provider-modal";
import { ProviderSkeletons } from "./components/provider-skeletons";
import { ProviderCard } from "./components/provider-card";
import { ProviderModelsModal } from "./components/provider-models-modal";
import { CreateModelModal } from "./components/create-model-modal";
import { EditProviderModal } from "./components/edit-provider-modal";

export default function ProvidersPage() {
    const { data: providers = [], isLoading } = useGetProvidersQuery();
    const [showCreate, setShowCreate] = useState(false);
    const [modelProvider, setModelProvider] = useState<ProviderListItem | null>(
        null,
    );
    const [showCreateModel, setShowCreateModel] = useState(false);
    const [editProvider, setEditProvider] = useState<ProviderListItem | null>(
        null,
    );
    const [createProvider, createState] = useCreateCustomProviderMutation();
    const [updateStatus, updateState] = useUpdateCustomProviderStatusMutation();
    const [deleteProvider, deleteState] = useDeleteCustomProviderMutation();

    const userProviders = providers.filter((p) => p.isCustom);
    const globalProviders = providers.filter((p) => !p.isCustom);

    const handleUpdateStatus = async (id: string, currentStatus: ContentStatus) => {
        try {
            await updateStatus({
                id,
                status:
                    currentStatus === ContentStatus.ACTIVE
                        ? ContentStatus.INACTIVE
                        : ContentStatus.ACTIVE,
            }).unwrap();
            toast.success("Provider status updated");
        } catch {
            toast.error("Could not update provider");
        }
    };

    const handleDeleteProvider = async (id: string, name: string) => {
        if (!window.confirm(`Delete ${name}?`)) return;
        try {
            await deleteProvider(id).unwrap();
            toast.success("Provider deleted");
        } catch {
            toast.error("Could not delete provider");
        }
    };

    return (
        <>
            <PageHeader
                title="Providers"
                description="Browse global providers and manage custom providers."
                actions={
                    <Button onClick={() => setShowCreate(true)}>
                        Add Custom Provider
                    </Button>
                }
            />
            {showCreate && (
                <CreateProviderModal
                    onClose={() => setShowCreate(false)}
                    createProvider={createProvider}
                    isLoading={createState.isLoading}
                />
            )}

            {/* User Created Providers Section */}
            <div className="grid gap-6">
                <h2 className="text-lg font-semibold">Your Providers</h2>
                <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {isLoading ? <ProviderSkeletons /> : null}
                    {!isLoading && userProviders.length === 0 && (
                        <div className="col-span-full">
                            <EmptyState
                                title="No custom providers found"
                                description="Add your first custom provider to connect a private or self-managed model endpoint."
                            />
                        </div>
                    )}
                    {userProviders.map((provider) => (
                        <ProviderCard
                            key={provider.id}
                            provider={provider}
                            onViewModels={setModelProvider}
                            onAddModel={(p) => {
                                setModelProvider(p);
                                setShowCreateModel(true);
                            }}
                            onEdit={setEditProvider}
                            onDelete={handleDeleteProvider}
                            onToggleStatus={handleUpdateStatus}
                            isDeleting={deleteState.isLoading}
                            isUpdatingStatus={updateState.isLoading}
                        />
                    ))}
                </section>
            </div>

            {/* Global Providers Section */}
            <div className="mt-8 grid gap-6">
                <h2 className="text-lg font-semibold">Global Providers</h2>
                <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {isLoading && globalProviders.length === 0 ? (
                        <ProviderSkeletons />
                    ) : null}
                    {!isLoading && globalProviders.length === 0 && (
                        <div className="col-span-full">
                            <EmptyState
                                title="No global providers available"
                                description="Global providers will appear here after they are created from the admin workspace."
                            />
                        </div>
                    )}
                    {globalProviders.map((provider) => (
                        <ProviderCard
                            key={provider.id}
                            provider={provider}
                            onViewModels={setModelProvider}
                        />
                    ))}
                </section>
            </div>

            {modelProvider && !showCreateModel && (
                <ProviderModelsModal
                    provider={modelProvider}
                    onClose={() => setModelProvider(null)}
                />
            )}
            {modelProvider && showCreateModel && (
                <CreateModelModal
                    provider={modelProvider}
                    onClose={() => {
                        setModelProvider(null);
                        setShowCreateModel(false);
                    }}
                />
            )}
            {editProvider && (
                <EditProviderModal
                    provider={editProvider}
                    onClose={() => setEditProvider(null)}
                />
            )}
        </>
    );
}
