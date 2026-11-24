import { ConsoleShell } from "@/shared/components/layout/console-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <ConsoleShell admin>{children}</ConsoleShell>;
}
