import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import { AppProviders } from "./providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
    title: "Roundhouse",
    description: "AI service orchestration control plane",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <NextTopLoader
                    color="var(--color-accent-primary)"
                    height={3}
                    showSpinner={false}
                    crawlSpeed={180}
                    speed={220}
                    easing="ease"
                />
                <AppProviders>{children}</AppProviders>
            </body>
        </html>
    );
}
