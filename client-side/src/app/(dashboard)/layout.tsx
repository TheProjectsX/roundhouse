import { ConsoleShell } from "@/shared/components/layout/console-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <ConsoleShell>{children}</ConsoleShell>;
}
