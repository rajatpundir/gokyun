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

import { SelectionModal } from "./main/utils/list";
import { ListAction } from "./main/utils/list";

import { Struct, Variable } from "./main/utils/variable";

import Test from "./modals/test";

import Decimal from "decimal.js";
import { Filter } from "./main/utils/db";

import { NativeBaseProvider } from "native-base";
import { HashSet } from "prelude-ts";
import { colors } from "./main/themed/colors";

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
    filters: [Filter, HashSet<Filter>];
    limit: Decimal;
    render_list_element: [
      (props: {
        selected: number;
        variable: Variable;
        disptach_values: (variable: Variable) => void;
      }) => JSX.Element,
      Record<
        string,
        (props: {
          selected: number;
          variable: Variable;
          disptach_values: (variable: Variable) => void;
        }) => JSX.Element
      >
    ];
    disptach_values: (variable: Variable) => void;
    render_custom_fields: (props: {
      filters: HashSet<Filter>;
      dispatch: React.Dispatch<ListAction>;
      show_views: () => void;
      show_sorting: () => void;
      show_filters: () => void;
    }) => JSX.Element;
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
      <NativeBaseProvider>
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
                  headerStyle: { backgroundColor: colors.custom.black[900] },
                  headerTintColor: colors.tailwind.slate[400],
                }}
              />
              <Stack.Screen
                name="Test"
                component={Test}
                options={{
                  title: "Test",
                  headerStyle: { backgroundColor: colors.custom.black[900] },
                  headerTintColor: colors.tailwind.slate[400],
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
      </NativeBaseProvider>
    );
  }
}
