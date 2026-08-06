import { configureStore } from "@reduxjs/toolkit";
import realtimeReducer from "./realtimeSlice";

/**
 * Redux store - dedicated to real-time/derived UI state that Socket.IO events
 * update (connection status, presence, live badges). REST data stays in React
 * Query; the two are kept in sync by the socket layer (see useSocket).
 */
export const store = configureStore({
  reducer: {
    realtime: realtimeReducer,
  },
  // Socket payloads are plain JSON, but keep the check lenient for dates.
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
