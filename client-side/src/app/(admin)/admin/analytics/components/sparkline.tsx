import React from "react";

interface SparklineProps {
    data: number[];
    color?: string;
    label?: string;
}

export function Sparkline({
    data,
    color = "var(--color-accent-primary)",
    label = "Trend chart",
}: SparklineProps) {
    if (data.length < 2) {
        return (
            <div className="grid h-full w-full place-items-center text-xs text-(--color-text-muted)">
                Not enough data points to plot trend.
            </div>
        );
    }
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data
        .map((v, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((v - min) / range) * 100;
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <svg
            viewBox="0 0 100 100"
            role="img"
            aria-label={label}
            className="h-full w-full overflow-visible"
            preserveAspectRatio="none"
        >
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="square"
                strokeLinejoin="miter"
                points={points}
            />
        </svg>
    );
}
