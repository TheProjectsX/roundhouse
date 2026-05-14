"use client";

import {
    ActivityIcon,
    CaretDownIcon,
    CaretUpIcon,
    ClockIcon,
    CoinsIcon,
    CpuIcon,
    GlobeIcon,
    PenIcon,
    PlusIcon,
    StackIcon,
    TrashIcon,
    UsersIcon,
} from "@phosphor-icons/react";
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
    useGetAdminProviderModelsQuery,
    useCreateAdminProviderModelMutation,
    useUpdateAdminProviderModelMutation,
    useUpdateAdminProviderModelStatusMutation,
    useDeleteAdminProviderModelMutation,
} from "@/shared/store/features/api/roundhouseApi";
import { ContentStatus, ProviderType } from "@/shared/types/enums";
import { cn, formatDate, formatNumber } from "@/shared/lib/utils";

function formatCompactNumber(value: number) {
    return new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}

function getSuccessRateColor(rate: number) {
    if (rate >= 95) return "text-(--color-status-success)";
    if (rate >= 80) return "text-(--color-status-warning)";
    return "text-(--color-status-error)";
}

function StatItem({
    icon,
    label,
    value,
    valueColor,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    valueColor?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-(--color-text-muted)">
                {icon}
                <span className="text-[10px] font-medium uppercase tracking-wider">
                    {label}
                </span>
            </div>
            <p
                className={cn(
                    "text-sm font-bold tracking-tight",
                    valueColor ?? "text-(--color-text-primary)",
                )}
            >
                {value}
            </p>
        </div>
    );
}

export default function AdminProvidersPage() {
    const { data: providers = [] } = useGetAdminProvidersQuery();
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
            <section className="grid gap-6">
                {providers.map((provider: any) => (
                    <Card
                        key={provider.id}
                        className={cn(
                            "overflow-hidden transition-all",
                            expandedProviderId === provider.id
                                ? "ring-2 ring-(--color-accent-primary) ring-offset-0"
                                : "hover:border-(--color-accent-primary)",
                        )}
                    >
                        <CardContent className="flex flex-col gap-6 p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="grid size-12 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-accent-secondary)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-accent-secondary)_8%,transparent)] text-(--color-accent-secondary)">
                                        <StackIcon size={26} weight="duotone" />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg font-bold tracking-tight text-(--color-text-primary)">
                                                {provider.name}
                                            </h2>
                                            <StatusBadge
                                                status={provider.status}
                                            />
                                            <Badge>{provider.type}</Badge>
                                        </div>
                                        <p className="mt-1 text-sm text-(--color-text-secondary)">
                                            {provider.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="h-9 gap-2 px-3"
                                        onClick={() =>
                                            setExpandedProviderId(
                                                expandedProviderId ===
                                                    provider.id
                                                    ? null
                                                    : provider.id,
                                            )
                                        }
                                    >
                                        {expandedProviderId === provider.id ? (
                                            <>
                                                <CaretUpIcon size={16} />
                                                Hide Models
                                            </>
                                        ) : (
                                            <>
                                                <CaretDownIcon size={16} />
                                                View Models
                                            </>
                                        )}
                                    </Button>
                                    <div className="h-6 w-px bg-(--color-border-subtle) mx-1" />
                                    <select
                                        value={provider.status}
                                        disabled={updateStatusState.isLoading}
                                        className="h-9 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-xs font-medium text-(--color-text-primary) outline-none transition-colors hover:border-(--color-accent-primary) focus:border-(--color-accent-primary)"
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
                                                <option
                                                    key={status}
                                                    value={status}
                                                >
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
                                        <TrashIcon size={18} />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-t border-(--color-border-subtle) pt-6 sm:grid-cols-3 lg:grid-cols-6">
                                <StatItem
                                    icon={<UsersIcon size={14} />}
                                    label="Unique Users"
                                    value={formatNumber(
                                        provider.uniqueUsersCount,
                                    )}
                                />
                                <StatItem
                                    icon={<GlobeIcon size={14} />}
                                    label="Connected APIs"
                                    value={formatNumber(
                                        provider.connectedApiCount,
                                    )}
                                />
                                <StatItem
                                    icon={<CpuIcon size={14} />}
                                    label="Active Models"
                                    value={`${formatNumber(provider.activeModelsCount)}/${formatNumber(provider.modelsCount)}`}
                                />
                                <StatItem
                                    icon={<CoinsIcon size={14} />}
                                    label="Total Tokens"
                                    value={formatCompactNumber(
                                        provider.totalTokenUsage,
                                    )}
                                />
                                <StatItem
                                    icon={<ActivityIcon size={14} />}
                                    label="Success Rate"
                                    value={`${provider.successRate.toFixed(1)}%`}
                                    valueColor={getSuccessRateColor(
                                        provider.successRate,
                                    )}
                                />
                                <StatItem
                                    icon={<ClockIcon size={14} />}
                                    label="Last Used"
                                    value={formatDate(provider.lastUsedAt)}
                                />
                            </div>
                        </CardContent>

                        {expandedProviderId === provider.id && (
                            <ModelsList providerId={provider.id} />
                        )}
                    </Card>
                ))}
            </section>
        </>
    );
}

