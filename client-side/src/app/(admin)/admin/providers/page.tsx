"use client";

import { useState } from "react";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
    useCreateAdminProviderMutation,
    useDeleteAdminProviderMutation,
    useGetAdminProvidersQuery,
    useUpdateAdminProviderStatusMutation,
} from "@/shared/store/features/admin/adminApi";
import { useUpdateCustomProviderMutation } from "@/shared/store/features/providers/providersApi";
import { ContentStatus } from "@/shared/types/enums";
import { CreateProviderModal } from "./components/create-provider-modal";
import { EditProviderModal } from "./components/edit-provider-modal";
import { ProviderCard } from "./components/provider-card";

export default function AdminProvidersPage() {
    const { data: providers = [], isLoading } = useGetAdminProvidersQuery();
    const [showCreate, setShowCreate] = useState(false);
    const [editingProvider, setEditingProvider] = useState<any>(null);
    const [expandedProviderId, setExpandedProviderId] = useState<string | null>(
        null,
    );

    const [createProvider, createState] = useCreateAdminProviderMutation();
    const [updateProvider, updateState] = useUpdateCustomProviderMutation();
    const [updateStatus, updateStatusState] =
        useUpdateAdminProviderStatusMutation();
    const [deleteProvider, deleteState] = useDeleteAdminProviderMutation();

    const handleUpdateStatus = async (id: string, status: ContentStatus) => {
        try {
            await updateStatus({ id, status }).unwrap();
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
                title="Global Providers"
                description="Create and manage platform provider catalogs."
                actions={
                    <Button onClick={() => setShowCreate(true)}>
                        Create Provider
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

            {editingProvider && (
                <EditProviderModal
                    provider={editingProvider}
                    onClose={() => setEditingProvider(null)}
                    updateProvider={updateProvider}
                    isLoading={updateState.isLoading}
                />
            )}

            <section className="grid gap-6">
                {isLoading
                    ? Array.from({ length: 3 }).map((_, index) => (
                          <Skeleton key={index} className="h-56 rounded-2xl" />
                      ))
                    : null}
                {!isLoading && providers.length === 0 ? (
                    <EmptyState
                        title="No providers in the global catalog"
                        description="Create a provider to start building the platform-wide provider catalog."
                    />
                ) : null}
                {!isLoading &&
                    providers.map((provider: any) => (
                    <ProviderCard
                        key={provider.id}
                        provider={provider}
                        isExpanded={expandedProviderId === provider.id}
                        onToggleExpand={() =>
                            setExpandedProviderId(
                                expandedProviderId === provider.id
                                    ? null
                                    : provider.id,
                            )
                        }
                        onStatusChange={handleUpdateStatus}
                        onEdit={() => setEditingProvider(provider)}
                        onDelete={handleDeleteProvider}
                        isUpdatingStatus={updateStatusState.isLoading}
                        isDeleting={deleteState.isLoading}
                    />
                ))}
            </section>
        </>
    );
}
