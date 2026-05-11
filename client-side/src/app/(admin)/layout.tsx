import { Sidebar } from "@/shared/components/layout/sidebar";
import { Topbar } from "@/shared/components/layout/topbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-dvh bg-[var(--color-bg-primary)]">
            <Sidebar admin />
            <div className="min-w-0 flex-1">
                <Topbar admin />
                <main className="mx-auto grid max-w-[1400px] gap-8 px-4 py-6 lg:px-6">{children}</main>
            </div>
        </div>
    );
}
