import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-bg-card-hover)] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
                className,
            )}
            {...props}
        />
    );
}
