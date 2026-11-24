import React from "react";
import { CopyIcon, GearIcon, PowerIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { roundhouseMethodLabels } from "@/shared/lib/enum-labels";
import { RoundhouseMethod } from "@/shared/types/enums";

interface CoreSettingsProps {
    apiKey: any;
    draft: {
        name: string;
        active: boolean;
        maxIterations: number;
        roundhouseMethod: RoundhouseMethod;
    };
    onDraftChange: (updates: Partial<CoreSettingsProps["draft"]>) => void;
    onToggleStatus: () => Promise<void>;
    isUpdatingStatus: boolean;
}

export function CoreSettings({
    apiKey,
    draft,
    onDraftChange,
    onToggleStatus,
    isUpdatingStatus,
}: CoreSettingsProps) {
    const masked =
        apiKey.key && apiKey.key.length > 15
            ? `${apiKey.key.slice(0, 11)}****${apiKey.key.slice(-4)}`
            : apiKey.key;

    return (
        <Card>
            <CardHeader>
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-base font-semibold">
                        <GearIcon size={18} /> Core Settings
                    </h2>
                    <Button
                        size="sm"
                        variant={draft.active ? "danger:outline" : "success:outline"}
                        disabled={isUpdatingStatus}
                        onClick={onToggleStatus}
                    >
                        <PowerIcon size={14} />
                        {draft.active ? "Disable" : "Enable"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="grid gap-4">
                <label className="grid gap-1.5 text-sm font-medium">
                    Name
                    <Input
                        value={draft.name}
                        onChange={(event) =>
                            onDraftChange({ name: event.target.value })
                        }
                    />
                </label>
                <div className="grid gap-1.5 text-sm font-medium">
                    <span>API key</span>
                    <div className="flex min-h-9 items-center gap-2 rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) px-3">
                        <code className="min-w-0 flex-1 truncate font-mono text-xs font-semibold">
                            {masked}
                        </code>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label="Copy API key"
                            title="Copy API key"
                            onClick={async () => {
                                await navigator.clipboard.writeText(apiKey.key);
                                toast.success("API key copied");
                            }}
                        >
                            <CopyIcon size={15} />
                        </Button>
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-sm font-medium">
                        Max iterations
                        <Input
                            type="number"
                            min={1}
                            value={draft.maxIterations}
                            onChange={(event) =>
                                onDraftChange({
                                    maxIterations: Math.max(
                                        1,
                                        Number(event.target.value) || 1,
                                    ),
                                })
                            }
                        />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                        Routing method
                        <select
                            value={draft.roundhouseMethod}
                            onChange={(event) =>
                                onDraftChange({
                                    roundhouseMethod: event.target
                                        .value as RoundhouseMethod,
                                })
                            }
                            className="min-h-9 rounded-sm border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm outline-none focus:border-(--color-border-focused)"
                        >
                            {Object.values(RoundhouseMethod).map((method) => (
                                <option key={method} value={method}>
                                    {roundhouseMethodLabels[method]}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </CardContent>
        </Card>
    );
}
