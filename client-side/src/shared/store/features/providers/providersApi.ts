import { roundhouseApi } from "../api/baseApi";
import type {
    FetchedProviderModelItem,
    ModelTestResult,
    ProviderListItem,
    ProviderModelListItem,
} from "@/shared/types/entities";
import { ContentStatus, ProviderType } from "@/shared/types/enums";

export const providersApi = roundhouseApi.injectEndpoints({
    endpoints: (builder) => ({
        getProviders: builder.query<ProviderListItem[], void>({
            query: () => "/api/iv1/providers",
            providesTags: ["Providers"],
        }),
        getCatalogStatus: builder.query<
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
            query: () => "/api/iv1/providers/catalog-status",
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
            invalidatesTags: ["Providers", "ApiKeys"],
        }),
        deleteCustomProvider: builder.mutation<void, string>({
            query: (id) => ({ url: `/api/iv1/me/providers/${id}`, method: "DELETE" }),
            invalidatesTags: ["Providers", "ApiKeys"],
        }),
        createProviderModel: builder.mutation<ProviderModelListItem, { providerId: string; body: { name: string; code: string; maxTokens?: number; tokenResetInterval?: number; contextWindow?: number; supportsTools?: boolean; supportsVision?: boolean; rpmLimit?: number; rpdLimit?: number; tpmLimit?: number; tpdLimit?: number; efficiencyScore?: number; thinking?: boolean; bestFor?: string[] } }>({
            query: ({ providerId, body }) => ({ url: `/api/iv1/me/providers/${providerId}/models`, method: "POST", body }),
            invalidatesTags: (_result, _error, { providerId }) => ["Providers", { type: "Providers", id: providerId }, "ApiKeys"],
        }),
        updateCustomProvider: builder.mutation<ProviderListItem, { id: string; body: { name?: string; code?: string; description?: string; baseApi?: string; free?: boolean; type?: ProviderType; status?: ContentStatus } }>({
            query: ({ id, body }) => ({ url: `/api/iv1/me/providers/${id}`, method: "PATCH", body }),
            invalidatesTags: (_result, _error, { id }) => ["Providers", { type: "Providers", id }, "ApiKeys"],
        }),
        updateProviderModel: builder.mutation<ProviderModelListItem, { modelId: string; body: { name?: string; code?: string; maxTokens?: number; tokenResetInterval?: number; contextWindow?: number; supportsTools?: boolean; supportsVision?: boolean; rpmLimit?: number; rpdLimit?: number; tpmLimit?: number; tpdLimit?: number; efficiencyScore?: number; thinking?: boolean; bestFor?: string[] } }>({
            query: ({ modelId, body }) => ({ url: `/api/iv1/me/providers/models/${modelId}`, method: "PATCH", body }),
            invalidatesTags: ["Providers", "ApiKeys"],
        }),
        deleteProviderModel: builder.mutation<void, string>({
            query: (modelId) => ({ url: `/api/iv1/me/providers/models/${modelId}`, method: "DELETE" }),
            invalidatesTags: ["Providers", "ApiKeys"],
        }),
        fetchUpstreamProviderModels: builder.mutation<
            FetchedProviderModelItem[],
            { providerId: string; apiKeyId?: string; apiKey?: string }
        >({
            query: ({ providerId, ...body }) => ({
                url: `/api/iv1/me/providers/${providerId}/models/fetch`,
                method: "POST",
                body,
            }),
        }),
        testProvider: builder.mutation<
            ModelTestResult,
            { providerId: string; modelId?: string; apiKeyId?: string }
        >({
            query: ({ providerId, ...body }) => ({
                url: `/api/iv1/providers/${providerId}/test`,
                method: "POST",
                body,
            }),
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetProvidersQuery,
    useGetCatalogStatusQuery,
    useGetProviderModelsQuery,
    useCreateCustomProviderMutation,
    useUpdateCustomProviderStatusMutation,
    useDeleteCustomProviderMutation,
    useCreateProviderModelMutation,
    useUpdateCustomProviderMutation,
    useUpdateProviderModelMutation,
    useDeleteProviderModelMutation,
    useFetchUpstreamProviderModelsMutation,
    useTestProviderMutation,
} = providersApi;
