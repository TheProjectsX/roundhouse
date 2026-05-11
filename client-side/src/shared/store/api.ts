import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { appConfig } from "@/shared/constants/config";
import type { RootState } from "./store";
import type {
    AdminAnalytics,
    AdminUserListItem,
    ApiKeyDetail,
    ApiKeyListItem,
    ApiKeyModelSelectionListItem,
    ApiKeysManagerItem,
    ProviderListItem,
    ProviderModelListItem,
    UnlockedKey,
    UserProfile,
} from "@/shared/types/entities";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/features/auth/types/auth";
import { ContentStatus, ProviderType, RoundhouseMethod, UserStatus } from "@/shared/types/enums";

const rawLiveBaseQuery = fetchBaseQuery({
    baseUrl: appConfig.apiBaseUrl,
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.token;
        if (token) headers.set("authorization", `Bearer ${token}`);
        return headers;
    },
});

const liveBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
    const result = await rawLiveBaseQuery(args, api, extraOptions);

    if (result.data && typeof result.data === "object" && "data" in result.data && "success" in result.data) {
        return { ...result, data: (result.data as { data: unknown }).data };
    }

    return result;
};

export const roundhouseApi = createApi({
    reducerPath: "roundhouseApi",
    baseQuery: liveBaseQuery,
    tagTypes: ["Me", "ApiKeys", "Providers", "KeysManager", "Admin"],
    endpoints: (builder) => ({
        login: builder.mutation<AuthResponse, LoginPayload>({
            query: (body) => ({ url: "/api/iv1/auth/login", method: "POST", body }),
        }),
        adminLogin: builder.mutation<AuthResponse, LoginPayload>({
            query: (body) => ({ url: "/api/iv1/admin/auth/login", method: "POST", body }),
        }),
        register: builder.mutation<unknown, RegisterPayload>({
            query: (body) => ({ url: "/api/iv1/auth/register", method: "POST", body }),
        }),
        getMe: builder.query<UserProfile, void>({
            query: () => "/api/iv1/me",
            providesTags: ["Me"],
        }),
        updateMe: builder.mutation<void, { name?: string }>({
            query: (body) => ({ url: "/api/iv1/me", method: "PATCH", body }),
            invalidatesTags: ["Me"],
        }),
        changePassword: builder.mutation<void, { oldPassword: string; newPassword: string }>({
            query: (body) => ({ url: "/api/iv1/auth/change-password", method: "POST", body }),
        }),
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
        getKeysManager: builder.query<ApiKeysManagerItem[], void>({
            query: () => "/api/iv1/me/apikeys",
            providesTags: ["KeysManager"],
        }),
        createKeysManager: builder.mutation<ApiKeysManagerItem, { name: string; provider?: string; key: string }>({
            query: (body) => ({ url: "/api/iv1/me/apikeys", method: "POST", body }),
            invalidatesTags: ["KeysManager"],
        }),
        updateKeysManager: builder.mutation<ApiKeysManagerItem, { id: string; body: { name?: string; active?: boolean } }>({
            query: ({ id, body }) => ({ url: `/api/iv1/me/apikeys/${id}`, method: "PATCH", body }),
            invalidatesTags: ["KeysManager", "Providers"],
        }),
        deleteKeysManager: builder.mutation<void, string>({
            query: (id) => ({ url: `/api/iv1/me/apikeys/${id}`, method: "DELETE" }),
            invalidatesTags: ["KeysManager", "Providers"],
        }),
        unlockKeys: builder.mutation<UnlockedKey[], { password: string }>({
            query: (body) => ({ url: "/api/iv1/me/apikeys/unlock", method: "POST", body }),
        }),
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
        createAdminProvider: builder.mutation<ProviderListItem, { name: string; code?: string; description?: string; baseApi: string; free?: boolean; type?: ProviderType; status?: ContentStatus }>({
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
});

export const {
    useAdminLoginMutation,
    useChangePasswordMutation,
    useCreateAdminProviderMutation,
    useCreateApiKeyMutation,
    useCreateCustomProviderMutation,
    useCreateKeysManagerMutation,
    useCreateProviderModelMutation,
    useDeleteAdminProviderMutation,
    useDeleteAdminUserMutation,
    useDeleteApiKeyMutation,
    useDeleteCustomProviderMutation,
    useDeleteKeysManagerMutation,
    useDeleteProviderModelMutation,
    useGetAdminAnalyticsQuery,
    useGetAdminProvidersQuery,
    useGetAdminUsersQuery,
    useGetApiKeyDetailQuery,
    useGetApiKeyModelSelectionsQuery,
    useGetApiKeysQuery,
    useGetKeysManagerQuery,
    useGetMeQuery,
    useGetProviderModelsQuery,
    useGetProvidersQuery,
    useLoginMutation,
    useRegisterMutation,
    useDeselectApiKeyProviderModelsMutation,
    useRemoveApiKeyProviderSelectionMutation,
    useReorderApiKeyModelSelectionsMutation,
    useSelectApiKeyProviderModelsMutation,
    useSelectApiKeyProviderMutation,
    useUpdateAdminProviderStatusMutation,
    useUpdateAdminUserStatusMutation,
    useUpdateApiKeyMutation,
    useUpdateApiKeySettingsMutation,
    useUpdateApiKeyStatusMutation,
    useUpdateApiKeyModelStatusMutation,
    useUpdateApiKeyProviderStatusMutation,
    useUpdateCustomProviderMutation,
    useUpdateCustomProviderStatusMutation,
    useUpdateKeysManagerMutation,
    useUpdateMeMutation,
    useUpdateProviderModelMutation,
    useUnlockKeysMutation,
} = roundhouseApi;
