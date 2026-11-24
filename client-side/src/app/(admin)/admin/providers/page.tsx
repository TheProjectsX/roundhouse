"use client";

import { useMemo, useState } from "react";
import {
    ArrowCounterClockwiseIcon,
    ArrowsClockwiseIcon,
    MagnifyingGlassIcon,
    TrashIcon,
} from "@phosphor-icons/react";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
    useCreateAdminProviderMutation,
    useDeleteAdminProviderMutation,
    useGetAdminCatalogSyncStatusQuery,
    useGetAdminModelBinQuery,
    useGetAdminProviderBinQuery,
    useGetAdminProvidersQuery,
    usePermanentDeleteAdminProviderModelMutation,
    usePermanentDeleteAdminProviderMutation,
    useRestoreAdminProviderModelMutation,
    useRestoreAdminProviderMutation,
    useSyncAllAdminCatalogsMutation,
    useUpdateAdminProviderStatusMutation,
} from "@/shared/store/features/admin/adminApi";
import { useUpdateCustomProviderMutation } from "@/shared/store/features/providers/providersApi";
import { contentStatusLabels } from "@/shared/lib/enum-labels";
import { formatDate, formatNumber } from "@/shared/lib/utils";
import { ContentStatus } from "@/shared/types/enums";
import { CreateProviderModal } from "./components/create-provider-modal";
import { EditProviderModal } from "./components/edit-provider-modal";
import { ProviderCard } from "./components/provider-card";

