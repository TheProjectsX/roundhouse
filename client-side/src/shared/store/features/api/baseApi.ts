import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { appConfig } from "@/shared/constants/config";
import type { RootState } from "../../app/store";

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
    tagTypes: ["Me", "ApiKeys", "Providers", "KeysManager", "Admin", "Models"],
    endpoints: () => ({}),
});
