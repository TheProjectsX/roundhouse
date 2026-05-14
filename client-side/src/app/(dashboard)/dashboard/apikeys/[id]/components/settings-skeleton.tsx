import React from "react";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function SettingsSkeleton() {
    return (
        <>
            <div className="flex justify-between gap-4">
                <div className="grid gap-3">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
            <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
                <Skeleton className="h-80" />
                <Skeleton className="h-80" />
            </section>
            <Skeleton className="h-[500px]" />
        </>
    );
}
