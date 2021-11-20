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
import { HashSet, Vector } from "prelude-ts";
import Decimal from "decimal.js";
import { Immutable } from "immer";
import {
  create_level,
  execute_transaction,
  get_select_query,
  replace_variables,
  useDB,
} from "./main/utils/db";

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
    // Test DB
    // Put some dummy data in DB
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

      await replace_variables(new Decimal(0), new Date(), "B", [
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

      await replace_variables(new Decimal(0), new Date(), "C", [
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

      await replace_variables(new Decimal(0), new Date(), "A", [
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

      const a = get_select_query(
        "A",
        {
          active: true,
          level: undefined,
          id: [],
          created_at: [],
          updated_at: [],
        },
        [
          [["x"], "str", undefined, []],
          [["y"], "other", undefined, [], "B"],
          [["y", "a"], "str", undefined, []],
          [["y", "b"], "i32", undefined, []],
          [["y", "c"], "udecimal", undefined, []],
          [["z"], "other", undefined, [], "C"],
          [["z", "q"], "str", undefined, []],
        ],
        [new Decimal(10), new Decimal(0)]
      );

      console.log(a);

      const s = await execute_transaction(a, []);

      console.log("RESULTS ARE: ", s);

      console.log("===============");
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
