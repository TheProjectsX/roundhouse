import React from "react";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";

interface EditModelModalProps {
    model: any;
    onClose: () => void;
    updateModel: any;
    isLoading: boolean;
}

export function EditModelModal({
    model,
    onClose,
    updateModel,
    isLoading,
}: EditModelModalProps) {
    return (
        <Modal
            onClose={onClose}
            ariaLabel="Edit model"
            showCloseButton
            className="w-full max-w-lg"
        >
            <div className="border-b border-(--color-border-primary) p-5">
                <h2 className="text-lg font-semibold">Edit Model</h2>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                    Update model details.
                </p>
            </div>
            <form
                className="grid gap-4 p-5"
                onSubmit={async (event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    const body = {
                        name: String(form.get("name")),
                        code: String(form.get("code")),
                        maxTokens: form.get("maxTokens")
                            ? Number(form.get("maxTokens"))
                            : null,
                        efficiencyScore: form.get("efficiencyScore")
                            ? Number(form.get("efficiencyScore")) / 100
                            : 0.8,
                    };

                    try {
                        await updateModel({ modelId: model.id, body }).unwrap();
                        toast.success("Model updated");
                        onClose();
                    } catch {
                        toast.error("Could not update model");
                    }
                }}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                        <label className="text-xs font-bold uppercase text-(--color-text-muted)">
                            Model Name
                        </label>
                        <Input
                            name="name"
                            defaultValue={model.name}
                            placeholder="GPT-4o"
                            required
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <label className="text-xs font-bold uppercase text-(--color-text-muted)">
                            Model Code
                        </label>
                        <Input
                            name="code"
                            defaultValue={model.code}
                            placeholder="gpt-4o"
                            required
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                        <label className="text-xs font-bold uppercase text-(--color-text-muted)">
                            Max Tokens
                        </label>
                        <Input
                            name="maxTokens"
                            type="number"
                            defaultValue={model.maxTokens ?? ""}
                            placeholder="128000"
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <label className="text-xs font-bold uppercase text-(--color-text-muted)">
                            Efficiency Score (%)
                        </label>
                        <Input
                            name="efficiencyScore"
                            type="number"
                            placeholder="80"
                            min="0"
                            max="100"
                            defaultValue={(
                                (model.efficiencyScore ?? 0) * 100
                            ).toFixed(0)}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        Update Model
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
