import type { ReactNode } from "react";
import { DocsSidebar } from "./_components/docs-sidebar";

export default function DocsLayout({ children }: { children: ReactNode }) {
    return (
        <main className="min-h-dvh bg-(--color-bg-primary)">
            <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
                <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
                    <DocsSidebar />
                    <div className="min-w-0 rounded-[28px] border border-(--color-border-primary) bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-bg-card)_96%,var(--color-accent-secondary)_4%),var(--color-bg-card))] p-5 shadow-(--color-shadow) sm:p-8">
                        {children}
                    </div>
                </div>
            </div>
        </main>
    );
}
