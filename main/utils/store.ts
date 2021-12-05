import create from "zustand/vanilla";
import createStore from "zustand";

type State = {
  db_updation_toggle: boolean;
  toggle_db_update_toggle: () => void;
};

// Note: fields in store should be mutable, or change is not reflected where they are used.
// Store is limited to per page open, use Local Storage to sync store every few seconds.
export const store = create<State>((set, get) => ({
  db_updation_toggle: false,
  toggle_db_update_toggle: () => {
    console.log("store value was toggled");
    set({ db_updation_toggle: !get().db_updation_toggle });
  },
}));

export const { getState, setState, subscribe, destroy } = store;

export const useStore = createStore(store);
