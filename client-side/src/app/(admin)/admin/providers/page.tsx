"use client";

import { StackIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import {
    useCreateAdminProviderMutation,
    useDeleteAdminProviderMutation,
    useGetAdminProvidersQuery,
    useUpdateAdminProviderStatusMutation,
} from "@/shared/store/api";
import { ContentStatus, ProviderType } from "@/shared/types/enums";

export default function AdminProvidersPage() {
    const { data: providers = [] } = useGetAdminProvidersQuery();
    const [showCreate, setShowCreate] = useState(false);
    const [createProvider, createState] = useCreateAdminProviderMutation();
    const [updateStatus, updateState] = useUpdateAdminProviderStatusMutation();
    const [deleteProvider, deleteState] = useDeleteAdminProviderMutation();

    return (
        <>
            <PageHeader
                title="Global Providers"
                description="Create and manage platform provider catalogs."
                actions={
                    <Button onClick={() => setShowCreate((value) => !value)}>
                        Create Provider
                    </Button>
                }
            />
            {showCreate ? (
                <Card>
                    <CardContent className="pt-5">
                        <form
                            className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]"
                            onSubmit={async (event) => {
                                event.preventDefault();
                                const form = new FormData(event.currentTarget);
                                const name = String(
                                    form.get("name") ?? "",
                                ).trim();
                                const baseApi = String(
                                    form.get("baseApi") ?? "",
                                ).trim();
                                const code = String(
                                    form.get("code") ?? "",
                                ).trim();
                                const description = String(
                                    form.get("description") ?? "",
                                ).trim();

                                if (!name || !baseApi) {
                                    toast.error(
                                        "Provider name and base API are required",
                                    );
                                    return;
                                }

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
                                    event.currentTarget.reset();
                                    setShowCreate(false);
                                } catch {
                                    toast.error("Could not create provider");
                                }
                            }}
                        >
                            <Input
                                name="name"
                                placeholder="Provider name"
                                required
                            />
                            <Input
                                name="baseApi"
                                type="url"
                                placeholder="https://api.example.com/v1"
                                required
                            />
                            <Input name="code" placeholder="provider-code" />
                            <div className="flex gap-2">
                                <Input
                                    name="description"
                                    placeholder="Description"
                                />
                                <Button
                                    type="submit"
                                    disabled={createState.isLoading}
                                >
                                    Create
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
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
                                    disabled={updateState.isLoading}
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
                                    variant="ghost"
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
