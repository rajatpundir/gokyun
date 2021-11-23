import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { NavigatorScreenParams } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinkingOptions } from "@react-navigation/native";

import useAssets from "./main/hooks/useAssets";
import useColorScheme from "./main/hooks/useColorScheme";
import {
  Navigator,
  NavigatorParams as MainScreenNavigatorParams,
} from "./components";
import NotFoundScreen from "./main/NotFoundScreen";
import { VariablesModal } from "./main/utils/variables_modal";
import { Path, PathFilter, StrongEnum, Struct } from "./main/utils/variable";

import Decimal from "decimal.js";
import { Immutable } from "immer";
import {
  activate_level,
  create_level,
  execute_transaction,
  get_param_text,
  get_struct_counter,
  get_variable,
  get_variables,
  increment_struct_counter,
  query,
  remove_variables,
  replace_param,
  replace_variables,
  useDB,
} from "./main/utils/db";
import { get_structs } from "./main/utils/schema";
import { HashSet, Vector, Option as OptionTS } from "prelude-ts";

declare global {
  namespace ReactNavigation {
    interface RootParamList extends NavigatorParams {}
  }
}

export type NavigatorParams = {
  Main: NavigatorScreenParams<MainScreenNavigatorParams> | undefined;
  NotFound: undefined;
  VariablesModal: {
    struct: Struct;
    permissions: [HashSet<Vector<string>>, HashSet<Vector<string>>];
    requested_paths: HashSet<Path>;
    selected: Decimal;
    set_selected: (selected: Decimal) => void;
    filters: Array<[boolean, HashSet<PathFilter>]>;
    limit: Decimal;
    offset: Decimal;
    render_item: (
      struct: Immutable<Struct>,
      id: Immutable<Decimal>,
      paths: Immutable<HashSet<Path>>,
      selected: Immutable<Decimal>,
      set_selected: (selected: Decimal) => void
    ) => JSX.Element;
  };
};

export type NavigatorProps<Screen extends keyof NavigatorParams> =
  NativeStackScreenProps<NavigatorParams, Screen>;

const linking: LinkingOptions<NavigatorParams> = {
  prefixes: [Linking.makeUrl("/")],
  config: {
    screens: {
      Main: {
        screens: {
          Alliances: "alliances",
          Clans: "clans",
          Guilds: "guilds",
          System: {
            path: "system",
            screens: {
              Categories: "categories",
              Countries: {
                path: "country/:id",
                parse: {
                  id: (id: number) => `${id}`,
                },
              },
              Languages: "languages",
              Tags: "tags",
            },
          },
          Users: "users",
        },
      },
      NotFound: "*",
    },
  },
};

const Stack = createNativeStackNavigator<NavigatorParams>();

