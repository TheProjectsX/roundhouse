import { Skeleton } from "@/shared/components/ui/skeleton";

export default function Loading() {
    return (
        <main className="min-h-dvh bg-[var(--color-bg-primary)] p-6">
            <div className="mx-auto grid max-w-[1400px] gap-6">
                <Skeleton className="h-12 w-72" />
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
            </div>
        </main>
    );
}
