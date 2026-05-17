import React, { useState } from "react";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";
import { roundhouseMethodLabels } from "@/shared/lib/enum-labels";
import { RoundhouseMethod } from "@/shared/types/enums";

interface CreateApiKeyModalProps {
    onClose: () => void;
    createApiKey: any;
    isLoading: boolean;
}

export function CreateApiKeyModal({
    onClose,
    createApiKey,
    isLoading,
}: CreateApiKeyModalProps) {
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
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                    Add a new Roundhouse API key and routing profile.
                </p>
            </div>
            <form
                className="grid gap-4 p-5"
                onSubmit={async (event) => {
                    event.preventDefault();
                    if (isSubmitting) return;

                    const form = new FormData(event.currentTarget);
                    const name = String(form.get("name") ?? "").trim();
                    const maxIterations = Number(form.get("maxIterations") ?? 3);
                    const roundhouseMethod = String(
                        form.get("roundhouseMethod"),
                    ) as RoundhouseMethod;

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
                            {roundhouseMethodLabels[method]}
                        </option>
                    ))}
                </select>
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
