import { attachPersistence, loadTrackedState } from "../features/tracked/persistence";
import { refreshUnloadedRepos } from "../features/tracked/operations";
import { setupStore } from "./store";

/** Production store: hydrated from localStorage, persisted on change. */
export function createAppStore() {
  const store = setupStore({ tracked: loadTrackedState() });
  attachPersistence(store);
  void store.dispatch(refreshUnloadedRepos());
  return store;
}
