"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { routes } from "@/shared/constants/routes";
import { useRegisterMutation } from "@/shared/store/features/auth/authApi";

const registerSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [registerAccount, registerState] = useRegisterMutation();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    return (
        <form
            className="grid gap-4"
            onSubmit={handleSubmit(async ({ confirmPassword: _confirmPassword, ...values }) => {
                try {
                    await registerAccount(values).unwrap();
                    toast.success("Account created. Sign in to continue.");
                    router.push(routes.login);
                } catch (error) {
                    const apiMessage = (error as { data?: { message?: string } })?.data?.message;
                    toast.error(apiMessage || (error instanceof Error ? error.message : "Registration failed"));
                }
            })}
        >
            <label className="grid gap-1.5 text-sm font-medium text-(--color-text-primary)">
                Name
                <Input autoComplete="name" placeholder="Ada Lovelace" {...register("name")} />
                {errors.name ? <span className="text-xs text-(--color-status-error)">{errors.name.message}</span> : null}
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-(--color-text-primary)">
                Email
                <Input type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
                {errors.email ? <span className="text-xs text-(--color-status-error)">{errors.email.message}</span> : null}
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-(--color-text-primary)">
                Password
                <div className="relative">
                    <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        className="pr-11"
                        {...register("password")}
                    />
                    <button
                        type="button"
                        className="absolute right-0 top-0 grid size-9 place-items-center rounded-r-sm text-(--color-text-muted) hover:bg-(--color-bg-card-hover) hover:text-(--color-text-primary)"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeSlashIcon size={17} /> : <EyeIcon size={17} />}
                    </button>
                </div>
                {errors.password ? <span className="text-xs text-(--color-status-error)">{errors.password.message}</span> : null}
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-(--color-text-primary)">
                Confirm password
                <div className="relative">
                    <Input
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Repeat your password"
                        className="pr-11"
                        {...register("confirmPassword")}
                    />
                    <button
                        type="button"
                        className="absolute right-0 top-0 grid size-9 place-items-center rounded-r-sm text-(--color-text-muted) hover:bg-(--color-bg-card-hover) hover:text-(--color-text-primary)"
                        onClick={() => setShowConfirm((value) => !value)}
                        aria-label={showConfirm ? "Hide confirmation password" : "Show confirmation password"}
                    >
                        {showConfirm ? <EyeSlashIcon size={17} /> : <EyeIcon size={17} />}
                    </button>
                </div>
                {errors.confirmPassword ? (
                    <span className="text-xs text-(--color-status-error)">{errors.confirmPassword.message}</span>
                ) : null}
            </label>
            <Button type="submit" disabled={registerState.isLoading} className="mt-1">
                {registerState.isLoading ? "Creating..." : "Create account"}
            </Button>
            <div className="border-t border-(--color-border-subtle) pt-4">
                <Link className="text-sm text-(--color-text-secondary) hover:text-(--color-text-primary)" href={routes.login}>
                    Already have an account? Sign in
                </Link>
            </div>
        </form>
    );
}
