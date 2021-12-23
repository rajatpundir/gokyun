import React, { useRef } from "react";
import { Draft } from "immer";
import { useEffect } from "react";
import { FlatList } from "react-native-gesture-handler";
import { useImmerReducer } from "use-immer";
import { NavigatorProps as RootNavigatorProps } from "../../App";
import { Filter, FilterPath, get_variables } from "../../main/utils/db";
import { Struct, Variable } from "../../main/utils/variable";
import { View, Text } from "../../main/themed";
import Decimal from "decimal.js";
import { Pressable } from "react-native";
import { apply, arrow, fold, unwrap } from "../../main/utils/prelude";
import { HashSet } from "prelude-ts";
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { FilterComponent } from "./filter";
import { colors } from "../../main/themed/colors";

// Ordering
// Limit Offset

// Rewrite SQL generation using Filter
// Fix OR filters
// id, created_at and updated_at in having clause
// Prevent SQL injection

// Test levels

// Custom outer search fields
// Create / Update Test component
// List Tests component

type State = {
  struct: Struct;
  active: boolean;
  level: Decimal | undefined;
  init_filter: Filter;
  filters: HashSet<Filter>;
  limit_offset: [Decimal, Decimal] | undefined;
  variables: Array<Variable>;
};

export type Action =
  | ["variables", Array<Variable>]
  | ["active", boolean]
  | ["level", Decimal | undefined]
  | ["limit_offset", [Decimal, Decimal] | undefined]
  | ["sort", "add", FilterPath, boolean]
  | ["sort", "remove", FilterPath]
  | ["sort", "up" | "down" | "toggle", FilterPath]
  | ["filter", "add"]
  | ["filter", "remove", Filter]
  | ["filter", "replace", Filter]
  | ["filters", Filter, "remove", FilterPath]
  | ["filters", Filter, "replace", FilterPath];

export function reducer(state: Draft<State>, action: Action) {
  switch (action[0]) {
    case "variables": {
      state.variables = action[1] as any;
      break;
    }
    case "active": {
      state.active = action[1];
      break;
    }
    case "level": {
      state.level = action[1];
      break;
    }
    case "limit_offset": {
      state.limit_offset = action[1];
      break;
    }
    case "sort": {
      const result = state.init_filter.filter_paths.findAny((x) =>
        x.equals(action[2])
      );
      if (result.isSome()) {
        switch (action[1]) {
          case "add": {
            state.init_filter = apply(state.init_filter.clone(), (it) => {
              it.filter_paths = state.init_filter.filter_paths.add(
                apply(result.get(), (it) => {
                  it.ordering = [
                    Decimal.add(
                      fold(
                        new Decimal(0),
                        state.init_filter.filter_paths.toArray().map((x) => {
                          if (x.ordering !== undefined) {
                            return x.ordering[0];
                          }
                          return new Decimal(0);
                        }),
                        (acc, val) => {
                          return Decimal.max(acc, val);
                        }
                      ),
                      1
                    ),
                    action[3],
                  ];
                  return it;
                })
              );
              return it;
            });
            break;
          }
          case "remove": {
            let order_count = new Decimal(1);
            let updated_filter_paths: HashSet<FilterPath> = HashSet.of();
            for (let filter_path of state.init_filter.filter_paths
              .add(
                apply(result.get(), (it) => {
                  it.ordering = undefined;
                  return it;
                })
              )
              .toArray()
              .sort((a, b) => {
                if (a.ordering === undefined) {
                  return -1;
                } else {
                  if (b.ordering === undefined) {
                    return 1;
                  } else {
                    if (a.ordering[0] > b.ordering[0]) return 1;
                    else if (b.ordering[0] > a.ordering[0]) return -1;
                    else return 0;
                  }
                }
              })) {
              updated_filter_paths = updated_filter_paths.add(
                apply(filter_path, (it) => {
                  const ordering = filter_path.ordering;
                  if (ordering !== undefined) {
                    it.ordering = [ordering[0], ordering[1]];
                    order_count = Decimal.add(ordering[0], 1);
                  }
                  return it;
                })
              );
            }
            state.init_filter.filter_paths = updated_filter_paths;
            break;
          }
          case "up":
          case "down": {
            const ordering = result.get().ordering;
            if (ordering !== undefined) {
              const result2 = state.init_filter.filter_paths.findAny((x) => {
                if (x.ordering !== undefined) {
                  if (action[1] === "up") {
                    return Decimal.add(x.ordering[0], 1).equals(ordering[0]);
                  }
                  if (action[1] === "down") {
                    return Decimal.add(ordering[0], 1).equals(x.ordering[0]);
                  }
                }
                return false;
              });
              if (result2.isSome()) {
                const ordering2 = result2.get().ordering;
                if (ordering2 !== undefined) {
                  state.init_filter.filter_paths.addAll([
                    apply(result.get(), (it) => {
                      it.ordering = [ordering2[0], ordering[1]];
                      return it;
                    }),
                    apply(result2.get(), (it) => {
                      it.ordering = [ordering[0], ordering2[1]];
                      return it;
                    }),
                  ]);
                }
              }
            }
            break;
          }
          case "toggle": {
            state.init_filter.filter_paths = state.init_filter.filter_paths.add(
              apply(result.get(), (it) => {
                const ordering = result.get().ordering;
                if (ordering !== undefined) {
                  it.ordering = [ordering[0], !ordering[1]];
                }
                return it;
              })
            );
            break;
          }
          default: {
            const _exhaustiveCheck: never = action[2];
            return _exhaustiveCheck;
          }
        }
      }
      break;
    }
    case "filter": {
      switch (action[1]) {
        case "add": {
          state.filters = state.filters.add(
            new Filter(
              1 + Math.max(-1, ...state.filters.map((x) => x.index).toArray()),
              [false, undefined],
              [false, undefined],
              [false, undefined],
              HashSet.of()
            )
          );
          break;
        }
        case "remove": {
          state.filters = state.filters.remove(action[2]);
          break;
        }
        case "replace": {
          state.filters = state.filters.remove(action[2]);
          state.filters = state.filters.add(action[2]);
          break;
        }
        default: {
          const _exhaustiveCheck: never = action[1];
          return _exhaustiveCheck;
        }
      }
      break;
    }
    case "filters": {
      const result = state.filters.findAny((x) => x === action[1]);
      if (result.isSome()) {
        state.filters = apply(result.get(), (filter) => {
          switch (action[2]) {
            case "replace": {
              filter.filter_paths = filter.filter_paths.add(action[3]);
              break;
            }
            case "remove": {
              filter.filter_paths = filter.filter_paths.remove(action[3]);
              break;
            }
            default: {
              const _exhaustiveCheck: never = action[2];
              return _exhaustiveCheck;
            }
          }
          return state.filters.add(filter);
        });
      }
      break;
    }
    default: {
      const _exhaustiveCheck: never = action[0];
      return _exhaustiveCheck;
    }
  }
}

