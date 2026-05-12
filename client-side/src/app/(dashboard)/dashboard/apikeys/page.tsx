"use client";

import {
    CopyIcon,
    DotsThreeIcon,
    GearIcon,
    GitBranchIcon,
    PowerIcon,
    TrashIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { Modal } from "@/shared/components/ui/modal";
import {
    useCreateApiKeyMutation,
    useDeleteApiKeyMutation,
    useGetApiKeysQuery,
    useUpdateApiKeyStatusMutation,
} from "@/shared/store/api";
import { formatDate, formatNumber } from "@/shared/lib/utils";
import { RoundhouseMethod } from "@/shared/types/enums";
import { routes } from "@/shared/constants/routes";

export default function ApiKeysPage() {
    const { data: apiKeys = [], isLoading } = useGetApiKeysQuery();
    const [showCreate, setShowCreate] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [createApiKey, createState] = useCreateApiKeyMutation();
    const [updateStatus, updateStatusState] = useUpdateApiKeyStatusMutation();
    const [deleteApiKey, deleteState] = useDeleteApiKeyMutation();

    return (
        <>
            <PageHeader
                title="API Keys"
                description="Manage Roundhouse API keys and their provider configurations."
                actions={
                    <Button onClick={() => setShowCreate((value) => !value)}>
                        Create API Key
                    </Button>
                }
            />
            {showCreate ? (
                <CreateApiKeyModal
                    onClose={() => setShowCreate(false)}
                    createApiKey={createApiKey}
                    isLoading={createState.isLoading}
                />
            ) : null}
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {isLoading ? <ApiKeySkeletons /> : null}
                {apiKeys.map((item) => (
                    <Card
                        key={item.id}
                        className="transition-colors hover:bg-(--color-bg-card-hover)"
                    >
                        <CardHeader className="relative">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="font-semibold tracking-tight">
                                        {item.name}
                                    </h2>
                                    <StatusBadge status={item.active} />
                                </div>
                                <div className="mt-3 flex min-h-11 items-center gap-2 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3">
                                    <code className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-(--color-text-primary)">
                                         {item.key.slice(0, 11)}****{item.key.slice(-5)}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Copy key"
                                        onClick={async () => {
                                            await navigator.clipboard.writeText(
                                                item.key,
                                            );
                                            toast.success("API key copied");
                                        }}
                                    >
                                        <CopyIcon size={18} />
                                    </Button>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Open key actions"
                                aria-expanded={openMenuId === item.id}
                                onClick={() =>
                                    setOpenMenuId((value) =>
                                        value === item.id ? null : item.id,
                                    )
                                }
                            >
                                <DotsThreeIcon size={20} weight="bold" />
                            </Button>
                            {openMenuId === item.id ? (
                                <div className="absolute right-5 top-14 z-10 grid min-w-44 gap-1 rounded-md border border-(--color-border-primary) bg-(--color-bg-secondary) p-1 shadow-(--color-shadow)">
                                    <button
                                        type="button"
                                        className="flex min-h-9 cursor-pointer items-center gap-2 rounded-sm px-3 text-left text-sm hover:bg-(--color-bg-card-hover)"
                                        disabled={updateStatusState.isLoading}
                                        onClick={async () => {
                                            try {
                                                await updateStatus({
                                                    id: item.id,
                                                    active: !item.active,
                                                }).unwrap();
                                                setOpenMenuId(null);
                                                toast.success(
                                                    item.active
                                                        ? "API key disabled"
                                                        : "API key enabled",
                                                );
                                            } catch {
                                                toast.error(
                                                    "Could not update API key",
                                                );
                                            }
                                        }}
                                    >
                                        <PowerIcon size={16} />{" "}
                                        {item.active ? "Disable" : "Enable"}
                                    </button>
                                    <button
                                        type="button"
                                        className="flex min-h-9 cursor-pointer items-center gap-2 rounded-sm px-3 text-left text-sm text-(--color-status-error) hover:bg-(--color-bg-card-hover)"
                                        disabled={deleteState.isLoading}
                                        onClick={async () => {
                                            if (
                                                !window.confirm(
                                                    `Delete ${item.name}?`,
                                                )
                                            )
                                                return;
                                            try {
                                                await deleteApiKey(
                                                    item.id,
                                                ).unwrap();
                                                setOpenMenuId(null);
                                                toast.success(
                                                    "API key deleted",
                                                );
                                            } catch {
                                                toast.error(
                                                    "Could not delete API key",
                                                );
                                            }
                                        }}
                                    >
                                        <TrashIcon size={16} /> Delete
                                    </button>
                                </div>
                            ) : null}
                        </CardHeader>
                        <CardContent className="grid gap-5">
                            <div className="flex flex-wrap gap-2">
                                <Badge>{item.roundhouseMethod}</Badge>
                                <Badge>{item.maxIterations} retries</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <Metric
                                    label="Providers"
                                    value={item.stats.providerCount}
                                />
                                <Metric
                                    label="Models"
                                    value={item.stats.modelCount}
                                />
                                <Metric
                                    label="Vault Keys"
                                    value={item.stats.apiKeysManagerCount}
                                />
                                <Metric
                                    label="Success"
                                    value={formatNumber(
                                        item.stats.successfulRequests,
                                    )}
                                />
                            </div>
                            <div className="flex items-center justify-between border-t border-(--color-border-subtle) pt-4 text-xs text-(--color-text-secondary)">
                                <span>
                                    Updated {formatDate(item.updatedAt)}
                                </span>
                                <div className="flex gap-1">
                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Open API key settings"
                                    >
                                        <Link
                                            href={`${routes.apiKeys}/${item.id}`}
                                        >
                                            <GearIcon size={18} />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </section>
            <Card>
                <CardContent className="flex items-start gap-4 pt-5">
                    <GitBranchIcon
                        className="text-(--color-accent-primary)"
                        size={24}
                        weight="duotone"
                    />
                    <div>
                        <h2 className="font-semibold tracking-tight">
                            Roundhouse routing summary
                        </h2>
                        <p className="mt-1 text-sm text-(--color-text-secondary)">
                            Production keys use efficiency scoring first, then
                            fail over through active providers while excluding
                            failed model attempts from the current request
                            cycle.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

function CreateApiKeyModal({
    onClose,
    createApiKey,
    isLoading,
}: {
    onClose: () => void;
    createApiKey: ReturnType<typeof useCreateApiKeyMutation>[0];
    isLoading: boolean;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <Modal
            onClose={onClose}
            ariaLabel="Create API key"
            showCloseButton
            className="w-full max-w-xl"
        >
            <div className="border-b border-(--color-border-primary) p-5">
                <h2 className="text-lg font-semibold">Create API Key</h2>
                <p className="mt-1 text-sm text-(--color-text-secondary)">Add a new Roundhouse API key and routing profile.</p>
            </div>
            <form
                className="grid gap-4 p-5"
                onSubmit={async (event) => {
                    event.preventDefault();
                    if (isSubmitting) return;

                    const form = new FormData(event.currentTarget);
                    const name = String(form.get("name") ?? "").trim();
                    const maxIterations = Number(form.get("maxIterations") ?? 3);
                    const roundhouseMethod = String(form.get("roundhouseMethod")) as RoundhouseMethod;

                    if (!name) {
                        toast.error("API key name is required");
                        return;
                    }

                    setIsSubmitting(true);
                    try {
                        await createApiKey({
                            name,
                            maxIterations,
                            roundhouseMethod,
                        }).unwrap();
                        toast.success("API key created");
                        onClose();
                    } catch {
                        toast.error("Could not create API key");
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
            >
                <Input name="name" placeholder="Production gateway" required />
                <Input
                    name="maxIterations"
                    type="number"
                    min={1}
                    defaultValue={3}
                    aria-label="Max retries"
                />
                <select
                    name="roundhouseMethod"
                    defaultValue={RoundhouseMethod.EFFICIENCY}
                    className="min-h-10 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm text-(--color-text-primary) outline-none"
                >
                    {Object.values(RoundhouseMethod).map((method) => (
                        <option key={method} value={method}>
                            {method}
                        </option>
                    ))}
                </select>
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isLoading || isSubmitting}>Create</Button>
                </div>
            </form>
        </Modal>
    );
}

function ApiKeySkeletons() {
    return Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
            <CardHeader>
                <div className="grid flex-1 gap-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-11 w-full" />
                </div>
                <Skeleton className="size-10" />
            </CardHeader>
            <CardContent className="grid gap-5">
                <div className="flex gap-2">
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-7 w-20" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((__, metricIndex) => (
                        <Skeleton key={metricIndex} className="h-20" />
                    ))}
                </div>
            </CardContent>
        </Card>
    ));
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-md bg-(--color-bg-input) p-3">
            <p className="text-xs text-(--color-text-muted)">{label}</p>
            <p className="mt-1 font-mono text-lg font-semibold">{value}</p>
        </div>
    );
}
