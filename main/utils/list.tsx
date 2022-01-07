import React, { useEffect, useState } from "react";
import { Draft } from "immer";
import { FlatList } from "react-native-gesture-handler";
import { useImmerReducer } from "use-immer";
import { Filter, FilterPath, get_variables } from "./db";
import { Struct, Variable } from "./variable";
import { View, Text } from "../themed";
import Decimal from "decimal.js";
import { Pressable } from "react-native";
import { apply, arrow, fold, unwrap } from "./prelude";
import { HashSet } from "prelude-ts";
import { colors } from "../themed/colors";
import { NavigatorProps as RootNavigatorProps } from "../../App";
import { getState, setState } from "./store";

export type ListState = {
  struct: Struct;
  active: boolean;
  level: Decimal | undefined;
  init_filter: Filter;
  filters: HashSet<Filter>;
  limit: Decimal;
  offset: Decimal;
  variables: Array<Variable>;
  reached_end: boolean;
  refreshing: boolean;
  layout: string;
};

export type ListAction =
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
  | ["filters", Filter, "replace", FilterPath]
  | ["layout", string];

export function reducer(state: Draft<ListState>, action: ListAction) {
  switch (action[0]) {
    case "variables": {
      if (state.offset.equals(0)) {
        state.variables = action[1] as any;
      } else {
        for (let v of action[1]) {
          let check = true;
          for (let v1 of state.variables) {
            if (v1.equals(v)) {
              check = false;
            }
          }
          if (check) {
            state.variables.push(v as any);
          }
        }
      }
      state.refreshing = false;
      if (!state.limit.equals(action[1].length)) {
        state.reached_end = true;
      }
      break;
    }
    case "active": {
      state.active = action[1];
      state.offset = new Decimal(0);
      state.reached_end = false;
      state.variables = [];
      break;
    }
    case "level": {
      state.level = action[1];
      state.offset = new Decimal(0);
      state.reached_end = false;
      state.variables = [];
      break;
    }
    case "offset": {
      if (!state.refreshing && !state.reached_end) {
        state.offset = Decimal.add(
          state.offset.toNumber(),
          state.limit.toNumber()
        );
        state.refreshing = true;
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
      state.reached_end = false;
      state.variables = [];
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
          if (
            action[2].id[0] ||
            action[2].created_at[0] ||
            action[2].updated_at[0] ||
            action[2].filter_paths.anyMatch((x) => x.active)
          ) {
            state.offset = new Decimal(0);
            state.reached_end = false;
            state.variables = [];
          }
          break;
        }
        case "replace": {
          state.filters = state.filters.remove(action[2]);
          state.filters = state.filters.add(action[2]);
          if (
            action[2].id[0] ||
            action[2].created_at[0] ||
            action[2].updated_at[0]
          ) {
            state.offset = new Decimal(0);
            state.reached_end = false;
            state.variables = [];
          }
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
      const result = state.filters.findAny((x) => x.equals(action[1]));
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
        if (action[3].active) {
          state.offset = new Decimal(0);
          state.reached_end = false;
          state.variables = [];
        }
      }
      break;
    }
    case "layout": {
      state.layout = action[1];
      break;
    }
    default: {
      const _exhaustiveCheck: never = action[0];
      return _exhaustiveCheck;
    }
  }
}

