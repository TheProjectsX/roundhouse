import React from "react";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";
import { ContentStatus } from "@/shared/types/enums";

interface CreateModelModalProps {
    providerId: string;
    onClose: () => void;
    createModel: any;
    isLoading: boolean;
}

export function CreateModelModal({
    providerId,
    onClose,
    createModel,
    isLoading,
}: CreateModelModalProps) {
    return (
        <Modal
            onClose={onClose}
            ariaLabel="Add model"
            showCloseButton
            className="w-full max-w-lg"
        >
            <div className="border-b border-(--color-border-primary) p-5">
                <h2 className="text-lg font-semibold">Add Model</h2>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                    Add a new model to this provider's catalog.
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
                        status: ContentStatus.ACTIVE,
                    };

                    try {
                        await createModel({ providerId, body }).unwrap();
                        toast.success("Model created");
                        onClose();
                    } catch {
                        toast.error("Could not create model");
                    }
                }}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                        <label className="text-xs font-bold uppercase text-(--color-text-muted)">
                            Model Name
                        </label>
                        <Input name="name" placeholder="GPT-4o" required />
                    </div>
                    <div className="grid gap-1.5">
                        <label className="text-xs font-bold uppercase text-(--color-text-muted)">
                            Model Code
                        </label>
                        <Input name="code" placeholder="gpt-4o" required />
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
                            defaultValue="80"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        Create Model
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
