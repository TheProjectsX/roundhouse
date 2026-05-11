"use client";

import {
    CopyIcon,
    LockKeyIcon,
    ShieldCheckIcon,
    TimerIcon,
    TrashIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import {
    useCreateKeysManagerMutation,
    useDeleteKeysManagerMutation,
    useGetKeysManagerQuery,
    useUnlockKeysMutation,
    useUpdateKeysManagerMutation,
} from "@/shared/store/api";
import { lock, unlock } from "@/shared/store/unlock-slice";
import { useAppDispatch, useAppSelector } from "@/shared/store/hooks";
import { formatDate } from "@/shared/lib/utils";

export default function KeysPage() {
    const dispatch = useAppDispatch();
    const { data: keys = [], isLoading } = useGetKeysManagerQuery();
    const [showCreate, setShowCreate] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [unlockPassword, setUnlockPassword] = useState("");
    const [unlockKeys, unlockState] = useUnlockKeysMutation();
    const [createKey, createState] = useCreateKeysManagerMutation();
    const [updateKey, updateState] = useUpdateKeysManagerMutation();
    const [deleteKey, deleteState] = useDeleteKeysManagerMutation();
    const unlockedKeys = useAppSelector((state) => state.unlock.unlockedKeys);
    const isUnlocked = Object.keys(unlockedKeys).length > 0;

    return (
        <>
            <PageHeader
                title="Key Vault"
                description="Securely manage encrypted provider API keys."
                actions={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setShowCreate((value) => !value)}
                        >
                            Add API Key
                        </Button>
                    </>
                }
            />
            <Card>
                <CardContent className="grid gap-3 pt-5 md:grid-cols-[1fr_auto]">
                    <Input
                        type="password"
                        value={unlockPassword}
                        onChange={(event) =>
                            setUnlockPassword(event.target.value)
                        }
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
            {showCreate ? (
                <Card>
                    <CardContent className="pt-5">
                        <form
                            className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
                            onSubmit={async (event) => {
                                event.preventDefault();
                                if (isSubmitting) return;

                                const form = new FormData(event.currentTarget);
                                const name = String(
                                    form.get("name") ?? "",
                                ).trim();
                                const provider = String(
                                    form.get("provider") ?? "",
                                ).trim();
                                const key = String(
                                    form.get("key") ?? "",
                                ).trim();

                                if (!name || !key) {
                                    toast.error("Name and key are required");
                                    return;
                                }

                                setIsSubmitting(true);
                                try {
                                    await createKey({
                                        name,
                                        provider: provider || undefined,
                                        key,
                                    }).unwrap();
                                    toast.success("Vault key added");
                                    event.currentTarget.reset();
                                    setShowCreate(false);
                                } catch {
                                    toast.error("Could not add vault key");
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                        >
                            <Input
                                name="name"
                                placeholder="OpenAI production"
                                required
                            />
                            <Input name="provider" placeholder="openai" />
                            <Input
                                name="key"
                                placeholder="Provider API key"
                                required
                            />
                            <Button
                                type="submit"
                                disabled={createState.isLoading || isSubmitting}
                            >
                                Add
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            ) : null}
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
                            Unlocking stores revealed values only in memory. Use
                            the lock action to clear them immediately.
                        </p>
                    </div>
                </CardContent>
            </Card>
            <section className="grid gap-4 xl:grid-cols-2">
                {isLoading ? <KeySkeletons /> : null}
                {keys.map((key) => {
                    const revealed = unlockedKeys[key.id];
                    return (
                        <Card key={key.id}>
                            <CardContent className="grid gap-4 pt-5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-semibold tracking-tight">
                                            {key.name}
                                        </h2>
                                        <StatusBadge status={key.active} />
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <Badge className="bg-[color-mix(in_srgb,var(--color-accent-secondary)_12%,transparent)] text-(--color-accent-secondary)">
                                            {key.provider ??
                                                "Unassigned provider"}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="rounded-md bg-(--color-bg-input) px-3 py-2 font-mono text-sm">
                                    {revealed ?? key.key}
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs text-(--color-text-muted)">
                                        Updated {formatDate(key.updatedAt)}
                                    </p>
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        {revealed ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-(--color-status-warning)">
                                                <TimerIcon size={14} /> visible
                                            </span>
                                        ) : null}
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={updateState.isLoading}
                                            onClick={async () => {
                                                try {
                                                    await updateKey({
                                                        id: key.id,
                                                        body: {
                                                            active: !key.active,
                                                        },
                                                    }).unwrap();
                                                    toast.success(
                                                        key.active
                                                            ? "Vault key disabled"
                                                            : "Vault key enabled",
                                                    );
                                                } catch {
                                                    toast.error(
                                                        "Could not update vault key",
                                                    );
                                                }
                                            }}
                                        >
                                            {key.active ? "Disable" : "Enable"}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Copy key"
                                            onClick={async () => {
                                                await navigator.clipboard.writeText(
                                                    revealed ?? key.key,
                                                );
                                                toast.success(
                                                    "Vault key copied",
                                                );
                                            }}
                                        >
                                            <CopyIcon size={18} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Delete key"
                                            disabled={deleteState.isLoading}
                                            onClick={async () => {
                                                if (
                                                    !window.confirm(
                                                        `Delete ${key.name}?`,
                                                    )
                                                )
                                                    return;
                                                try {
                                                    await deleteKey(
                                                        key.id,
                                                    ).unwrap();
                                                    toast.success(
                                                        "Vault key deleted",
                                                    );
                                                } catch {
                                                    toast.error(
                                                        "Could not delete vault key",
                                                    );
                                                }
                                            }}
                                        >
                                            <TrashIcon size={18} />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </section>
        </>
    );
}

function KeySkeletons() {
    return Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
            <CardContent className="grid gap-4 pt-5">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-10" />
                <div className="flex justify-end gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="size-10" />
                    <Skeleton className="size-10" />
                </div>
                <Skeleton className="h-4 w-32" />
            </CardContent>
        </Card>
    ));
}
