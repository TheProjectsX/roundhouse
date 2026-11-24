import React, { useState } from "react";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useGetProvidersQuery } from "@/shared/store/features/providers/providersApi";
import { toast } from "sonner";

interface CreateKeyModalProps {
    onClose: () => void;
    createKey: any;
    isLoading: boolean;
    defaultProviderCode?: string;
    onCreated?: (created: { id: string }) => void;
}

export function CreateKeyModal({
    onClose,
    createKey,
    isLoading,
    defaultProviderCode = "",
    onCreated,
}: CreateKeyModalProps) {
    const { data: providers = [] } = useGetProvidersQuery();
    const [selectedProvider, setSelectedProvider] =
        useState(defaultProviderCode);
    const [customProvider, setCustomProvider] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <Modal
            onClose={onClose}
            ariaLabel="Add API key"
            showCloseButton
            className="w-full max-w-xl"
        >
            <div className="border-b border-(--color-border-primary) p-5">
                <h2 className="text-lg font-semibold">Add Vault Key</h2>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                    Store a provider API key in your Key Vault so it can be
                    attached to Roundhouse API keys.
                </p>
            </div>
            <form
                className="grid gap-4 p-5"
                onSubmit={async (event) => {
                    event.preventDefault();
                    if (isSubmitting) return;

                    const form = new FormData(event.currentTarget);
                    const name = String(form.get("name") ?? "").trim();
                    const provider =
                        selectedProvider === "__custom__"
                            ? customProvider.trim()
                            : selectedProvider.trim();
                    const key = String(form.get("key") ?? "").trim();

                    if (!name || !key) {
                        toast.error("Name and key are required");
                        return;
                    }

                    setIsSubmitting(true);
                    try {
                        const created = await createKey({
                            name,
                            provider: provider || undefined,
                            key,
                        }).unwrap();
                        toast.success("Vault key added");
                        onCreated?.(created);
                        onClose();
                    } catch {
                        toast.error("Could not add vault key");
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
            >
                <label className="grid gap-2 text-sm font-medium">
                    Name
                    <Input
                        name="name"
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
                    Provider API Key
                    <Input
                        name="key"
                        type="password"
                        placeholder="sk-..."
                        required
                    />
                </label>
                <div className="flex justify-end gap-2 border-t border-(--color-border-subtle) pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || isSubmitting}>
                        Add Key
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
