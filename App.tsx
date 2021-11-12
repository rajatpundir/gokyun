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
import { Path, PathFilter, Struct } from "./main/utils/variable";
import { HashSet, Vector } from "prelude-ts";
import Decimal from "decimal.js";
import { Immutable } from "immer";
import * as SQLite from "expo-sqlite";
import { generate_query } from "./main/utils/db";

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

const db = SQLite.openDatabase("db.testDb");

export default function App() {
  const isLoadingComplete = useAssets();
  const colorScheme = useColorScheme();

  // console.log(
  //   generate_query(
  //     "Wallet",
  //     new Decimal(0),
  //     new Decimal(0),
  //     4,
  //     undefined,
  //     undefined
  //   )
  // );

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
