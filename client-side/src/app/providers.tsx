"use client";

import { ThemeProvider } from "next-themes";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { ReduxProvider } from "./redux-provider";
import { useGetMeQuery } from "@/shared/store/features/auth/authApi";
import { setUser } from "@/shared/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/shared/store/hooks";

export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <ReduxProvider>
                <AuthBootstrap />
                {children}
                <Toaster richColors closeButton position="top-right" />
            </ReduxProvider>
        </ThemeProvider>
    );
}

function AuthBootstrap() {
    const dispatch = useAppDispatch();
    const token = useAppSelector((state) => state.auth.token);
    const { data: user } = useGetMeQuery(undefined, { skip: !token });

    useEffect(() => {
        if (user) dispatch(setUser(user));
    }, [dispatch, user]);

    return null;
}
