import React, { useState } from "react";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";
import { contentStatusLabels } from "@/shared/lib/enum-labels";
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
                    const description = String(form.get("description") ?? "").trim();
                    const type = (String(form.get("type") ?? ProviderType.OPENAI)) as ProviderType;
                    const status = (String(form.get("status") ?? ContentStatus.ACTIVE)) as ContentStatus;

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
                            type,
                            status,
                        }).unwrap();
                        toast.success("Provider created");
                        onClose();
                    } catch (err: any) {
                        toast.error(err?.data?.message || "Could not create provider");
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
            >
                <label className="grid gap-1.5 text-sm font-medium">
                    Provider Name
                    <Input name="name" placeholder="OpenAI" required />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                    Base API URL
                    <Input
                        name="baseApi"
                        type="url"
                        placeholder="https://api.example.com/v1"
                        required
                    />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-sm font-medium">
                        Provider Type
                        <select
                            name="type"
                            defaultValue={ProviderType.OPENAI}
                            className="min-h-9 rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm text-(--color-text-primary) outline-none focus:border-(--color-border-focused)"
                        >
                            {Object.values(ProviderType).map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                        Initial Status
                        <select
                            name="status"
                            defaultValue={ContentStatus.ACTIVE}
                            className="min-h-9 rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm text-(--color-text-primary) outline-none focus:border-(--color-border-focused)"
                        >
                            {Object.values(ContentStatus).map((s) => (
                                <option key={s} value={s}>
                                    {contentStatusLabels[s]}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <label className="grid gap-1.5 text-sm font-medium">
                    Provider Code (optional)
                    <Input name="code" placeholder="provider-code" />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                    Description (optional)
                    <Input name="description" placeholder="Short description" />
                </label>
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
