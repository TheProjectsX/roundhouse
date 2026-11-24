"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sidebar, SidebarNavContent } from "@/shared/components/layout/sidebar";
import { Topbar } from "@/shared/components/layout/topbar";

export function ConsoleShell({
    admin = false,
    children,
}: {
    admin?: boolean;
    children: ReactNode;
}) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    useEffect(() => {
        if (!mobileNavOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setMobileNavOpen(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [mobileNavOpen]);

    return (
        <div className="flex min-h-dvh bg-(--color-bg-primary)">
            <Sidebar admin={admin} />
            <div className="min-w-0 flex-1">
                <Topbar
                    admin={admin}
                    onOpenMobileNav={() => setMobileNavOpen(true)}
                />
                <main className="mx-auto grid max-w-350 gap-6 px-4 py-6 lg:px-6">
                    {children}
                </main>
            </div>

            {mobileNavOpen ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={admin ? "Admin navigation" : "Workspace navigation"}
                    className="fixed inset-0 z-50 bg-(--color-bg-overlay) lg:hidden"
                    onClick={() => setMobileNavOpen(false)}
                >
                    <div
                        className="h-full w-[min(84vw,280px)] overflow-y-auto border-r border-(--color-border-primary) bg-(--color-bg-secondary) p-3.5"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <SidebarNavContent
                            admin={admin}
                            showClose
                            onClose={() => setMobileNavOpen(false)}
                            onNavigate={() => setMobileNavOpen(false)}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
