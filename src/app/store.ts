import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { githubApi } from "../api/githubApi";
import trackedReducer from "../features/tracked/trackedSlice";

const rootReducer = combineReducers({
  tracked: trackedReducer,
  [githubApi.reducerPath]: githubApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/** Factory (not a singleton) so tests can build isolated stores. */
export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().concat(githubApi.middleware),
  });
}

export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore["dispatch"];
