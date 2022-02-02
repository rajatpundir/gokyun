import create from "zustand/vanilla";
import {
  StoreApiWithSubscribeWithSelector,
  subscribeWithSelector,
} from "zustand/middleware";
import { GetState, SetState } from "zustand";

type State = {
  structs: StructQueue;
  notify_struct_changes: (
    args: Record<
      QueueStruct,
      {
        create: ReadonlyArray<number>;
        update: ReadonlyArray<number>;
        remove: ReadonlyArray<number>;
      }
    >
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
          args: Record<
            QueueStruct,
            {
              create: ReadonlyArray<number>;
              update: ReadonlyArray<number>;
              remove: ReadonlyArray<number>;
            }
          >
        ) => {
          const temp1 = { ...get().structs };
          for (const struct_name of Object.keys(args)) {
            temp1[struct_name as QueueStruct] = {
              create: get().structs[struct_name as QueueStruct].create.concat(
                args[struct_name as QueueStruct].create
              ),
              update: get().structs[struct_name as QueueStruct].update.concat(
                args[struct_name as QueueStruct].update
              ),
              remove: get().structs[struct_name as QueueStruct].remove.concat(
                args[struct_name as QueueStruct].remove
              ),
            };
          }
          set({ structs: temp1 });
          setTimeout(async () => {
            const temp2 = { ...get().structs };
            for (const struct_name of Object.keys(args)) {
              temp1[struct_name as QueueStruct] = {
                create: get().structs[struct_name as QueueStruct].create.slice(
                  args[struct_name as QueueStruct].create.length
                ),
                update: get().structs[struct_name as QueueStruct].update.slice(
                  args[struct_name as QueueStruct].update.length
                ),
                remove: get().structs[struct_name as QueueStruct].remove.slice(
                  args[struct_name as QueueStruct].remove.length
                ),
              };
            }
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

export type QueueStruct = keyof StructQueue;
