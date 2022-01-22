import React, { useCallback, useEffect, useRef } from "react";
import { Draft } from "immer";
import { FlatList } from "react-native-gesture-handler";
import { useImmerReducer } from "use-immer";
import { Filter, FilterPath, get_variables } from "./db";
import { PathString, Struct, Variable } from "./variable";
import Decimal from "decimal.js";
import { ListRenderItemInfo } from "react-native";
import { apply, arrow, fold, unwrap } from "./prelude";
import { HashSet } from "prelude-ts";
import { NavigatorProps as RootNavigatorProps } from "../../navigation/main";
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { FilterComponent, SortComponent, SortComponentFields } from "./filter";
import { Ionicons } from "@expo/vector-icons";
import { Portal } from "@gorhom/portal";
import { Column, Row, Text, Pressable, Checkbox } from "native-base";
import { ModalHeader } from "./component";
import { tw } from "./tailwind";
import { bs_theme } from "./theme";

// TODO. Handle large virtualized list, shouldComponentUpdate

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

type RenderListItemProps = {
  struct: Struct;
  user_paths: Array<PathString>;
  borrows: Array<string>;
  variable: Variable;
  selected: boolean;
  update_parent_values: () => void;
};

export type CommonProps = {
  user_paths: Array<PathString>;
  borrows: Array<string>;
  limit: Decimal;
  render_list_element: [
    (props: RenderListItemProps) => JSX.Element,
    Record<string, (props: RenderListItemProps) => JSX.Element>
  ];
  render_custom_fields: (props: {
    init_filter: Filter;
    filters: HashSet<Filter>;
    dispatch: React.Dispatch<ListAction>;
    show_views: [(props: { element: JSX.Element }) => JSX.Element, boolean];
    show_sorting: (props: { element: JSX.Element }) => JSX.Element;
    show_filters: (props: { element: JSX.Element }) => JSX.Element;
  }) => JSX.Element;
  horizontal?: boolean;
};

type ListSpecificProps = CommonProps & {
  selected: Decimal;
  active: boolean;
  struct: Struct;
  level: Decimal | undefined;
  filters: [Filter, HashSet<Filter>];
  update_parent_values: (variable: Variable) => void;
};

