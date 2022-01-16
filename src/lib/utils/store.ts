import create from "zustand/vanilla";
import {
  StoreApiWithSubscribeWithSelector,
  subscribeWithSelector,
} from "zustand/middleware";
import { GetState, SetState } from "zustand";

type State = {
  db_updation_toggle: boolean;
  toggle_db_update_toggle: () => void;
};

export const store = create<
  State,
  SetState<State>,
  GetState<State>,
  StoreApiWithSubscribeWithSelector<State>
>(
  subscribeWithSelector(
    (set, get) =>
      ({
        db_updation_toggle: false,
        toggle_db_update_toggle: () => {
          console.log("store value was toggled");
          set({ db_updation_toggle: !get().db_updation_toggle });
        },
      } as State)
  )
);

export const { getState, setState, subscribe, destroy } = store;
