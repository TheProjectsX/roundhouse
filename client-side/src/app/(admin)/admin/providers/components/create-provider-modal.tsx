import React, { useState } from "react";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";
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
