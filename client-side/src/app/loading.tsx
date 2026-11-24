import { Skeleton } from "@/shared/components/ui/skeleton";

export default function Loading() {
    return (
        <main className="min-h-dvh bg-(--color-bg-primary) p-6">
            <div className="mx-auto grid max-w-350 gap-6">
                <Skeleton className="h-10 w-64 rounded-md" />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Skeleton className="h-28 rounded-md" />
                    <Skeleton className="h-28 rounded-md" />
                    <Skeleton className="h-28 rounded-md" />
                    <Skeleton className="h-28 rounded-md" />
                </div>
            </div>
        </main>
    );
}
