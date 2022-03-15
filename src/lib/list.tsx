import React, { useEffect, useRef } from "react";
import { Draft } from "immer";
import { useImmerReducer } from "use-immer";
import { get_variables, AndFilter, OrFilter, FilterPath } from "./db";
import { Struct, Variable } from "./variable";
import Decimal from "decimal.js";
import { apply, fold, unwrap } from "./prelude";
import { HashSet } from "prelude-ts";
import { NavigatorProps as RootNavigatorProps } from "../navigation/main";
import { BottomSheetFlatList, BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  AndFilterComponent,
  SortComponent,
  SortComponentFields,
} from "./filter";
import { Portal } from "@gorhom/portal";
import { Row, Text, Pressable } from "native-base";
import { Identity, ModalHeader } from "./component";
import { tw } from "./tailwind";
import { ListVariant, ListVariantOptions } from "./list_variants";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { BrokerKey, subscribe } from "./store";
import { useBSTheme } from "./theme";
import { Entrypoint } from "./permissions";

// TODO. Handle large virtualized list, shouldComponentUpdate

export type ListState = {
  struct: Struct;
  init_filter: OrFilter;
  filters: HashSet<AndFilter>;
  limit: Decimal;
  offset: Decimal;
  variables: Array<Variable>;
  reached_end: boolean;
  refreshing: boolean;
  layout: string;
  reload: number;
};

export type ListAction =
  | ["variables", Array<Variable>]
  | ["offset"]
  | ["sort", "add", FilterPath, boolean]
  | ["sort", "remove", FilterPath]
  | ["sort", "up" | "down" | "toggle", FilterPath]
  | ["and_filter", "add"]
  | ["and_filter", "remove", AndFilter]
  | ["and_filter", "replace", AndFilter]
  | ["or_filter", AndFilter, "add"]
  | ["or_filter", AndFilter, "remove", OrFilter]
  | ["or_filter", AndFilter, "replace", OrFilter]
  | ["filter_path", AndFilter, OrFilter, "remove", FilterPath]
  | ["filter_path", AndFilter, OrFilter, "replace", FilterPath]
  | ["layout", string]
  | ["reload"]
  | ["remove", Array<number>];

