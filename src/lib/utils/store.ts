import create from "zustand/vanilla";
import {
  StoreApiWithSubscribeWithSelector,
  subscribeWithSelector,
} from "zustand/middleware";
import { GetState, SetState } from "zustand";
import { ThemeName } from "./theme";
import { get_param_text, replace_param } from "./db";
import { arrow, unwrap } from "./prelude";

type State = {
  params: {
    theme: ThemeName;
  };
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
        params: { theme: "Dark" },
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

// load params
arrow(async () => {
  // this should run only after load_test_data has finished
  // console.log("##################");
  const result = await get_param_text("theme");
  console.log(result);
  if (unwrap(result)) {
    const theme_names: ReadonlyArray<ThemeName> = ["Light", "Dark", "Black"];
    if (theme_names.includes(result.value as any)) {
      console.log(result.value);
      setState({ params: { theme: result.value as ThemeName } });
    }
  }
  // console.log("##################");
});

// store params
subscribe(
  (store) => store.params,
  async (params) => {
    console.log("--------------");
    console.log(params);
    await replace_param("theme", { type: "str", value: params.theme });
    console.log("--------------");
  }
);

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
