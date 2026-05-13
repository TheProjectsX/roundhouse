import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UnlockedKey } from "@/shared/types/entities";

interface UnlockState {
    unlockedKeys: Record<string, string>;
    unlockedAt: number | null;
}

const initialState: UnlockState = {
    unlockedKeys: {},
    unlockedAt: null,
};

const unlockSlice = createSlice({
    name: "unlock",
    initialState,
    reducers: {
        unlock: (state, action: PayloadAction<UnlockedKey[]>) => {
            state.unlockedKeys = Object.fromEntries(action.payload.map((item) => [item.id, item.key]));
            state.unlockedAt = Date.now();
        },
        lock: (state) => {
            state.unlockedKeys = {};
            state.unlockedAt = null;
        },
    },
});

export const { lock, unlock } = unlockSlice.actions;
export default unlockSlice.reducer;
