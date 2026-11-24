"use client";

import {
    EyeIcon,
    EyeSlashIcon,
    LockKeyIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon,
    TimerIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { EmptyState } from "@/shared/components/data-display/empty-state";
import { Input } from "@/shared/components/ui/input";
import {
    useCreateKeysManagerMutation,
    useDeleteKeysManagerMutation,
    useGetKeysManagerQuery,
    useUnlockKeysMutation,
    useUpdateKeysManagerMutation,
} from "@/shared/store/features/keysManager/keysManagerApi";
import { lock, unlock } from "@/shared/store/unlock-slice";
import { useAppDispatch, useAppSelector } from "@/shared/store/hooks";
import { CreateKeyModal } from "./components/create-key-modal";
import { EditKeyModal } from "./components/edit-key-modal";
import { KeySkeletons } from "./components/key-skeletons";
import { VaultKeyCard } from "./components/vault-key-card";

const AUTO_LOCK_MS = 5 * 60 * 1000;

type VaultSortOption =
    | "-updatedAt"
    | "updatedAt"
    | "-createdAt"
    | "createdAt"
    | "name"
    | "-name"
    | "-active";

export default function KeysPage() {
    const dispatch = useAppDispatch();
    const [sortBy, setSortBy] = useState<VaultSortOption>("-updatedAt");
    const { data: keys = [], isLoading, isError, refetch } =
        useGetKeysManagerQuery({ order: sortBy });
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [editingKey, setEditingKey] = useState<any>(null);
    const [confirmDelete, setConfirmDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [unlockPassword, setUnlockPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [unlockKeys, unlockState] = useUnlockKeysMutation();
    const [createKey, createState] = useCreateKeysManagerMutation();
    const [updateKey, updateState] = useUpdateKeysManagerMutation();
    const [deleteKey, deleteState] = useDeleteKeysManagerMutation();
    const unlockedKeys = useAppSelector((state) => state.unlock.unlockedKeys);
    const unlockedAt = useAppSelector((state) => state.unlock.unlockedAt);
    const isUnlocked = Object.keys(unlockedKeys).length > 0;
    const [remainingSec, setRemainingSec] = useState<number | null>(null);

    useEffect(() => {
        if (!isUnlocked || !unlockedAt) {
            setRemainingSec(null);
            return;
        }

        const updateCountdown = () => {
            const elapsed = Date.now() - unlockedAt;
            const remaining = Math.max(
                0,
                Math.ceil((AUTO_LOCK_MS - elapsed) / 1000),
            );
            if (remaining <= 0) {
                dispatch(lock());
                setUnlockPassword("");
                setRemainingSec(null);
                toast.info("Vault keys auto-locked");
                return;
            }
            setRemainingSec(remaining);
        };

        updateCountdown();
        const interval = window.setInterval(updateCountdown, 1000);
        return () => window.clearInterval(interval);
    }, [isUnlocked, unlockedAt, dispatch]);

    const filteredKeys = useMemo(() => {
        const term = search.trim().toLowerCase();
        const filtered = !term
            ? keys
            : keys.filter(
                  (k) =>
                      k.name.toLowerCase().includes(term) ||
                      (k.provider ?? "").toLowerCase().includes(term),
              );

        return [...filtered].sort((a, b) => {
            switch (sortBy) {
                case "updatedAt":
                    return (
                        new Date(a.updatedAt).getTime() -
                        new Date(b.updatedAt).getTime()
                    );
                case "-createdAt":
                    return (
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    );
                case "createdAt":
                    return (
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime()
                    );
                case "name":
                    return a.name.localeCompare(b.name);
                case "-name":
                    return b.name.localeCompare(a.name);
                case "-active":
                    if (a.active !== b.active) return a.active ? -1 : 1;
                    return (
                        new Date(b.updatedAt).getTime() -
                        new Date(a.updatedAt).getTime()
                    );
                case "-updatedAt":
                default:
                    return (
                        new Date(b.updatedAt).getTime() -
                        new Date(a.updatedAt).getTime()
                    );
            }
        });
    }, [keys, search, sortBy]);

    const handleUnlockSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isUnlocked) {
            dispatch(lock());
            setUnlockPassword("");
            return;
        }
        if (!unlockPassword) {
            toast.error("Enter your account password");
            return;
        }
        try {
            const result = await unlockKeys({
                password: unlockPassword,
            }).unwrap();
            dispatch(unlock(result));
            setUnlockPassword("");
            toast.success("Keys unlocked for 5 minutes");
        } catch (err: any) {
            toast.error(err?.data?.message || "Invalid password or could not unlock keys");
        }
    };

    const handleUpdateStatus = async (id: string, active: boolean) => {
        try {
            await updateKey({
                id,
                body: { active },
            }).unwrap();
            toast.success(active ? "Vault key enabled" : "Vault key disabled");
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not update vault key");
        }
    };

    const handleDeleteKey = async (id: string, name: string) => {
        setConfirmDelete({ id, name });
    };

    const confirmDeleteKey = async () => {
        if (!confirmDelete) return;
        try {
            await deleteKey(confirmDelete.id).unwrap();
            toast.success("Vault key deleted");
            setConfirmDelete(null);
        } catch (err: any) {
            toast.error(err?.data?.message || "Could not delete vault key");
        }
    };

    const formatCountdown = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, "0")}`;
    };

    return (
        <>
            <PageHeader
                title="Key Vault"
                description="Manage encrypted upstream provider credentials before attaching them to Roundhouse API keys."
                actions={
                    <Button onClick={() => setShowCreate(true)}>
                        Add Vault Key
                    </Button>
                }
            />
            <Card>
                <CardContent className="p-4">
                    <form
                        onSubmit={handleUnlockSubmit}
                        className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center"
                    >
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={unlockPassword}
                                onChange={(event) => setUnlockPassword(event.target.value)}
                                placeholder={
                                    isUnlocked
                                        ? "Vault unlocked in memory"
                                        : "Enter account password to unlock keys..."
                                }
                                aria-label="Account password"
                                autoComplete="current-password"
                                disabled={isUnlocked}
                                className="pr-11"
                            />
                            {!isUnlocked ? (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-0 top-0 grid size-9 place-items-center rounded-r-sm text-(--color-text-muted) hover:bg-(--color-bg-card-hover) hover:text-(--color-text-primary)"
                                >
                                    {showPassword ? <EyeSlashIcon size={16} /> : <EyeIcon size={16} />}
                                </button>
                            ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {isUnlocked && remainingSec !== null && (
                                <span className="inline-flex items-center gap-1 font-mono text-xs text-(--color-status-warning)">
                                    <TimerIcon size={14} />
                                    Auto-lock {formatCountdown(remainingSec)}
                                </span>
                            )}
                            <Button
                                type="submit"
                                variant={isUnlocked ? "secondary" : "primary"}
                                disabled={unlockState.isLoading}
                            >
                                <LockKeyIcon size={16} />
                                {isUnlocked ? "Lock Keys" : "Unlock All Keys"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {keys.length > 0 ? (
                <div className="flex flex-col gap-3 rounded-md border border-(--color-border-primary) bg-(--color-bg-card) p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-sm">
                        <MagnifyingGlassIcon
                            size={15}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
                        />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter vault keys by name or provider..."
                            aria-label="Filter vault keys"
                            className="pl-9"
                        />
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <select
                            value={sortBy}
                            onChange={(e) =>
                                setSortBy(e.target.value as VaultSortOption)
                            }
                            aria-label="Sort vault keys"
                            className="min-h-9 rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-xs text-(--color-text-primary) outline-none focus:border-(--color-border-focused)"
                        >
                            <option value="-updatedAt">
                                Updated (Newest first)
                            </option>
                            <option value="updatedAt">
                                Updated (Oldest first)
                            </option>
                            <option value="-createdAt">
                                Created (Newest first)
                            </option>
                            <option value="createdAt">
                                Created (Oldest first)
                            </option>
                            <option value="-active">Active first</option>
                            <option value="name">Name (A-Z)</option>
                            <option value="-name">Name (Z-A)</option>
                        </select>
                        <span className="font-mono text-xs text-(--color-text-muted)">
                            {filteredKeys.length}/{keys.length}
                        </span>
                    </div>
                </div>
            ) : null}

            {showCreate && (
                <CreateKeyModal
                    onClose={() => setShowCreate(false)}
                    createKey={createKey}
                    isLoading={createState.isLoading}
                />
            )}
            {editingKey && (
                <EditKeyModal
                    item={editingKey}
                    onClose={() => setEditingKey(null)}
                    updateKey={updateKey}
                    isLoading={updateState.isLoading}
                />
            )}
            {confirmDelete && (
                <ConfirmModal
                    title="Delete Vault Key"
                    description={`Are you sure you want to delete "${confirmDelete.name}"? It will be unlinked from all provider selections, and any provider selection left with no remaining vault keys will be automatically deactivated.`}
                    isLoading={deleteState.isLoading}
                    onConfirm={confirmDeleteKey}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
            <Card>
                <CardContent className="flex items-start gap-3 p-4">
                    <ShieldCheckIcon size={18} className="mt-0.5 shrink-0 text-(--color-status-warning)" />
                    <p className="text-xs leading-5 text-(--color-text-secondary)">
                        <strong className="font-semibold text-(--color-text-primary)">
                            In-memory unlock policy:
                        </strong>{" "}
                        Keys are encrypted at rest and masked by default. Unlocking keeps decrypted values in memory for 5 minutes or until manually locked.
                    </p>
                </CardContent>
            </Card>

            {isError ? (
                <EmptyState
                    title="Could not load vault keys"
                    description="Check your connection or session and retry."
                    action={
                        <Button variant="secondary" onClick={() => refetch()}>
                            Retry
                        </Button>
                    }
                />
            ) : (
                <section className="grid gap-4 xl:grid-cols-2">
                    {isLoading ? <KeySkeletons /> : null}
                    {!isLoading && filteredKeys.length === 0 ? (
                        <div className="xl:col-span-2">
                            <EmptyState
                                title={search ? "No matching vault keys" : "No vault keys saved"}
                                description={
                                    search
                                        ? "Try clearing your search filter."
                                        : "Add provider API keys to the vault so they can be attached to provider selections."
                                }
                                action={
                                    !search ? (
                                        <Button onClick={() => setShowCreate(true)}>
                                            Add Vault Key
                                        </Button>
                                    ) : undefined
                                }
                            />
                        </div>
                    ) : null}
                    {filteredKeys.map((key) => (
                        <VaultKeyCard
                            key={key.id}
                            item={key}
                            revealed={unlockedKeys[key.id]}
                            onEdit={setEditingKey}
                            onUpdateStatus={handleUpdateStatus}
                            onDelete={handleDeleteKey}
                            isUpdating={updateState.isLoading}
                            isDeleting={deleteState.isLoading}
                        />
                    ))}
                </section>
            )}
        </>
    );
}
