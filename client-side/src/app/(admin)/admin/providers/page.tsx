"use client";

import { useState } from "react";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
    useCreateAdminProviderMutation,
    useDeleteAdminProviderMutation,
    useGetAdminCatalogSyncStatusQuery,
    useGetAdminProvidersQuery,
    useSyncAllAdminCatalogsMutation,
    useUpdateAdminProviderStatusMutation,
} from "@/shared/store/features/admin/adminApi";
import { useUpdateCustomProviderMutation } from "@/shared/store/features/providers/providersApi";
import { contentStatusLabels } from "@/shared/lib/enum-labels";
import { ContentStatus } from "@/shared/types/enums";
import { CreateProviderModal } from "./components/create-provider-modal";
import { EditProviderModal } from "./components/edit-provider-modal";
import { ProviderCard } from "./components/provider-card";

export default function AdminProvidersPage() {
    const { data: providers = [], isLoading, isError, refetch } =
        useGetAdminProvidersQuery();
    const { data: syncStatus } = useGetAdminCatalogSyncStatusQuery();
    const [syncAllCatalogs, syncAllState] = useSyncAllAdminCatalogsMutation();
    const [showCreate, setShowCreate] = useState(false);
    const [editingProvider, setEditingProvider] = useState<any>(null);
    const [confirmDelete, setConfirmDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [confirmStatus, setConfirmStatus] = useState<{
        id: string;
        name: string;
        status: ContentStatus;
    } | null>(null);
    const [expandedProviderId, setExpandedProviderId] = useState<string | null>(
        null,
    );

    const [createProvider, createState] = useCreateAdminProviderMutation();
    const [updateProvider, updateState] = useUpdateCustomProviderMutation();
    const [updateStatus, updateStatusState] =
        useUpdateAdminProviderStatusMutation();
    const [deleteProvider, deleteState] = useDeleteAdminProviderMutation();

    const applyStatusUpdate = async (id: string, status: ContentStatus) => {
        try {
            await updateStatus({ id, status }).unwrap();
            toast.success("Provider status updated");
            setConfirmStatus(null);
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not update provider");
        }
    };

    const handleUpdateStatus = async (
        id: string,
        name: string,
        status: ContentStatus,
    ) => {
        if (
            status === ContentStatus.INACTIVE ||
            status === ContentStatus.DEPRECATED
        ) {
            setConfirmStatus({ id, name, status });
            return;
        }
        await applyStatusUpdate(id, status);
    };

    const handleDeleteProvider = async (id: string, name: string) => {
        setConfirmDelete({ id, name });
    };

    const confirmDeleteProvider = async () => {
        if (!confirmDelete) return;
        try {
            await deleteProvider(confirmDelete.id).unwrap();
            toast.success("Provider deleted");
            setConfirmDelete(null);
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not delete provider");
        }
    };

    const handleSyncAll = async () => {
        try {
            const res = await syncAllCatalogs().unwrap();
            const s = res.lastSummary;
            toast.success(
                s
                    ? `Synced ${s.providersSynced} providers (+${s.createdCount} new, ${s.updatedCount} updated, ${s.deprecatedCount} deprecated)`
                    : "Global catalog synced",
            );
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not sync global catalog");
        }
    };

    return (
        <>
            <PageHeader
                title="Global Providers"
                description="Auto-seeded platform provider catalogs with scheduled background sync."
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="secondary"
                            disabled={syncAllState.isLoading || syncStatus?.syncing}
                            onClick={handleSyncAll}
                        >
                            <ArrowsClockwiseIcon
                                size={15}
                                className={
                                    syncAllState.isLoading || syncStatus?.syncing
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                            {syncAllState.isLoading || syncStatus?.syncing
                                ? "Syncing..."
                                : "Re-sync Catalog"}
                        </Button>
                        <Button onClick={() => setShowCreate(true)}>
                            Create Provider
                        </Button>
                    </div>
                }
            />

            {syncStatus ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-(--color-border-primary) bg-(--color-bg-card) px-4 py-3 text-xs text-(--color-text-secondary)">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className="font-mono">
                            Auto-seed every {syncStatus.syncIntervalHours}h
                        </Badge>
                        <span>
                            {syncStatus.lastSyncedAt
                                ? `Last synced: ${new Date(syncStatus.lastSyncedAt).toLocaleString()}`
                                : "Initial sync pending or not yet run"}
                        </span>
                    </div>
                    {syncStatus.lastSummary ? (
                        <span className="font-mono">
                            {syncStatus.lastSummary.providersSynced} providers ·{" "}
                            +{syncStatus.lastSummary.createdCount} added ·{" "}
                            {syncStatus.lastSummary.updatedCount} updated ·{" "}
                            {syncStatus.lastSummary.deprecatedCount} deprecated
                        </span>
                    ) : null}
                </div>
            ) : null}

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

            {confirmStatus && (
                <ConfirmModal
                    title={`Mark Provider ${contentStatusLabels[confirmStatus.status]}`}
                    description={`Change global provider "${confirmStatus.name}" to ${contentStatusLabels[confirmStatus.status]}? This affects all tenant API keys routing through it.`}
                    confirmLabel={`Set ${contentStatusLabels[confirmStatus.status]}`}
                    isLoading={updateStatusState.isLoading}
                    onConfirm={() =>
                        applyStatusUpdate(confirmStatus.id, confirmStatus.status)
                    }
                    onCancel={() => setConfirmStatus(null)}
                />
            )}

            {confirmDelete && (
                <ConfirmModal
                    title="Delete Global Provider"
                    description={`Permanently delete "${confirmDelete.name}" from the global catalog?`}
                    isLoading={deleteState.isLoading}
                    onConfirm={confirmDeleteProvider}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}

            {isError ? (
                <EmptyState
                    title="Could not load global providers"
                    description="Check your admin session and retry."
                    action={
                        <Button variant="secondary" onClick={() => refetch()}>
                            Retry
                        </Button>
                    }
                />
            ) : (
                <section className="grid gap-4">
                    {isLoading
                        ? Array.from({ length: 3 }).map((_, index) => (
                              <Skeleton key={index} className="h-48 rounded-md" />
                          ))
                        : null}
                    {!isLoading && providers.length === 0 ? (
                        <EmptyState
                            title="No providers in the global catalog"
                            description="Create a provider or click Re-sync Catalog to populate the platform-wide provider catalog."
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
                                onStatusChange={(id, status) =>
                                    handleUpdateStatus(id, provider.name, status)
                                }
                                onEdit={() => setEditingProvider(provider)}
                                onDelete={handleDeleteProvider}
                                isUpdatingStatus={updateStatusState.isLoading}
                                isDeleting={deleteState.isLoading}
                            />
                        ))}
                </section>
            )}
        </>
    );
}
