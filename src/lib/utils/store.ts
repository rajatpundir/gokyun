import create from "zustand/vanilla";
import {
  StoreApiWithSubscribeWithSelector,
  subscribeWithSelector,
} from "zustand/middleware";
import { GetState, SetState } from "zustand";
import { ThemeName } from "./theme";

type State = {
  theme: ThemeName;
  broker: Broker;
  announce_message: (
    args: Record<
      BrokerKey,
      {
        create: ReadonlyArray<number>;
        remove: ReadonlyArray<number>;
        update: ReadonlyArray<number>;
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
        theme: "Light",
        broker: {
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
        announce_message: async (
          args: Record<
            BrokerKey,
            {
              create: ReadonlyArray<number>;
              update: ReadonlyArray<number>;
              remove: ReadonlyArray<number>;
            }
          >
        ) => {
          const temp1 = { ...get().broker };
          for (const struct_name of Object.keys(args)) {
            temp1[struct_name as BrokerKey] = {
              create: get().broker[struct_name as BrokerKey].create.concat(
                args[struct_name as BrokerKey].create
              ),
              update: get().broker[struct_name as BrokerKey].update.concat(
                args[struct_name as BrokerKey].update
              ),
              remove: get().broker[struct_name as BrokerKey].remove.concat(
                args[struct_name as BrokerKey].remove
              ),
            };
          }
          set({ broker: temp1 });
          const temp2 = { ...get().broker };
          for (const struct_name of Object.keys(args)) {
            temp2[struct_name as BrokerKey] = {
              create: get().broker[struct_name as BrokerKey].create.slice(
                args[struct_name as BrokerKey].create.length
              ),
              update: get().broker[struct_name as BrokerKey].update.slice(
                args[struct_name as BrokerKey].update.length
              ),
              remove: get().broker[struct_name as BrokerKey].remove.slice(
                args[struct_name as BrokerKey].remove.length
              ),
            };
          }
          set({ broker: temp2 });
        },
      } as State)
  )
);

export const { getState, setState, subscribe, destroy } = store;

type Broker = {
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

export type BrokerKey = keyof Broker;
