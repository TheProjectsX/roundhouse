import React from "react";

interface EntityItemProps {
    label: string;
    value: string | number;
}

export function EntityItem({ label, value }: EntityItemProps) {
    return (
        <div className="flex items-center justify-between rounded-md bg-(--color-bg-input) p-3 text-sm">
            <span>{label}</span>
            <span className="font-mono font-semibold">{value}</span>
        </div>
    );
}
