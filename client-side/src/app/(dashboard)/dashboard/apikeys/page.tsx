"use client";

import { GitBranchIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { Input } from "@/shared/components/ui/input";
import { PageHeader } from "@/shared/components/layout/page-header";
import {
    useCreateApiKeyMutation,
    useDeleteApiKeyMutation,
    useGetApiKeysQuery,
    useUpdateApiKeyStatusMutation,
} from "@/shared/store/features/apikeys/apikeysApi";
import { CreateApiKeyModal } from "./components/create-api-key-modal";
import { ApiKeySkeletons } from "./components/api-key-skeletons";
import { ApiKeyCard } from "./components/api-key-card";

export default function ApiKeysPage() {
    const { data: apiKeys = [], isLoading, isError, refetch } = useGetApiKeysQuery();
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [createApiKey, createState] = useCreateApiKeyMutation();
    const [updateStatus, updateStatusState] = useUpdateApiKeyStatusMutation();
    const [deleteApiKey, deleteState] = useDeleteApiKeyMutation();

    useEffect(() => {
        if (!openMenuId) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpenMenuId(null);
        };
        const onPointerDown = () => setOpenMenuId(null);
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("pointerdown", onPointerDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("pointerdown", onPointerDown);
        };
    }, [openMenuId]);

    const filteredKeys = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return apiKeys;
        return apiKeys.filter(
            (item) =>
                item.name.toLowerCase().includes(term) ||
                item.roundhouseMethod.toLowerCase().includes(term),
        );
    }, [apiKeys, search]);

    const handleUpdateStatus = async (id: string, active: boolean) => {
        try {
            await updateStatus({
                id,
                active,
            }).unwrap();
            setOpenMenuId(null);
            toast.success(active ? "API key enabled" : "API key disabled");
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not update API key");
        }
    };

    const handleDeleteApiKey = async (id: string, name: string) => {
        setOpenMenuId(null);
        setConfirmDelete({ id, name });
    };

    const confirmDeleteApiKey = async () => {
        if (!confirmDelete) return;
        try {
            await deleteApiKey(confirmDelete.id).unwrap();
            toast.success("API key deleted");
            setConfirmDelete(null);
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not delete API key");
        }
    };

    return (
        <>
            <PageHeader
                title="API Keys"
                description="Manage Roundhouse API keys and their provider routing profiles."
                actions={
                    <Button onClick={() => setShowCreate(true)}>
                        Create API Key
                    </Button>
                }
            />

            {apiKeys.length > 0 ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-(--color-border-primary) bg-(--color-bg-card) p-3">
                    <div className="relative w-full sm:max-w-sm">
                        <MagnifyingGlassIcon
                            size={15}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
                        />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter API keys by name or method..."
                            aria-label="Filter API keys"
                            className="pl-9"
                        />
                    </div>
                    <span className="font-mono text-xs text-(--color-text-muted)">
                        {filteredKeys.length}/{apiKeys.length}
                    </span>
                </div>
            ) : null}

            {showCreate && (
                <CreateApiKeyModal
                    onClose={() => setShowCreate(false)}
                    createApiKey={createApiKey}
                    isLoading={createState.isLoading}
                />
            )}
            {confirmDelete && (
                <ConfirmModal
                    title="Delete API Key"
                    description={`Are you sure you want to delete "${confirmDelete.name}"? Any applications using this Roundhouse key will stop working.`}
                    isLoading={deleteState.isLoading}
                    onConfirm={confirmDeleteApiKey}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
            {isError ? (
                <EmptyState
                    title="Could not load API keys"
                    description="Check your connection or session and retry."
                    action={
                        <Button variant="secondary" onClick={() => refetch()}>
                            Retry
                        </Button>
                    }
                />
            ) : (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {isLoading ? <ApiKeySkeletons /> : null}
                    {!isLoading && filteredKeys.length === 0 ? (
                        <div className="md:col-span-2 xl:col-span-3">
                            <EmptyState
                                title={
                                    search
                                        ? "No matching API keys"
                                        : "No API keys yet"
                                }
                                description={
                                    search
                                        ? "Try clearing your search filter."
                                        : "Create your first Roundhouse API key to configure provider routing and model selection."
                                }
                                action={
                                    !search ? (
                                        <Button onClick={() => setShowCreate(true)}>
                                            Create API Key
                                        </Button>
                                    ) : undefined
                                }
                            />
                        </div>
                    ) : null}
                    {filteredKeys.map((item) => (
                        <ApiKeyCard
                            key={item.id}
                            item={item}
                            isMenuOpen={openMenuId === item.id}
                            onToggleMenu={() =>
                                setOpenMenuId((value) =>
                                    value === item.id ? null : item.id,
                                )
                            }
                            onUpdateStatus={handleUpdateStatus}
                            onDelete={handleDeleteApiKey}
                            isUpdating={updateStatusState.isLoading}
                            isDeleting={deleteState.isLoading}
                        />
                    ))}
                </section>
            )}
            <Card>
                <CardContent className="flex items-start gap-3 p-4">
                    <GitBranchIcon
                        className="mt-0.5 shrink-0 text-(--color-text-secondary)"
                        size={18}
                    />
                    <p className="text-xs leading-5 text-(--color-text-secondary)">
                        <strong className="font-semibold text-(--color-text-primary)">
                            Routing summary:
                        </strong>{" "}
                        Each key builds an eligible pool, orders by efficiency,
                        priority, or random strategy, excludes failed model
                        attempts inside the cycle, and stops at{" "}
                        <code className="font-mono">maxIterations</code>.
                    </p>
                </CardContent>
            </Card>
        </>
    );
}
