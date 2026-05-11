import type { UserProfile } from "@/shared/types/entities";

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken?: string;
    user?: UserProfile;
}
