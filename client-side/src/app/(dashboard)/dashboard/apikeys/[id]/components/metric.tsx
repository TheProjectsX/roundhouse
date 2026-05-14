import React from "react";

interface MetricProps {
    label: string;
    value: string | number;
}

export function Metric({ label, value }: MetricProps) {
    return (
        <div className="rounded-md bg-(--color-bg-input) p-3">
            <p className="text-xs text-(--color-text-muted)">{label}</p>
            <p className="mt-1 font-mono text-lg font-semibold">{value}</p>
        </div>
    );
}