function reducer(state: Draft<ListState>, action: ListAction) {
  switch (action[0]) {
    case "variables": {
      if (state.offset.equals(0)) {
        state.variables = action[1] as any;
      } else {
        for (const v of action[1]) {
          let check = true;
          for (const v1 of state.variables) {
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
    case "and_filter": {
      switch (action[1]) {
        case "add": {
          state.filters = state.filters.add(
            new AndFilter(
              1 + Math.max(-1, ...state.filters.map((x) => x.index).toArray()),
              HashSet.of(
                new OrFilter(
                  0,
                  [false, undefined],
                  [false, undefined],
                  [false, undefined],
                  HashSet.of()
                )
              )
            )
          );
          break;
        }
        case "remove": {
          state.filters = state.filters.remove(action[2]);
          for (const or_filter of action[2].filters) {
            if (
              or_filter.id[0] ||
              or_filter.created_at[0] ||
              or_filter.updated_at[0] ||
              or_filter.filter_paths.anyMatch((x) => x.active)
            ) {
              state.offset = new Decimal(0);
              state.reached_end = false;
              state.variables = [];
            }
          }
          break;
        }
        case "replace": {
          state.filters = state.filters.remove(action[2]);
          state.filters = state.filters.add(action[2]);
          for (const or_filter of action[2].filters) {
            if (
              or_filter.id[0] ||
              or_filter.created_at[0] ||
              or_filter.updated_at[0] ||
              or_filter.filter_paths.anyMatch((x) => x.active)
            ) {
              state.offset = new Decimal(0);
              state.reached_end = false;
              state.variables = [];
            }
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
    case "or_filter": {
      const and_filter = state.filters.findAny((x) => x.equals(action[1]));
      if (and_filter.isSome()) {
        switch (action[2]) {
          case "add": {
            state.filters = state.filters.add(
              apply(and_filter.get(), (it) => {
                it.filters = it.filters.add(
                  new OrFilter(
                    1 +
                      Math.max(-1, ...it.filters.map((x) => x.index).toArray()),
                    [false, undefined],
                    [false, undefined],
                    [false, undefined],
                    HashSet.of()
                  )
                );
                return it;
              })
            );
            break;
          }
          case "remove": {
            state.filters = state.filters.add(
              apply(and_filter.get(), (it) => {
                it.filters = it.filters.remove(action[3]);
                for (const or_filter of it.filters) {
                  if (
                    or_filter.id[0] ||
                    or_filter.created_at[0] ||
                    or_filter.updated_at[0] ||
                    or_filter.filter_paths.anyMatch((x) => x.active)
                  ) {
                    state.offset = new Decimal(0);
                    state.reached_end = false;
                    state.variables = [];
                  }
                }
                return it;
              })
            );
            break;
          }
          case "replace": {
            state.filters = state.filters.add(
              apply(and_filter.get(), (it) => {
                it.filters = it.filters.add(action[3]);
                for (const or_filter of it.filters) {
                  if (
                    or_filter.id[0] ||
                    or_filter.created_at[0] ||
                    or_filter.updated_at[0] ||
                    or_filter.filter_paths.anyMatch((x) => x.active)
                  ) {
                    state.offset = new Decimal(0);
                    state.reached_end = false;
                    state.variables = [];
                  }
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
    case "filter_path": {
      const and_filter = state.filters.findAny((x) => x.equals(action[1]));
      if (and_filter.isSome()) {
        const or_filter = and_filter
          .get()
          .filters.findAny((x) => x.equals(action[2]));
        if (or_filter.isSome()) {
          switch (action[3]) {
            case "remove": {
              state.filters = state.filters.add(
                apply(and_filter.get(), (and_filter) => {
                  and_filter.filters = and_filter.filters.add(
                    apply(or_filter.get(), (or_filter) => {
                      or_filter.filter_paths = or_filter.filter_paths.remove(
                        action[4]
                      );
                      return or_filter;
                    })
                  );
                  return and_filter;
                })
              );
              break;
            }
            case "replace": {
              state.filters = state.filters.add(
                apply(and_filter.get(), (and_filter) => {
                  and_filter.filters = and_filter.filters.add(
                    apply(or_filter.get(), (or_filter) => {
                      or_filter.filter_paths = or_filter.filter_paths.add(
                        action[4]
                      );
                      return or_filter;
                    })
                  );
                  return and_filter;
                })
              );
              break;
            }
            default: {
              const _exhaustiveCheck: never = action[3];
              return _exhaustiveCheck;
            }
          }
          if (action[4].active) {
            state.offset = new Decimal(0);
            state.reached_end = false;
            state.variables = [];
          }
        }
      }
      break;
    }
    case "layout": {
      state.layout = action[1];
      break;
    }
    case "reload": {
      state.reload += 1;
      state.offset = new Decimal(0);
      state.variables = [];
      state.reached_end = false;
      state.refreshing = true;
      break;
    }
    case "remove": {
      state.variables = state.variables.filter((x) => {
        return !action[1].includes(x.id.toNumber());
      });
      state.offset = new Decimal(state.variables.length);
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
  entrypoints: Array<Entrypoint>;
  variable: Variable;
  selected: boolean;
  update_parent_values: () => void;
};

export type RenderListElement = [
  (props: RenderListItemProps) => JSX.Element,
  Record<string, (props: RenderListItemProps) => JSX.Element>
];

export type RenderListVariantProps = {
  init_filter: OrFilter;
  filters: HashSet<AndFilter>;
  dispatch: React.Dispatch<ListAction>;
  variant: JSX.Element;
  bsm_view_ref: React.RefObject<BottomSheetModalMethods>;
  bsm_sorting_ref: React.RefObject<BottomSheetModalMethods>;
  bsm_filters_ref: React.RefObject<BottomSheetModalMethods>;
};

export type CommonProps = {
  limit: Decimal;
  options: ListVariantOptions;
  RenderVariant?: (props: RenderListVariantProps) => JSX.Element;
  searchable?: boolean;
};

type ListProps = CommonProps & {
  selected: Decimal;
  struct: Struct;
  init_filter: OrFilter;
  filters: HashSet<AndFilter>;
  update_parent_values?: (variable: Variable) => void;
};

export function List(props: ListProps): JSX.Element {
  const bs_theme = useBSTheme();
  const [state, dispatch] = useImmerReducer<ListState, ListAction>(reducer, {
    struct: props.struct,
    init_filter: props.init_filter,
    filters: props.filters,
    limit: props.limit,
    offset: new Decimal(0),
    variables: [],
    reached_end: false,
    refreshing: true,
    layout: "",
    reload: 0,
  });

  const request_counter = useRef(0);
  useEffect(() => {
    const get_vars = async () => {
      request_counter.current += 1;
      const request_count = request_counter.current;
      setTimeout(
        async () => {
          if (request_count === request_counter.current) {
            const variables = await get_variables(
              state.struct,
              undefined,
              props.init_filter,
              state.filters,
              state.limit,
              state.offset,
              []
            );
            if (request_count === request_counter.current) {
              if (unwrap(variables)) {
                dispatch(["variables", variables.value]);
              }
            }
          }
        },
        props.searchable ? 10000 : 0
      );
    };
    get_vars();
  }, [
    state.struct,
    props.init_filter,
    state.filters,
    state.limit,
    state.offset,
    state.reload,
  ]);

  useEffect(() => {
    const unsub = subscribe(
      (store) => store.broker,
      (broker) => {
        if (state.struct.name in broker) {
          apply(broker[state.struct.name as BrokerKey], (it) => {
            if (it.create.length !== 0 || it.update.length !== 0) {
              dispatch(["reload"]);
            }
            if (it.remove.length !== 0) {
              dispatch(["remove", it.remove]);
            }
          });
        }
      }
    );
    return unsub;
  }, []);

  const bsm_view_ref = useRef<BottomSheetModal>(null);
  const bsm_sorting_ref = useRef<BottomSheetModal>(null);
  const bsm_sorting_fields_ref = useRef<BottomSheetModal>(null);
  const bsm_filters_ref = useRef<BottomSheetModal>(null);

  const RenderVariant = props.RenderVariant ? props.RenderVariant : Identity;

  return (
    <>
      <RenderVariant
        init_filter={state.init_filter}
        filters={state.filters}
        dispatch={dispatch}
        variant={
          <ListVariant
            {...props}
            state={state}
            dispatch={dispatch}
            bsm_view_ref={bsm_view_ref}
            bsm_sorting_ref={bsm_sorting_ref}
            bsm_sorting_fields_ref={bsm_sorting_fields_ref}
            bsm_filters_ref={bsm_filters_ref}
            update_parent_values={
              props.update_parent_values !== undefined
                ? props.update_parent_values
                : () => {}
            }
          />
        }
        bsm_view_ref={bsm_view_ref}
        bsm_sorting_ref={bsm_sorting_ref}
        bsm_filters_ref={bsm_filters_ref}
      />
      <Portal>
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
            borderBottomColor={bs_theme.primary}
            borderBottomWidth={"1"}
            px={"3"}
            pb={"2"}
          >
            <Text bold color={bs_theme.text}>
              SORT
            </Text>
            <Row space={"1"}>
              <Pressable
                onPress={() => bsm_sorting_fields_ref.current?.present()}
                backgroundColor={bs_theme.primary}
                borderRadius={"xs"}
                px={"2"}
                py={"0.5"}
              >
                <Text bold color={"white"}>
                  Field++
                </Text>
              </Pressable>
              <Pressable
                onPress={() => bsm_sorting_ref.current?.close()}
                borderColor={bs_theme.primary}
                borderWidth={"1"}
                borderRadius={"xs"}
                px={"2"}
                py={"0.5"}
              >
                <Text color={bs_theme.text}>Close</Text>
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
              borderBottomColor={bs_theme.primary}
              borderBottomWidth={"1"}
              px={"3"}
              pb={"2"}
            >
              <Text bold color={bs_theme.text}>
                Fields
              </Text>
              <Pressable
                onPress={() => bsm_sorting_fields_ref.current?.close()}
                borderColor={bs_theme.primary}
                borderWidth={"1"}
                borderRadius={"xs"}
                px={"2"}
                py={"0.5"}
              >
                <Text color={bs_theme.text}>Close</Text>
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
          index={0}
          backgroundStyle={tw.style(["border"], {
            backgroundColor: bs_theme.background,
            borderColor: bs_theme.primary,
          })}
        >
          <Row
            justifyContent={"space-between"}
            alignItems={"center"}
            pl={"2"}
            pr={"3"}
            pb={"2"}
          >
            <Text bold color={bs_theme.text}>
              FILTERS
            </Text>
            <Pressable
              onPress={() => dispatch(["and_filter", "add"])}
              backgroundColor={bs_theme.highlight}
              borderRadius={"xs"}
              px={"2"}
              py={"0.5"}
            >
              <Text bold color={"white"}>
                Set++
              </Text>
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
                <AndFilterComponent
                  key={list_item.item.index.toString()}
                  init_filter={state.init_filter}
                  and_filter={list_item.item}
                  dispatch={dispatch}
                />
              );
            }}
          />
        </BottomSheetModal>
      </Portal>
    </>
  );
}

export type ModalSpecificProps = {
  title: string;
};

export type SelectionModalProps = ListProps & ModalSpecificProps;

export function SelectionModal(
  props: RootNavigatorProps<"SelectionModal">
): JSX.Element {
  useEffect(() => {
    props.navigation.setOptions({ headerTitle: props.route.params.title });
  }, [props.route.params.title]);
  return (
    <>
      <ModalHeader title={props.route.params.title} />
      <List
        {...props.route.params}
        update_parent_values={(variable: Variable) => {
          if (props.route.params.update_parent_values !== undefined) {
            props.route.params.update_parent_values(variable);
          }
          props.navigation.goBack();
        }}
      />
    </>
  );
}
