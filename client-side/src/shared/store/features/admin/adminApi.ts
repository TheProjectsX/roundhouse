import { roundhouseApi } from "../api/baseApi";
import type { AdminAnalytics, AdminUserListItem, ProviderListItem, ProviderModelListItem } from "@/shared/types/entities";
import { ContentStatus, UserStatus } from "@/shared/types/enums";

export const adminApi = roundhouseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAdminAnalytics: builder.query<AdminAnalytics, void>({
            query: () => "/api/iv1/admin/analytics",
            providesTags: ["Admin"],
        }),
        getAdminUsers: builder.query<AdminUserListItem[], { limit?: number; page?: number; search?: string } | void>({
            query: (params) => ({
                url: "/api/iv1/admin/users",
                params: { limit: 100, ...(params || {}) },
            }),
            providesTags: ["Admin"],
        }),
        getAdminUserBin: builder.query<AdminUserListItem[], { limit?: number; page?: number } | void>({
            query: (params) => ({
                url: "/api/iv1/admin/users/bin",
                params: { limit: 100, ...(params || {}) },
            }),
            providesTags: ["Admin"],
        }),
        getAdminProviders: builder.query<ProviderListItem[], { customOnly?: boolean; limit?: number; page?: number; search?: string } | void>({
            query: (params) => ({
                url: "/api/iv1/admin/providers",
                params: { limit: 100, ...(params || {}) },
            }),
            providesTags: ["Admin", "Providers"],
        }),
        getAdminProviderBin: builder.query<ProviderListItem[], { limit?: number; page?: number } | void>({
            query: (params) => ({
                url: "/api/iv1/admin/providers/bin",
                params: { limit: 100, ...(params || {}) },
            }),
            providesTags: ["Admin", "Providers"],
        }),
        getAdminModelBin: builder.query<any[], { provider?: string; limit?: number; page?: number } | void>({
            query: (params) => ({
                url: "/api/iv1/admin/providers/models/bin",
                params: { limit: 200, ...(params || {}) },
            }),
            providesTags: ["Admin", "Models"],
        }),
        getAdminCatalogSyncStatus: builder.query<
            {
                syncing: boolean;
                lastSyncedAt: string | null;
                syncIntervalHours: number;
                lastSummary: {
                    createdCount: number;
                    updatedCount: number;
                    deprecatedCount: number;
                    providersSynced: number;
                } | null;
            },
            void
        >({
            query: () => "/api/iv1/admin/providers/sync-status",
            providesTags: ["Admin", "Providers"],
        }),
        syncAllAdminCatalogs: builder.mutation<
            {
                syncing: boolean;
                lastSyncedAt: string | null;
                syncIntervalHours: number;
                lastSummary: {
                    createdCount: number;
                    updatedCount: number;
                    deprecatedCount: number;
                    providersSynced: number;
                } | null;
            },
            void
        >({
            query: () => ({
                url: "/api/iv1/admin/providers/sync-all",
                method: "POST",
            }),
            invalidatesTags: ["Admin", "Providers", "Models"],
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
            invalidatesTags: ["Admin", "Providers", "Models"],
        }),
        restoreAdminProvider: builder.mutation<void, string>({
            query: (id) => ({ url: `/api/iv1/admin/providers/${id}/restore`, method: "PATCH" }),
            invalidatesTags: ["Admin", "Providers", "Models"],
        }),
        permanentDeleteAdminProvider: builder.mutation<void, string>({
            query: (id) => ({ url: `/api/iv1/admin/providers/${id}/permanent`, method: "DELETE" }),
            invalidatesTags: ["Admin", "Providers", "Models", "ApiKeys"],
        }),

        getAdminProviderModels: builder.query<ProviderModelListItem[], string>({
            query: (id) => ({
                url: `/api/iv1/admin/providers/${id}/models`,
                params: { limit: 500 },
            }),
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
        restoreAdminProviderModel: builder.mutation<void, string>({
            query: (modelId) => ({ url: `/api/iv1/admin/providers/models/${modelId}/restore`, method: "PATCH" }),
            invalidatesTags: ["Admin", "Models", "Providers"],
        }),
        permanentDeleteAdminProviderModel: builder.mutation<void, string>({
            query: (modelId) => ({ url: `/api/iv1/admin/providers/models/${modelId}/permanent`, method: "DELETE" }),
            invalidatesTags: ["Admin", "Models", "Providers", "ApiKeys"],
        }),

        updateAdminUserStatus: builder.mutation<AdminUserListItem, { id: string; status: UserStatus }>({
            query: ({ id, status }) => ({ url: `/api/iv1/admin/users/${id}/status`, method: "PATCH", body: { status } }),
            invalidatesTags: ["Admin"],
        }),
        deleteAdminUser: builder.mutation<void, string>({
            query: (id) => ({ url: `/api/iv1/admin/users/${id}`, method: "DELETE" }),
            invalidatesTags: ["Admin"],
        }),
        restoreAdminUser: builder.mutation<void, string>({
            query: (id) => ({ url: `/api/iv1/admin/users/${id}/restore`, method: "PATCH" }),
            invalidatesTags: ["Admin"],
        }),
        permanentDeleteAdminUser: builder.mutation<void, string>({
            query: (id) => ({ url: `/api/iv1/admin/users/${id}/permanent`, method: "DELETE" }),
            invalidatesTags: ["Admin"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetAdminAnalyticsQuery,
    useGetAdminUsersQuery,
    useGetAdminUserBinQuery,
    useGetAdminProvidersQuery,
    useGetAdminProviderBinQuery,
    useGetAdminModelBinQuery,
    useGetAdminCatalogSyncStatusQuery,
    useSyncAllAdminCatalogsMutation,
    useCreateAdminProviderMutation,
    useUpdateAdminProviderStatusMutation,
    useDeleteAdminProviderMutation,
    useRestoreAdminProviderMutation,
    usePermanentDeleteAdminProviderMutation,
    useGetAdminProviderModelsQuery,
    useCreateAdminProviderModelMutation,
    useUpdateAdminProviderModelMutation,
    useUpdateAdminProviderModelStatusMutation,
    useDeleteAdminProviderModelMutation,
    useRestoreAdminProviderModelMutation,
    usePermanentDeleteAdminProviderModelMutation,
    useUpdateAdminUserStatusMutation,
    useDeleteAdminUserMutation,
    useRestoreAdminUserMutation,
    usePermanentDeleteAdminUserMutation,
} = adminApi;
