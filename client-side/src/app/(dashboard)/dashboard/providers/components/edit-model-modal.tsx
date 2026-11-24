import React, { useState } from "react";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";
import { useUpdateProviderModelMutation } from "@/shared/store/features/providers/providersApi";

interface EditModelModalProps {
    model: any;
    onClose: () => void;
}

export function EditModelModal({ model, onClose }: EditModelModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updateModel, updateState] = useUpdateProviderModelMutation();

    return (
        <Modal
            onClose={onClose}
            ariaLabel={`Edit model ${model.name}`}
            className="grid w-full max-w-md gap-0"
        >
            <div className="border-b border-(--color-border-primary) p-5">
                <h2 className="text-lg font-semibold">Edit Model</h2>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                    Update model details for {model.name}
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
                        await updateModel({
                            modelId: model.id,
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
                        toast.success("Model updated successfully");
                        onClose();
                    } catch {
                        toast.error("Could not update model");
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
            >
                <div className="grid gap-1.5">
                    <label htmlFor="edit-model-name" className="text-sm font-medium">Model Name</label>
                    <Input
                        id="edit-model-name"
                        name="name"
                        placeholder="GPT-4 Turbo"
                        defaultValue={model.name}
                        required
                    />
                </div>
                <div className="grid gap-1.5">
                    <label htmlFor="edit-model-code" className="text-sm font-medium">Model Code</label>
                    <Input
                        id="edit-model-code"
                        name="code"
                        placeholder="gpt-4-turbo"
                        defaultValue={model.code}
                        required
                    />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                        <label htmlFor="edit-model-max-tokens" className="text-sm font-medium">
                            Max Tokens
                        </label>
                        <Input
                            id="edit-model-max-tokens"
                            name="maxTokens"
                            type="number"
                            min={1}
                            placeholder="4096"
                            defaultValue={model.maxTokens ?? ""}
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <label htmlFor="edit-model-efficiency" className="text-sm font-medium">
                            Efficiency (0–1)
                        </label>
                        <Input
                            id="edit-model-efficiency"
                            name="efficiencyScore"
                            type="number"
                            step="0.01"
                            min={0}
                            max={1}
                            placeholder="0.85"
                            defaultValue={model.efficiencyScore ?? ""}
                        />
                    </div>
                </div>
                <div className="grid gap-1.5">
                    <label htmlFor="edit-model-reset" className="text-sm font-medium">
                        Token Reset Interval (seconds)
                    </label>
                    <Input
                        id="edit-model-reset"
                        name="tokenResetInterval"
                        type="number"
                        min={1}
                        placeholder="60"
                        defaultValue={model.tokenResetInterval ?? ""}
                    />
                </div>
                <div className="grid gap-1.5">
                    <label htmlFor="edit-model-best-for" className="text-sm font-medium">
                        Best For (Comma-separated)
                    </label>
                    <Input
                        id="edit-model-best-for"
                        name="bestFor"
                        placeholder="reasoning, coding, analysis"
                        defaultValue={model.bestFor?.join(", ") || ""}
                    />
                </div>
                <label className="flex items-center justify-between gap-3 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 py-2 text-sm font-medium">
                    Thinking model
                    <input
                        name="thinking"
                        type="checkbox"
                        defaultChecked={Boolean(model.thinking)}
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
                        Update Model
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
