"use client";

import { CheckCircle, Circle, Pencil, Plug, Plus, Stack, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { useCreateCustomProviderMutation, useCreateProviderModelMutation, useDeleteCustomProviderMutation, useDeleteProviderModelMutation, useGetProviderModelsQuery, useGetProvidersQuery, useUpdateCustomProviderMutation, useUpdateCustomProviderStatusMutation, useUpdateProviderModelMutation } from "@/shared/store/api";
import { formatDate } from "@/shared/lib/utils";
import { ContentStatus, ProviderType } from "@/shared/types/enums";
import type { ProviderListItem } from "@/shared/types/entities";

export default function ProvidersPage() {
    const { data: providers = [], isLoading } = useGetProvidersQuery();
    const [showCreate, setShowCreate] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modelProvider, setModelProvider] = useState<ProviderListItem | null>(null);
    const [showCreateModel, setShowCreateModel] = useState(false);
    const [editProvider, setEditProvider] = useState<ProviderListItem | null>(null);
    const [createProvider, createState] = useCreateCustomProviderMutation();
    const [updateProvider, updateProviderState] = useUpdateCustomProviderMutation();
    const [updateStatus, updateState] = useUpdateCustomProviderStatusMutation();
    const [deleteProvider, deleteState] = useDeleteCustomProviderMutation();

    const userProviders = providers.filter((p) => p.isCustom);
    const globalProviders = providers.filter((p) => !p.isCustom);

    return (
        <>
            <PageHeader title="Providers" description="Browse global providers and manage custom providers." actions={<Button onClick={() => setShowCreate((value) => !value)}>Add Custom Provider</Button>} />
            {showCreate ? (
                <Card>
                    <CardContent className="pt-5">
                        <form
                            className="grid gap-4"
                            onSubmit={async (event) => {
                                event.preventDefault();
                                if (isSubmitting) return;
                                
                                const form = new FormData(event.currentTarget);
                                const name = String(form.get("name") ?? "").trim();
                                const baseApi = String(form.get("baseApi") ?? "").trim();
                                const description = String(form.get("description") ?? "").trim();
                                const code = String(form.get("code") ?? "").trim();
                                const free = form.get("free") === "on";
                                const type = String(form.get("type") ?? ProviderType.CUSTOM) as ProviderType;
                                const status = String(form.get("status") ?? ContentStatus.ACTIVE) as ContentStatus;

                                if (!name || !baseApi) {
                                    toast.error("Provider name and base API are required");
                                    return;
                                }

                                setIsSubmitting(true);
                                try {
                                    await createProvider({
                                        name,
                                        code: code || undefined,
                                        baseApi,
                                        description: description || undefined,
                                        free,
                                        type,
                                        status,
                                    }).unwrap();
                                    toast.success("Custom provider created");
                                    event.currentTarget.reset();
                                    setShowCreate(false);
                                } catch {
                                    toast.error("Could not create custom provider");
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                        >
                            <div className="grid gap-3 lg:grid-cols-2">
                                <label className="grid gap-2 text-sm font-medium">
                                    Name
                                    <Input name="name" placeholder="Provider name" required />
                                </label>
                                <label className="grid gap-2 text-sm font-medium">
                                    Base API
                                    <Input name="baseApi" type="url" placeholder="https://api.example.com/v1" required />
                                </label>
                                <label className="grid gap-2 text-sm font-medium">
                                    Code
                                    <Input name="code" placeholder="provider-code" />
                                </label>
                                <label className="grid gap-2 text-sm font-medium">
                                    Description
                                    <Input name="description" placeholder="Description" />
                                </label>
                            </div>
                            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                                <label className="grid gap-2 text-sm font-medium">
                                    Type
                                    <select
                                        name="type"
                                        defaultValue={ProviderType.CUSTOM}
                                        className="min-h-10 rounded-[var(--radius-md)] border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-3 text-sm text-[var(--color-text-primary)] outline-none"
                                    >
                                        {Object.values(ProviderType).map((value) => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="grid gap-2 text-sm font-medium">
                                    Status
                                    <select
                                        name="status"
                                        defaultValue={ContentStatus.ACTIVE}
                                        className="min-h-10 rounded-[var(--radius-md)] border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-3 text-sm text-[var(--color-text-primary)] outline-none"
                                    >
                                        {Object.values(ContentStatus).map((value) => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-3 text-sm font-medium">
                                    Free provider
                                    <input name="free" type="checkbox" className="size-4 accent-[var(--color-accent-primary)]" />
                                </label>
                            </div>
                            <div className="flex justify-end border-t border-[var(--color-border-subtle)] pt-4">
                                <Button type="submit" disabled={createState.isLoading || isSubmitting}>Create Provider</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : null}
            
            {/* User Created Providers Section */}
            {userProviders.length > 0 || isLoading ? (
                <div>
                    <h2 className="mb-4 text-lg font-semibold">Your Providers</h2>
                    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {isLoading ? <ProviderSkeletons /> : null}
                        {userProviders.map((provider) => (
                            <div key={provider.id} className="grid gap-3">
                                <Card className="transition-colors hover:bg-[var(--color-bg-card-hover)]">
                                    <CardHeader>
                                        <div className="grid size-11 place-items-center rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--color-accent-primary)_14%,transparent)] text-[var(--color-accent-primary)]">
                                            <Stack size={22} weight="duotone" />
                                        </div>
                                        <StatusBadge status={provider.status} />
                                    </CardHeader>
                                    <CardContent className="grid gap-4">
                                        <div>
                                            <h2 className="font-semibold tracking-tight">{provider.name}</h2>
                                            <p className="mt-1 line-clamp-2 min-h-10 text-sm text-[var(--color-text-secondary)]">{provider.description}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge>{provider.type}</Badge>
                                            {provider.free ? <Badge>Free</Badge> : null}
                                            <Badge>Custom</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-md)] bg-[var(--color-bg-input)] p-3 text-sm">
                                            <span className="text-[var(--color-text-secondary)]">Models</span>
                                            <span className="text-right font-mono">{provider.activeModelsCount}/{provider.modelsCount}</span>
                                            <span className="text-[var(--color-text-secondary)]">Connected</span>
                                            <span className="flex justify-end text-[var(--color-status-success)]">
                                                {provider.connected ? <CheckCircle size={18} weight="fill" /> : <Circle size={18} />}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]">
                                            <span>{formatDate(provider.updatedAt)}</span>
                                            <div className="flex gap-1">
                                                <Button variant="secondary" size="sm" onClick={() => setModelProvider(provider)}>
                                                    Models
                                                </Button>
                                                <Button variant="secondary" size="sm" onClick={() => { setModelProvider(provider); setShowCreateModel(true); }}>
                                                    <Plus size={14} /> Add
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-1 border-t border-[var(--color-border-subtle)] pt-3">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Edit provider"
                                                onClick={() => setEditProvider(provider)}
                                            >
                                                <Pencil size={16} />
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                disabled={updateState.isLoading}
                                                onClick={async () => {
                                                    try {
                                                        await updateStatus({
                                                            id: provider.id,
                                                            status: provider.status === ContentStatus.ACTIVE ? ContentStatus.INACTIVE : ContentStatus.ACTIVE,
                                                        }).unwrap();
                                                        toast.success("Provider status updated");
                                                    } catch {
                                                        toast.error("Could not update provider");
                                                    }
                                                }}
                                            >
                                                <Plug size={16} /> {provider.status === ContentStatus.ACTIVE ? "Disable" : "Enable"}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Delete provider"
                                                disabled={deleteState.isLoading}
                                                onClick={async () => {
                                                    if (!window.confirm(`Delete ${provider.name}?`)) return;
                                                    try {
                                                        await deleteProvider(provider.id).unwrap();
                                                        toast.success("Provider deleted");
                                                    } catch {
                                                        toast.error("Could not delete provider");
                                                    }
                                                }}
                                            >
                                                <Trash size={16} />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </section>
                </div>
            ) : null}
            
            {/* Global Providers Section */}
            {globalProviders.length > 0 || isLoading ? (
                <div>
                    <h2 className="mb-4 text-lg font-semibold">Global Providers</h2>
                    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {isLoading && userProviders.length === 0 ? <ProviderSkeletons /> : null}
                        {globalProviders.map((provider) => (
                            <div key={provider.id} className="grid gap-3">
                                <Card className="transition-colors hover:bg-[var(--color-bg-card-hover)]">
                                    <CardHeader>
                                        <div className="grid size-11 place-items-center rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--color-accent-primary)_14%,transparent)] text-[var(--color-accent-primary)]">
                                            <Stack size={22} weight="duotone" />
                                        </div>
                                        <StatusBadge status={provider.status} />
                                    </CardHeader>
                                    <CardContent className="grid gap-4">
                                        <div>
                                            <h2 className="font-semibold tracking-tight">{provider.name}</h2>
                                            <p className="mt-1 line-clamp-2 min-h-10 text-sm text-[var(--color-text-secondary)]">{provider.description}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge>{provider.type}</Badge>
                                            {provider.free ? <Badge>Free</Badge> : null}
                                            <Badge>Global</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-md)] bg-[var(--color-bg-input)] p-3 text-sm">
                                            <span className="text-[var(--color-text-secondary)]">Models</span>
                                            <span className="text-right font-mono">{provider.activeModelsCount}/{provider.modelsCount}</span>
                                            <span className="text-[var(--color-text-secondary)]">Connected</span>
                                            <span className="flex justify-end text-[var(--color-status-success)]">
                                                {provider.connected ? <CheckCircle size={18} weight="fill" /> : <Circle size={18} />}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]">
                                            <span>{formatDate(provider.updatedAt)}</span>
                                            <Button variant="secondary" size="sm" onClick={() => setModelProvider(provider)}>
                                                Models
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </section>
                </div>
            ) : null}
            
            {modelProvider ? <ProviderModelsModal provider={modelProvider} onClose={() => { setModelProvider(null); setShowCreateModel(false); }} /> : null}
            {modelProvider && showCreateModel ? <CreateModelModal provider={modelProvider} onClose={() => { setModelProvider(null); setShowCreateModel(false); }} /> : null}
            {editProvider ? <EditProviderModal provider={editProvider} onClose={() => setEditProvider(null)} /> : null}
        </>
    );
}

function ProviderModelsModal({ provider, onClose }: { provider: ProviderListItem; onClose: () => void }) {
    const { data: models = [], isLoading } = useGetProviderModelsQuery(provider.id);
    const [editModel, setEditModel] = useState<any>(null);
    const [deleteModel, deleteModelState] = useDeleteProviderModelMutation();

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--color-bg-overlay)] p-4" role="dialog" aria-modal="true" aria-label={`${provider.name} models`}>
            <div className="grid max-h-[86dvh] w-full max-w-4xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] shadow-xl shadow-[var(--color-shadow)]">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-primary)] p-5">
                    <div>
                        <h2 className="text-lg font-semibold">{provider.name} Models</h2>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Inspect active models and their best-fit feature tags.</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
                </div>
                <div className="grid max-h-[70dvh] gap-3 overflow-y-auto p-5 md:grid-cols-2">
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-28" />)
                        : models.map((model) => (
                              <div key={model.id} className="grid gap-3 rounded-[var(--radius-md)] bg-[var(--color-bg-input)] p-3">
                                  <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                          <h3 className="truncate text-sm font-semibold">{model.name}</h3>
                                          <p className="mt-1 truncate font-mono text-xs text-[var(--color-text-muted)]">{model.code}</p>
                                      </div>
                                      <StatusBadge status={model.status} />
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                      {model.bestFor.length > 0 ? model.bestFor.map((item) => <Badge key={item}>{item}</Badge>) : <Badge>General</Badge>}
                                      {model.thinking ? <Badge>Thinking</Badge> : null}
                                      {model.efficiencyScore !== null ? <Badge>{Math.round(model.efficiencyScore * 100)}% efficient</Badge> : null}
                                  </div>
                                  {provider.isCustom ? (
                                      <div className="flex justify-end gap-1 border-t border-[var(--color-border-subtle)] pt-2">
                                          <Button
                                              variant="ghost"
                                              size="sm"
                                              aria-label="Edit model"
                                              onClick={() => setEditModel(model)}
                                          >
                                              <Pencil size={14} />
                                          </Button>
                                          <Button
                                              variant="ghost"
                                              size="sm"
                                              aria-label="Delete model"
                                              disabled={deleteModelState.isLoading}
                                              onClick={async () => {
                                                  if (!window.confirm(`Delete ${model.name}?`)) return;
                                                  try {
                                                      await deleteModel(model.id).unwrap();
                                                      toast.success("Model deleted");
                                                  } catch {
                                                      toast.error("Could not delete model");
                                                  }
                                              }}
                                          >
                                              <Trash size={14} />
                                          </Button>
                                      </div>
                                  ) : null}
                              </div>
                          ))}
                    {!isLoading && models.length === 0 ? <p className="text-sm text-[var(--color-text-secondary)]">No active models found for this provider.</p> : null}
                </div>
            </div>
            {editModel ? <EditModelModal model={editModel} onClose={() => setEditModel(null)} /> : null}
        </div>
    );
}

function CreateModelModal({ provider, onClose }: { provider: ProviderListItem; onClose: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createModel, createState] = useCreateProviderModelMutation();

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--color-bg-overlay)] p-4" role="dialog" aria-modal="true" aria-label={`Create model for ${provider.name}`}>
            <div className="grid w-full max-w-md gap-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] shadow-xl shadow-[var(--color-shadow)]">
                <div className="border-b border-[var(--color-border-primary)] p-5">
                    <h2 className="text-lg font-semibold">Create Model</h2>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Add a new model to {provider.name}</p>
                </div>
                <form
                    className="grid gap-4 p-5"
                    onSubmit={async (event) => {
                        event.preventDefault();
                        if (isSubmitting) return;

                        const form = new FormData(event.currentTarget);
                        const name = String(form.get("name") ?? "").trim();
                        const code = String(form.get("code") ?? "").trim();
                        const maxTokens = form.get("maxTokens") ? Number(form.get("maxTokens")) : undefined;
                        const bestFor = form.get("bestFor") ? String(form.get("bestFor")).split(",").map((s) => s.trim()).filter(Boolean) : undefined;

                        if (!name || !code) {
                            toast.error("Model name and code are required");
                            return;
                        }

                        setIsSubmitting(true);
                        try {
                            await createModel({
                                providerId: provider.id,
                                body: {
                                    name,
                                    code,
                                    maxTokens,
                                    bestFor,
                                },
                            }).unwrap();
                            toast.success("Model created successfully");
                            onClose();
                        } catch {
                            toast.error("Could not create model");
                        } finally {
                            setIsSubmitting(false);
                        }
                    }}
                >
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Model Name</label>
                        <Input name="name" placeholder="GPT-4 Turbo" required />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Model Code</label>
                        <Input name="code" placeholder="gpt-4-turbo" required />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Max Tokens (Optional)</label>
                        <Input name="maxTokens" type="number" placeholder="4096" />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Best For (Comma-separated, Optional)</label>
                        <Input name="bestFor" placeholder="reasoning, coding, analysis" />
                    </div>
                    <div className="flex justify-end gap-2 border-t border-[var(--color-border-subtle)] pt-4">
                        <Button variant="secondary" onClick={onClose} disabled={createState.isLoading || isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={createState.isLoading || isSubmitting}>Create Model</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EditProviderModal({ provider, onClose }: { provider: ProviderListItem; onClose: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updateProvider, updateState] = useUpdateCustomProviderMutation();

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--color-bg-overlay)] p-4" role="dialog" aria-modal="true" aria-label={`Edit provider ${provider.name}`}>
            <div className="grid w-full max-w-md gap-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] shadow-xl shadow-[var(--color-shadow)]">
                <div className="border-b border-[var(--color-border-primary)] p-5">
                    <h2 className="text-lg font-semibold">Edit Provider</h2>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Update provider details for {provider.name}</p>
                </div>
                <form
                    className="grid gap-4 p-5"
                    onSubmit={async (event) => {
                        event.preventDefault();
                        if (isSubmitting) return;

                        const form = new FormData(event.currentTarget);
                        const name = String(form.get("name") ?? "").trim();
                        const baseApi = String(form.get("baseApi") ?? "").trim();
                        const description = String(form.get("description") ?? "").trim();
                        const code = String(form.get("code") ?? "").trim();
                        const free = form.get("free") === "on";

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
                                    baseApi,
                                    description: description || undefined,
                                    free,
                                },
                            }).unwrap();
                            toast.success("Provider updated successfully");
                            onClose();
                        } catch {
                            toast.error("Could not update provider");
                        } finally {
                            setIsSubmitting(false);
                        }
                    }}
                >
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input name="name" placeholder="Provider name" defaultValue={provider.name} required />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Base API</label>
                        <Input name="baseApi" type="url" placeholder="https://api.example.com/v1" defaultValue={provider.baseApi} required />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Code</label>
                        <Input name="code" placeholder="provider-code" defaultValue={provider.code || ""} />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Description</label>
                        <Input name="description" placeholder="Description" defaultValue={provider.description || ""} />
                    </div>
                    <label className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-primary)] bg-[var(--color-bg-input)] px-3 py-2 text-sm font-medium">
                        Free provider
                        <input name="free" type="checkbox" defaultChecked={provider.free} className="size-4 accent-[var(--color-accent-primary)]" />
                    </label>
                    <div className="flex justify-end gap-2 border-t border-[var(--color-border-subtle)] pt-4">
                        <Button variant="secondary" onClick={onClose} disabled={updateState.isLoading || isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={updateState.isLoading || isSubmitting}>Update Provider</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EditModelModal({ model, onClose }: { model: any; onClose: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updateModel, updateState] = useUpdateProviderModelMutation();

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--color-bg-overlay)] p-4" role="dialog" aria-modal="true" aria-label={`Edit model ${model.name}`}>
            <div className="grid w-full max-w-md gap-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] shadow-xl shadow-[var(--color-shadow)]">
                <div className="border-b border-[var(--color-border-primary)] p-5">
                    <h2 className="text-lg font-semibold">Edit Model</h2>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Update model details for {model.name}</p>
                </div>
                <form
                    className="grid gap-4 p-5"
                    onSubmit={async (event) => {
                        event.preventDefault();
                        if (isSubmitting) return;

                        const form = new FormData(event.currentTarget);
                        const name = String(form.get("name") ?? "").trim();
                        const code = String(form.get("code") ?? "").trim();
                        const maxTokens = form.get("maxTokens") ? Number(form.get("maxTokens")) : undefined;
                        const bestFor = form.get("bestFor") ? String(form.get("bestFor")).split(",").map((s) => s.trim()).filter(Boolean) : undefined;

                        if (!name || !code) {
                            toast.error("Model name and code are required");
                            return;
                        }

                        setIsSubmitting(true);
                        try {
                            await updateModel({
                                modelId: model.id,
                                body: {
                                    name,
                                    code,
                                    maxTokens,
                                    bestFor,
                                },
                            }).unwrap();
                            toast.success("Model updated successfully");
                            onClose();
                        } catch {
                            toast.error("Could not update model");
                        } finally {
                            setIsSubmitting(false);
                        }
                    }}
                >
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Model Name</label>
                        <Input name="name" placeholder="GPT-4 Turbo" defaultValue={model.name} required />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Model Code</label>
                        <Input name="code" placeholder="gpt-4-turbo" defaultValue={model.code} required />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Max Tokens (Optional)</label>
                        <Input name="maxTokens" type="number" placeholder="4096" defaultValue={model.maxTokens || ""} />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Best For (Comma-separated, Optional)</label>
                        <Input name="bestFor" placeholder="reasoning, coding, analysis" defaultValue={model.bestFor?.join(", ") || ""} />
                    </div>
                    <div className="flex justify-end gap-2 border-t border-[var(--color-border-subtle)] pt-4">
                        <Button variant="secondary" onClick={onClose} disabled={updateState.isLoading || isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={updateState.isLoading || isSubmitting}>Update Model</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ProviderSkeletons() {
    return Array.from({ length: 8 }).map((_, index) => (
        <Card key={index}>
            <CardHeader>
                <Skeleton className="size-11" />
                <Skeleton className="h-6 w-20" />
            </CardHeader>
            <CardContent className="grid gap-4">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-10" />
                <div className="flex gap-2">
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-7 w-16" />
                </div>
                <Skeleton className="h-24" />
            </CardContent>
        </Card>
    ));
}
