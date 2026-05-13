import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { appConfig } from "@/shared/constants/config";
import { UserRole } from "@/shared/types/enums";
import type { UserProfile } from "@/shared/types/entities";

interface AuthState {
    user: UserProfile | null;
    token: string | null;
    refreshToken: string | null;
}

function readAuthCookie(name: string) {
    if (typeof document === "undefined") return null;
    const cookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith(`${name}=`));

    return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
}

const initialState: AuthState = {
    user: null,
    token: readAuthCookie(appConfig.tokenStorageKey),
    refreshToken: readAuthCookie(appConfig.refreshTokenStorageKey),
};

function writeAuthCookie(name: string, token: string | null) {
    if (typeof document === "undefined") return;
    document.cookie = token
        ? `${name}=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`
        : `${name}=; path=/; max-age=0; SameSite=Lax`;
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setSession: (state, action: PayloadAction<{ user?: UserProfile | null; token: string; refreshToken?: string | null }>) => {
            state.user = action.payload.user ?? state.user;
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken ?? state.refreshToken;
            writeAuthCookie(appConfig.tokenStorageKey, action.payload.token);
            writeAuthCookie(appConfig.refreshTokenStorageKey, action.payload.refreshToken ?? null);
        },
        setUser: (state, action: PayloadAction<UserProfile | null>) => {
            state.user = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            writeAuthCookie(appConfig.tokenStorageKey, null);
            writeAuthCookie(appConfig.refreshTokenStorageKey, null);
        },
    },
    selectors: {
        selectIsAuthenticated: (state) => Boolean(state.token),
        selectIsAdmin: (state) => state.user?.role === UserRole.ADMIN,
    },
});

export const { logout, setSession, setUser } = authSlice.actions;
export const { selectIsAdmin, selectIsAuthenticated } = authSlice.selectors;
export default authSlice.reducer;
