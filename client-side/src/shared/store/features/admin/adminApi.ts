import { roundhouseApi } from "../api/baseApi";
import type { AdminAnalytics, AdminUserListItem, ProviderListItem, ProviderModelListItem } from "@/shared/types/entities";
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
        getAdminProviders: builder.query<ProviderListItem[], { customOnly?: boolean } | void>({
            query: (params) => ({
                url: "/api/iv1/admin/providers",
                params: params || {},
            }),
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

        getAdminProviderModels: builder.query<ProviderModelListItem[], string>({
            query: (id) => `/api/iv1/admin/providers/${id}/models`,
            providesTags: ["Admin", "Models"],
        }),
        createAdminProviderModel: builder.mutation<ProviderModelListItem, { providerId: string; body: any }>({
            query: ({ providerId, body }) => ({ url: `/api/iv1/admin/providers/${providerId}/models`, method: "POST", body }),
            invalidatesTags: ["Admin", "Models", "Providers"],
        }),
        updateAdminProviderModel: builder.mutation<ProviderModelListItem, { modelId: string; body: any }>({
            query: ({ modelId, body }) => ({ url: `/api/iv1/admin/providers/models/${modelId}`, method: "PATCH", body }),
            invalidatesTags: ["Admin", "Models"],
        }),
        updateAdminProviderModelStatus: builder.mutation<ProviderModelListItem, { modelId: string; status: ContentStatus }>({
            query: ({ modelId, status }) => ({ url: `/api/iv1/admin/providers/models/${modelId}/status`, method: "PATCH", body: { status } }),
            invalidatesTags: ["Admin", "Models"],
        }),
        deleteAdminProviderModel: builder.mutation<void, string>({
            query: (modelId) => ({ url: `/api/iv1/admin/providers/models/${modelId}`, method: "DELETE" }),
            invalidatesTags: ["Admin", "Models", "Providers"],
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
    useGetAdminProviderModelsQuery,
    useCreateAdminProviderModelMutation,
    useUpdateAdminProviderModelMutation,
    useUpdateAdminProviderModelStatusMutation,
    useDeleteAdminProviderModelMutation,
    useUpdateAdminUserStatusMutation,
    useDeleteAdminUserMutation,
} = adminApi;
