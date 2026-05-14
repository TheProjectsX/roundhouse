import React from "react";
import { Card, CardHeader, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function ApiKeySkeletons() {
    return (
        <>
            {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index}>
                    <CardHeader>
                        <div className="grid flex-1 gap-3">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-11 w-full" />
                        </div>
                        <Skeleton className="size-10" />
                    </CardHeader>
                    <CardContent className="grid gap-5">
                        <div className="flex gap-2">
                            <Skeleton className="h-7 w-24" />
                            <Skeleton className="h-7 w-20" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {Array.from({ length: 4 }).map((__, metricIndex) => (
                                <Skeleton key={metricIndex} className="h-20" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </>
    );
}
