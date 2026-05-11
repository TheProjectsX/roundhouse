import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
    sidebarCollapsed: boolean;
    commandPaletteOpen: boolean;
}

const initialState: UiState = {
    sidebarCollapsed: false,
    commandPaletteOpen: false,
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
            state.sidebarCollapsed = action.payload;
        },
        toggleSidebar: (state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
        },
        setCommandPaletteOpen: (state, action: PayloadAction<boolean>) => {
            state.commandPaletteOpen = action.payload;
        },
    },
});

export const { setCommandPaletteOpen, setSidebarCollapsed, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