export default function App() {
  const db = useDB();

  React.useEffect(() => {
    // TODO:
    // Test filters
    // Add counter for structs and link it to zustand
    // Make VariablesModal work with dummy data
    const x = async () => {
      console.log("===============");
      const q = await execute_transaction("SELECT * FROM LEVELS", []);
      console.log("BEFORE LEVELS: ", q);
      console.log("===============");
      const q2 = await execute_transaction("SELECT * FROM VARS", []);
      console.log("BEFORE VARS: ", q2);
      console.log("===============");
      const q3 = await execute_transaction("SELECT * FROM VALS", []);
      console.log("BEFORE VALS: ", q3);
      console.log("===============");
      const q4 = await execute_transaction("SELECT * FROM REMOVED_VARS", []);
      console.log("BEFORE REMOVED_VARS: ", q4);
      console.log("===============");

      await create_level(new Decimal(1));
      await create_level(new Decimal(2));
      // activate_level(new Decimal(1));

      const level = new Decimal(2);

      await replace_variables(level, new Date(), "B", [
        {
          id: new Decimal(1),
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
          paths: [
            [
              [],
              [
                "a",
                {
                  type: "str",
                  value: "qq",
                },
              ],
            ],
            [
              [],
              [
                "b",
                {
                  type: "i32",
                  value: new Decimal(32),
                },
              ],
            ],
            [
              [],
              [
                "c",
                {
                  type: "udecimal",
                  value: new Decimal(24.64),
                },
              ],
            ],
          ],
        },
        {
          id: new Decimal(2),
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
          paths: [
            [
              [],
              [
                "a",
                {
                  type: "str",
                  value: "ww",
                },
              ],
            ],
            [
              [],
              [
                "b",
                {
                  type: "i32",
                  value: new Decimal(33),
                },
              ],
            ],
            [
              [],
              [
                "c",
                {
                  type: "udecimal",
                  value: new Decimal(85.73),
                },
              ],
            ],
          ],
        },
        {
          id: new Decimal(3),
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
          paths: [
            [
              [],
              [
                "a",
                {
                  type: "str",
                  value: "ee",
                },
              ],
            ],
            [
              [],
              [
                "b",
                {
                  type: "i32",
                  value: new Decimal(34),
                },
              ],
            ],
            [
              [],
              [
                "c",
                {
                  type: "udecimal",
                  value: new Decimal(67.98),
                },
              ],
            ],
          ],
        },
      ]);

      await replace_variables(level, new Date(), "C", [
        {
          id: new Decimal(1),
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
          paths: [
            [
              [],
              [
                "q",
                {
                  type: "str",
                  value: "cc1",
                },
              ],
            ],
          ],
        },
        {
          id: new Decimal(2),
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
          paths: [
            [
              [],
              [
                "q",
                {
                  type: "str",
                  value: "cc2",
                },
              ],
            ],
          ],
        },
        {
          id: new Decimal(3),
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
          paths: [
            [
              [],
              [
                "q",
                {
                  type: "str",
                  value: "cc3",
                },
              ],
            ],
          ],
        },
      ]);

      await replace_variables(level, new Date(), "A", [
        {
          id: new Decimal(1),
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
          paths: [
            [
              [],
              [
                "x",
                {
                  type: "str",
                  value: "aa1",
                },
              ],
            ],
            [
              [],
              [
                "y",
                {
                  type: "other",
                  other: "B",
                  value: new Decimal(1),
                },
              ],
            ],
            [
              [],
              [
                "z",
                {
                  type: "other",
                  other: "C",
                  value: new Decimal(1),
                },
              ],
            ],
          ],
        },
        {
          id: new Decimal(2),
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
          paths: [
            [
              [],
              [
                "x",
                {
                  type: "str",
                  value: "aa2",
                },
              ],
            ],
            [
              [],
              [
                "y",
                {
                  type: "other",
                  other: "B",
                  value: new Decimal(2),
                },
              ],
            ],
            [
              [],
              [
                "z",
                {
                  type: "other",
                  other: "C",
                  value: new Decimal(2),
                },
              ],
            ],
          ],
        },
        {
          id: new Decimal(3),
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
          paths: [
            [
              [],
              [
                "x",
                {
                  type: "str",
                  value: "aa3",
                },
              ],
            ],
            [
              [],
              [
                "y",
                {
                  type: "other",
                  other: "B",
                  value: new Decimal(3),
                },
              ],
            ],
            [
              [],
              [
                "z",
                {
                  type: "other",
                  other: "C",
                  value: new Decimal(3),
                },
              ],
            ],
          ],
        },
      ]);

      // await remove_variables(new Decimal(1), "A", [new Decimal(1)]);

      console.log("===============");
      const w = await execute_transaction("SELECT * FROM LEVELS", []);
      console.log("AFTER LEVELS: ", w);
      console.log("===============");
      const w2 = await execute_transaction("SELECT * FROM VARS", []);
      console.log("AFTER VARS: ", w2);
      console.log("===============");
      const w3 = await execute_transaction("SELECT * FROM VALS", []);
      console.log("AFTER VALS: ", w3);
      console.log("===============");
      const w4 = await execute_transaction("SELECT * FROM REMOVED_VARS", []);
      console.log("AFTER REMOVED_VARS: ", w4);
      console.log("===============");

      const a = await query(
        "A",
        {
          active: true,
          level: new Decimal(2),
          id: [
            // ["==", new Decimal(3)],
          ],
          created_at: [],
          updated_at: [],
        },
        [
          [["x"], "str", undefined, []],
          [["y"], "other", undefined, [], "B"],
          [["y", "a"], "str", undefined, []],
          [
            ["y", "b"],
            "i32",
            undefined,
            [["between", [new Decimal(33), new Decimal(34)]]],
          ],
          [["y", "c"], "udecimal", [new Decimal(0), false], []],
          [["z"], "other", undefined, [], "C"],
          [["z", "q"], "str", undefined, []],
        ],
        undefined
      );

      console.log(a);

      // const s = await execute_transaction(a, []);

      // console.log("RESULTS ARE: ", s);

      console.log("===============");

      const r = await execute_transaction("SELECT * FROM COUNTERS", []);
      console.log("AFTER COUNTERS: ", r);
      console.log("===============");

      let l = await get_struct_counter("AA");
      console.log("RESULT: ", l);
      console.log("===============");

      await increment_struct_counter("AA");

      const t = await execute_transaction("SELECT * FROM COUNTERS", []);
      console.log("AFTER COUNTERS: ", t);
      console.log("===============");

      l = await get_struct_counter("AA");
      console.log("RESULT: ", l);
      console.log("===============");

      const ref_struct: OptionTS<Struct> = get_structs()
        .filter((x) => x.name === "A")
        .single();
      if (ref_struct.isSome()) {
        // const g = await get_variable(
        //   undefined,
        //   ref_struct.get(),
        //   new Decimal(19),
        //   true,
        //   [
        // ["x", [["x"], "str", undefined, []]],
        // ["ya", [["y", "a"], "str", undefined, []]],
        // ["yb", [["y", "b"], "i32", undefined, []]],
        // ["yc", [["y", "c"], "udecimal", undefined, []]],
        // ["zq", [["z", "q"], "str", undefined, []]],
        //   ]
        // );

        const g = await get_variables(
          ref_struct.get(),
          {
            active: true,
            level: undefined,
            id: [["==", new Decimal(1)]],
            created_at: [],
            updated_at: [],
          },
          [
            ["x", [["x"], "str", undefined, []]],
            ["ya", [["y", "a"], "str", undefined, []]],
            ["yb", [["y", "b"], "i32", undefined, []]],
            ["yc", [["y", "c"], "udecimal", undefined, []]],
            ["zq", [["z", "q"], "str", undefined, []]],
          ],
          undefined
        );

        console.log(g);
      }
    };
    x();
  }, []);

  const isLoadingComplete = useAssets();
  const colorScheme = useColorScheme();

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider>
        <NavigationContainer
          linking={linking}
          theme={colorScheme !== "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack.Navigator>
            <Stack.Screen
              name="Main"
              component={Navigator}
              options={{ headerShown: false, animation: "none" }}
            />
            <Stack.Screen
              name="VariablesModal"
              component={VariablesModal}
              options={{ title: "Select your Variable!" }}
            />
            <Stack.Screen
              name="NotFound"
              component={NotFoundScreen}
              options={{ title: "Oops!" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar />
      </SafeAreaProvider>
    );
  }
}
