import type { Metadata } from "next";
import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
    title: "Sign in — Roundhouse",
};

export default function LoginPage() {
    return (
        <div className="mx-auto w-full max-w-md">
            <AuthCard title="Sign in" description="Manage model routing, provider keys, and Roundhouse reliability settings.">
                <LoginForm />
            </AuthCard>
        </div>
    );
}
