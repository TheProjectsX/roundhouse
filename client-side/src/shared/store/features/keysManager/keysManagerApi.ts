import { roundhouseApi } from "../api/baseApi";
import type { ApiKeysManagerItem, UnlockedKey } from "@/shared/types/entities";

export const keysManagerApi = roundhouseApi.injectEndpoints({
    endpoints: (builder) => ({
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
    }),
    overrideExisting: false,
});

export const {
    useGetKeysManagerQuery,
    useCreateKeysManagerMutation,
    useUpdateKeysManagerMutation,
    useDeleteKeysManagerMutation,
    useUnlockKeysMutation,
} = keysManagerApi;
