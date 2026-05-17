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
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-3 w-full">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <GearIcon size={20} /> Core Settings
                    </h2>
                    <Button
                        size="sm"
                        variant={draft.active ? "danger" : "success"}
                        disabled={isUpdatingStatus}
                        onClick={onToggleStatus}
                    >
                        <PowerIcon size={16} />
                        {draft.active ? "Disable" : "Enable"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium">
                    Name
                    <Input
                        value={draft.name}
                        onChange={(event) =>
                            onDraftChange({ name: event.target.value })
                        }
                    />
                </label>
                <div className="grid gap-2 text-sm font-medium">
                    API key
                    <div className="flex min-h-11 items-center gap-2 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3">
                        <code className="min-w-0 flex-1 truncate font-mono text-sm font-semibold">
                            {apiKey.key.slice(0, 11) + "****" + apiKey.key.slice(-4)}
                        </code>
                        <Button
                            variant="blank"
                            size="icon"
                            aria-label="Copy API key"
                            title="Copy API key"
                            onClick={async () => {
                                await navigator.clipboard.writeText(apiKey.key);
                                toast.success("API key copied");
                            }}
                        >
                            <CopyIcon size={18} />
                        </Button>
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium">
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
                    <label className="grid gap-2 text-sm font-medium">
                        Routing method
                        <select
                            value={draft.roundhouseMethod}
                            onChange={(event) =>
                                onDraftChange({
                                    roundhouseMethod: event.target
                                        .value as RoundhouseMethod,
                                })
                            }
                            className="min-h-10 rounded-md border border-(--color-border-primary) bg-(--color-bg-input) px-3 text-sm outline-none"
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
