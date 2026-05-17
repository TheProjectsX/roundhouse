"use client";

import { LockKeyIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
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
import { KeySkeletons } from "./components/key-skeletons";
import { VaultKeyCard } from "./components/vault-key-card";

export default function KeysPage() {
    const dispatch = useAppDispatch();
    const { data: keys = [], isLoading } = useGetKeysManagerQuery();
    const [showCreate, setShowCreate] = useState(false);
    const [unlockPassword, setUnlockPassword] = useState("");
    const [unlockKeys, unlockState] = useUnlockKeysMutation();
    const [createKey, createState] = useCreateKeysManagerMutation();
    const [updateKey, updateState] = useUpdateKeysManagerMutation();
    const [deleteKey, deleteState] = useDeleteKeysManagerMutation();
    const unlockedKeys = useAppSelector((state) => state.unlock.unlockedKeys);
    const isUnlocked = Object.keys(unlockedKeys).length > 0;

    const handleUpdateStatus = async (id: string, active: boolean) => {
        try {
            await updateKey({
                id,
                body: { active },
            }).unwrap();
            toast.success(active ? "Vault key enabled" : "Vault key disabled");
        } catch {
            toast.error("Could not update vault key");
        }
    };

    const handleDeleteKey = async (id: string, name: string) => {
        if (!window.confirm(`Delete ${name}?`)) return;
        try {
            await deleteKey(id).unwrap();
            toast.success("Vault key deleted");
        } catch {
            toast.error("Could not delete vault key");
        }
    };

    return (
        <>
            <PageHeader
                title="Key Vault"
                description="Securely manage encrypted provider API keys."
                actions={
                    <Button
                        variant="secondary"
                        onClick={() => setShowCreate(true)}
                    >
                        Add API Key
                    </Button>
                }
            />
            <Card>
                <CardContent className="grid gap-3 pt-5 md:grid-cols-[1fr_auto]">
                    <Input
                        type="password"
                        value={unlockPassword}
                        onChange={(event) => setUnlockPassword(event.target.value)}
                        placeholder="Account password"
                        aria-label="Account password"
                    />
                    <Button
                        variant={isUnlocked ? "secondary" : "primary"}
                        disabled={unlockState.isLoading}
                        onClick={async () => {
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
                                toast.success("Keys unlocked");
                            } catch {
                                toast.error("Could not unlock keys");
                            }
                        }}
                    >
                        <LockKeyIcon size={18} />{" "}
                        {isUnlocked ? "Lock Keys" : "Unlock All Keys"}
                    </Button>
                </CardContent>
            </Card>
            {showCreate && (
                <CreateKeyModal
                    onClose={() => setShowCreate(false)}
                    createKey={createKey}
                    isLoading={createState.isLoading}
                />
            )}
            <Card>
                <CardContent className="flex items-start gap-4 pt-5">
                    <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[color-mix(in_srgb,var(--color-status-warning)_16%,transparent)] text-(--color-status-warning)">
                        <ShieldCheckIcon size={20} weight="duotone" />
                    </div>
                    <div>
                        <h2 className="font-semibold tracking-tight">
                            Keys are encrypted and masked by default
                        </h2>
                        <p className="mt-1 text-sm text-(--color-text-secondary)">
                            Unlocking stores revealed values only in memory. Use the
                            lock action to clear them immediately.
                        </p>
                    </div>
                </CardContent>
            </Card>
            <section className="grid gap-4 xl:grid-cols-2">
                {isLoading ? <KeySkeletons /> : null}
                {!isLoading && keys.length === 0 ? (
                    <div className="xl:col-span-2">
                        <EmptyState
                            title="No vault keys saved"
                            description="Add provider API keys to the vault so they can be attached to provider selections."
                        />
                    </div>
                ) : null}
                {keys.map((key) => (
                    <VaultKeyCard
                        key={key.id}
                        item={key}
                        revealed={unlockedKeys[key.id]}
                        onUpdateStatus={handleUpdateStatus}
                        onDelete={handleDeleteKey}
                        isUpdating={updateState.isLoading}
                        isDeleting={deleteState.isLoading}
                    />
                ))}
            </section>
        </>
    );
}
