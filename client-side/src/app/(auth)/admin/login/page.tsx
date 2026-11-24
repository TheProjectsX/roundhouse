import type { Metadata } from "next";
import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
    title: "Admin Sign in — Roundhouse",
};

export default function AdminLoginPage() {
    return (
        <div className="mx-auto w-full max-w-md">
            <AuthCard
                eyebrow="Admin Console"
                title="Operator sign in"
                description="Elevated access for provider, user, and platform analytics management."
            >
                <LoginForm admin />
            </AuthCard>
        </div>
    );
}
