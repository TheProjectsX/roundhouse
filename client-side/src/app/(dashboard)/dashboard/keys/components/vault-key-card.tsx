import React, { useState } from "react";
import {
    CopyIcon,
    EyeIcon,
    EyeSlashIcon,
    PencilIcon,
    TimerIcon,
    TrashIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { formatDate } from "@/shared/lib/utils";

interface VaultKeyCardProps {
    item: any;
    revealed: string | undefined;
    onEdit: (item: any) => void;
    onUpdateStatus: (id: string, active: boolean) => Promise<void>;
    onDelete: (id: string, name: string) => Promise<void>;
    isUpdating: boolean;
    isDeleting: boolean;
}

export function VaultKeyCard({
    item,
    revealed,
    onEdit,
    onUpdateStatus,
    onDelete,
    isUpdating,
    isDeleting,
}: VaultKeyCardProps) {
    const [hideLocally, setHideLocally] = useState(false);
    const showPlaintext = Boolean(revealed && !hideLocally);

    return (
        <Card>
            <CardContent className="grid gap-4 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-semibold tracking-tight">
                                {item.name}
                            </h2>
                            <StatusBadge status={item.active} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            <Badge className="font-mono text-[11px]">
                                {item.provider ?? "Unassigned provider"}
                            </Badge>
                        </div>
                    </div>
                    {revealed ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => setHideLocally((v) => !v)}
                        >
                            {showPlaintext ? <EyeSlashIcon size={14} /> : <EyeIcon size={14} />}
                            {showPlaintext ? "Mask" : "Show"}
                        </Button>
                    ) : null}
                </div>

                <div className="truncate rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) px-3 py-2 font-mono text-xs text-(--color-text-primary)">
                    {showPlaintext ? revealed : item.key}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-(--color-border-subtle) pt-3">
                    <p className="text-xs text-(--color-text-muted)" suppressHydrationWarning>
                        Updated {formatDate(item.updatedAt)}
                    </p>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {revealed ? (
                            <span className="inline-flex items-center gap-1 font-mono text-xs text-(--color-status-warning)">
                                <TimerIcon size={13} /> unlocked
                            </span>
                        ) : null}
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => onUpdateStatus(item.id, !item.active)}
                        >
                            {item.active ? "Disable" : "Enable"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit key"
                            title="Edit key"
                            onClick={() => onEdit(item)}
                        >
                            <PencilIcon size={16} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Copy key"
                            title={
                                revealed
                                    ? "Copy key"
                                    : "Unlock keys to copy the full value"
                            }
                            disabled={!revealed}
                            onClick={async () => {
                                if (!revealed) return;
                                await navigator.clipboard.writeText(revealed);
                                toast.success("Vault key copied");
                            }}
                        >
                            <CopyIcon size={16} />
                        </Button>
                        <div className="ml-1 border-l border-(--color-border-subtle) pl-2">
                            <Button
                                variant="danger:outline"
                                size="icon"
                                aria-label="Delete key"
                                title="Delete key"
                                disabled={isDeleting}
                                onClick={() => onDelete(item.id, item.name)}
                            >
                                <TrashIcon size={16} />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
