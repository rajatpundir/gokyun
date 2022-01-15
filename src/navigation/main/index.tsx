import React from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalProvider } from "@gorhom/portal";
import { Provider as PaperProvider } from "react-native-paper";
import { NativeBaseProvider } from "native-base";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { registerRootComponent } from "expo";
import { StatusBar } from "expo-status-bar";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { NavigatorScreenParams } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import useAssets from "../../lib/hooks/useAssets";

import { Navigator, NavigatorParams as MainTabNavigatorParams } from "./tree";
import { useDeviceContext } from "twrnc";
import { tw } from "../../lib/utils/tailwind";
import { apply } from "../../lib/utils/prelude";
import { theme, theme_rn, theme_rnp, theme_nb } from "../../lib/utils/theme";
import { ListAction, SelectionModal } from "../../lib/utils/list";
import { PathString, Struct, Variable } from "../../lib/utils/variable";
import { Filter } from "../../lib/utils/db";

import Test from "../test";

// Ignore react navigation error related to serializability of props passed

export type NavigatorParams = {
  Main: NavigatorScreenParams<MainTabNavigatorParams> | undefined;
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

function Component() {
  useDeviceContext(tw);
  return apply(useAssets(), (is_loading_complete) => {
    if (is_loading_complete) {
      return (
        <GestureHandlerRootView style={tw.style(["flex-1"])}>
          <BottomSheetModalProvider>
            <PortalProvider>
              <PaperProvider theme={theme_rnp}>
                <NativeBaseProvider theme={theme_nb}>
                  <SafeAreaProvider>
                    <SafeAreaView style={tw.style(["flex-1"])}>
                      <NavigationContainer theme={theme_rn}>
                        <Stack.Navigator initialRouteName="Main">
                          <Stack.Group
                            screenOptions={{
                              headerShown: false,
                              // animation: "none",
                            }}
                          >
                            <Stack.Screen name="Main" component={Navigator} />
                            <Stack.Group
                              screenOptions={{
                                presentation: "modal",
                              }}
                            >
                              <Stack.Screen
                                name="SelectionModal"
                                component={SelectionModal}
                              />
                              <Stack.Screen name="Test" component={Test} />
                            </Stack.Group>
                          </Stack.Group>
                        </Stack.Navigator>
                      </NavigationContainer>
                    </SafeAreaView>
                    <StatusBar backgroundColor={theme.background} />
                  </SafeAreaProvider>
                </NativeBaseProvider>
              </PaperProvider>
            </PortalProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      );
    }
    return <></>;
  });
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
