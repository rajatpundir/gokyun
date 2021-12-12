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

import { VariableFilter, VariablesModal } from "./main/utils/variables_modal";
import SelectionModal from "./modals/selection";
import { Struct, Variable } from "./main/utils/variable";

import Test from "./modals/test";

import Decimal from "decimal.js";
import { Immutable } from "immer";
import { Filter, PathFilter } from "./main/utils/db";

declare global {
  namespace ReactNavigation {
    interface RootParamList extends NavigatorParams {}
  }
}

export type NavigatorParams = {
  Main: NavigatorScreenParams<MainScreenNavigatorParams> | undefined;
  NotFound: undefined;
  SelectionModal: {
    title: string;
    selected: number;
    struct: Struct;
    active: boolean;
    level: Decimal | undefined;
    filters: ReadonlyArray<Filter>;
    limit_offset: [Decimal, Decimal] | undefined;
    render_list_element: (props: {
      selected: number;
      variable: Variable;
      disptach_values: (variable: Variable) => void;
    }) => JSX.Element;
    disptach_values: (variable: Variable) => void;
  };
  VariablesModal: {
    struct: Struct;
    filter: VariableFilter;
    selected: Decimal;
    set_selected: (selected: Decimal) => void;
    render_item: (
      variable: Variable,
      selected: Immutable<Decimal>,
      set_selected: (selected: Decimal) => void
    ) => JSX.Element;
  };
  Test: {
    id: number;
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
              name="SelectionModal"
              component={SelectionModal}
              options={{
                title: "Select variable",
                headerStyle: { backgroundColor: "black" },
                headerTintColor: "white",
              }}
            />
            <Stack.Screen
              name="VariablesModal"
              component={VariablesModal}
              options={{
                title: "Select your Variable!",
                headerStyle: { backgroundColor: "black" },
                headerTintColor: "white",
              }}
            />
            <Stack.Screen
              name="Test"
              component={Test}
              options={{
                title: "Test",
                headerStyle: { backgroundColor: "black" },
                headerTintColor: "white",
              }}
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