export function List(props: CommonProps & ListSpecificProps): JSX.Element {
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

  const request_counter = useRef(0);
  useEffect(() => {
    const get_vars = async () => {
      request_counter.current += 1;
      const request_count = request_counter.current;
      setTimeout(async () => {
        if (request_count === request_counter.current) {
          const variables = await get_variables(
            state.struct,
            state.active,
            state.level,
            state.init_filter,
            state.filters,
            state.limit,
            state.offset
          );
          if (request_count === request_counter.current) {
            if (unwrap(variables)) {
              dispatch(["variables", variables.value]);
            }
          }
        }
      }, 100);
    };
    get_vars();
  }, [
    state.struct,
    state.active,
    state.level,
    state.init_filter,
    state.filters,
    state.limit,
    state.offset,
  ]);

  const bsm_view_ref = useRef<BottomSheetModal>(null);
  const bsm_sorting_ref = useRef<BottomSheetModal>(null);
  const bsm_sorting_fields_ref = useRef<BottomSheetModal>(null);
  const bsm_filters_ref = useRef<BottomSheetModal>(null);

  const renderItem = useCallback(
    (list_item: ListRenderItemInfo<Variable>) => {
      const ElementJSX = arrow(() => {
        if (state.layout in props.render_list_element[1]) {
          return props.render_list_element[1][state.layout];
        }
        return props.render_list_element[0];
      });
      return (
        <ElementJSX
          struct={state.struct}
          user_paths={props.user_paths}
          borrows={props.borrows}
          variable={list_item.item}
          selected={list_item.item.id.equals(props.selected)}
          update_parent_values={() =>
            props.update_parent_values(list_item.item)
          }
        />
      );
    },
    [state.struct, state.layout, props.selected]
  );

  const keyExtractor = useCallback(
    (list_item: Variable) => list_item.id.valueOf(),
    []
  );

  const ListFooterComponent = useCallback(() => {
    if (!state.reached_end) {
      return <Text style={{ textAlign: "center" }}>Loading...</Text>;
    }
    return <Text mt={"2"} />;
  }, [state.reached_end]);

  return (
    <Column>
      <props.render_custom_fields
        init_filter={state.init_filter}
        filters={state.filters}
        dispatch={dispatch}
        show_views={[
          ({ element }: { element: JSX.Element }) => (
            <Pressable
              onPress={() => {
                bsm_view_ref.current?.present();
              }}
            >
              {element}
            </Pressable>
          ),
          Object.keys(props.render_list_element[1]).length === 0,
        ]}
        show_sorting={({ element }: { element: JSX.Element }) => (
          <Pressable onPress={() => bsm_sorting_ref.current?.present()}>
            {element}
          </Pressable>
        )}
        show_filters={({ element }: { element: JSX.Element }) => (
          <Pressable onPress={() => bsm_filters_ref.current?.present()}>
            {element}
          </Pressable>
        )}
      />

      <FlatList
        data={state.variables}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={state.refreshing}
        onRefresh={() => {}}
        onEndReachedThreshold={0.5}
        onEndReached={() => dispatch(["offset"])}
        ListFooterComponent={ListFooterComponent}
        horizontal={!!props.horizontal}
        nestedScrollEnabled={true}
      />

      <Portal>
        <BottomSheetModal
          ref={bsm_view_ref}
          snapPoints={["50%", "82%"]}
          index={0}
          backgroundStyle={tw.style(["border"], {
            backgroundColor: bs_theme.background,
            borderColor: bs_theme.primary,
          })}
        >
          <Row
            justifyContent={"space-between"}
            alignItems={"center"}
            borderBottomColor={bs_theme.border}
            borderBottomWidth={"1"}
            px={"3"}
            pb={"2"}
          >
            <Text bold>VIEW</Text>
            <Pressable
              onPress={() => bsm_view_ref.current?.close()}
              borderColor={bs_theme.primary}
              borderWidth={"1"}
              borderRadius={"xs"}
              px={"2"}
              py={"0.5"}
            >
              <Text>Close</Text>
            </Pressable>
          </Row>
          <BottomSheetScrollView contentContainerStyle={tw.style(["m-2"], {})}>
            <Pressable
              onPress={() => {
                if (state.layout !== "") {
                  bsm_view_ref.current?.close();
                  dispatch(["layout", ""]);
                }
              }}
              flex={1}
              flexDirection={"row"}
              py={"0.5"}
            >
              {state.layout === "" ? (
                <Ionicons
                  name="radio-button-on"
                  size={24}
                  color={bs_theme.primary}
                />
              ) : (
                <Ionicons
                  name="radio-button-off"
                  size={24}
                  color={bs_theme.primary}
                />
              )}
              <Text pl={1}>Default</Text>
            </Pressable>
            {Object.keys(props.render_list_element[1]).map((layout) => (
              <Pressable
                onPress={() => {
                  if (state.layout !== layout) {
                    bsm_view_ref.current?.close();
                    dispatch(["layout", layout]);
                  }
                }}
                flex={1}
                flexDirection={"row"}
                py={"0.5"}
              >
                {state.layout === layout ? (
                  <Ionicons
                    name="radio-button-on"
                    size={24}
                    color={bs_theme.primary}
                  />
                ) : (
                  <Ionicons
                    name="radio-button-off"
                    size={24}
                    color={bs_theme.primary}
                  />
                )}
                <Text pl={1}>{layout}</Text>
              </Pressable>
            ))}
          </BottomSheetScrollView>
        </BottomSheetModal>

        <BottomSheetModal
          ref={bsm_sorting_ref}
          snapPoints={["50%", "82%"]}
          index={0}
          backgroundStyle={tw.style(["border"], {
            backgroundColor: bs_theme.background,
            borderColor: bs_theme.primary,
          })}
        >
          <Row
            justifyContent={"space-between"}
            alignItems={"center"}
            borderBottomColor={bs_theme.border}
            borderBottomWidth={"1"}
            px={"3"}
            pb={"2"}
          >
            <Text bold>SORT</Text>
            <Row>
              <Pressable
                onPress={() => bsm_sorting_fields_ref.current?.present()}
                backgroundColor={bs_theme.primary}
                borderRadius={"xs"}
                px={"2"}
                py={"0.5"}
                mx={"1"}
              >
                <Text bold>Field++</Text>
              </Pressable>
              <Pressable
                onPress={() => bsm_sorting_ref.current?.close()}
                borderColor={bs_theme.primary}
                borderWidth={"1"}
                borderRadius={"xs"}
                px={"2"}
                py={"0.5"}
              >
                <Text>Close</Text>
              </Pressable>
            </Row>
          </Row>
          <SortComponent init_filter={state.init_filter} dispatch={dispatch} />
          <BottomSheetModal
            ref={bsm_sorting_fields_ref}
            snapPoints={["50%", "82%"]}
            index={0}
            backgroundStyle={tw.style(["border"], {
              backgroundColor: bs_theme.background,
              borderColor: bs_theme.primary,
            })}
          >
            <Row
              justifyContent={"space-between"}
              alignItems={"center"}
              borderBottomColor={bs_theme.border}
              borderBottomWidth={"1"}
              px={"3"}
              pb={"2"}
            >
              <Text bold>Fields</Text>
              <Pressable
                onPress={() => bsm_sorting_fields_ref.current?.close()}
                borderColor={bs_theme.primary}
                borderWidth={"1"}
                borderRadius={"xs"}
                px={"2"}
                py={"0.5"}
              >
                <Text>Close</Text>
              </Pressable>
            </Row>
            <SortComponentFields
              init_filter={state.init_filter}
              dispatch={dispatch}
            />
          </BottomSheetModal>
        </BottomSheetModal>

        <BottomSheetModal
          ref={bsm_filters_ref}
          snapPoints={["50%", "82%"]}
          index={1}
          backgroundStyle={tw.style(["border"], {
            backgroundColor: bs_theme.background,
            borderColor: bs_theme.primary,
          })}
        >
          <Row
            justifyContent={"space-between"}
            alignItems={"center"}
            borderBottomColor={bs_theme.border}
            borderBottomWidth={"1"}
            px={"3"}
            pb={"2"}
          >
            <Text bold>FILTERS</Text>
            <Row>
              <Pressable
                onPress={() => {
                  dispatch(["active", !state.active]);
                }}
              >
                <Text>Active</Text>
              </Pressable>
              <Checkbox
                mx={"1"}
                value={String(state.active)}
                onChange={() => dispatch(["active", !state.active])}
                colorScheme={state.active ? bs_theme.primary : undefined}
              />
            </Row>

            <Row>
              <Pressable
                onPress={() =>
                  dispatch([
                    "level",
                    !!state.level ? undefined : new Decimal(0),
                  ])
                }
              >
                <Text>Unsaved</Text>
              </Pressable>
              <Checkbox
                mx={"1"}
                value={String(!state.level ? true : false)}
                onChange={(x) =>
                  dispatch(["level", x ? undefined : new Decimal(0)])
                }
                colorScheme={!state.level ? bs_theme.primary : undefined}
              />
            </Row>
            <Pressable
              onPress={() => dispatch(["filter", "add"])}
              backgroundColor={bs_theme.highlight}
              borderRadius={"xs"}
              px={"2"}
              py={"0.5"}
            >
              <Text bold>Filter++</Text>
            </Pressable>
          </Row>

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
        </BottomSheetModal>
      </Portal>
    </Column>
  );
}

export type ModalSpecificProps = {
  title: string;
};

export type SelectionModalProps = ListSpecificProps & ModalSpecificProps;

export function SelectionModal(
  props: RootNavigatorProps<"SelectionModal">
): JSX.Element {
  useEffect(() => {
    props.navigation.setOptions({ headerTitle: props.route.params.title });
  }, []);
  return (
    <>
      <ModalHeader title={props.route.params.title} />
      <List
        selected={props.route.params.selected}
        active={props.route.params.active}
        struct={props.route.params.struct}
        level={props.route.params.level}
        filters={props.route.params.filters}
        update_parent_values={props.route.params.update_parent_values}
        user_paths={props.route.params.user_paths}
        borrows={props.route.params.borrows}
        limit={props.route.params.limit}
        render_list_element={props.route.params.render_list_element}
        render_custom_fields={props.route.params.render_custom_fields}
        horizontal={props.route.params.horizontal}
      />
    </>
  );
}
