import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface RealtimeState {
  /** Live socket connection status (drives the "reconnecting..." UI). */
  connected: boolean;
  /** User ids currently online in the company (presence). */
  online: string[];
  /** Monotonic counter bumped on any inbound event - handy for subtle
   *  "live" pulse animations without storing every payload. */
  lastEventAt: number | null;
}

const initialState: RealtimeState = {
  connected: false,
  online: [],
  lastEventAt: null,
};

const realtimeSlice = createSlice({
  name: "realtime",
  initialState,
  reducers: {
    setConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload;
      if (!action.payload) state.online = [];
    },
    setPresence(state, action: PayloadAction<string[]>) {
      state.online = action.payload;
    },
    markEvent(state) {
      state.lastEventAt = Date.now();
    },
  },
});

export const { setConnected, setPresence, markEvent } = realtimeSlice.actions;
export default realtimeSlice.reducer;
