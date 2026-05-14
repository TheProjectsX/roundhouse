import React from "react";

interface SparklineProps {
    data: number[];
    color?: string;
}

export function Sparkline({
    data,
    color = "var(--color-accent-primary)",
}: SparklineProps) {
    if (data.length < 2) return null;
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
            className="h-full w-full overflow-visible"
            preserveAspectRatio="none"
        >
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
}
