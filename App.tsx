import React, { useEffect, useLayoutEffect, useRef } from "react";
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

import { Struct, Variable } from "./main/utils/variable";

import Test from "./modals/test";

import Decimal from "decimal.js";
import { Filter } from "./main/utils/db";

import { HashSet } from "prelude-ts";
import { colors } from "./main/themed/colors";
import { Text, View } from "./main/themed";
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { getState, subscribe } from "./main/utils/store";
import { arrow } from "./main/utils/prelude";
import Checkbox from "expo-checkbox";
import { Pressable } from "react-native";
import {
  FilterComponent,
  SortComponent,
  SortComponentFields,
} from "./main/utils/filter";

// Ignore react navigation error related to serializability of props passed

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
    horizontal: boolean;
  };
  Test: {
    id: number;
  };
};

export default function App() {
  const isLoadingComplete = useAssets();
  const colorScheme = useColorScheme();

  let [bsm_view_props, set_bsm_view_props] = React.useState(
    getState().bsm_view.props
  );
  const bsm_view_ref = useRef<BottomSheetModal>(null);
  useLayoutEffect(() => {
    const unsub = subscribe(
      (s) => s.bsm_view.props,
      (x) => {
        set_bsm_view_props(x);
      }
    );
    return unsub;
  }, []);
  useLayoutEffect(() => {
    const unsub = subscribe(
      (s) => s.bsm_view.count,
      () => {
        bsm_view_ref.current?.present();
      }
    );
    return unsub;
  }, []);

  let [bsm_sorting_props, set_bsm_sorting_props] = React.useState(
    getState().bsm_sorting.props
  );
  const bsm_sorting_ref = useRef<BottomSheetModal>(null);
  const bsm_sorting_fields_ref = useRef<BottomSheetModal>(null);
  useLayoutEffect(() => {
    const unsub = subscribe(
      (s) => s.bsm_sorting.props,
      (x) => {
        set_bsm_sorting_props(x);
      }
    );
    return unsub;
  }, []);
  useLayoutEffect(() => {
    const unsub = subscribe(
      (s) => s.bsm_sorting.count,
      () => {
        bsm_sorting_ref.current?.present();
      }
    );
    return unsub;
  }, []);

  let [bsm_filters_props, set_bsm_filters_props] = React.useState(
    getState().bsm_filters.props
  );
  const bsm_filters_ref = useRef<BottomSheetModal>(null);
  useLayoutEffect(() => {
    const unsub = subscribe(
      (s) => s.bsm_filters.props,
      (x) => {
        set_bsm_filters_props(x);
      }
    );
    return unsub;
  }, []);
  useLayoutEffect(() => {
    const unsub = subscribe(
      (s) => s.bsm_filters.count,
      () => {
        bsm_filters_ref.current?.present();
      }
    );
    return unsub;
  }, []);

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <BottomSheetModalProvider>
        <SafeAreaProvider>
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

        <BottomSheetModal
          ref={bsm_view_ref}
          snapPoints={["50%", "82%"]}
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
                onPress={() => bsm_view_ref.current?.close()}
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
            {arrow(() => {
              if (bsm_view_props !== undefined) {
                const [state, dispatch, render_list_element] = [
                  bsm_view_props.state,
                  bsm_view_props.dispatch,
                  bsm_view_props.render_list_element,
                ];
                return (
                  <>
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
                                bsm_view_ref.current?.close();
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
                                    bsm_view_ref.current?.close();
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
                  </>
                );
              }
              return <></>;
            })}
          </BottomSheetScrollView>
        </BottomSheetModal>

        <BottomSheetModal
          ref={bsm_sorting_ref}
          snapPoints={["50%", "82%"]}
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
              SORT
            </Text>
            <View>
              <Pressable
                onPress={() => bsm_sorting_fields_ref.current?.present()}
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
                  Add Field
                </Text>
              </Pressable>
              <Pressable
                onPress={() => bsm_sorting_ref.current?.close()}
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
          {arrow(() => {
            if (bsm_sorting_props !== undefined) {
              const [state, dispatch] = [
                bsm_sorting_props.state,
                bsm_sorting_props.dispatch,
              ];
              return (
                <>
                  <SortComponent
                    init_filter={state.init_filter}
                    dispatch={dispatch}
                  />
                  <BottomSheetModal
                    ref={bsm_sorting_fields_ref}
                    snapPoints={["50%", "82%"]}
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
                        Fields
                      </Text>
                      <View>
                        <Pressable
                          onPress={() =>
                            bsm_sorting_fields_ref.current?.close()
                          }
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
                    <SortComponentFields
                      init_filter={state.init_filter}
                      dispatch={dispatch}
                    />
                  </BottomSheetModal>
                </>
              );
            }
            return <></>;
          })}
        </BottomSheetModal>

        <BottomSheetModal
          ref={bsm_filters_ref}
          snapPoints={["50%", "82%"]}
          index={1}
          backgroundStyle={{
            backgroundColor: colors.custom.black[900],
            borderColor: colors.tailwind.gray[500],
            borderWidth: 1,
          }}
        >
          {arrow(() => {
            if (bsm_filters_props !== undefined) {
              const [state, dispatch] = [
                bsm_filters_props.state,
                bsm_filters_props.dispatch,
              ];
              return (
                <View
                  style={{
                    flex: 1,
                    flexDirection: "column",
                    backgroundColor: colors.custom.black[900],
                    borderColor: colors.tailwind.gray[500],
                    borderLeftWidth: 1,
                    borderRightWidth: 1,
                    paddingHorizontal: 0,
                  }}
                >
                  <View
                    style={{
                      borderBottomWidth: 1,
                      backgroundColor: colors.custom.black[900],
                      paddingHorizontal: 10,
                      paddingBottom: 5,
                      marginBottom: 5,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      FILTERS
                    </Text>
                    <View
                      style={{
                        paddingHorizontal: 4,
                        paddingVertical: 4,
                        backgroundColor: colors.custom.black[900],
                      }}
                    >
                      <Text>Active</Text>
                      <Checkbox
                        value={state.active}
                        onValueChange={(x) => dispatch(["active", x])}
                        color={
                          state.active ? colors.custom.red[900] : undefined
                        }
                        style={{
                          alignSelf: "center",
                          marginHorizontal: 6,
                        }}
                      />
                    </View>

                    <View
                      style={{
                        paddingHorizontal: 4,
                        paddingVertical: 4,
                        marginBottom: 2,
                        backgroundColor: colors.custom.black[900],
                      }}
                    >
                      <Text>Unsynced</Text>
                      <Checkbox
                        value={!state.level ? true : false}
                        onValueChange={(x) =>
                          dispatch(["level", x ? undefined : new Decimal(0)])
                        }
                        color={
                          !state.level ? colors.custom.red[900] : undefined
                        }
                        style={{
                          alignSelf: "center",
                          marginHorizontal: 6,
                        }}
                      />
                    </View>
                    <Pressable
                      onPress={() => {
                        dispatch(["filter", "add"]);
                      }}
                      style={{
                        alignSelf: "center",
                      }}
                    >
                      <Text
                        style={{
                          backgroundColor: colors.custom.red[900],
                          alignSelf: "flex-end",
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          fontWeight: "bold",
                          marginRight: 4,
                          color: "white",
                          borderRadius: 2,
                        }}
                      >
                        Add Filter
                      </Text>
                    </Pressable>
                  </View>

                  <BottomSheetFlatList
                    data={state.filters
                      .toArray()
                      .sort((a, b) =>
                        a.index > b.index ? 1 : a.index < b.index ? -1 : 0
                      )}
                    keyExtractor={(list_item) => list_item.index.toString()}
                    renderItem={(list_item) => {
                      return (
                        <FilterComponent
                          key={list_item.item.index}
                          init_filter={state.init_filter}
                          filter={list_item.item}
                          dispatch={dispatch}
                        />
                      );
                    }}
                  />
                </View>
              );
            }
            return <></>;
          })}
        </BottomSheetModal>
      </BottomSheetModalProvider>
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
