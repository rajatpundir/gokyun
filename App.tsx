import React, { useState } from "react";
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

import { HashSet } from "prelude-ts";
import { colors } from "./main/themed/colors";
import { Text, View } from "./main/themed";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { getState, subscribe } from "./main/utils/store";
import { arrow } from "./main/utils/prelude";
import Checkbox from "expo-checkbox";
import { Pressable } from "react-native";

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
      show_views: (props: { element: JSX.Element }) => JSX.Element;
      show_sorting: (props: { element: JSX.Element }) => JSX.Element;
      show_filters: (props: { element: JSX.Element }) => JSX.Element;
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

// Ignore react navigation error related to serializability of props passed

// Use Zustand state to hide bottom tab via styling.
// On component unmount via return callback of useEffect, manipulate zustand state.

export default function App() {
  const isLoadingComplete = useAssets();
  const colorScheme = useColorScheme();
  const [bottom_sheet_props, set_bottom_sheet_props] = useState(
    getState().bottom_sheet_props
  );
  subscribe((s) => set_bottom_sheet_props(s.bottom_sheet_props));
  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <BottomSheetModalProvider>
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
                  headerTintColor: colors.tailwind.slate[200],
                }}
              />
              <Stack.Screen
                name="Test"
                component={Test}
                options={{
                  title: "Test",
                  headerStyle: { backgroundColor: colors.custom.black[900] },
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
        {/* {arrow(() => {
          if (bottom_sheet_props !== undefined) {
            const [state, dispatch, render_list_element] = [
              bottom_sheet_props.state,
              bottom_sheet_props.dispatch,
              bottom_sheet_props.render_list_element,
            ];
            const bottomSheetModalRef4 = bottom_sheet_props.view;
            return (
              <BottomSheetModal
                ref={bottomSheetModalRef4}
                snapPoints={["50%", "90%"]}
                index={0}
                backgroundStyle={{
                  backgroundColor: colors.custom.black[900],
                  borderColor: colors.tailwind.gray[500],
                  borderWidth: 1,
                }}
              >
                <View
                  style={{
                    paddingBottom: 10,
                    marginHorizontal: 1,
                    paddingHorizontal: 8,
                    borderBottomWidth: 1,
                    backgroundColor: colors.custom.black[900],
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    VIEW
                  </Text>
                  <View>
                    <Pressable
                      onPress={() => bottomSheetModalRef4.current?.close()}
                      style={{ paddingRight: 8 }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "700",
                          textAlign: "center",
                          paddingHorizontal: 5,
                          paddingVertical: 2,
                          borderRadius: 2,
                          backgroundColor: colors.custom.red[900],
                        }}
                      >
                        Close
                      </Text>
                    </Pressable>
                  </View>
                </View>
                <BottomSheetScrollView
                  contentContainerStyle={{
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    margin: 5,
                  }}
                >
                  <View
                    style={{
                      justifyContent: "flex-start",
                      marginHorizontal: 5,
                      marginVertical: 10,
                    }}
                  >
                    {arrow(() => {
                      const active = state.layout === "";
                      return (
                        <Checkbox
                          value={active}
                          onValueChange={(x) => {
                            if (x) {
                              dispatch(["layout", ""]);
                              bottomSheetModalRef4.current?.close();
                            }
                          }}
                          color={active ? colors.custom.red[900] : undefined}
                        />
                      );
                    })}
                    <Text style={{ paddingLeft: 10 }}>Default</Text>
                  </View>
                  {Object.keys(render_list_element[1]).map((layout) => {
                    return (
                      <View
                        style={{
                          justifyContent: "flex-start",
                          marginHorizontal: 5,
                          marginVertical: 10,
                        }}
                      >
                        {arrow(() => {
                          const active = state.layout === layout;
                          return (
                            <Checkbox
                              value={active}
                              onValueChange={(x) => {
                                if (x) {
                                  dispatch(["layout", layout]);
                                  bottomSheetModalRef4.current?.close();
                                }
                              }}
                              color={
                                active ? colors.custom.red[900] : undefined
                              }
                            />
                          );
                        })}
                        <Text style={{ paddingLeft: 10 }}>{layout}</Text>
                      </View>
                    );
                  })}
                </BottomSheetScrollView>
              </BottomSheetModal>
            );
          }
          return <></>;
        })} */}
      </BottomSheetModalProvider>
    );
  }
}
