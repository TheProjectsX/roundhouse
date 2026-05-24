import { NextResponse, type NextRequest } from "next/server";
import { routes } from "@/shared/constants/routes";
import { appConfig } from "@/shared/constants/config";

const protectedPrefixes = [routes.dashboard];
const adminPrefixes = ["/admin"];
const authPrefixes = ["/login", "/register", "/admin/login"];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(appConfig.tokenStorageKey)?.value;
    const isAuthRoute = authPrefixes.some((prefix) => pathname === prefix);
    const isProtectedRoute = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    const isAdminRoute = adminPrefixes.some((prefix) => pathname.startsWith(prefix)) && pathname !== routes.adminLogin;

    if (!token && (isProtectedRoute || isAdminRoute)) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = isAdminRoute ? routes.adminLogin : routes.login;
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (token && isAuthRoute) {
        const dashboardUrl = request.nextUrl.clone();
        dashboardUrl.pathname = pathname.startsWith("/admin") ? routes.admin : routes.dashboard;
        return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