export default function AdminProvidersPage() {
    const { data: providers = [], isLoading, isError, refetch } =
        useGetAdminProvidersQuery();
    const { data: binnedProviders = [], isLoading: isBinProvidersLoading } =
        useGetAdminProviderBinQuery();
    const { data: binnedModels = [], isLoading: isBinModelsLoading } =
        useGetAdminModelBinQuery();
    const { data: syncStatus } = useGetAdminCatalogSyncStatusQuery();
    const [syncAllCatalogs, syncAllState] = useSyncAllAdminCatalogsMutation();
    const [viewMode, setViewMode] = useState<"catalog" | "bin">("catalog");
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [editingProvider, setEditingProvider] = useState<any>(null);
    const [confirmDelete, setConfirmDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<{
        kind: "provider" | "model";
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
    const [restoreProvider, restoreProviderState] =
        useRestoreAdminProviderMutation();
    const [permanentDeleteProvider, permanentDeleteProviderState] =
        usePermanentDeleteAdminProviderMutation();
    const [restoreModel, restoreModelState] =
        useRestoreAdminProviderModelMutation();
    const [permanentDeleteModel, permanentDeleteModelState] =
        usePermanentDeleteAdminProviderModelMutation();

    const filteredProviders = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return providers;
        return providers.filter(
            (p: any) =>
                p.name.toLowerCase().includes(term) ||
                p.code.toLowerCase().includes(term) ||
                p.type.toLowerCase().includes(term) ||
                (p.description ?? "").toLowerCase().includes(term),
        );
    }, [providers, search]);

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
            toast.success("Provider moved to bin");
            setConfirmDelete(null);
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not move provider to bin");
        }
    };

    const handleRestoreProvider = async (id: string, name: string) => {
        try {
            await restoreProvider(id).unwrap();
            toast.success(`"${name}" restored`);
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not restore provider");
        }
    };

    const handleRestoreModel = async (id: string, name: string) => {
        try {
            await restoreModel(id).unwrap();
            toast.success(`"${name}" restored`);
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not restore model");
        }
    };

    const confirmPermanentDeleteAction = async () => {
        if (!confirmPermanentDelete) return;
        try {
            if (confirmPermanentDelete.kind === "provider") {
                await permanentDeleteProvider(
                    confirmPermanentDelete.id,
                ).unwrap();
                toast.success("Provider permanently deleted");
            } else {
                await permanentDeleteModel(confirmPermanentDelete.id).unwrap();
                toast.success("Model permanently deleted");
            }
            setConfirmPermanentDelete(null);
        } catch (err: any) {
            toast.error(
                err?.data?.message || "Could not permanently delete item",
            );
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
                            variant={
                                viewMode === "catalog" ? "primary" : "secondary"
                            }
                            onClick={() => setViewMode("catalog")}
                        >
                            Catalog ({providers.length})
                        </Button>
                        <Button
                            variant={
                                viewMode === "bin" ? "primary" : "secondary"
                            }
                            onClick={() => setViewMode("bin")}
                        >
                            <TrashIcon size={15} />
                            Bin ({binnedProviders.length + binnedModels.length})
                        </Button>
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
                    title="Move Global Provider to Bin"
                    description={`Move "${confirmDelete.name}" to the bin? All of its models will become unusable until restored, while analytics and routing stats are preserved.`}
                    confirmLabel="Move to Bin"
                    isLoading={deleteState.isLoading}
                    onConfirm={confirmDeleteProvider}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}

            {confirmPermanentDelete && (
                <ConfirmModal
                    title={
                        confirmPermanentDelete.kind === "provider"
                            ? "Permanently Delete Provider"
                            : "Permanently Delete Model"
                    }
                    description={
                        confirmPermanentDelete.kind === "provider"
                            ? `This action cannot be undone. Permanently delete "${confirmPermanentDelete.name}", all of its models, connected API key selections, and historical routing stats?`
                            : `This action cannot be undone. Permanently delete model "${confirmPermanentDelete.name}", all user selections referencing it, and its historical stats?`
                    }
                    confirmLabel="Permanently Delete"
                    isLoading={
                        permanentDeleteProviderState.isLoading ||
                        permanentDeleteModelState.isLoading
                    }
                    onConfirm={confirmPermanentDeleteAction}
                    onCancel={() => setConfirmPermanentDelete(null)}
                />
            )}

            {viewMode === "bin" ? (
                <section className="grid gap-6">
                    <Card>
                        <CardContent className="grid gap-4 p-5">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-base font-semibold">
                                        Deleted Providers ({binnedProviders.length})
                                    </h2>
                                    <p className="text-xs text-(--color-text-secondary)">
                                        Soft-deleted providers keep historical analytics; restore them to re-enable routing.
                                    </p>
                                </div>
                            </div>
                            {isBinProvidersLoading ? (
                                <Skeleton className="h-24 rounded-md" />
                            ) : binnedProviders.length === 0 ? (
                                <EmptyState
                                    compact
                                    title="No providers in bin"
                                    description="Soft-deleted global providers will appear here."
                                />
                            ) : (
                                <div className="grid gap-3">
                                    {binnedProviders.map((provider: any) => (
                                        <div
                                            key={provider.id}
                                            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-(--color-border-primary) bg-(--color-bg-secondary) p-4"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-semibold">
                                                        {provider.name}
                                                    </span>
                                                    <Badge className="font-mono text-[11px]">
                                                        {provider.code}
                                                    </Badge>
                                                    <Badge className="font-mono text-[11px]">
                                                        {provider.type}
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 font-mono text-xs text-(--color-text-muted)">
                                                    Deleted {formatDate(provider.deletedAt)} ·{" "}
                                                    {formatNumber(provider.modelsCount)} models ·{" "}
                                                    {formatNumber(provider.connectedApiCount)} connected APIs ·{" "}
                                                    {formatNumber(provider.totalTokenUsage)} tokens
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled={restoreProviderState.isLoading}
                                                    onClick={() =>
                                                        handleRestoreProvider(
                                                            provider.id,
                                                            provider.name,
                                                        )
                                                    }
                                                >
                                                    <ArrowCounterClockwiseIcon size={14} />
                                                    Restore
                                                </Button>
                                                <Button
                                                    variant="danger:outline"
                                                    size="sm"
                                                    disabled={permanentDeleteProviderState.isLoading}
                                                    onClick={() =>
                                                        setConfirmPermanentDelete({
                                                            kind: "provider",
                                                            id: provider.id,
                                                            name: provider.name,
                                                        })
                                                    }
                                                >
                                                    <TrashIcon size={14} />
                                                    Delete Forever
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="grid gap-4 p-5">
                            <div>
                                <h2 className="text-base font-semibold">
                                    Deleted Models ({binnedModels.length})
                                </h2>
                                <p className="text-xs text-(--color-text-secondary)">
                                    Soft-deleted models are excluded from routing and catalogs while preserving usage statistics.
                                </p>
                            </div>
                            {isBinModelsLoading ? (
                                <Skeleton className="h-24 rounded-md" />
                            ) : binnedModels.length === 0 ? (
                                <EmptyState
                                    compact
                                    title="No models in bin"
                                    description="Soft-deleted global models will appear here."
                                />
                            ) : (
                                <div className="grid gap-3">
                                    {binnedModels.map((model: any) => (
                                        <div
                                            key={model.id}
                                            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-(--color-border-primary) bg-(--color-bg-secondary) p-4"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-semibold">
                                                        {model.name}
                                                    </span>
                                                    <code className="font-mono text-xs text-(--color-text-muted)">
                                                        {model.code}
                                                    </code>
                                                    <Badge className="font-mono text-[11px]">
                                                        {model.providerRef?.name || model.provider}
                                                    </Badge>
                                                    {model.providerRef?.deletedAt ? (
                                                        <Badge className="text-[11px] text-(--color-status-warning)">
                                                            Parent provider in bin
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                                <p className="mt-1 font-mono text-xs text-(--color-text-muted)">
                                                    Deleted {formatDate(model.deletedAt)} ·{" "}
                                                    {formatNumber(model.totalSuccessCount)} ok /{" "}
                                                    {formatNumber(model.totalFailureCount)} fail ·{" "}
                                                    {formatNumber(model.totalTokenUsage)} tokens
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled={
                                                        restoreModelState.isLoading ||
                                                        Boolean(model.providerRef?.deletedAt)
                                                    }
                                                    title={
                                                        model.providerRef?.deletedAt
                                                            ? "Restore the parent provider first"
                                                            : "Restore model"
                                                    }
                                                    onClick={() =>
                                                        handleRestoreModel(
                                                            model.id,
                                                            model.name,
                                                        )
                                                    }
                                                >
                                                    <ArrowCounterClockwiseIcon size={14} />
                                                    Restore
                                                </Button>
                                                <Button
                                                    variant="danger:outline"
                                                    size="sm"
                                                    disabled={permanentDeleteModelState.isLoading}
                                                    onClick={() =>
                                                        setConfirmPermanentDelete({
                                                            kind: "model",
                                                            id: model.id,
                                                            name: model.name,
                                                        })
                                                    }
                                                >
                                                    <TrashIcon size={14} />
                                                    Delete Forever
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            ) : isError ? (
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
                    {!isLoading && providers.length > 0 ? (
                        <div className="flex items-center justify-between gap-3 rounded-md border border-(--color-border-primary) bg-(--color-bg-card) p-3">
                            <div className="relative w-full sm:max-w-sm">
                                <MagnifyingGlassIcon
                                    size={15}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
                                />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search global providers by name, code, or type..."
                                    aria-label="Search global providers"
                                    className="pl-9"
                                />
                            </div>
                            <span className="font-mono text-xs text-(--color-text-muted)">
                                {filteredProviders.length}/{providers.length}
                            </span>
                        </div>
                    ) : null}
                    {isLoading
                        ? Array.from({ length: 3 }).map((_, index) => (
                              <Skeleton key={index} className="h-48 rounded-md" />
                          ))
                        : null}
                    {!isLoading && filteredProviders.length === 0 ? (
                        <EmptyState
                            title={
                                search
                                    ? "No matching providers"
                                    : "No providers in the global catalog"
                            }
                            description={
                                search
                                    ? "Try clearing your search filter."
                                    : "Create a provider or click Re-sync Catalog to populate the platform-wide provider catalog."
                            }
                        />
                    ) : null}
                    {!isLoading &&
                        filteredProviders.map((provider: any) => (
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
