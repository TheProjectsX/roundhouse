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

interface CreateProviderModalProps {
    onClose: () => void;
    createProvider: any;
    isLoading: boolean;
}

export function CreateProviderModal({
    onClose,
    createProvider,
    isLoading,
}: CreateProviderModalProps) {
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
                        <Input name="name" placeholder="Provider name" required />
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
                                    {providerTypeLabels[value]}
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
                                    {contentStatusLabels[value]}
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
