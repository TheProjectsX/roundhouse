export const appConfig = {
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Roundhouse",
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000",
    tokenStorageKey: process.env.NEXT_PUBLIC_TOKEN_STORAGE_KEY ?? "rh_access_token",
    refreshTokenStorageKey: process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY ?? "rh_refresh_token",
    defaultTheme: process.env.NEXT_PUBLIC_DEFAULT_THEME ?? "dark",
    keyUnlockTimeout: Number(process.env.NEXT_PUBLIC_KEY_UNLOCK_TIMEOUT ?? 60),
};
