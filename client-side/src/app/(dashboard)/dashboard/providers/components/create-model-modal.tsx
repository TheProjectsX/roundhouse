import React, { useState } from "react";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";
import { useCreateProviderModelMutation } from "@/shared/store/features/providers/providersApi";
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
                    const tokenResetInterval = form.get("tokenResetInterval")
                        ? Number(form.get("tokenResetInterval"))
                        : undefined;
                    const efficiencyScore = form.get("efficiencyScore")
                        ? Number(form.get("efficiencyScore"))
                        : undefined;
                    const thinking = form.get("thinking") === "on";
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
                                tokenResetInterval,
                                efficiencyScore,
                                thinking,
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
                <div className="grid gap-1.5">
                    <label htmlFor="create-model-name" className="text-sm font-medium">Model Name</label>
                    <Input id="create-model-name" name="name" placeholder="GPT-4 Turbo" required />
                </div>
                <div className="grid gap-1.5">
                    <label htmlFor="create-model-code" className="text-sm font-medium">Model Code</label>
                    <Input id="create-model-code" name="code" placeholder="gpt-4-turbo" required />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                        <label htmlFor="create-model-max-tokens" className="text-sm font-medium">
                            Max Tokens
                        </label>
                        <Input
                            id="create-model-max-tokens"
                            name="maxTokens"
                            type="number"
                            min={1}
                            placeholder="4096"
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <label htmlFor="create-model-efficiency" className="text-sm font-medium">
                            Efficiency (0–1)
                        </label>
                        <Input
                            id="create-model-efficiency"
                            name="efficiencyScore"
                            type="number"
                            step="0.01"
                            min={0}
                            max={1}
                            placeholder="0.85"
                        />
                    </div>
                </div>
                <div className="grid gap-1.5">
                    <label htmlFor="create-model-reset" className="text-sm font-medium">
                        Token Reset Interval (seconds)
                    </label>
                    <Input
                        id="create-model-reset"
                        name="tokenResetInterval"
                        type="number"
                        min={1}
                        placeholder="60"
                    />
                </div>
                <div className="grid gap-1.5">
                    <label htmlFor="create-model-best-for" className="text-sm font-medium">
                        Best For (Comma-separated)
                    </label>
                    <Input
                        id="create-model-best-for"
                        name="bestFor"
                        placeholder="reasoning, coding, analysis"
                    />
                </div>
                <label className="flex items-center justify-between gap-3 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 py-2 text-sm font-medium">
                    Thinking model
                    <input
                        name="thinking"
                        type="checkbox"
                        className="size-4 accent-(--color-accent-primary)"
                    />
                </label>
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button
                        type="button"
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
