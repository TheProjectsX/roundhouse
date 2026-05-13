import { roundhouseApi } from "../api/baseApi";
import type {
    ApiKeyDetail,
    ApiKeyListItem,
    ApiKeyModelSelectionListItem,
} from "@/shared/types/entities";
import { RoundhouseMethod } from "@/shared/types/enums";

export const apikeysApi = roundhouseApi.injectEndpoints({
    endpoints: (builder) => ({
        getApiKeys: builder.query<ApiKeyListItem[], void>({
            query: () => "/api/iv1/apikeys",
            providesTags: ["ApiKeys"],
        }),
        createApiKey: builder.mutation<ApiKeyListItem, { name: string; maxIterations?: number; roundhouseMethod?: RoundhouseMethod }>({
            query: (body) => ({ url: "/api/iv1/apikeys", method: "POST", body }),
            invalidatesTags: ["ApiKeys", "Providers"],
        }),
        getApiKeyDetail: builder.query<ApiKeyDetail, string>({
            query: (id) => `/api/iv1/apikeys/${id}`,
            providesTags: (_result, _error, id) => [{ type: "ApiKeys", id }],
        }),
        getApiKeyModelSelections: builder.query<ApiKeyModelSelectionListItem[], string>({
            query: (id) => `/api/iv1/apikeys/${id}/models`,
            providesTags: (_result, _error, id) => [{ type: "ApiKeys", id }],
        }),
        updateApiKey: builder.mutation<ApiKeyListItem, { id: string; body: { name?: string; active?: boolean } }>({
            query: ({ id, body }) => ({ url: `/api/iv1/apikeys/${id}`, method: "PATCH", body }),
            invalidatesTags: (_result, _error, { id }) => ["ApiKeys", { type: "ApiKeys", id }],
        }),
        updateApiKeySettings: builder.mutation<ApiKeyListItem, { id: string; body: { maxIterations?: number; roundhouseMethod?: RoundhouseMethod } }>({
            query: ({ id, body }) => ({ url: `/api/iv1/apikeys/${id}/settings`, method: "PATCH", body }),
            invalidatesTags: (_result, _error, { id }) => ["ApiKeys", { type: "ApiKeys", id }],
        }),
        updateApiKeyStatus: builder.mutation<ApiKeyListItem, { id: string; active: boolean }>({
            query: ({ id, active }) => ({ url: `/api/iv1/apikeys/${id}/status`, method: "PATCH", body: { active } }),
            invalidatesTags: (_result, _error, { id }) => ["ApiKeys", { type: "ApiKeys", id }],
        }),
        deleteApiKey: builder.mutation<void, string>({
            query: (id) => ({ url: `/api/iv1/apikeys/${id}`, method: "DELETE" }),
            invalidatesTags: ["ApiKeys", "Providers"],
        }),
        selectApiKeyProvider: builder.mutation<{ id: string; apiKeysManagerIds: string[] }, { apiKeyId: string; providerId: string; apiKeysManagerIds: string[] }>({
            query: ({ apiKeyId, providerId, apiKeysManagerIds }) => ({
                url: `/api/iv1/apikeys/${apiKeyId}/providers/${providerId}`,
                method: "POST",
                body: { apiKeysManagerIds },
            }),
            invalidatesTags: (_result, _error, { apiKeyId }) => ["ApiKeys", "Providers", { type: "ApiKeys", id: apiKeyId }],
        }),
        removeApiKeyProviderSelection: builder.mutation<void, { apiKeyId: string; selectionId: string }>({
            query: ({ apiKeyId, selectionId }) => ({ url: `/api/iv1/apikeys/${apiKeyId}/selections/${selectionId}`, method: "DELETE" }),
            invalidatesTags: (_result, _error, { apiKeyId }) => ["ApiKeys", "Providers", { type: "ApiKeys", id: apiKeyId }],
        }),
        selectApiKeyProviderModels: builder.mutation<void, { apiKeyId: string; providerId: string; modelIds: string[] }>({
            query: ({ apiKeyId, providerId, modelIds }) => ({
                url: `/api/iv1/apikeys/${apiKeyId}/providers/${providerId}/models`,
                method: "PATCH",
                body: { modelIds },
            }),
            invalidatesTags: (_result, _error, { apiKeyId }) => ["ApiKeys", { type: "ApiKeys", id: apiKeyId }],
        }),
        deselectApiKeyProviderModels: builder.mutation<void, { apiKeyId: string; providerId: string; modelIds: string[] }>({
            query: ({ apiKeyId, providerId, modelIds }) => ({
                url: `/api/iv1/apikeys/${apiKeyId}/providers/${providerId}/models`,
                method: "DELETE",
                body: { modelIds },
            }),
            invalidatesTags: (_result, _error, { apiKeyId }) => ["ApiKeys", { type: "ApiKeys", id: apiKeyId }],
        }),
        updateApiKeyProviderStatus: builder.mutation<void, { apiKeyId: string; providerId: string; active: boolean }>({
            query: ({ apiKeyId, providerId, active }) => ({
                url: `/api/iv1/apikeys/${apiKeyId}/providers/${providerId}/status`,
                method: "PATCH",
                body: { active },
            }),
            invalidatesTags: (_result, _error, { apiKeyId }) => ["ApiKeys", { type: "ApiKeys", id: apiKeyId }],
        }),
        updateApiKeyModelStatus: builder.mutation<void, { apiKeyId: string; modelId: string; active: boolean }>({
            query: ({ apiKeyId, modelId, active }) => ({ url: `/api/iv1/apikeys/${apiKeyId}/models/${modelId}/status`, method: "PATCH", body: { active } }),
            invalidatesTags: (_result, _error, { apiKeyId }) => ["ApiKeys", { type: "ApiKeys", id: apiKeyId }],
        }),
        reorderApiKeyModelSelections: builder.mutation<void, { apiKeyId: string; items: { modelSelectionId: string; priority: number }[] }>({
            query: ({ apiKeyId, items }) => ({ url: `/api/iv1/apikeys/${apiKeyId}/models/priority`, method: "PATCH", body: { items } }),
            invalidatesTags: (_result, _error, { apiKeyId }) => ["ApiKeys", { type: "ApiKeys", id: apiKeyId }],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetApiKeysQuery,
    useCreateApiKeyMutation,
    useGetApiKeyDetailQuery,
    useGetApiKeyModelSelectionsQuery,
    useUpdateApiKeyMutation,
    useUpdateApiKeySettingsMutation,
    useUpdateApiKeyStatusMutation,
    useDeleteApiKeyMutation,
    useSelectApiKeyProviderMutation,
    useRemoveApiKeyProviderSelectionMutation,
    useSelectApiKeyProviderModelsMutation,
    useDeselectApiKeyProviderModelsMutation,
    useUpdateApiKeyProviderStatusMutation,
    useUpdateApiKeyModelStatusMutation,
    useReorderApiKeyModelSelectionsMutation,
} = apikeysApi;
