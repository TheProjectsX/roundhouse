import React, { useState } from "react";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";
import {
    contentStatusLabels,
    providerTypeLabels,
} from "@/shared/lib/enum-labels";
import { ContentStatus, ProviderType } from "@/shared/types/enums";
import { useUpdateCustomProviderMutation } from "@/shared/store/features/providers/providersApi";
import type { ProviderListItem } from "@/shared/types/entities";

interface EditProviderModalProps {
    provider: ProviderListItem;
    onClose: () => void;
}

export function EditProviderModal({
    provider,
    onClose,
}: EditProviderModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updateProvider, updateState] = useUpdateCustomProviderMutation();

    return (
        <Modal
            onClose={onClose}
            ariaLabel={`Edit provider ${provider.name}`}
            className="grid w-full max-w-lg gap-0"
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
                    const type = String(
                        form.get("type") ?? provider.type,
                    ) as ProviderType;
                    const status = String(
                        form.get("status") ?? provider.status,
                    ) as ContentStatus;

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
                                type,
                                status,
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
                <div className="grid gap-3 sm:grid-cols-2">
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
                        <label className="text-sm font-medium">
                            Description
                        </label>
                        <Input
                            name="description"
                            placeholder="Description"
                            defaultValue={provider.description || ""}
                        />
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium">
                        Type
                        <select
                            name="type"
                            defaultValue={provider.type}
                            className="min-h-10 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm text-(--color-text-primary) outline-none"
                        >
                            {Object.values(ProviderType).map((value) => (
                                <option key={value} value={value}>
                                    {providerTypeLabels[value]}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                        Status
                        <select
                            name="status"
                            defaultValue={provider.status}
                            className="min-h-10 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm text-(--color-text-primary) outline-none"
                        >
                            {Object.values(ContentStatus).map((value) => (
                                <option key={value} value={value}>
                                    {contentStatusLabels[value]}
                                </option>
                            ))}
                        </select>
                    </label>
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
                        type="button"
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
