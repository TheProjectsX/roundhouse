import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "rounded-[var(--radius-lg)] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] shadow-sm shadow-[var(--color-shadow)]",
                className,
            )}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("flex items-start justify-between gap-4 p-5 pb-3", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-5 pt-2", className)} {...props} />;
}
