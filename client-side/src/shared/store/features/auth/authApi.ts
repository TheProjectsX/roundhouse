import { roundhouseApi } from "../api/baseApi";
import type { UserProfile } from "@/shared/types/entities";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/features/auth/types/auth";

export const authApi = roundhouseApi.injectEndpoints({
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
    }),
    overrideExisting: false,
});

export const {
    useLoginMutation,
    useAdminLoginMutation,
    useRegisterMutation,
    useGetMeQuery,
    useUpdateMeMutation,
    useChangePasswordMutation,
} = authApi;
