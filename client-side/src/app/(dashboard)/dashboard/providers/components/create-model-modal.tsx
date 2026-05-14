import React, { useState } from "react";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";
import { useCreateProviderModelMutation } from "@/shared/store/features/api/roundhouseApi";
import type { ProviderListItem } from "@/shared/types/entities";

interface CreateModelModalProps {
    provider: ProviderListItem;
    onClose: () => void;
}

export function CreateModelModal({
    provider,
    onClose,
}: CreateModelModalProps) {
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
