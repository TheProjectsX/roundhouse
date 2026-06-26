import { Sidebar } from "@/shared/components/layout/sidebar";
import { Topbar } from "@/shared/components/layout/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-dvh bg-(--color-bg-primary)">
            <Sidebar />
            <div className="min-w-0 flex-1">
                <Topbar />
                <main className="mx-auto grid max-w-350 gap-8 px-4 py-6 lg:px-6">{children}</main>
            </div>
        </div>
    );
}
