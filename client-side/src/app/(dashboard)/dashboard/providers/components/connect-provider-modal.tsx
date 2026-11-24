"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircleIcon, KeyIcon, PlugIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
    useCreateKeysManagerMutation,
    useGetKeysManagerQuery,
} from "@/shared/store/features/keysManager/keysManagerApi";
import {
    useGetApiKeysQuery,
    useSelectApiKeyProviderMutation,
} from "@/shared/store/features/apikeys/apikeysApi";
import type { ProviderListItem } from "@/shared/types/entities";

interface ConnectProviderModalProps {
    provider: ProviderListItem;
    onClose: () => void;
}

export function ConnectProviderModal({
    provider,
    onClose,
}: ConnectProviderModalProps) {
    const { data: vaultKeys = [] } = useGetKeysManagerQuery();
    const { data: apiKeys = [] } = useGetApiKeysQuery();
    const [createVaultKey, createVaultKeyState] = useCreateKeysManagerMutation();
    const [selectProvider, selectProviderState] =
        useSelectApiKeyProviderMutation();

    const matchingKeys = useMemo(() => {
        return vaultKeys.filter((k) => {
            if (!k.active) return false;
            const hint = (k.provider ?? "").toLowerCase();
            return (
                !hint ||
                hint === provider.code.toLowerCase() ||
                hint === provider.type.toLowerCase()
            );
        });
    }, [vaultKeys, provider.code, provider.type]);

    const [keyMode, setKeyMode] = useState<"existing" | "new">(
        matchingKeys.length > 0 ? "existing" : "new",
    );
    const [selectedVaultKeyIds, setSelectedVaultKeyIds] = useState<string[]>(
        () => (matchingKeys.length > 0 ? [matchingKeys[0].id] : []),
    );
    const [newKeyName, setNewKeyName] = useState(`${provider.name} Key`);
    const [newKeySecrets, setNewKeySecrets] = useState("");
    const [selectedApiKeyId, setSelectedApiKeyId] = useState("");

    useEffect(() => {
        if (selectedVaultKeyIds.length === 0 && matchingKeys.length > 0) {
            setSelectedVaultKeyIds([matchingKeys[0].id]);
        }
    }, [matchingKeys, selectedVaultKeyIds.length]);

    useEffect(() => {
        if (!selectedApiKeyId && apiKeys.length > 0) {
            const active = apiKeys.find((k) => k.active) ?? apiKeys[0];
            setSelectedApiKeyId(active.id);
        }
    }, [apiKeys, selectedApiKeyId]);

    const parsedNewKeys = useMemo(
        () =>
            Array.from(
                new Set(
                    newKeySecrets
                        .split(/[\r\n,]+/)
                        .map((k) => k.trim())
                        .filter(Boolean),
                ),
            ),
        [newKeySecrets],
    );

    const toggleVaultKey = (id: string) => {
        setSelectedVaultKeyIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
        );
    };

    const isSubmitting =
        createVaultKeyState.isLoading || selectProviderState.isLoading;

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApiKeyId) {
            toast.error("Create or select a Roundhouse API key first");
            return;
        }

        let vaultKeyIdsToLink = [...selectedVaultKeyIds];

        try {
            if (keyMode === "new") {
                if (parsedNewKeys.length === 0) {
                    toast.error("Paste at least one provider API key");
                    return;
                }

                const baseLabel = newKeyName.trim() || `${provider.name} Key`;
                const createdIds: string[] = [];
                for (let i = 0; i < parsedNewKeys.length; i += 1) {
                    const label =
                        parsedNewKeys.length === 1
                            ? baseLabel
                            : `${baseLabel} #${i + 1}`;
                    const created = await createVaultKey({
                        name: label,
                        provider: provider.code,
                        key: parsedNewKeys[i],
                    }).unwrap();
                    createdIds.push(created.id);
                }
                vaultKeyIdsToLink = createdIds;
            } else if (vaultKeyIdsToLink.length === 0) {
                toast.error("Select at least one Vault Key");
                return;
            }

            await selectProvider({
                apiKeyId: selectedApiKeyId,
                providerId: provider.id,
                apiKeysManagerIds: vaultKeyIdsToLink,
            }).unwrap();

            toast.success(
                `Linked ${vaultKeyIdsToLink.length} ${
                    vaultKeyIdsToLink.length === 1 ? "key" : "keys"
                } to ${provider.name}!`,
            );
            onClose();
        } catch (err: any) {
            toast.error(
                err?.data?.message || `Could not connect ${provider.name}`,
            );
        }
    };

    return (
        <Modal
            onClose={onClose}
            ariaLabel={`Connect ${provider.name}`}
            className="grid w-full max-w-lg gap-0"
        >
            <div className="flex items-start justify-between gap-4 border-b border-(--color-border-primary) p-5">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">
                            {provider.connected
                                ? `Link Keys to ${provider.name}`
                                : `Connect ${provider.name}`}
                        </h2>
                        <Badge>{provider.type}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-(--color-text-secondary)">
                        Attach one or multiple API keys for automatic rotation
                        and rate-limit failover across {provider.activeModelsCount}{" "}
                        models.
                    </p>
                </div>
                <Button variant="secondary" size="sm" onClick={onClose}>
                    Close
                </Button>
            </div>

            <form onSubmit={handleConnect} className="grid gap-4 p-5">
                <div className="grid gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                            1. Provider API Key(s)
                        </span>
                        {matchingKeys.length > 0 ? (
                            <div className="flex gap-1">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        keyMode === "existing"
                                            ? "primary"
                                            : "secondary"
                                    }
                                    onClick={() => setKeyMode("existing")}
                                >
                                    Use Vault Keys ({matchingKeys.length})
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        keyMode === "new"
                                            ? "primary"
                                            : "secondary"
                                    }
                                    onClick={() => setKeyMode("new")}
                                >
                                    Paste New Key(s)
                                </Button>
                            </div>
                        ) : null}
                    </div>

                    {keyMode === "existing" && matchingKeys.length > 0 ? (
                        <div className="grid gap-2 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) p-3">
                            <div className="flex items-center justify-between text-xs text-(--color-text-muted)">
                                <span>
                                    {selectedVaultKeyIds.length} of{" "}
                                    {matchingKeys.length} selected
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="hover:text-(--color-text-primary)"
                                        onClick={() =>
                                            setSelectedVaultKeyIds(
                                                matchingKeys.map((k) => k.id),
                                            )
                                        }
                                    >
                                        Select all
                                    </button>
                                    <button
                                        type="button"
                                        className="hover:text-(--color-text-primary)"
                                        onClick={() =>
                                            setSelectedVaultKeyIds([])
                                        }
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                            <div className="grid max-h-40 gap-1.5 overflow-y-auto">
                                {matchingKeys.map((k) => (
                                    <label
                                        key={k.id}
                                        className="flex cursor-pointer items-center justify-between gap-2 rounded border border-(--color-border-subtle) bg-(--color-bg-card) px-2.5 py-2 text-sm"
                                    >
                                        <span className="flex min-w-0 items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedVaultKeyIds.includes(
                                                    k.id,
                                                )}
                                                onChange={() =>
                                                    toggleVaultKey(k.id)
                                                }
                                                className="size-4 accent-(--color-accent-primary)"
                                            />
                                            <span className="truncate font-medium">
                                                {k.name}
                                            </span>
                                        </span>
                                        {k.provider ? (
                                            <Badge className="shrink-0 font-mono text-xs">
                                                {k.provider}
                                            </Badge>
                                        ) : null}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-2.5 rounded-md border border-(--color-border-subtle) bg-(--color-bg-card) p-3">
                            <Input
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                placeholder="Key label prefix (e.g. Groq Free)"
                            />
                            <textarea
                                rows={3}
                                value={newKeySecrets}
                                onChange={(e) =>
                                    setNewKeySecrets(e.target.value)
                                }
                                placeholder="Paste one or multiple API keys (one per line or comma-separated)"
                                className="rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 py-2 font-mono text-xs outline-none focus:border-(--color-border-focused)"
                            />
                            {parsedNewKeys.length > 0 ? (
                                <p className="text-xs text-(--color-status-success)">
                                    Ready to save & link {parsedNewKeys.length}{" "}
                                    {parsedNewKeys.length === 1 ? "key" : "keys"}
                                </p>
                            ) : null}
                        </div>
                    )}
                </div>

                <div className="grid gap-2">
                    <label className="text-sm font-medium">
                        2. Target Roundhouse API Key
                    </label>
                    {apiKeys.length === 0 ? (
                        <div className="rounded-md border border-dashed border-(--color-border-primary) p-3 text-sm text-(--color-text-secondary)">
                            No Roundhouse API keys found.{" "}
                            <Link
                                href="/dashboard/apikeys"
                                className="font-medium text-(--color-accent-primary) underline"
                            >
                                Create one first
                            </Link>
                            .
                        </div>
                    ) : (
                        <select
                            value={selectedApiKeyId}
                            onChange={(e) =>
                                setSelectedApiKeyId(e.target.value)
                            }
                            className="h-10 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm outline-none"
                        >
                            {apiKeys.map((k) => (
                                <option key={k.id} value={k.id}>
                                    {k.name} {!k.active ? "(inactive)" : ""}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-(--color-border-subtle) pt-4">
                    <span className="flex items-center gap-1.5 text-xs text-(--color-text-muted)">
                        <KeyIcon size={14} /> Encrypted with AES-GCM in Vault
                    </span>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || apiKeys.length === 0}
                        >
                            {provider.connected ? (
                                <CheckCircleIcon size={16} />
                            ) : (
                                <PlugIcon size={16} />
                            )}
                            {isSubmitting
                                ? "Linking..."
                                : provider.connected
                                  ? "Link Selected Keys"
                                  : "Connect & Enable Models"}
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
