import { roundhouseApi } from "../api/baseApi";
import type { AdminAnalytics, AdminUserListItem, ProviderListItem } from "@/shared/types/entities";
import { ContentStatus, UserStatus } from "@/shared/types/enums";

export const adminApi = roundhouseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAdminAnalytics: builder.query<AdminAnalytics, void>({
            query: () => "/api/iv1/admin/analytics",
            providesTags: ["Admin"],
        }),
        getAdminUsers: builder.query<AdminUserListItem[], void>({
            query: () => "/api/iv1/admin/users",
            providesTags: ["Admin"],
        }),
        getAdminProviders: builder.query<ProviderListItem[], void>({
            query: () => "/api/iv1/admin/providers",
            providesTags: ["Admin", "Providers"],
        }),
        createAdminProvider: builder.mutation<ProviderListItem, { name: string; code?: string; description?: string; baseApi: string; free?: boolean; type?: string; status?: ContentStatus }>({
            query: (body) => ({ url: "/api/iv1/admin/providers", method: "POST", body }),
            invalidatesTags: ["Admin", "Providers"],
        }),
        updateAdminProviderStatus: builder.mutation<ProviderListItem, { id: string; status: ContentStatus }>({
            query: ({ id, status }) => ({ url: `/api/iv1/admin/providers/${id}/status`, method: "PATCH", body: { status } }),
            invalidatesTags: ["Admin", "Providers"],
        }),
        deleteAdminProvider: builder.mutation<void, string>({
            query: (id) => ({ url: `/api/iv1/admin/providers/${id}`, method: "DELETE" }),
            invalidatesTags: ["Admin", "Providers"],
        }),
        updateAdminUserStatus: builder.mutation<AdminUserListItem, { id: string; status: UserStatus }>({
            query: ({ id, status }) => ({ url: `/api/iv1/admin/users/${id}/status`, method: "PATCH", body: { status } }),
            invalidatesTags: ["Admin"],
        }),
        deleteAdminUser: builder.mutation<void, string>({
            query: (id) => ({ url: `/api/iv1/admin/users/${id}`, method: "DELETE" }),
            invalidatesTags: ["Admin"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetAdminAnalyticsQuery,
    useGetAdminUsersQuery,
    useGetAdminProvidersQuery,
    useCreateAdminProviderMutation,
    useUpdateAdminProviderStatusMutation,
    useDeleteAdminProviderMutation,
    useUpdateAdminUserStatusMutation,
    useDeleteAdminUserMutation,
} = adminApi;
