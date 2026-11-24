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
    const masked =
        item.key && item.key.length > 16
            ? `${item.key.slice(0, 11)}****${item.key.slice(-5)}`
            : item.key;

    return (
        <Card className="transition-colors hover:border-(--color-border-focused)">
            <CardHeader className="relative">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold tracking-tight">
                            {item.name}
                        </h2>
                        <StatusBadge status={item.active} />
                    </div>
                    <div className="mt-3 flex min-h-9 items-center gap-2 rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) px-3">
                        <code className="min-w-0 flex-1 truncate font-mono text-xs font-semibold text-(--color-text-primary)">
                            {masked}
                        </code>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label="Copy key"
                            onClick={async () => {
                                await navigator.clipboard.writeText(item.key);
                                toast.success("API key copied");
                            }}
                        >
                            <CopyIcon size={15} />
                        </Button>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open key actions"
                    aria-expanded={isMenuOpen}
                    onClick={(event) => {
                        event.stopPropagation();
                        onToggleMenu();
                    }}
                >
                    <DotsThreeIcon size={18} weight="bold" />
                </Button>
                {isMenuOpen && (
                    <div
                        role="menu"
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                        className="absolute right-4 top-14 z-10 grid min-w-44 gap-1 rounded-sm border border-(--color-border-primary) bg-(--color-bg-secondary) p-1"
                    >
                        <button
                            type="button"
                            role="menuitem"
                            className="flex min-h-9 cursor-pointer items-center gap-2 rounded-sm px-3 text-left text-sm hover:bg-(--color-bg-card-hover)"
                            disabled={isUpdating}
                            onClick={() => onUpdateStatus(item.id, !item.active)}
                        >
                            <PowerIcon size={15} />
                            {item.active ? "Disable" : "Enable"}
                        </button>
                        <div className="my-0.5 border-t border-(--color-border-subtle)" />
                        <button
                            type="button"
                            role="menuitem"
                            className="flex min-h-9 cursor-pointer items-center gap-2 rounded-sm px-3 text-left text-sm text-(--color-status-error) hover:bg-(--color-bg-card-hover)"
                            disabled={isDeleting}
                            onClick={() => onDelete(item.id, item.name)}
                        >
                            <TrashIcon size={15} /> Delete
                        </button>
                    </div>
                )}
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="flex flex-wrap gap-1.5">
                    <Badge className="font-mono text-[11px]">
                        {item.roundhouseMethod}
                    </Badge>
                    <Badge className="font-mono text-[11px]">
                        {item.maxIterations} max iter
                    </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-sm">
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
                <div className="flex items-center justify-between border-t border-(--color-border-subtle) pt-3 text-xs text-(--color-text-secondary)">
                    <span suppressHydrationWarning>
                        Updated {formatDate(item.updatedAt)}
                    </span>
                    <Button asChild variant="secondary" size="sm">
                        <Link href={`${routes.apiKeys}/${item.id}`}>
                            <GearIcon size={14} />
                            Configure
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
