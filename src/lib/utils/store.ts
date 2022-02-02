import create from "zustand/vanilla";
import {
  StoreApiWithSubscribeWithSelector,
  subscribeWithSelector,
} from "zustand/middleware";
import { GetState, SetState } from "zustand";

type State = {
  structs: StructQueue;
  notify_struct_changes: (
    struct_name: keyof StructQueue,
    op: "create" | "update" | "remove",
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
        structs: {
          User: {
            create: [],
            update: [],
            remove: [],
          },
          Test: {
            create: [],
            update: [],
            remove: [],
          },
        },
        notify_struct_changes: async (
          struct_name: keyof StructQueue,
          op: "create" | "update" | "remove",
          ids: Array<number>
        ) => {
          const temp1 = { ...get().structs };
          temp1[struct_name][op] = get().structs[struct_name][op].concat(ids);
          set({ structs: temp1 });
          setTimeout(async () => {
            const temp2 = { ...get().structs };
            temp2[struct_name][op] = get().structs[struct_name][op].slice(
              ids.length
            );
            set({ structs: temp2 });
          }, 1);
        },
      } as State)
  )
);

export const { getState, setState, subscribe, destroy } = store;

type StructQueue = {
  User: {
    create: Array<number>;
    update: Array<number>;
    remove: Array<number>;
  };
  Test: {
    create: Array<number>;
    update: Array<number>;
    remove: Array<number>;
  };
};
