"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { routes } from "@/shared/constants/routes";
import {
    useAdminLoginMutation,
    useLoginMutation,
} from "@/shared/store/features/auth/authApi";
import { setSession } from "@/shared/store/auth-slice";
import { useAppDispatch } from "@/shared/store/hooks";

const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({ admin = false }: { admin?: boolean }) {
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useAppDispatch();
    const [login, loginState] = useLoginMutation();
    const [adminLogin, adminLoginState] = useAdminLoginMutation();
    const pending = loginState.isLoading || adminLoginState.isLoading;
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    return (
        <form
            className="grid gap-4"
            onSubmit={handleSubmit(async (values) => {
                try {
                    const session = await (
                        admin ? adminLogin(values) : login(values)
                    ).unwrap();
                    if (!session?.accessToken) {
                        throw new Error("Login failed: missing access token");
                    }
                    dispatch(
                        setSession({
                            token: session.accessToken,
                            refreshToken: session.refreshToken ?? null,
                            user: session.user ?? null,
                        }),
                    );
                    const defaultTarget = admin ? routes.admin : routes.dashboard;
                    const redirectParam = new URLSearchParams(window.location.search).get("redirect");
                    const isSafeRedirect =
                        redirectParam &&
                        redirectParam.startsWith("/") &&
                        !redirectParam.startsWith("//") &&
                        (admin ? redirectParam.startsWith("/admin") : !redirectParam.startsWith("/admin"));
                    // Full navigation bypasses stale App Router cache redirects from proxy.ts
                    window.location.replace(isSafeRedirect ? redirectParam : defaultTarget);
                } catch (error) {
                    const apiMessage = (error as { data?: { message?: string } })?.data?.message;
                    toast.error(
                        apiMessage ||
                            (error instanceof Error ? error.message : "Login failed"),
                    );
                }
            })}
        >
            <label className="grid gap-1.5 text-sm font-medium text-(--color-text-primary)">
                Email
                <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...register("email")}
                />
                {errors.email ? (
                    <span className="text-xs text-(--color-status-error)">
                        {errors.email.message}
                    </span>
                ) : null}
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-(--color-text-primary)">
                Password
                <div className="relative">
                    <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        className="pr-11"
                        {...register("password")}
                    />
                    <button
                        type="button"
                        className="absolute right-0 top-0 grid size-9 place-items-center rounded-r-sm text-(--color-text-muted) hover:bg-(--color-bg-card-hover) hover:text-(--color-text-primary)"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={
                            showPassword ? "Hide password" : "Show password"
                        }
                    >
                        {showPassword ? (
                            <EyeSlashIcon size={17} />
                        ) : (
                            <EyeIcon size={17} />
                        )}
                    </button>
                </div>
                {errors.password ? (
                    <span className="text-xs text-(--color-status-error)">
                        {errors.password.message}
                    </span>
                ) : null}
            </label>
            <Button type="submit" disabled={pending} className="mt-1">
                {pending
                    ? "Signing in..."
                    : admin
                      ? "Open admin console"
                      : "Sign in"}
            </Button>
            <div className="flex items-center justify-between border-t border-(--color-border-subtle) pt-4 text-sm text-(--color-text-secondary)">
                {admin ? (
                    <Link
                        className="hover:text-(--color-text-primary)"
                        href={routes.login}
                    >
                        Back to user login
                    </Link>
                ) : (
                    <>
                        <Link
                            className="hover:text-(--color-text-primary)"
                            href={routes.register}
                        >
                            Create account
                        </Link>
                        <Link
                            className="hover:text-(--color-text-primary)"
                            href={routes.adminLogin}
                        >
                            Admin login
                        </Link>
                    </>
                )}
            </div>
        </form>
    );
}
