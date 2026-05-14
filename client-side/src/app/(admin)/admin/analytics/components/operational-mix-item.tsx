import React from "react";

interface OperationalMixItemProps {
    label: string;
    value: number | undefined;
    icon: any;
    totalModels: number;
}

export function OperationalMixItem({
    label,
    value,
    icon: Icon,
    totalModels,
}: OperationalMixItemProps) {
    return (
        <div className="group relative flex items-center gap-4 rounded-xl border border-transparent p-3 transition-all hover:border-(--color-border-subtle) hover:bg-(--color-bg-secondary)">
            <div className="grid size-10 place-items-center rounded-lg bg-(--color-bg-primary) text-(--color-text-secondary) group-hover:bg-(--color-accent-primary)/10 group-hover:text-(--color-accent-primary)">
                <Icon size={20} weight="duotone" />
            </div>
            <div className="flex flex-1 flex-col">
                <span className="text-sm font-bold">{label}</span>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-(--color-bg-input)">
                    <div
                        className="h-1.5 rounded-full bg-(--color-accent-primary)"
                        style={{
                            width: `${(Number(value) / (totalModels || 1)) * 100}%`,
                        }}
                    />
                </div>
            </div>
            <span className="font-mono text-lg font-black">{value}</span>
        </div>
    );
}
