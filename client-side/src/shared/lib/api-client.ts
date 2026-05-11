import { appConfig } from "@/shared/constants/config";
import type { ApiErrorPayload, ApiResponse, ApiResult } from "@/shared/types/api";

export class ApiError extends Error {
    statusCode: number;
    errors?: Record<string, string[]>;

    constructor(payload: ApiErrorPayload) {
        super(payload.message);
        this.name = "ApiError";
        this.statusCode = payload.statusCode;
        this.errors = payload.errors;
    }
}

type RequestOptions = Omit<RequestInit, "body"> & {
    body?: unknown;
    token?: string | null;
    query?: Record<string, string | number | boolean | null | undefined>;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
    const url = new URL(path, appConfig.apiBaseUrl);

    Object.entries(query ?? {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
            url.searchParams.set(key, String(value));
        }
    });

    return url.toString();
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
    const { body, token, query, headers, ...init } = options;
    const response = await fetch(buildUrl(path, query), {
        ...init,
        headers: {
            Accept: "application/json",
            ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });

    const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

    if (!response.ok || !payload?.success) {
        throw new ApiError({
            statusCode: payload?.statusCode ?? response.status,
            message: payload?.message ?? "Request failed",
        });
    }

    return {
        data: payload.data,
        pagination: payload.pagination,
        message: payload.message,
    };
}
