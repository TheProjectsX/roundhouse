import React, { useState } from "react";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";

interface CreateKeyModalProps {
    onClose: () => void;
    createKey: any;
    isLoading: boolean;
}

export function CreateKeyModal({
    onClose,
    createKey,
    isLoading,
}: CreateKeyModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <Modal
            onClose={onClose}
            ariaLabel="Add API key"
            showCloseButton
            className="w-full max-w-xl"
        >
            <div className="border-b border-(--color-border-primary) p-5">
                <h2 className="text-lg font-semibold">Add API Key</h2>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                    Store an encrypted provider key in the vault.
                </p>
            </div>
            <form
                className="grid gap-4 p-5"
                onSubmit={async (event) => {
                    event.preventDefault();
                    if (isSubmitting) return;

                    const form = new FormData(event.currentTarget);
                    const name = String(form.get("name") ?? "").trim();
                    const provider = String(form.get("provider") ?? "").trim();
                    const key = String(form.get("key") ?? "").trim();

                    if (!name || !key) {
                        toast.error("Name and key are required");
                        return;
                    }

                    setIsSubmitting(true);
                    try {
                        await createKey({
                            name,
                            provider: provider || undefined,
                            key,
                        }).unwrap();
                        toast.success("Vault key added");
                        onClose();
                    } catch {
                        toast.error("Could not add vault key");
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
            >
                <Input
                    name="name"
                    placeholder="OpenAI production"
                    required
                />
                <Input name="provider" placeholder="openai" />
                <Input name="key" placeholder="Provider API key" required />
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || isSubmitting}>
                        Add
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
