import type { ReactNode } from "react";
import { DocsSidebar } from "./_components/docs-sidebar";

export default function DocsLayout({ children }: { children: ReactNode }) {
    return (
        <main className="min-h-dvh bg-(--color-bg-primary)">
            <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                    <div className="lg:w-[260px] lg:shrink-0">
                        <DocsSidebar />
                    </div>
                    <div className="min-w-0 flex-1">
                        {children}
                    </div>
                </div>
            </div>
        </main>
    );
}
