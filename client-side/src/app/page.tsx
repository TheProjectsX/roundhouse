import type { Metadata } from "next";
import { LandingPage } from "@/features/marketing/components/landing-page";

export const metadata: Metadata = {
    title: "Roundhouse | AI Routing Control Plane",
    description:
        "Route OpenAI-compatible traffic through a single control plane with provider failover, vault-backed keys, and deterministic model selection.",
};

export default function HomePage() {
    return <LandingPage />;
}
