import { registerRootComponent } from "expo";
import React from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Provider as PaperProvider,
  DefaultTheme as PaperTheme,
} from "react-native-paper";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalProvider } from "@gorhom/portal";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { StatusBar } from "expo-status-bar";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { NavigatorScreenParams } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ListAction, SelectionModal } from "../../lib/utils/list";
import { PathString, Struct, Variable } from "../../lib/utils/variable";
import { Filter } from "../../lib/utils/db";
import { colors } from "../../lib/themed/colors";

import {
  Navigator,
  NavigatorParams as MainScreenNavigatorParams,
} from "./tree";

import NotFoundScreen from "../not_found";
import Test from "../test";
import useAssets from "../../lib/hooks/useAssets";

// Ignore react navigation error related to serializability of props passed

export type NavigatorParams = {
  Main: NavigatorScreenParams<MainScreenNavigatorParams> | undefined;
  NotFound: undefined;
  SelectionModal: {
    title: string;
    selected: Decimal;
    struct: Struct;
    user_paths: Array<PathString>;
    borrows: Array<string>;
    active: boolean;
    level: Decimal | undefined;
    filters: [Filter, HashSet<Filter>];
    limit: Decimal;
    render_list_element: [
      (props: {
        struct: Struct;
        user_paths: Array<PathString>;
        borrows: Array<string>;
        variable: Variable;
        selected: boolean;
        update_parent_values: () => void;
      }) => JSX.Element,
      Record<
        string,
        (props: {
          struct: Struct;
          user_paths: Array<PathString>;
          borrows: Array<string>;
          variable: Variable;
          selected: boolean;
          update_parent_values: () => void;
        }) => JSX.Element
      >
    ];
    update_parent_values: (variable: Variable) => void;
    render_custom_fields: (props: {
      init_filter: Filter;
      filters: HashSet<Filter>;
      dispatch: React.Dispatch<ListAction>;
      show_views: [(props: { element: JSX.Element }) => JSX.Element, boolean];
      show_sorting: (props: { element: JSX.Element }) => JSX.Element;
      show_filters: (props: { element: JSX.Element }) => JSX.Element;
    }) => JSX.Element;
    horizontal: boolean;
  };
  Test: {
    id: number;
  };
};

const theme: ReactNativePaper.Theme = {
  ...PaperTheme,
  roundness: 5,
  dark: true,
  mode: "exact",
  colors: {
    ...PaperTheme.colors,
    primary: colors.tailwind.red[600],
    accent: colors.tailwind.blue[900],
    background: colors.tailwind.zinc[900],
    placeholder: colors.tailwind.zinc[300],
    text: colors.tailwind.zinc[100],
  },
};

function Component() {
  const isLoadingComplete = useAssets();
  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={theme}>
          <BottomSheetModalProvider>
            <PortalProvider>
              <SafeAreaProvider>
                <SafeAreaView style={{ flex: 1 }}>
                  <NavigationContainer
                    theme={{
                      dark: true,
                      colors: {
                        ...DarkTheme.colors,
                        primary: colors.tailwind.red[600],
                        background: colors.tailwind.zinc[900],
                        card: colors.tailwind.zinc[900],
                        border: colors.tailwind.zinc[800],
                        text: colors.tailwind.zinc[300],
                        notification: colors.tailwind.sky[600],
                      },
                    }}
                  >
                    <Stack.Navigator>
                      <Stack.Group>
                        <Stack.Screen
                          name="Main"
                          component={Navigator}
                          options={{ headerShown: false, animation: "none" }}
                        />
                      </Stack.Group>
                      <Stack.Group screenOptions={{ presentation: "modal" }}>
                        <Stack.Screen
                          name="SelectionModal"
                          component={SelectionModal}
                          options={{
                            headerShown: false,
                            animation: "none",
                          }}
                        />
                        <Stack.Screen
                          name="Test"
                          component={Test}
                          options={{
                            headerShown: false,
                            animation: "none",
                          }}
                        />
                        <Stack.Screen
                          name="NotFound"
                          component={NotFoundScreen}
                          options={{
                            headerShown: false,
                            animation: "none",
                          }}
                        />
                      </Stack.Group>
                    </Stack.Navigator>
                  </NavigationContainer>
                  <StatusBar backgroundColor={colors.tailwind.zinc[900]} />
                </SafeAreaView>
              </SafeAreaProvider>
            </PortalProvider>
          </BottomSheetModalProvider>
        </PaperProvider>
      </GestureHandlerRootView>
    );
  }
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends NavigatorParams {}
  }
}

export type NavigatorProps<Screen extends keyof NavigatorParams> =
  NativeStackScreenProps<NavigatorParams, Screen>;

const Stack = createNativeStackNavigator<NavigatorParams>();

registerRootComponent(Component);
