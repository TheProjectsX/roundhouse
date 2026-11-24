"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import {
    useCreateCustomProviderMutation,
    useDeleteCustomProviderMutation,
    useGetProvidersQuery,
    useTestProviderMutation,
    useUpdateCustomProviderStatusMutation,
} from "@/shared/store/features/providers/providersApi";
import { useGetKeysManagerQuery } from "@/shared/store/features/keysManager/keysManagerApi";
import { ContentStatus } from "@/shared/types/enums";
import { summarizeErrorMessage } from "@/shared/lib/utils";
import type { ProviderListItem } from "@/shared/types/entities";
import { CreateProviderModal } from "../providers/components/create-provider-modal";
import { ProviderSkeletons } from "../providers/components/provider-skeletons";
import { ProviderCard } from "../providers/components/provider-card";
import { ProviderModelsModal } from "../providers/components/provider-models-modal";
import { CreateModelModal } from "../providers/components/create-model-modal";
import { EditProviderModal } from "../providers/components/edit-provider-modal";
import { FetchModelsModal } from "../providers/components/fetch-models-modal";
import { ConnectProviderModal } from "../providers/components/connect-provider-modal";

export default function CustomProvidersPage() {
    const { data: providers = [], isLoading } = useGetProvidersQuery();
    const { data: vaultKeys = [] } = useGetKeysManagerQuery();
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [connectProvider, setConnectProvider] =
        useState<ProviderListItem | null>(null);
    const [modelProvider, setModelProvider] = useState<ProviderListItem | null>(
        null,
    );
    const [showCreateModel, setShowCreateModel] = useState(false);
    const [editProvider, setEditProvider] = useState<ProviderListItem | null>(
        null,
    );
    const [confirmDelete, setConfirmDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [fetchModelsProvider, setFetchModelsProvider] =
        useState<ProviderListItem | null>(null);

    const [createProvider, createState] = useCreateCustomProviderMutation();
    const [updateStatus, updateState] = useUpdateCustomProviderStatusMutation();
    const [deleteProvider, deleteState] = useDeleteCustomProviderMutation();
    const [testProvider] = useTestProviderMutation();
    const [testingProviderId, setTestingProviderId] = useState<string | null>(
        null,
    );

    const getVaultKeysCount = (provider: ProviderListItem) =>
        vaultKeys.filter((k) => {
            if (!k.active || !k.provider) return false;
            const hint = k.provider.toLowerCase();
            return (
                hint === provider.code.toLowerCase() ||
                hint === provider.type.toLowerCase()
            );
        }).length;

    const customProviders = useMemo(() => {
        const term = search.trim().toLowerCase();
        return providers
            .filter((p) => p.isCustom)
            .filter((provider) => {
                if (!term) return true;
                return (
                    provider.name.toLowerCase().includes(term) ||
                    provider.code.toLowerCase().includes(term) ||
                    provider.type.toLowerCase().includes(term) ||
                    (provider.description ?? "").toLowerCase().includes(term)
                );
            });
    }, [providers, search]);

    const handleUpdateStatus = async (
        id: string,
        currentStatus: ContentStatus,
    ) => {
        try {
            await updateStatus({
                id,
                status:
                    currentStatus === ContentStatus.ACTIVE
                        ? ContentStatus.INACTIVE
                        : ContentStatus.ACTIVE,
            }).unwrap();
            toast.success("Custom provider status updated");
        } catch {
            toast.error("Could not update custom provider");
        }
    };

    const handleTestProvider = async (provider: ProviderListItem) => {
        setTestingProviderId(provider.id);
        try {
            const res = await testProvider({
                providerId: provider.id,
            }).unwrap();
            if (res.success) {
                toast.success(
                    `${provider.name} OK (${res.model.code} • ${res.latencyMs}ms)`,
                );
            } else {
                toast.error(
                    `${provider.name} failed (${res.model.code}): ${summarizeErrorMessage(res.error, "Unknown error")}`,
                );
            }
        } catch (err: any) {
            toast.error(
                summarizeErrorMessage(
                    err?.data?.message,
                    "Could not test provider",
                ),
            );
        } finally {
            setTestingProviderId(null);
        }
    };

    const confirmDeleteProvider = async () => {
        if (!confirmDelete) return;
        try {
            await deleteProvider(confirmDelete.id).unwrap();
            toast.success("Custom provider deleted");
            setConfirmDelete(null);
        } catch {
            toast.error("Could not delete custom provider");
        }
    };

    return (
        <>
            <PageHeader
                title="Custom Providers"
                description="Create and manage your own private, local (Ollama/vLLM/LM Studio), or custom OpenAI-compatible endpoints."
                actions={
                    <Button onClick={() => setShowCreate(true)}>
                        <PlusIcon size={16} /> Add Custom Provider
                    </Button>
                }
            />

            <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-(--color-border-primary) bg-(--color-bg-card) p-3">
                <div className="relative w-full sm:max-w-sm">
                    <MagnifyingGlassIcon
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
                    />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search your custom providers..."
                        className="pl-9"
                    />
                </div>
                <span className="font-mono text-xs text-(--color-text-muted)">
                    {customProviders.length}{" "}
                    {customProviders.length === 1 ? "provider" : "providers"}
                </span>
            </div>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {isLoading ? <ProviderSkeletons /> : null}
                {!isLoading && customProviders.length === 0 ? (
                    <div className="col-span-full">
                        <EmptyState
                            title={
                                search
                                    ? "No matching custom providers"
                                    : "No custom providers yet"
                            }
                            description={
                                search
                                    ? "Try clearing your search filter."
                                    : "Add your first custom provider to connect a private or self-managed model endpoint."
                            }
                            action={
                                !search ? (
                                    <Button onClick={() => setShowCreate(true)}>
                                        <PlusIcon size={16} /> Add Custom Provider
                                    </Button>
                                ) : undefined
                            }
                        />
                    </div>
                ) : null}
                {customProviders.map((provider) => (
                    <ProviderCard
                        key={provider.id}
                        provider={provider}
                        vaultKeysCount={getVaultKeysCount(provider)}
                        onConnect={setConnectProvider}
                        onViewModels={setModelProvider}
                        onTest={handleTestProvider}
                        isTesting={testingProviderId === provider.id}
                        onFetchModels={setFetchModelsProvider}
                        onAddModel={(p) => {
                            setModelProvider(p);
                            setShowCreateModel(true);
                        }}
                        onEdit={setEditProvider}
                        onDelete={async (id, name) =>
                            setConfirmDelete({ id, name })
                        }
                        onToggleStatus={handleUpdateStatus}
                        isDeleting={deleteState.isLoading}
                        isUpdatingStatus={updateState.isLoading}
                    />
                ))}
            </section>

            {showCreate && (
                <CreateProviderModal
                    onClose={() => setShowCreate(false)}
                    createProvider={createProvider}
                    isLoading={createState.isLoading}
                />
            )}
            {connectProvider && (
                <ConnectProviderModal
                    provider={connectProvider}
                    onClose={() => setConnectProvider(null)}
                />
            )}
            {modelProvider && !showCreateModel && (
                <ProviderModelsModal
                    provider={modelProvider}
                    onClose={() => setModelProvider(null)}
                    onFetchModels={() => {
                        const target = modelProvider;
                        setModelProvider(null);
                        setFetchModelsProvider(target);
                    }}
                />
            )}
            {fetchModelsProvider && (
                <FetchModelsModal
                    provider={fetchModelsProvider}
                    onClose={() => setFetchModelsProvider(null)}
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
            {confirmDelete && (
                <ConfirmModal
                    title="Permanently Delete Custom Provider"
                    description={`This action is permanent and cannot be undone. Deleting "${confirmDelete.name}" will permanently delete all of its custom models, disconnect it from every Roundhouse API key, and erase its routing statistics.`}
                    confirmLabel="Permanently Delete"
                    isLoading={deleteState.isLoading}
                    onConfirm={confirmDeleteProvider}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </>
    );
}
