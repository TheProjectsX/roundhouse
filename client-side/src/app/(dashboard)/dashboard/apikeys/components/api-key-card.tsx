import React from "react";
import {
    CopyIcon,
    DotsThreeIcon,
    GearIcon,
    PowerIcon,
    TrashIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { formatDate, formatNumber } from "@/shared/lib/utils";
import { routes } from "@/shared/constants/routes";
import { Metric } from "./metric";

interface ApiKeyCardProps {
    item: any;
    isMenuOpen: boolean;
    onToggleMenu: () => void;
    onUpdateStatus: (id: string, active: boolean) => Promise<void>;
    onDelete: (id: string, name: string) => Promise<void>;
    isUpdating: boolean;
    isDeleting: boolean;
}

export function ApiKeyCard({
    item,
    isMenuOpen,
    onToggleMenu,
    onUpdateStatus,
    onDelete,
    isUpdating,
    isDeleting,
}: ApiKeyCardProps) {
    return (
        <Card className="transition-colors hover:bg-(--color-bg-card-hover)">
            <CardHeader className="relative">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h2 className="font-semibold tracking-tight">
                            {item.name}
                        </h2>
                        <StatusBadge status={item.active} />
                    </div>
                    <div className="mt-3 flex min-h-11 items-center gap-2 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3">
                        <code className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-(--color-text-primary)">
                            {item.key.slice(0, 11)}****{item.key.slice(-5)}
                        </code>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Copy key"
                            onClick={async () => {
                                await navigator.clipboard.writeText(item.key);
                                toast.success("API key copied");
                            }}
                        >
                            <CopyIcon size={18} />
                        </Button>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open key actions"
                    aria-expanded={isMenuOpen}
                    onClick={onToggleMenu}
                >
                    <DotsThreeIcon size={20} weight="bold" />
                </Button>
                {isMenuOpen && (
                    <div className="absolute right-5 top-14 z-10 grid min-w-44 gap-1 rounded-md border border-(--color-border-primary) bg-(--color-bg-secondary) p-1 shadow-(--color-shadow)">
                        <button
                            type="button"
                            className="flex min-h-9 cursor-pointer items-center gap-2 rounded-sm px-3 text-left text-sm hover:bg-(--color-bg-card-hover)"
                            disabled={isUpdating}
                            onClick={() => onUpdateStatus(item.id, !item.active)}
                        >
                            <PowerIcon size={16} />{" "}
                            {item.active ? "Disable" : "Enable"}
                        </button>
                        <button
                            type="button"
                            className="flex min-h-9 cursor-pointer items-center gap-2 rounded-sm px-3 text-left text-sm text-(--color-status-error) hover:bg-(--color-bg-card-hover)"
                            disabled={isDeleting}
                            onClick={() => onDelete(item.id, item.name)}
                        >
                            <TrashIcon size={16} /> Delete
                        </button>
                    </div>
                )}
            </CardHeader>
            <CardContent className="grid gap-5">
                <div className="flex flex-wrap gap-2">
                    <Badge>{item.roundhouseMethod}</Badge>
                    <Badge>{item.maxIterations} retries</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <Metric label="Providers" value={item.stats.providerCount} />
                    <Metric label="Models" value={item.stats.modelCount} />
                    <Metric
                        label="Vault Keys"
                        value={item.stats.apiKeysManagerCount}
                    />
                    <Metric
                        label="Success"
                        value={formatNumber(item.stats.successfulRequests)}
                    />
                </div>
                <div className="flex items-center justify-between border-t border-(--color-border-subtle) pt-4 text-xs text-(--color-text-secondary)">
                    <span>Updated {formatDate(item.updatedAt)}</span>
                    <div className="flex gap-1">
                        <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            aria-label="Open API key settings"
                        >
                            <Link href={`${routes.apiKeys}/${item.id}`}>
                                <GearIcon size={18} />
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
