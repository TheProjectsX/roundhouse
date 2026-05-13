"use client";

import {
    CheckCircleIcon,
    CircleIcon,
    DotsThreeVerticalIcon,
    PencilIcon,
    PlugIcon,
    PlusIcon,
    StackIcon,
    TrashIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { Modal } from "@/shared/components/ui/modal";
import {
    useCreateCustomProviderMutation,
    useCreateProviderModelMutation,
    useDeleteCustomProviderMutation,
    useDeleteProviderModelMutation,
    useGetProviderModelsQuery,
    useGetProvidersQuery,
    useUpdateCustomProviderMutation,
    useUpdateCustomProviderStatusMutation,
    useUpdateProviderModelMutation,
} from "@/shared/store/api";
import { formatDate } from "@/shared/lib/utils";
import { ContentStatus, ProviderType } from "@/shared/types/enums";
import type { ProviderListItem } from "@/shared/types/entities";

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
    const [updateProvider, updateProviderState] =
        useUpdateCustomProviderMutation();
    const [updateStatus, updateState] = useUpdateCustomProviderStatusMutation();
    const [deleteProvider, deleteState] = useDeleteCustomProviderMutation();

    const userProviders = providers.filter((p) => p.isCustom);
    const globalProviders = providers.filter((p) => !p.isCustom);

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
            {showCreate ? (
                <CreateProviderModal
                    onClose={() => setShowCreate(false)}
                    createProvider={createProvider}
                    isLoading={createState.isLoading}
                />
            ) : null}

            {/* User Created Providers Section */}
            {userProviders.length > 0 || isLoading ? (
                <div>
                    <h2 className="mb-4 text-lg font-semibold">
                        Your Providers
                    </h2>
                    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {isLoading ? <ProviderSkeletons /> : null}
                        {userProviders.map((provider) => (
                            <div key={provider.id} className="grid gap-3">
                                <Card className="transition-colors hover:bg-(--color-bg-card-hover)">
                                    <CardHeader>
                                        <div className="grid size-11 place-items-center rounded-md bg-[color-mix(in_srgb,var(--color-accent-primary)_14%,transparent)] text-(--color-accent-primary)">
                                            <StackIcon
                                                size={22}
                                                weight="duotone"
                                            />
                                        </div>
                                        <StatusBadge status={provider.status} />
                                    </CardHeader>
                                    <CardContent className="grid gap-4">
                                        <div>
                                            <h2 className="font-semibold tracking-tight">
                                                {provider.name}
                                            </h2>
                                            <p className="mt-1 line-clamp-2 min-h-10 text-sm text-(--color-text-secondary)">
                                                {provider.description ??
                                                    `${provider.name} API Provider`}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge>{provider.type}</Badge>
                                            {provider.free ? (
                                                <Badge>Free</Badge>
                                            ) : null}
                                            <Badge>Custom</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 rounded-md bg-(--color-bg-input) p-3 text-sm">
                                            <span className="text-(--color-text-secondary)">
                                                Models
                                            </span>
                                            <span className="text-right font-mono">
                                                {provider.activeModelsCount}/
                                                {provider.modelsCount}
                                            </span>
                                            <span className="text-(--color-text-secondary)">
                                                Connected
                                            </span>
                                            <span className="flex justify-end text-(--color-status-success)">
                                                {provider.connected ? (
                                                    <CheckCircleIcon
                                                        size={18}
                                                        weight="fill"
                                                    />
                                                ) : (
                                                    <CircleIcon size={18} />
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 text-xs text-(--color-text-muted)">
                                            <span>
                                                {formatDate(provider.updatedAt)}
                                            </span>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() =>
                                                        setModelProvider(
                                                            provider,
                                                        )
                                                    }
                                                >
                                                    Models
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => {
                                                        setModelProvider(
                                                            provider,
                                                        );
                                                        setShowCreateModel(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    <PlusIcon size={14} /> Add
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between gap-1 border-t border-(--color-border-subtle) pt-3">
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="primary:outline"
                                                    size="icon"
                                                    aria-label="Edit provider"
                                                    onClick={() =>
                                                        setEditProvider(
                                                            provider,
                                                        )
                                                    }
                                                >
                                                    <PencilIcon size={16} />
                                                </Button>
                                                <Button
                                                    variant="danger:outline"
                                                    size="icon"
                                                    aria-label="Delete provider"
                                                    disabled={
                                                        deleteState.isLoading
                                                    }
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
                                                            toast.success(
                                                                "Provider deleted",
                                                            );
                                                        } catch {
                                                            toast.error(
                                                                "Could not delete provider",
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <TrashIcon size={16} />
                                                </Button>
                                            </div>
                                            <Button
                                                variant={provider.status === ContentStatus.ACTIVE ? "danger:outline" : "success:outline"}
                                                size="sm"
                                                disabled={updateState.isLoading}
                                                onClick={async () => {
                                                    try {
                                                        await updateStatus({
                                                            id: provider.id,
                                                            status:
                                                                provider.status ===
                                                                ContentStatus.ACTIVE
                                                                    ? ContentStatus.INACTIVE
                                                                    : ContentStatus.ACTIVE,
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
                                                <PlugIcon size={16} />{" "}
                                                {provider.status ===
                                                ContentStatus.ACTIVE
                                                    ? "Disable"
                                                    : "Enable"}
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
                    <h2 className="mb-4 text-lg font-semibold">
                        Global Providers
                    </h2>
                    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {isLoading && userProviders.length === 0 ? (
                            <ProviderSkeletons />
                        ) : null}
                        {globalProviders.map((provider) => (
                            <div key={provider.id} className="grid gap-3">
                                <Card className="transition-colors hover:bg-(--color-bg-card-hover)">
                                    <CardHeader>
                                        <div className="grid size-11 place-items-center rounded-md bg-[color-mix(in_srgb,var(--color-accent-primary)_14%,transparent)] text-(--color-accent-primary)">
                                            <StackIcon
                                                size={22}
                                                weight="duotone"
                                            />
                                        </div>
                                        <StatusBadge status={provider.status} />
                                    </CardHeader>
                                    <CardContent className="grid gap-4">
                                        <div>
                                            <h2 className="font-semibold tracking-tight">
                                                {provider.name}
                                            </h2>
                                            <p className="mt-1 line-clamp-2 min-h-10 text-sm text-(--color-text-secondary)">
                                                {provider.description ??
                                                    `${provider.name} API Provider`}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge>{provider.type}</Badge>
                                            {provider.free ? (
                                                <Badge>Free</Badge>
                                            ) : null}
                                            <Badge>Global</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 rounded-md bg-(--color-bg-input) p-3 text-sm">
                                            <span className="text-(--color-text-secondary)">
                                                Models
                                            </span>
                                            <span className="text-right font-mono">
                                                {provider.activeModelsCount}/
                                                {provider.modelsCount}
                                            </span>
                                            <span className="text-(--color-text-secondary)">
                                                Connected
                                            </span>
                                            <span className="flex justify-end text-(--color-status-success)">
                                                {provider.connected ? (
                                                    <CheckCircleIcon
                                                        size={18}
                                                        weight="fill"
                                                    />
                                                ) : (
                                                    <CircleIcon size={18} />
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 text-xs text-(--color-text-muted)">
                                            <span>
                                                {formatDate(provider.updatedAt)}
                                            </span>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() =>
                                                    setModelProvider(provider)
                                                }
                                            >
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

            {modelProvider ? (
                <ProviderModelsModal
                    provider={modelProvider}
                    onClose={() => {
                        setModelProvider(null);
                        setShowCreateModel(false);
                    }}
                />
            ) : null}
            {modelProvider && showCreateModel ? (
                <CreateModelModal
                    provider={modelProvider}
                    onClose={() => {
                        setModelProvider(null);
                        setShowCreateModel(false);
                    }}
                />
            ) : null}
            {editProvider ? (
                <EditProviderModal
                    provider={editProvider}
                    onClose={() => setEditProvider(null)}
                />
            ) : null}
        </>
    );
}

function CreateProviderModal({
    onClose,
    createProvider,
    isLoading,
}: {
    onClose: () => void;
    createProvider: ReturnType<typeof useCreateCustomProviderMutation>[0];
    isLoading: boolean;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <Modal
            onClose={onClose}
            ariaLabel="Create custom provider"
            showCloseButton
            className="w-full max-w-2xl"
        >
            <div className="border-b border-(--color-border-primary) p-5">
                <h2 className="text-lg font-semibold">Create Provider</h2>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                    Add a new custom provider to the catalog.
                </p>
            </div>
            <form
                className="grid gap-4 p-5"
                onSubmit={async (event) => {
                    event.preventDefault();
                    if (isSubmitting) return;

                    const form = new FormData(event.currentTarget);
                    const name = String(form.get("name") ?? "").trim();
                    const baseApi = String(form.get("baseApi") ?? "").trim();
                    const description = String(
                        form.get("description") ?? "",
                    ).trim();
                    const code = String(form.get("code") ?? "").trim();
                    const free = form.get("free") === "on";
                    const type = String(
                        form.get("type") ?? ProviderType.CUSTOM,
                    ) as ProviderType;
                    const status = String(
                        form.get("status") ?? ContentStatus.ACTIVE,
                    ) as ContentStatus;

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
                        onClose();
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
                        <Input
                            name="name"
                            placeholder="Provider name"
                            required
                        />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                        Base API
                        <Input
                            name="baseApi"
                            type="url"
                            placeholder="https://api.example.com/v1"
                            required
                        />
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
                            className="min-h-10 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm text-(--color-text-primary) outline-none"
                        >
                            {Object.values(ProviderType).map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                        Status
                        <select
                            name="status"
                            defaultValue={ContentStatus.ACTIVE}
                            className="min-h-10 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm text-(--color-text-primary) outline-none"
                        >
                            {Object.values(ContentStatus).map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm font-medium">
                        Free provider
                        <input
                            name="free"
                            type="checkbox"
                            className="size-4 accent-(--color-accent-primary)"
                        />
                    </label>
                </div>
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || isSubmitting}>
                        Create Provider
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

function ProviderModelsModal({
    provider,
    onClose,
}: {
    provider: ProviderListItem;
    onClose: () => void;
}) {
    const { data: models = [], isLoading } = useGetProviderModelsQuery(
        provider.id,
    );
    const [editModel, setEditModel] = useState<any>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deleteModel, deleteModelState] = useDeleteProviderModelMutation();

    return (
        <Modal
            onClose={onClose}
            ariaLabel={`${provider.name} models`}
            className="grid max-h-[86dvh] w-full max-w-4xl"
        >
            <div className="flex items-start justify-between gap-4 border-b border-(--color-border-primary) p-5">
                <div>
                    <h2 className="text-lg font-semibold">
                        {provider.name} Models
                    </h2>
                    <p className="mt-1 text-sm text-(--color-text-secondary)">
                        Inspect active models and their best-fit feature tags.
                    </p>
                </div>
                <Button variant="secondary" size="sm" onClick={onClose}>
                    Close
                </Button>
            </div>
            <div 
                className="grid max-h-[70dvh] gap-3 overflow-y-auto p-5 md:grid-cols-2"
                onClick={() => setOpenMenuId(null)}
            >
                {isLoading
                    ? Array.from({ length: 6 }).map((_, index) => (
                          <Skeleton key={index} className="h-28" />
                      ))
                    : models.map((model) => (
                          <div
                              key={model.id}
                              className="grid gap-3 rounded-md bg-(--color-bg-input) p-3"
                          >
                              <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                      <h3 className="truncate text-sm font-semibold">
                                          {model.name}
                                      </h3>
                                      <p className="mt-1 truncate font-mono text-xs text-(--color-text-muted)">
                                          {model.code}
                                      </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <StatusBadge status={model.status} />
                                      {provider.isCustom ? (
                                          <div className="relative">
                                              <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  aria-label="Model options"
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOpenMenuId(
                                                          openMenuId === model.id
                                                              ? null
                                                              : model.id,
                                                      );
                                                  }}
                                              >
                                                  <DotsThreeVerticalIcon size={16} />
                                              </Button>
                                              {openMenuId === model.id ? (
                                                  <div 
                                                      className="absolute right-0 top-full z-10 mt-1 rounded-md border border-(--color-border-primary) bg-(--color-bg-primary) shadow-lg"
                                                      onClick={(e) => e.stopPropagation()}
                                                  >
                                                      <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="w-full justify-start rounded-none rounded-t-md px-3"
                                                          aria-label="Edit model"
                                                          onClick={() => {
                                                              setEditModel(
                                                                  model,
                                                              );
                                                              setOpenMenuId(null);
                                                          }}
                                                      >
                                                          <PencilIcon size={14} />
                                                          Edit
                                                      </Button>
                                                      <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="w-full justify-start rounded-none rounded-b-md px-3 text-(--color-status-error)"
                                                          aria-label="Delete model"
                                                          disabled={
                                                              deleteModelState.isLoading
                                                          }
                                                          onClick={async () => {
                                                              if (
                                                                  !window.confirm(
                                                                      `Delete ${model.name}?`,
                                                                  )
                                                              )
                                                                  return;
                                                              try {
                                                                  await deleteModel(
                                                                      model.id,
                                                                  ).unwrap();
                                                                  toast.success(
                                                                      "Model deleted",
                                                                  );
                                                              } catch {
                                                                  toast.error(
                                                                      "Could not delete model",
                                                                  );
                                                              }
                                                              setOpenMenuId(null);
                                                          }}
                                                      >
                                                          <TrashIcon size={14} />
                                                          Delete
                                                      </Button>
                                                  </div>
                                              ) : null}
                                          </div>
                                      ) : null}
                                  </div>
                              </div>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                  {model.bestFor.length > 0 ? (
                                      model.bestFor.map((item) => (
                                          <Badge key={item}>{item}</Badge>
                                      ))
                                  ) : (
                                      <Badge>General</Badge>
                                  )}
                                  {model.thinking ? (
                                      <Badge>Thinking</Badge>
                                  ) : null}
                                  {model.efficiencyScore !== null ? (
                                      <Badge>
                                          {Math.round(
                                              model.efficiencyScore * 100,
                                          )}
                                          % efficient
                                      </Badge>
                                  ) : null}
                              </div>
                          </div>
                      ))}
                {!isLoading && models.length === 0 ? (
                    <p className="text-sm text-(--color-text-secondary)">
                        No active models found for this provider.
                    </p>
                ) : null}
            </div>
            {editModel ? (
                <EditModelModal
                    model={editModel}
                    onClose={() => setEditModel(null)}
                />
            ) : null}
        </Modal>
    );
}

function CreateModelModal({
    provider,
    onClose,
}: {
    provider: ProviderListItem;
    onClose: () => void;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createModel, createState] = useCreateProviderModelMutation();

    return (
        <Modal
            onClose={onClose}
            ariaLabel={`Create model for ${provider.name}`}
            className="grid w-full max-w-md gap-0"
        >
            <div className="border-b border-(--color-border-primary) p-5">
                <h2 className="text-lg font-semibold">Create Model</h2>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                    Add a new model to {provider.name}
                </p>
            </div>
            <form
                className="grid gap-4 p-5"
                onSubmit={async (event) => {
                    event.preventDefault();
                    if (isSubmitting) return;

                    const form = new FormData(event.currentTarget);
                    const name = String(form.get("name") ?? "").trim();
                    const code = String(form.get("code") ?? "").trim();
                    const maxTokens = form.get("maxTokens")
                        ? Number(form.get("maxTokens"))
                        : undefined;
                    const bestFor = form.get("bestFor")
                        ? String(form.get("bestFor"))
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                        : undefined;

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
                    <label className="text-sm font-medium">
                        Max Tokens (Optional)
                    </label>
                    <Input name="maxTokens" type="number" placeholder="4096" />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">
                        Best For (Comma-separated, Optional)
                    </label>
                    <Input
                        name="bestFor"
                        placeholder="reasoning, coding, analysis"
                    />
                </div>
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={createState.isLoading || isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={createState.isLoading || isSubmitting}
                    >
                        Create Model
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

function EditProviderModal({
    provider,
    onClose,
}: {
    provider: ProviderListItem;
    onClose: () => void;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updateProvider, updateState] = useUpdateCustomProviderMutation();

    return (
        <Modal
            onClose={onClose}
            ariaLabel={`Edit provider ${provider.name}`}
            className="grid w-full max-w-md gap-0"
        >
            <div className="border-b border-(--color-border-primary) p-5">
                <h2 className="text-lg font-semibold">Edit Provider</h2>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                    Update provider details for {provider.name}
                </p>
            </div>
            <form
                className="grid gap-4 p-5"
                onSubmit={async (event) => {
                    event.preventDefault();
                    if (isSubmitting) return;

                    const form = new FormData(event.currentTarget);
                    const name = String(form.get("name") ?? "").trim();
                    const baseApi = String(form.get("baseApi") ?? "").trim();
                    const description = String(
                        form.get("description") ?? "",
                    ).trim();
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
                    <Input
                        name="name"
                        placeholder="Provider name"
                        defaultValue={provider.name}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Base API</label>
                    <Input
                        name="baseApi"
                        type="url"
                        placeholder="https://api.example.com/v1"
                        defaultValue={provider.baseApi}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Code</label>
                    <Input
                        name="code"
                        placeholder="provider-code"
                        defaultValue={provider.code || ""}
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                        name="description"
                        placeholder="Description"
                        defaultValue={provider.description || ""}
                    />
                </div>
                <label className="flex items-center justify-between gap-3 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 py-2 text-sm font-medium">
                    Free provider
                    <input
                        name="free"
                        type="checkbox"
                        defaultChecked={provider.free}
                        className="size-4 accent-(--color-accent-primary)"
                    />
                </label>
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={updateState.isLoading || isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={updateState.isLoading || isSubmitting}
                    >
                        Update Provider
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

function EditModelModal({
    model,
    onClose,
}: {
    model: any;
    onClose: () => void;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updateModel, updateState] = useUpdateProviderModelMutation();

    return (
        <Modal
            onClose={onClose}
            ariaLabel={`Edit model ${model.name}`}
            className="grid w-full max-w-md gap-0"
        >
            <div className="border-b border-(--color-border-primary) p-5">
                <h2 className="text-lg font-semibold">Edit Model</h2>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                    Update model details for {model.name}
                </p>
            </div>
            <form
                className="grid gap-4 p-5"
                onSubmit={async (event) => {
                    event.preventDefault();
                    if (isSubmitting) return;

                    const form = new FormData(event.currentTarget);
                    const name = String(form.get("name") ?? "").trim();
                    const code = String(form.get("code") ?? "").trim();
                    const maxTokens = form.get("maxTokens")
                        ? Number(form.get("maxTokens"))
                        : undefined;
                    const bestFor = form.get("bestFor")
                        ? String(form.get("bestFor"))
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                        : undefined;

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
                    <Input
                        name="name"
                        placeholder="GPT-4 Turbo"
                        defaultValue={model.name}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Model Code</label>
                    <Input
                        name="code"
                        placeholder="gpt-4-turbo"
                        defaultValue={model.code}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">
                        Max Tokens (Optional)
                    </label>
                    <Input
                        name="maxTokens"
                        type="number"
                        placeholder="4096"
                        defaultValue={model.maxTokens || ""}
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">
                        Best For (Comma-separated, Optional)
                    </label>
                    <Input
                        name="bestFor"
                        placeholder="reasoning, coding, analysis"
                        defaultValue={model.bestFor?.join(", ") || ""}
                    />
                </div>
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={updateState.isLoading || isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={updateState.isLoading || isSubmitting}
                    >
                        Update Model
                    </Button>
                </div>
            </form>
        </Modal>
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
