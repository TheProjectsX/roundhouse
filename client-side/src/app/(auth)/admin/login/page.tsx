import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";

export default function AdminLoginPage() {
    return (
        <div className="mx-auto w-full max-w-md">
            <div className="rounded-[calc(var(--radius-lg)+2px)] border border-[color-mix(in_srgb,var(--color-status-warning)_42%,transparent)]">
                <AuthCard eyebrow="Admin Console" title="Operator sign in" description="Elevated access for provider, user, and platform analytics management.">
                    <LoginForm admin />
                </AuthCard>
            </div>
        </div>
    );
}
