import React from "react";
import { Card, CardHeader, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function ProviderSkeletons() {
    return (
        <>
            {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index}>
                    <CardHeader>
                        <Skeleton className="size-11" />
                        <Skeleton className="h-6 w-20" />
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-10" />
                        <div className="flex gap-2">
                            <Skeleton className="h-7 w-20" />
                            <Skeleton className="h-7 w-16" />
                        </div>
                        <Skeleton className="h-24" />
                    </CardContent>
                </Card>
            ))}
        </>
    );
}
