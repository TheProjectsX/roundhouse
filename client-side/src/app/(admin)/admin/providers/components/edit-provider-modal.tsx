import React, { useState } from "react";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";

interface EditProviderModalProps {
    provider: any;
    onClose: () => void;
    updateProvider: any;
    isLoading: boolean;
}

export function EditProviderModal({
    provider,
    onClose,
    updateProvider,
    isLoading,
}: EditProviderModalProps) {
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