export function List(props: {
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
}): JSX.Element {
  const [state, dispatch] = useImmerReducer<ListState, ListAction>(reducer, {
    struct: props.struct,
    active: props.active,
    level: props.level,
    init_filter: props.filters[0],
    filters: props.filters[1],
    limit: props.limit,
    offset: new Decimal(0),
    variables: [],
    reached_end: false,
    refreshing: true,
    layout: "",
  });

  const get_vars = async () => {
    const variables = await get_variables(
      state.struct,
      state.active,
      state.level,
      state.init_filter,
      state.filters,
      state.limit,
      state.offset
    );
    if (unwrap(variables)) {
      dispatch(["variables", variables.value]);
    }
  };

  useEffect(() => {
    get_vars();
  }, [
    state.struct,
    state.active,
    state.level,
    state.init_filter,
    state.filters,
    state.offset,
  ]);

  const [bsm_view_count, set_bsm_view_count] = useState(-1);
  const [bsm_sorting_count, set_bsm_sorting_count] = useState(-1);
  const [bsm_filters_count, set_bsm_filters_count] = useState(-1);

  useEffect(() => {
    if (getState().bsm_view.count === bsm_view_count) {
      setState((s) => {
        return {
          bsm_view: {
            props: {
              state: state,
              dispatch: dispatch,
              render_list_element: props.render_list_element,
            },
            count: s.bsm_view.count,
          },
        };
      });
    }
    if (getState().bsm_sorting.count === bsm_sorting_count) {
      setState((s) => {
        return {
          bsm_sorting: {
            props: {
              state: state,
              dispatch: dispatch,
            },
            count: s.bsm_sorting.count,
          },
        };
      });
    }
    if (getState().bsm_filters.count === bsm_filters_count) {
      setState((s) => {
        return {
          bsm_filters: {
            props: {
              state: state,
              dispatch: dispatch,
            },
            count: s.bsm_filters.count,
          },
        };
      });
    }
  }, [state, dispatch, props.render_list_element]);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "column",
        backgroundColor: colors.custom.black[900],
      }}
    >
      {props.render_custom_fields({
        filters: state.filters,
        dispatch: dispatch,
        show_views: ({ element }: { element: JSX.Element }) => (
          <Pressable
            onPress={() => {
              setState((s) => {
                set_bsm_view_count(s.bsm_view.count + 1);
                return {
                  bsm_view: {
                    props: {
                      state: state,
                      dispatch: dispatch,
                      render_list_element: props.render_list_element,
                    },
                    count: s.bsm_view.count + 1,
                  },
                };
              });
            }}
          >
            {element}
          </Pressable>
        ),
        show_sorting: ({ element }: { element: JSX.Element }) => (
          <Pressable
            onPress={() => {
              setState((s) => {
                set_bsm_sorting_count(s.bsm_sorting.count + 1);
                return {
                  bsm_sorting: {
                    props: {
                      state: state,
                      dispatch: dispatch,
                    },
                    count: s.bsm_sorting.count + 1,
                  },
                };
              });
            }}
          >
            {element}
          </Pressable>
        ),
        show_filters: ({ element }: { element: JSX.Element }) => (
          <Pressable
            onPress={() => {
              setState((s) => {
                set_bsm_filters_count(s.bsm_filters.count + 1);
                return {
                  bsm_filters: {
                    props: {
                      state: state,
                      dispatch: dispatch,
                    },
                    count: s.bsm_filters.count + 1,
                  },
                };
              });
            }}
          >
            {element}
          </Pressable>
        ),
      })}

      <FlatList
        data={state.variables}
        renderItem={(list_item) => {
          const ElementJSX = arrow(() => {
            if (state.layout in props.render_list_element[1]) {
              return props.render_list_element[1][state.layout];
            }
            return props.render_list_element[0];
          });
          return (
            <ElementJSX
              selected={props.selected}
              variable={list_item.item}
              disptach_values={props.disptach_values}
            />
          );
        }}
        keyExtractor={(list_item: Variable) => list_item.id.valueOf()}
        refreshing={state.refreshing}
        onRefresh={() => {}}
        onEndReachedThreshold={0.5}
        onEndReached={() => dispatch(["offset"])}
        ListFooterComponent={arrow(() => {
          if (!state.reached_end) {
            return <Text style={{ textAlign: "center" }}>Loading...</Text>;
          }
          return <></>;
        })}
        // horizontal={true}
        style={{ marginTop: 4 }}
      />
    </View>
  );
}

export function SelectionModal(
  props: RootNavigatorProps<"SelectionModal">
): JSX.Element {
  React.useEffect(() => {
    props.navigation.setOptions({ headerTitle: props.route.params.title });
  }, []);
  return (
    <List
      selected={props.route.params.selected}
      struct={props.route.params.struct}
      active={props.route.params.active}
      level={props.route.params.level}
      filters={props.route.params.filters}
      limit={props.route.params.limit}
      render_list_element={props.route.params.render_list_element}
      disptach_values={props.route.params.disptach_values}
      render_custom_fields={props.route.params.render_custom_fields}
    />
  );
}
