import React, { useMemo, useState } from "react";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useGetProvidersQuery } from "@/shared/store/features/providers/providersApi";
import type { ApiKeysManagerItem } from "@/shared/types/entities";
import { toast } from "sonner";

interface EditKeyModalProps {
    item: ApiKeysManagerItem;
    onClose: () => void;
    updateKey: any;
    isLoading: boolean;
}

export function EditKeyModal({
    item,
    onClose,
    updateKey,
    isLoading,
}: EditKeyModalProps) {
    const { data: providers = [] } = useGetProvidersQuery();
    const knownCodes = useMemo(
        () => new Set(providers.map((p) => p.code)),
        [providers],
    );
    const initialIsCustom = Boolean(
        item.provider && !knownCodes.has(item.provider),
    );
    const [selectedProvider, setSelectedProvider] = useState(
        initialIsCustom ? "__custom__" : (item.provider ?? ""),
    );
    const [customProvider, setCustomProvider] = useState(
        initialIsCustom ? (item.provider ?? "") : "",
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <Modal
            onClose={onClose}
            ariaLabel={`Edit ${item.name}`}
            showCloseButton
            className="w-full max-w-xl"
        >
            <div className="border-b border-(--color-border-primary) p-5">
                <h2 className="text-lg font-semibold">Edit Vault Key</h2>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                    Update the label, linked provider, or rotate the secret key.
                </p>
            </div>
            <form
                className="grid gap-4 p-5"
                onSubmit={async (event) => {
                    event.preventDefault();
                    if (isSubmitting) return;

                    const form = new FormData(event.currentTarget);
                    const name = String(form.get("name") ?? "").trim();
                    const key = String(form.get("key") ?? "").trim();
                    const provider =
                        selectedProvider === "__custom__"
                            ? customProvider.trim()
                            : selectedProvider.trim();

                    if (!name) {
                        toast.error("Name is required");
                        return;
                    }

                    setIsSubmitting(true);
                    try {
                        await updateKey({
                            id: item.id,
                            body: {
                                name,
                                provider: provider || undefined,
                                ...(key ? { key } : {}),
                            },
                        }).unwrap();
                        toast.success("Vault key updated");
                        onClose();
                    } catch {
                        toast.error("Could not update vault key");
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
            >
                <label className="grid gap-2 text-sm font-medium">
                    Name
                    <Input
                        name="name"
                        defaultValue={item.name}
                        placeholder="OpenAI production"
                        required
                    />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                    Provider
                    <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="min-h-10 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm text-(--color-text-primary) outline-none"
                    >
                        <option value="">Unassigned (any provider)</option>
                        {providers.map((p) => (
                            <option key={p.id} value={p.code}>
                                {p.name} ({p.code})
                            </option>
                        ))}
                        <option value="__custom__">Other / Custom code</option>
                    </select>
                </label>
                {selectedProvider === "__custom__" && (
                    <label className="grid gap-2 text-sm font-medium">
                        Custom provider code
                        <Input
                            value={customProvider}
                            onChange={(e) => setCustomProvider(e.target.value)}
                            placeholder="my-custom-provider"
                        />
                    </label>
                )}
                <label className="grid gap-2 text-sm font-medium">
                    Rotate API Key (optional)
                    <Input
                        name="key"
                        type="password"
                        placeholder="Leave blank to keep existing key"
                    />
                </label>
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || isSubmitting}>
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
