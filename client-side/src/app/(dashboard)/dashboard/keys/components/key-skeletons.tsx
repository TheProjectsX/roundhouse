import React from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function KeySkeletons() {
    return (
        <>
            {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index}>
                    <CardContent className="grid gap-4 pt-5">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                        <Skeleton className="h-10" />
                        <div className="flex justify-end gap-2">
                            <Skeleton className="h-9 w-20" />
                            <Skeleton className="size-10" />
                            <Skeleton className="size-10" />
                        </div>
                        <Skeleton className="h-4 w-32" />
                    </CardContent>
                </Card>
            ))}
        </>
    );
}