export default function Component(props: RootNavigatorProps<"SelectionModal">) {
  const [state, dispatch] = useImmerReducer<State, Action>(reducer, {
    struct: props.route.params.struct,
    active: props.route.params.active,
    level: props.route.params.level,
    init_filter: props.route.params.filters[0],
    filters: props.route.params.filters[1],
    limit_offset: props.route.params.limit_offset,
    variables: [],
  });

  useEffect(() => {
    props.navigation.setOptions({ headerTitle: props.route.params.title });
    const get_vars = async () => {
      const variables = await get_variables(
        state.struct,
        state.active,
        state.level,
        [state.init_filter, state.filters],
        state.limit_offset
      );
      if (unwrap(variables)) {
        dispatch(["variables", variables.value]);
      }
    };
    get_vars();
  }, [
    state.struct,
    state.active,
    state.level,
    state.filters,
    state.limit_offset,
  ]);

  const bottomSheetModalRef1 = useRef<BottomSheetModal>(null);
  const bottomSheetModalRef2 = useRef<BottomSheetModal>(null);
  const bottomSheetModalRef3 = useRef<BottomSheetModal>(null);
  return (
    <BottomSheetModalProvider>
      <View style={{ flex: 1, flexDirection: "column" }}>
        <View style={{ justifyContent: "flex-end" }}>
          <Pressable
            onPress={() => bottomSheetModalRef2.current?.present()}
            style={{
              alignSelf: "center",
            }}
          >
            <Text
              style={{
                alignSelf: "flex-end",
                fontSize: 15,
                fontWeight: "500",
                textAlign: "center",
                paddingHorizontal: 4,
                paddingVertical: 2,
                color: "white",
              }}
            >
              Sort <FontAwesome name="unsorted" size={16} color="white" />
            </Text>
          </Pressable>
          <BottomSheetModal
            ref={bottomSheetModalRef2}
            snapPoints={["50%", "100%"]}
            index={1}
            backgroundStyle={{
              backgroundColor: colors.custom.black[900],
              borderColor: "white",
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
                SORT BY
              </Text>
              <View>
                <Pressable
                  onPress={() => bottomSheetModalRef3.current?.present()}
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
                  onPress={() => bottomSheetModalRef2.current?.close()}
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
            <SortComponent
              init_filter={state.init_filter}
              dispatch={dispatch}
            />
            <BottomSheetModal
              ref={bottomSheetModalRef3}
              snapPoints={["50%", "100%"]}
              index={1}
              backgroundStyle={{
                backgroundColor: colors.custom.black[900],
                borderColor: "white",
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
                    onPress={() => bottomSheetModalRef3.current?.close()}
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
          </BottomSheetModal>
          <Pressable
            onPress={() => bottomSheetModalRef1.current?.present()}
            style={{
              paddingLeft: 4,
            }}
          >
            <Text
              style={{
                alignSelf: "flex-end",
                fontSize: 15,
                fontWeight: "500",
                textAlign: "center",
                paddingHorizontal: 4,
                paddingVertical: 2,
              }}
            >
              Filter <FontAwesome name="filter" size={16} color="white" />
            </Text>
          </Pressable>
        </View>

        {/* Should be replcaed with a generic component thats passed down as props and that takes state.variabels as input */}
        <FlatList
          data={state.variables}
          renderItem={(list_item) => (
            <props.route.params.render_list_element
              selected={props.route.params.selected}
              variable={list_item.item}
              disptach_values={props.route.params.disptach_values}
            />
          )}
          keyExtractor={(list_item: Variable) => list_item.id.valueOf()}
        />

        <BottomSheetModal
          ref={bottomSheetModalRef1}
          snapPoints={["50%", "100%"]}
          index={1}
          backgroundStyle={{
            backgroundColor: colors.custom.black[900],
            borderColor: "white",
            borderWidth: 1,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "column",
              backgroundColor: colors.custom.black[900],
              borderColor: "white",
              borderLeftWidth: 1,
              borderRightWidth: 1,
              paddingHorizontal: 0,
            }}
          >
            <View
              style={{
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
                  color={state.active ? colors.custom.red[900] : undefined}
                  style={{
                    alignSelf: "center",
                    marginRight: 6,
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
                  color={!state.level ? colors.custom.red[900] : undefined}
                  style={{
                    alignSelf: "center",
                    marginRight: 6,
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
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  );
}

function SortComponent(props: {
  init_filter: Filter;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <BottomSheetScrollView
      contentContainerStyle={{
        flexDirection: "column",
        justifyContent: "flex-start",
        margin: 5,
      }}
    >
      {props.init_filter.filter_paths
        .toArray()
        .filter((x) => x.ordering !== undefined)
        .sort((a, b) => (a.label > b.label ? 1 : a.label < b.label ? -1 : 0))
        .map((filter_path, index) => {
          const ordering = filter_path.ordering;
          if (ordering !== undefined) {
            return (
              <View
                key={index}
                style={{
                  justifyContent: "flex-start",
                  marginHorizontal: 5,
                  marginVertical: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: "column",
                  }}
                >
                  <Pressable
                    onPress={() => props.dispatch(["sort", "up", filter_path])}
                    style={{ marginBottom: -4 }}
                  >
                    <FontAwesome name="sort-up" size={24} color="white" />
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      props.dispatch(["sort", "down", filter_path])
                    }
                    style={{ marginTop: -4 }}
                  >
                    <FontAwesome name="sort-down" size={24} color="white" />
                  </Pressable>
                </View>
                <View style={{ flexGrow: 1 }}>
                  <Text style={{ paddingLeft: 10 }}>
                    {filter_path.label}{" "}
                    {apply(filter_path.ordering, (it) => {
                      if (it !== undefined) {
                        return it[0].valueOf();
                      }
                    })}
                  </Text>
                  <Pressable
                    onPress={() =>
                      props.dispatch(["sort", "toggle", filter_path])
                    }
                    style={{ alignSelf: "center" }}
                  >
                    {arrow(() => {
                      if (ordering[1]) {
                        return (
                          <AntDesign name="arrowdown" size={24} color="white" />
                        );
                      } else {
                        return (
                          <AntDesign name="arrowup" size={24} color="white" />
                        );
                      }
                    })}
                  </Pressable>
                </View>
              </View>
            );
          }
          return <></>;
        })}
    </BottomSheetScrollView>
  );
}

function SortComponentFields(props: {
  init_filter: Filter;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <BottomSheetScrollView
      contentContainerStyle={{
        flexDirection: "column",
        justifyContent: "flex-start",
        margin: 5,
      }}
    >
      {props.init_filter.filter_paths
        .toArray()
        .sort((a, b) => (a.label > b.label ? 1 : a.label < b.label ? -1 : 0))
        .map((filter_path, index) => {
          const active = filter_path.ordering !== undefined;
          return (
            <View
              key={index}
              style={{
                justifyContent: "flex-start",
                marginHorizontal: 5,
                marginVertical: 10,
              }}
            >
              <Checkbox
                value={active}
                onValueChange={(x) => {
                  console.log(x);
                  if (x) {
                    const field_struct_name = filter_path.value[0];
                    props.dispatch([
                      "sort",
                      "add",
                      filter_path,
                      apply(true, (it) => {
                        switch (field_struct_name) {
                          case "str":
                          case "lstr":
                          case "clob": {
                            return false;
                          }
                        }
                        return it;
                      }),
                    ]);
                  } else {
                    props.dispatch(["sort", "remove", filter_path]);
                  }
                }}
                color={active ? colors.custom.red[900] : undefined}
              />
              <Text style={{ paddingLeft: 10 }}>
                {filter_path.label}{" "}
                {apply(filter_path.ordering, (it) => {
                  if (it !== undefined) {
                    return it[0].valueOf();
                  }
                })}
              </Text>
            </View>
          );
        })}
    </BottomSheetScrollView>
  );
}
