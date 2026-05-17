import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReducer from "../auth-slice";
import uiReducer from "../ui-slice";
import unlockReducer from "../unlock-slice";
import { roundhouseApi } from "../features/api/baseApi";
import "../features/admin/adminApi";
import "../features/apikeys/apikeysApi";
import "../features/auth/authApi";
import "../features/keysManager/keysManagerApi";
import "../features/providers/providersApi";

const rootReducer = combineReducers({
    auth: authReducer,
    ui: uiReducer,
    unlock: unlockReducer,
    [roundhouseApi.reducerPath]: roundhouseApi.reducer,
});

export function makeStore() {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(roundhouseApi.middleware),
    });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore["dispatch"];
