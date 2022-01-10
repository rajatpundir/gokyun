import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { StatusBar } from "expo-status-bar";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { NavigatorScreenParams } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import useAssets from "./main/hooks/useAssets";
import useColorScheme from "./main/hooks/useColorScheme";
import {
  Navigator,
  NavigatorParams as MainScreenNavigatorParams,
} from "./components";

import NotFoundScreen from "./main/NotFoundScreen";

import { SelectionModal } from "./main/utils/list";
import { ListAction } from "./main/utils/list";

import { PathString, Struct, Variable } from "./main/utils/variable";

import Test from "./modals/test";

import Decimal from "decimal.js";
import { Filter } from "./main/utils/db";

import { HashSet } from "prelude-ts";
import { colors } from "./main/themed/colors";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalProvider } from "@gorhom/portal";
import { Provider as PaperProvider } from "react-native-paper";

// Ignore react navigation error related to serializability of props passed

export type NavigatorParams = {
  Main: NavigatorScreenParams<MainScreenNavigatorParams> | undefined;
  NotFound: undefined;
  SelectionModal: {
    title: string;
    selected: Decimal;
    struct: Struct;
    active: boolean;
    level: Decimal | undefined;
    filters: [Filter, HashSet<Filter>];
    limit: Decimal;
    render_list_element: [
      (props: {
        struct: Struct;
        variable: Variable;
        selected: boolean;
        update_parent_values: (variable: Variable) => void;
      }) => JSX.Element,
      Record<
        string,
        (props: {
          struct: Struct;
          variable: Variable;
          selected: boolean;
          update_parent_values: (variable: Variable) => void;
        }) => JSX.Element
      >
    ];
    update_parent_values: (variable: Variable) => void;
    render_custom_fields: (props: {
      filters: HashSet<Filter>;
      dispatch: React.Dispatch<ListAction>;
      show_views: (props: { element: JSX.Element }) => JSX.Element;
      show_sorting: (props: { element: JSX.Element }) => JSX.Element;
      show_filters: (props: { element: JSX.Element }) => JSX.Element;
    }) => JSX.Element;
    horizontal: boolean;
  };
  Test: {
    id: number;
  };
};

export default function App() {
  const isLoadingComplete = useAssets();
  const colorScheme = useColorScheme();

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <PaperProvider>
        <BottomSheetModalProvider>
          <PortalProvider>
            <SafeAreaProvider>
              {/* <TextInput
                mode="outlined"
                autoComplete={true}
                // style={styles.inputContainerStyle}
                label="Outlined input multiline"
                multiline
                placeholder="Type something"
                value={"outlinedMultiline"}
                onChangeText={
                  (outlinedMultiline) => {}
                  // inputActionHandler('outlinedMultiline', outlinedMultiline)
                }
              /> */}
              <NavigationContainer
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
                      headerStyle: {
                        backgroundColor: colors.custom.black[900],
                      },
                      headerTintColor: colors.tailwind.slate[200],
                    }}
                  />
                  <Stack.Screen
                    name="Test"
                    component={Test}
                    options={{
                      title: "Test",
                      headerStyle: {
                        backgroundColor: colors.custom.black[900],
                      },
                      headerTintColor: colors.tailwind.slate[200],
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
          </PortalProvider>
        </BottomSheetModalProvider>
      </PaperProvider>
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
