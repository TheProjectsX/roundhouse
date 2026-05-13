"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { routes } from "@/shared/constants/routes";
import { useRegisterMutation } from "@/shared/store/features/api/roundhouseApi";

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
                    toast.error(error instanceof Error ? error.message : "Registration failed");
                }
            })}
        >
            <label className="grid gap-2 text-sm font-medium">
                Name
                <Input autoComplete="name" placeholder="Ada Lovelace" {...register("name")} />
                {errors.name ? <span className="text-xs text-(--color-status-error)">{errors.name.message}</span> : null}
            </label>
            <label className="grid gap-2 text-sm font-medium">
                Email
                <Input type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
                {errors.email ? <span className="text-xs text-(--color-status-error)">{errors.email.message}</span> : null}
            </label>
            <label className="grid gap-2 text-sm font-medium">
                Password
                <Input type="password" autoComplete="new-password" {...register("password")} />
                {errors.password ? <span className="text-xs text-(--color-status-error)">{errors.password.message}</span> : null}
            </label>
            <label className="grid gap-2 text-sm font-medium">
                Confirm password
                <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
                {errors.confirmPassword ? (
                    <span className="text-xs text-(--color-status-error)">{errors.confirmPassword.message}</span>
                ) : null}
            </label>
            <Button type="submit" disabled={registerState.isLoading} className="mt-2">
                {registerState.isLoading ? "Creating..." : "Create account"}
            </Button>
            <Link className="text-sm text-(--color-text-secondary) hover:text-(--color-accent-primary)" href={routes.login}>
                Already have an account?
            </Link>
        </form>
    );
}