function ModelsList({ providerId }: { providerId: string }) {
    const { data: models = [], isLoading } =
        useGetAdminProviderModelsQuery(providerId);
    const [createModel, createModelState] =
        useCreateAdminProviderModelMutation();
    const [updateModel, updateModelState] =
        useUpdateAdminProviderModelMutation();
    const [updateStatus, updateStatusState] =
        useUpdateAdminProviderModelStatusMutation();
    const [deleteModel, deleteModelState] =
        useDeleteAdminProviderModelMutation();

    const [showCreate, setShowCreate] = useState(false);
    const [editingModel, setEditingModel] = useState<any>(null);

    if (isLoading) {
        return (
            <div className="border-t border-(--color-border-subtle) bg-[color-mix(in_srgb,var(--color-bg-primary)_40%,transparent)] p-12 text-center">
                <p className="text-sm text-(--color-text-secondary)">
                    Loading models...
                </p>
            </div>
        );
    }

    return (
        <div className="border-t border-(--color-border-subtle) bg-[color-mix(in_srgb,var(--color-bg-primary)_40%,transparent)]">
            <div className="flex items-center justify-between px-6 py-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">
                    Models Catalog ({models.length})
                </h3>
                <Button
                    size="sm"
                    className="h-8 gap-1.5 px-3 text-xs"
                    onClick={() => setShowCreate(true)}
                >
                    <PlusIcon size={14} weight="bold" />
                    Add Model
                </Button>
            </div>

            <div className="px-6 pb-6">
                <div className="overflow-hidden rounded-lg border border-(--color-border-subtle) bg-(--color-bg-secondary)">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-(--color-border-subtle) bg-[color-mix(in_srgb,var(--color-bg-primary)_30%,transparent)]">
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Name
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Code
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Max Tokens
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Efficiency
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Success / Failure
                                </th>
                                <th className="px-4 py-3 font-semibold text-(--color-text-secondary)">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right font-semibold text-(--color-text-secondary)">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--color-border-subtle)">
                            {models.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-8 text-center text-(--color-text-muted)"
                                    >
                                        No models found for this provider.
                                    </td>
                                </tr>
                            ) : (
                                models.map((model: any) => (
                                    <tr
                                        key={model.id}
                                        className="transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_2%,transparent)]"
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={cn(
                                                        "size-1.5 rounded-full",
                                                        model.status ===
                                                            ContentStatus.ACTIVE
                                                            ? "bg-(--color-status-success) shadow-[0_0_8px_var(--color-status-success)]"
                                                            : "bg-(--color-text-muted)",
                                                    )}
                                                />
                                                {model.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono text-(--color-text-secondary)">
                                            {model.code}
                                        </td>
                                        <td className="px-4 py-3 text-(--color-text-secondary)">
                                            {model.maxTokens
                                                ? formatCompactNumber(
                                                      model.maxTokens,
                                                  )
                                                : "Unlimited"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-(--color-bg-primary)">
                                                    <div
                                                        className="h-full bg-(--color-accent-secondary)"
                                                        style={{
                                                            width: `${(model.efficiencyScore ?? 0) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold">
                                                    {(
                                                        (model.efficiencyScore ??
                                                            0) * 100
                                                    ).toFixed(0)}
                                                    %
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-xs font-bold text-(--color-status-success)">
                                                    {formatNumber(
                                                        model.totalSuccessCount,
                                                    )}
                                                </span>
                                                <span className="text-(--color-text-muted)">
                                                    /
                                                </span>
                                                <span className="font-mono text-xs font-bold text-(--color-status-error)">
                                                    {formatNumber(
                                                        model.totalFailureCount,
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={model.status}
                                                disabled={
                                                    updateStatusState.isLoading
                                                }
                                                className="h-7 rounded border border-(--color-border-primary) bg-(--color-bg-input) px-2 text-[10px] font-bold uppercase text-(--color-text-primary) outline-none"
                                                onChange={async (event) => {
                                                    try {
                                                        await updateStatus({
                                                            modelId: model.id,
                                                            status: event.target
                                                                .value as ContentStatus,
                                                        }).unwrap();
                                                        toast.success(
                                                            "Model status updated",
                                                        );
                                                    } catch {
                                                        toast.error(
                                                            "Could not update status",
                                                        );
                                                    }
                                                }}
                                            >
                                                {Object.values(
                                                    ContentStatus,
                                                ).map((status) => (
                                                    <option
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="primary:outline"
                                                    size="icon"
                                                    className="size-7"
                                                    onClick={() =>
                                                        setEditingModel(model)
                                                    }
                                                >
                                                    <PenIcon size={14} />
                                                </Button>
                                                <Button
                                                    variant="danger:outline"
                                                    size="icon"
                                                    className="size-7"
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
                                                    }}
                                                >
                                                    <TrashIcon size={14} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showCreate && (
                <CreateModelModal
                    providerId={providerId}
                    onClose={() => setShowCreate(false)}
                    createModel={createModel}
                    isLoading={createModelState.isLoading}
                />
            )}

            {editingModel && (
                <EditModelModal
                    model={editingModel}
                    onClose={() => setEditingModel(null)}
                    updateModel={updateModel}
                    isLoading={updateModelState.isLoading}
                />
            )}
        </div>
    );
}

function CreateModelModal({
    providerId,
    onClose,
    createModel,
    isLoading,
}: {
    providerId: string;
    onClose: () => void;
    createModel: any;
    isLoading: boolean;
}) {
    return (
        <Modal
            onClose={onClose}
            ariaLabel="Add model"
            showCloseButton
            className="w-full max-w-lg"
        >
            <div className="border-b border-(--color-border-primary) p-5">
                <h2 className="text-lg font-semibold">Add Model</h2>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                    Add a new model to this provider's catalog.
                </p>
            </div>
            <form
                className="grid gap-4 p-5"
                onSubmit={async (event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    const body = {
                        name: String(form.get("name")),
                        code: String(form.get("code")),
                        maxTokens: form.get("maxTokens")
                            ? Number(form.get("maxTokens"))
                            : null,
                        efficiencyScore: form.get("efficiencyScore")
                            ? Number(form.get("efficiencyScore")) / 100
                            : 0.8,
                        status: ContentStatus.ACTIVE,
                    };

                    try {
                        await createModel({ providerId, body }).unwrap();
                        toast.success("Model created");
                        onClose();
                    } catch {
                        toast.error("Could not create model");
                    }
                }}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                        <label className="text-xs font-bold uppercase text-(--color-text-muted)">
                            Model Name
                        </label>
                        <Input name="name" placeholder="GPT-4o" required />
                    </div>
                    <div className="grid gap-1.5">
                        <label className="text-xs font-bold uppercase text-(--color-text-muted)">
                            Model Code
                        </label>
                        <Input name="code" placeholder="gpt-4o" required />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                        <label className="text-xs font-bold uppercase text-(--color-text-muted)">
                            Max Tokens
                        </label>
                        <Input
                            name="maxTokens"
                            type="number"
                            placeholder="128000"
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <label className="text-xs font-bold uppercase text-(--color-text-muted)">
                            Efficiency Score (%)
                        </label>
                        <Input
                            name="efficiencyScore"
                            type="number"
                            placeholder="80"
                            min="0"
                            max="100"
                            defaultValue="80"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        Create Model
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

function EditModelModal({
    model,
    onClose,
    updateModel,
    isLoading,
}: {
    model: any;
    onClose: () => void;
    updateModel: any;
    isLoading: boolean;
}) {
    return (
        <Modal
            onClose={onClose}
            ariaLabel="Edit model"
            showCloseButton
            className="w-full max-w-lg"
        >
            <div className="border-b border-(--color-border-primary) p-5">
                <h2 className="text-lg font-semibold">Edit Model</h2>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                    Update model details.
                </p>
            </div>
            <form
                className="grid gap-4 p-5"
                onSubmit={async (event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    const body = {
                        name: String(form.get("name")),
                        code: String(form.get("code")),
                        maxTokens: form.get("maxTokens")
                            ? Number(form.get("maxTokens"))
                            : null,
                        efficiencyScore: form.get("efficiencyScore")
                            ? Number(form.get("efficiencyScore")) / 100
                            : 0.8,
                    };

                    try {
                        await updateModel({ modelId: model.id, body }).unwrap();
                        toast.success("Model updated");
                        onClose();
                    } catch {
                        toast.error("Could not update model");
                    }
                }}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                        <label className="text-xs font-bold uppercase text-(--color-text-muted)">
                            Model Name
                        </label>
                        <Input
                            name="name"
                            defaultValue={model.name}
                            placeholder="GPT-4o"
                            required
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <label className="text-xs font-bold uppercase text-(--color-text-muted)">
                            Model Code
                        </label>
                        <Input
                            name="code"
                            defaultValue={model.code}
                            placeholder="gpt-4o"
                            required
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                        <label className="text-xs font-bold uppercase text-(--color-text-muted)">
                            Max Tokens
                        </label>
                        <Input
                            name="maxTokens"
                            type="number"
                            defaultValue={model.maxTokens ?? ""}
                            placeholder="128000"
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <label className="text-xs font-bold uppercase text-(--color-text-muted)">
                            Efficiency Score (%)
                        </label>
                        <Input
                            name="efficiencyScore"
                            type="number"
                            placeholder="80"
                            min="0"
                            max="100"
                            defaultValue={(
                                (model.efficiencyScore ?? 0) * 100
                            ).toFixed(0)}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        Update Model
                    </Button>
                </div>
            </form>
        </Modal>
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
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                    Add a platform provider to the global catalog.
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
                    const code = String(form.get("code") ?? "").trim();
                    const description = String(
                        form.get("description") ?? "",
                    ).trim();

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
                <Input
                    name="baseApi"
                    type="url"
                    placeholder="https://api.example.com/v1"
                    required
                />
                <Input name="code" placeholder="provider-code" />
                <Input name="description" placeholder="Description" />
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || isSubmitting}>
                        Create
                    </Button>
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
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                    Update provider details.
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
                    const code = String(form.get("code") ?? "").trim();
                    const description = String(
                        form.get("description") ?? "",
                    ).trim();

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
                <Input
                    name="name"
                    placeholder="Provider name"
                    defaultValue={provider.name}
                    required
                />
                <Input
                    name="baseApi"
                    type="url"
                    placeholder="https://api.example.com/v1"
                    defaultValue={provider.baseApi}
                    required
                />
                <Input
                    name="code"
                    placeholder="provider-code"
                    defaultValue={provider.code || ""}
                />
                <Input
                    name="description"
                    placeholder="Description"
                    defaultValue={provider.description || ""}
                />
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || isSubmitting}>
                        Update
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
