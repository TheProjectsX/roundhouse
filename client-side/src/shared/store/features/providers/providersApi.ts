import { roundhouseApi } from "../api/baseApi";
import type { ProviderListItem, ProviderModelListItem } from "@/shared/types/entities";
import { ContentStatus, ProviderType } from "@/shared/types/enums";

export const providersApi = roundhouseApi.injectEndpoints({
    endpoints: (builder) => ({
        getProviders: builder.query<ProviderListItem[], void>({
            query: () => "/api/iv1/providers",
            providesTags: ["Providers"],
        }),
        getProviderModels: builder.query<ProviderModelListItem[], string>({
            query: (id) => `/api/iv1/providers/${id}/models`,
            providesTags: (_result, _error, id) => [{ type: "Providers", id }],
        }),
        createCustomProvider: builder.mutation<ProviderListItem, { name: string; code?: string; description?: string; baseApi: string; free?: boolean; type?: ProviderType; status?: ContentStatus }>({
            query: (body) => ({ url: "/api/iv1/me/providers", method: "POST", body }),
            invalidatesTags: ["Providers"],
        }),
        updateCustomProviderStatus: builder.mutation<ProviderListItem, { id: string; status: ContentStatus }>({
            query: ({ id, status }) => ({ url: `/api/iv1/me/providers/${id}/status`, method: "PATCH", body: { status } }),
            invalidatesTags: ["Providers"],
        }),
        deleteCustomProvider: builder.mutation<void, string>({
            query: (id) => ({ url: `/api/iv1/me/providers/${id}`, method: "DELETE" }),
            invalidatesTags: ["Providers"],
        }),
        createProviderModel: builder.mutation<ProviderModelListItem, { providerId: string; body: { name: string; code: string; maxTokens?: number; tokenResetInterval?: number; thinking?: boolean; bestFor?: string[] } }>({
            query: ({ providerId, body }) => ({ url: `/api/iv1/me/providers/${providerId}/models`, method: "POST", body }),
            invalidatesTags: (_result, _error, { providerId }) => ["Providers", { type: "Providers", id: providerId }],
        }),
        updateCustomProvider: builder.mutation<ProviderListItem, { id: string; body: { name?: string; code?: string; description?: string; baseApi?: string; free?: boolean; type?: ProviderType; status?: ContentStatus } }>({
            query: ({ id, body }) => ({ url: `/api/iv1/me/providers/${id}`, method: "PATCH", body }),
            invalidatesTags: (_result, _error, { id }) => ["Providers", { type: "Providers", id }],
        }),
        updateProviderModel: builder.mutation<ProviderModelListItem, { modelId: string; body: { name?: string; code?: string; maxTokens?: number; tokenResetInterval?: number; efficiencyScore?: number; bestFor?: string[] } }>({
            query: ({ modelId, body }) => ({ url: `/api/iv1/me/providers/models/${modelId}`, method: "PATCH", body }),
            invalidatesTags: ["Providers"],
        }),
        deleteProviderModel: builder.mutation<void, string>({
            query: (modelId) => ({ url: `/api/iv1/me/providers/models/${modelId}`, method: "DELETE" }),
            invalidatesTags: ["Providers"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetProvidersQuery,
    useGetProviderModelsQuery,
    useCreateCustomProviderMutation,
    useUpdateCustomProviderStatusMutation,
    useDeleteCustomProviderMutation,
    useCreateProviderModelMutation,
    useUpdateCustomProviderMutation,
    useUpdateProviderModelMutation,
    useDeleteProviderModelMutation,
} = providersApi;
