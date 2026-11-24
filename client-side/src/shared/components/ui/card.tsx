import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "rounded-md border border-(--color-border-primary) bg-(--color-bg-card)",
                className,
            )}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("flex items-start justify-between gap-4 border-b border-(--color-border-subtle) px-5 py-4", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-5", className)} {...props} />;
}
