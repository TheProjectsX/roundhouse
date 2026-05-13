"use client";

import { PenIcon, StackIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { Modal } from "@/shared/components/ui/modal";
import {
    useCreateAdminProviderMutation,
    useDeleteAdminProviderMutation,
    useGetAdminProvidersQuery,
    useUpdateAdminProviderStatusMutation,
    useUpdateCustomProviderMutation,
} from "@/shared/store/features/api/roundhouseApi";
import { ContentStatus, ProviderType } from "@/shared/types/enums";

export default function AdminProvidersPage() {
    const { data: providers = [] } = useGetAdminProvidersQuery();
    const [showCreate, setShowCreate] = useState(false);
    const [editingProvider, setEditingProvider] = useState<(typeof providers)[0] | null>(null);
    const [createProvider, createState] = useCreateAdminProviderMutation();
    const [updateProvider, updateState] = useUpdateCustomProviderMutation();
    const [updateStatus, updateStatusState] = useUpdateAdminProviderStatusMutation();
    const [deleteProvider, deleteState] = useDeleteAdminProviderMutation();

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
            {showCreate ? (
                <CreateAdminProviderModal
                    onClose={() => setShowCreate(false)}
                    createProvider={createProvider}
                    isLoading={createState.isLoading}
                />
            ) : null}
            {editingProvider ? (
                <EditAdminProviderModal
                    provider={editingProvider}
                    onClose={() => setEditingProvider(null)}
                    updateProvider={updateProvider}
                    isLoading={updateState.isLoading}
                />
            ) : null}
            <section className="grid gap-4">
                {providers.map((provider) => (
                    <Card key={provider.id}>
                        <CardContent className="grid gap-4 pt-5 md:grid-cols-[auto_1fr_auto] md:items-center">
                            <div className="grid size-11 place-items-center rounded-md bg-[color-mix(in_srgb,var(--color-accent-secondary)_14%,transparent)] text-(--color-accent-secondary)">
                                <StackIcon size={22} weight="duotone" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="font-semibold tracking-tight">
                                        {provider.name}
                                    </h2>
                                    <StatusBadge status={provider.status} />
                                    <Badge>{provider.type}</Badge>
                                </div>
                                <p className="mt-1 text-sm text-(--color-text-secondary)">
                                    {provider.description}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 text-right">
                                <div>
                                    <p className="font-mono text-lg font-semibold">
                                        {provider.activeModelsCount}/
                                        {provider.modelsCount}
                                    </p>
                                    <p className="text-xs text-(--color-text-muted)">
                                        active models
                                    </p>
                                </div>
                                <select
                                    value={provider.status}
                                    disabled={updateStatusState.isLoading}
                                    className="min-h-9 rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) px-2 text-xs text-(--color-text-primary) outline-none"
                                    onChange={async (event) => {
                                        try {
                                            await updateStatus({
                                                id: provider.id,
                                                status: event.target
                                                    .value as ContentStatus,
                                            }).unwrap();
                                            toast.success(
                                                "Provider status updated",
                                            );
                                        } catch {
                                            toast.error(
                                                "Could not update provider",
                                            );
                                        }
                                    }}
                                >
                                    {Object.values(ContentStatus).map(
                                        (status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ),
                                    )}
                                </select>
                                <Button
                                    variant="primary:outline"
                                    size="icon"
                                    aria-label="Edit provider"
                                    disabled={updateStatusState.isLoading}
                                    onClick={async () => {
                                        setEditingProvider(provider);
                                    }}
                                >
                                    <PenIcon size={18} />
                                </Button>

                                <Button
                                    variant="danger:outline"
                                    size="icon"
                                    aria-label="Delete provider"
                                    disabled={deleteState.isLoading}
                                    onClick={async () => {
                                        if (
                                            !window.confirm(
                                                `Delete ${provider.name}?`,
                                            )
                                        )
                                            return;
                                        try {
                                            await deleteProvider(
                                                provider.id,
                                            ).unwrap();
                                            toast.success("Provider deleted");
                                        } catch {
                                            toast.error(
                                                "Could not delete provider",
                                            );
                                        }
                                    }}
                                >
                                    <TrashIcon size={18} />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </section>
        </>
    );
}

function CreateAdminProviderModal({
    onClose,
    createProvider,
    isLoading,
}: {
    onClose: () => void;
    createProvider: ReturnType<typeof useCreateAdminProviderMutation>[0];
    isLoading: boolean;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <Modal
            onClose={onClose}
            ariaLabel="Create provider"
            showCloseButton
            className="w-full max-w-xl"
        >
            <div className="border-b border-(--color-border-primary) p-5">
                <h2 className="text-lg font-semibold">Create Provider</h2>
                <p className="mt-1 text-sm text-(--color-text-secondary)">Add a platform provider to the global catalog.</p>
            </div>
            <form
                className="grid gap-4 p-5"
                onSubmit={async (event) => {
                    event.preventDefault();
                    if (isSubmitting) return;

                    const form = new FormData(event.currentTarget);
                    const name = String(form.get("name") ?? "").trim();
                    const baseApi = String(form.get("baseApi") ?? "").trim();
                    const code = String(form.get("code") ?? "").trim();
                    const description = String(form.get("description") ?? "").trim();

                    if (!name || !baseApi) {
                        toast.error("Provider name and base API are required");
                        return;
                    }

                    setIsSubmitting(true);
                    try {
                        await createProvider({
                            name,
                            code: code || undefined,
                            description: description || undefined,
                            baseApi,
                            type: ProviderType.OPENAI,
                            status: ContentStatus.ACTIVE,
                        }).unwrap();
                        toast.success("Provider created");
                        onClose();
                    } catch {
                        toast.error("Could not create provider");
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
            >
                <Input name="name" placeholder="Provider name" required />
                <Input name="baseApi" type="url" placeholder="https://api.example.com/v1" required />
                <Input name="code" placeholder="provider-code" />
                <Input name="description" placeholder="Description" />
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isLoading || isSubmitting}>Create</Button>
                </div>
            </form>
        </Modal>
    );
}

function EditAdminProviderModal({
    provider,
    onClose,
    updateProvider,
    isLoading,
}: {
    provider: any;
    onClose: () => void;
    updateProvider: ReturnType<typeof useUpdateCustomProviderMutation>[0];
    isLoading: boolean;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <Modal
            onClose={onClose}
            ariaLabel="Edit provider"
            showCloseButton
            className="w-full max-w-xl"
        >
            <div className="border-b border-(--color-border-primary) p-5">
                <h2 className="text-lg font-semibold">Edit Provider</h2>
                <p className="mt-1 text-sm text-(--color-text-secondary)">Update provider details.</p>
            </div>
            <form
                className="grid gap-4 p-5"
                onSubmit={async (event) => {
                    event.preventDefault();
                    if (isSubmitting) return;

                    const form = new FormData(event.currentTarget);
                    const name = String(form.get("name") ?? "").trim();
                    const baseApi = String(form.get("baseApi") ?? "").trim();
                    const code = String(form.get("code") ?? "").trim();
                    const description = String(form.get("description") ?? "").trim();

                    if (!name || !baseApi) {
                        toast.error("Provider name and base API are required");
                        return;
                    }

                    setIsSubmitting(true);
                    try {
                        await updateProvider({
                            id: provider.id,
                            body: {
                                name,
                                code: code || undefined,
                                description: description || undefined,
                                baseApi,
                            },
                        }).unwrap();
                        toast.success("Provider updated");
                        onClose();
                    } catch {
                        toast.error("Could not update provider");
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
            >
                <Input name="name" placeholder="Provider name" defaultValue={provider.name} required />
                <Input name="baseApi" type="url" placeholder="https://api.example.com/v1" defaultValue={provider.baseApi} required />
                <Input name="code" placeholder="provider-code" defaultValue={provider.code || ""} />
                <Input name="description" placeholder="Description" defaultValue={provider.description || ""} />
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isLoading || isSubmitting}>Update</Button>
                </div>
            </form>
        </Modal>
    );
}