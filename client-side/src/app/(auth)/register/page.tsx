import type { Metadata } from "next";
import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
    title: "Create account — Roundhouse",
};

export default function RegisterPage() {
    return (
        <div className="mx-auto w-full max-w-md">
            <AuthCard title="Create your workspace" description="Start configuring a unified API layer for your AI providers.">
                <RegisterForm />
            </AuthCard>
        </div>
    );
}
