import create from "zustand/vanilla";
import {
  StoreApiWithSubscribeWithSelector,
  subscribeWithSelector,
} from "zustand/middleware";
import { GetState, SetState } from "zustand";

type StructQueue = {
  User: Array<number>;
  Test: Array<number>;
};

type State = {
  // db_updation_toggle: boolean;
  // toggle_db_update_toggle: () => void;
  structs: StructQueue;
  notify_struct_changes: (
    struct_name: keyof StructQueue,
    ids: Array<number>
  ) => Promise<void>;
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
        // db_updation_toggle: false,
        // toggle_db_update_toggle: () => {
        //   console.log("store value was toggled");
        //   set({ db_updation_toggle: !get().db_updation_toggle });
        // }
        structs: {
          User: [],
          Test: [],
        },
        notify_struct_changes: async (
          struct_name: keyof StructQueue,
          ids: Array<number>
        ) => {
          const temp1 = { ...get().structs };
          temp1[struct_name] = get().structs[struct_name].concat(ids);
          set({ structs: temp1 });
          setTimeout(async () => {
            const temp2 = { ...get().structs };
            temp2[struct_name] = get().structs[struct_name].slice(ids.length);
            set({ structs: temp2 });
          }, 1);
        },
      } as State)
  )
);

export const { getState, setState, subscribe, destroy } = store;
