import React, { useRef } from "react";
import { Draft } from "immer";
import { useEffect } from "react";
import { FlatList } from "react-native-gesture-handler";
import { useImmerReducer } from "use-immer";
import { NavigatorProps as RootNavigatorProps } from "../../App";
import { Filter, FilterPath, get_variables } from "../../main/utils/db";
import { Struct, Variable } from "../../main/utils/variable";
import { View, Text, TextInput } from "../../main/themed";
import Decimal from "decimal.js";
import { Pressable } from "react-native";
import { apply, arrow, fold, unwrap } from "../../main/utils/prelude";
import { HashSet } from "prelude-ts";
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import { FontAwesome } from "@expo/vector-icons";
import { FilterComponent, SortComponent, SortComponentFields } from "./filter";
import { colors } from "../../main/themed/colors";
import Checkbox from "expo-checkbox";

// Tinker around and things will fall into place.
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
  loading: boolean;
  struct: Struct;
  active: boolean;
  level: Decimal | undefined;
  init_filter: Filter;
  filters: HashSet<Filter>;
  limit: Decimal;
  offset: Decimal;
  variables: Array<Variable>;
};

export type Action =
  | ["variables", Array<Variable>]
  | ["active", boolean]
  | ["level", Decimal | undefined]
  | ["offset"]
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
      if (state.offset.equals(0)) {
        state.variables = action[1] as any;
      } else {
        for (let v of action[1]) {
          state.variables.push(v as any);
        }
      }
      if (!state.limit.equals(action[1].length)) {
        state.loading = true;
      } else {
        state.loading = false;
      }
      break;
    }
    case "active": {
      state.active = action[1];
      state.offset = new Decimal(0);
      break;
    }
    case "level": {
      state.level = action[1];
      state.offset = new Decimal(0);
      break;
    }
    case "offset": {
      if (!state.loading) {
        state.offset = Decimal.add(
          state.offset.toNumber(),
          state.limit.toNumber()
        );
        state.loading = true;
      }
      break;
    }
    case "sort": {
      switch (action[1]) {
        case "add": {
          state.init_filter = apply(state.init_filter.clone(), (it) => {
            it.filter_paths = state.init_filter.filter_paths.add(
              apply(action[2], (it) => {
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
          state.init_filter = apply(state.init_filter.clone(), (it) => {
            it.filter_paths.add(
              apply(action[2], (x) => {
                x.ordering = undefined;
                return x;
              })
            );
            return it;
          });
          break;
        }
        case "up":
        case "down": {
          const ordering = action[2].ordering;
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
                state.init_filter = apply(state.init_filter.clone(), (it) => {
                  it.filter_paths.add(
                    apply(action[2], (x) => {
                      x.ordering = [ordering2[0], ordering[1]];
                      return x;
                    })
                  );
                  it.filter_paths.add(
                    apply(result2.get(), (x) => {
                      x.ordering = [ordering[0], ordering2[1]];
                      return x;
                    })
                  );
                  return it;
                });
              }
            }
          }
          break;
        }
        case "toggle": {
          state.init_filter = apply(state.init_filter.clone(), (it) => {
            it.filter_paths.add(
              apply(action[2], (x) => {
                if (x.ordering !== undefined) {
                  x.ordering = [x.ordering[0], !x.ordering[1]];
                }
                return x;
              })
            );
            return it;
          });
          break;
        }
        default: {
          const _exhaustiveCheck: never = action[2];
          return _exhaustiveCheck;
        }
      }
      state.offset = new Decimal(0);
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
      state.offset = new Decimal(0);
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
      state.offset = new Decimal(0);
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
    loading: false,
    struct: props.route.params.struct,
    active: props.route.params.active,
    level: props.route.params.level,
    init_filter: props.route.params.filters[0],
    filters: props.route.params.filters[1],
    limit: new Decimal(10),
    offset: new Decimal(0),
    variables: [],
  });

  const get_vars = async () => {
    const variables = await get_variables(
      state.struct,
      state.active,
      state.level,
      [state.init_filter, state.filters],
      [state.limit, state.offset]
    );
    if (unwrap(variables)) {
      console.log("##########");
      for (let v of variables.value) {
        console.log(v.id);
      }
      dispatch(["variables", variables.value]);
    }
  };

  useEffect(() => {
    props.navigation.setOptions({ headerTitle: props.route.params.title });
    get_vars();
  }, [
    state.struct,
    state.active,
    state.level,
    state.init_filter,
    state.filters,
    state.offset,
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
            snapPoints={["50%", "95%"]}
            index={1}
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
              snapPoints={["50%", "95%"]}
              index={1}
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
          keyExtractor={(list_item: Variable) => {
            if (list_item.id === undefined) {
              console.log(JSON.stringify(list_item));
            }
            return list_item.id.valueOf();
          }}
          onEndReachedThreshold={0.1}
          onEndReached={() => dispatch(["offset"])}
        />

        <BottomSheetModal
          ref={bottomSheetModalRef1}
          snapPoints={["50%", "95%"]}
          index={1}
          backgroundStyle={{
            backgroundColor: colors.custom.black[900],
            borderColor: colors.tailwind.gray[500],
            borderWidth: 1,
          }}
        >
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
