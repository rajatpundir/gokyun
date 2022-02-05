import React, { useEffect, useLayoutEffect, useState } from "react";
import { View } from "react-native";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { useImmerReducer } from "use-immer";
import { OrFilter, FilterPath, get_variable, AndFilter } from "./db";
import { apply, arrow, unwrap } from "./prelude";
import { compare_paths, Path, PathString, Struct, Variable } from "./variable";
import {
  State,
  Action,
  reducer,
  get_filter_paths,
  get_creation_paths,
  run_triggers,
  compute_checks,
} from "./commons";
import { RenderListVariantProps } from "./list";
import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "./tailwind";
import { Text, Input, Pressable, Row, Column, Spinner } from "native-base";
import { theme } from "./theme";
import { BrokerKey, subscribe } from "./store";

export type ComponentViews = Record<
  string,
  {
    create: (props: {
      struct: Struct;
      state: State;
      dispatch: React.Dispatch<Action>;
    }) => JSX.Element;
    update: (props: {
      struct: Struct;
      state: State;
      dispatch: React.Dispatch<Action>;
      selected: boolean;
      update_parent_values: () => void;
    }) => JSX.Element;
    show: (props: {
      struct: Struct;
      state: State;
      dispatch: React.Dispatch<Action>;
      selected: boolean;
      update_parent_values: () => void;
    }) => JSX.Element;
  }
>;

export function useComponent(props: {
  struct: Struct;
  id: Decimal;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  values: HashSet<Path>;
  init_values: HashSet<Path>;
  extensions: State["extensions"];
  labels: State["labels"];
  higher_structs: State["higher_structs"];
  user_paths: State["user_paths"];
  borrows: State["borrows"];
  create: ComponentViews[string]["create"];
  update: ComponentViews[string]["update"];
  show: ComponentViews[string]["show"];
  selected?: boolean;
  update_parent_values?: () => void;
  found?: boolean | undefined;
}): [State, React.Dispatch<Action>, JSX.Element] {
  const [state, dispatch] = useImmerReducer<State, Action>(reducer, {
    id: new Decimal(props.id),
    active: props.active,
    created_at: props.created_at,
    updated_at: props.updated_at,
    values: props.values,
    init_values: props.init_values,
    mode: new Decimal(props.id).equals(-1) ? "write" : "read",
    event_trigger: 0,
    check_trigger: 0,
    checks: {},
    extensions: props.extensions,
    higher_structs: props.higher_structs,
    labels: props.labels,
    user_paths: props.user_paths,
    borrows: props.borrows,
    found: props.found,
  });

  useLayoutEffect(() => {
    const update_values = async () => {
      if (state.id.equals(-1)) {
        dispatch([
          "variable",
          new Variable(
            props.struct,
            new Decimal(-1),
            state.active,
            state.created_at,
            state.updated_at,
            get_creation_paths(props.struct, state)
          ),
        ]);
      } else {
        const result = await get_variable(
          props.struct,
          true,
          undefined,
          state.id as Decimal,
          get_filter_paths(
            props.struct,
            state.labels as Array<[string, PathString]>,
            state.user_paths as Array<PathString>,
            state.borrows as Array<string>
          )
        );
        if (unwrap(result)) {
          dispatch(["variable", result.value]);
        } else {
          dispatch(["found", false]);
        }
      }
    };
    update_values();
  }, [state.id]);

  useLayoutEffect(() => {
    if (state.mode === "write") {
      run_triggers(props.struct, state, dispatch);
    }
  }, [state.id, state.mode, state.event_trigger]);

  useLayoutEffect(() => {
    if (state.mode === "write") {
      compute_checks(props.struct, state, dispatch);
    }
  }, [state.id, state.mode, state.check_trigger]);

  useLayoutEffect(() => {
    if (!state.id.equals(-1)) {
      const unsub = subscribe(
        (store) => store.broker,
        (broker) => {
          if (props.struct.name in broker) {
            apply(broker[props.struct.name as BrokerKey], (it) => {
              if (it.update.includes(state.id.toNumber())) {
                dispatch(["reload", state.id as Decimal]);
              }
              if (it.remove.includes(state.id.toNumber())) {
                dispatch(["found", false]);
              }
              if (it.create.includes(state.id.toNumber())) {
                dispatch(["reload", state.id as Decimal]);
              }
            });
          }
        }
      );
      return unsub;
    }
  }, [state.id]);

  const jsx: JSX.Element = arrow(() => {
    if (state.mode === "write") {
      if (state.id.equals(-1)) {
        return (
          <props.create
            struct={props.struct}
            state={state}
            dispatch={dispatch}
          />
        );
      } else {
        if (state.found === undefined) {
          return (
            <Spinner
              flex={"1"}
              justifyContent={"center"}
              alignItems={"center"}
              size={"lg"}
              color={theme.primary}
            />
          );
        } else if (!state.found) {
          return <Text>Not Found</Text>;
        } else {
          return (
            <props.update
              struct={props.struct}
              state={state}
              dispatch={dispatch}
              selected={!!props.selected}
              update_parent_values={
                props.update_parent_values
                  ? props.update_parent_values
                  : () => {}
              }
            />
          );
        }
      }
    } else {
      if (state.found === undefined) {
        return (
          <Spinner
            flex={"1"}
            justifyContent={"center"}
            alignItems={"center"}
            size={"lg"}
            color={theme.primary}
          />
        );
      } else if (!state.found) {
        return <Text>Not Found</Text>;
      } else {
        return (
          <props.show
            struct={props.struct}
            state={state}
            dispatch={dispatch}
            selected={!!props.selected}
            update_parent_values={
              props.update_parent_values ? props.update_parent_values : () => {}
            }
          />
        );
      }
    }
  });
  return [state, dispatch, jsx];
}

export function OtherComponent(props: {
  struct: Struct;
  user_paths: Array<PathString>;
  borrows: Array<string>;
  variable: Variable;
  selected: boolean;
  update_parent_values: () => void;
  view: ComponentViews[string];
}): JSX.Element {
  const [, , jsx] = useComponent({
    struct: props.struct,
    id: props.variable.id,
    active: props.variable.active,
    created_at: props.variable.created_at,
    updated_at: props.variable.updated_at,
    values: props.variable.paths,
    init_values: props.variable.paths,
    extensions: {},
    higher_structs: [],
    labels: props.variable.paths
      .toArray()
      .map((v) => [v.label, [v.path[0].map((x) => x[0]), v.path[1][0]]]),
    user_paths: props.user_paths,
    borrows: props.borrows,
    create: props.view.create,
    update: props.view.update,
    show: props.view.show,
    selected: props.selected,
    update_parent_values: props.update_parent_values,
    found: true,
  });
  return jsx;
}

export function Identity(props: RenderListVariantProps): JSX.Element {
  return props.variant;
}

export function SearchWrapper(
  props: RenderListVariantProps & {
    placeholder: string;
    path: PathString;
    is_views_editable?: boolean;
    is_sorting_editable?: boolean;
    is_filters_editable?: boolean;
  }
): JSX.Element {
  const and_filter = props.filters.findAny((x) => x.index === 0);
  useEffect(() => {
    if (and_filter.isNone()) {
      props.dispatch([
        "and_filter",
        "replace",
        new AndFilter(
          0,
          HashSet.of(
            new OrFilter(
              0,
              [false, undefined],
              [false, undefined],
              [false, undefined],
              HashSet.of()
            )
          )
        ),
      ]);
    } else {
      const or_filter = and_filter.get().filters.findAny((x) => x.index === 0);
      if (or_filter.isNone()) {
        props.dispatch([
          "or_filter",
          and_filter.get(),
          "replace",
          new OrFilter(
            0,
            [false, undefined],
            [false, undefined],
            [false, undefined],
            HashSet.of()
          ),
        ]);
      }
    }
  }, [and_filter]);
  const [local_val, set_local_val] = useState(
    arrow(() => {
      if (and_filter.isSome()) {
        const or_filter = and_filter
          .get()
          .filters.findAny((x) => x.index === 0);
        if (or_filter.isSome()) {
          const result = or_filter
            .get()
            .filter_paths.findAny((x) => compare_paths(x.path, props.path));
          if (result.isSome()) {
            const v = result.get().value;
            if (v[0] === "str" && v[1] !== undefined && v[1][0] === "like") {
              if (typeof v[1][1] === "string") {
                return v[1][1];
              }
            }
          }
        }
      }
      return "";
    })
  );
  const [has_errors, set_has_errors] = useState(false);
  const default_value = "";
  if (and_filter.isSome()) {
    const or_filter = and_filter.get().filters.findAny((x) => x.index === 0);
    if (or_filter.isSome()) {
      return (
        <Column flex={1}>
          <Row>
            <Input
              m={"2"}
              flex={1}
              size={"md"}
              maxLength={255}
              placeholder={props.placeholder}
              value={local_val}
              isInvalid={has_errors}
              onChangeText={(x) => {
                const result = props.init_filter.filter_paths.findAny((x) =>
                  compare_paths(x.path, props.path)
                );
                if (result.isSome()) {
                  try {
                    set_local_val(x);
                    set_has_errors(false);
                    props.dispatch([
                      "filter_path",
                      and_filter.get(),
                      or_filter.get(),
                      "replace",
                      apply(
                        new FilterPath(
                          result.get().label,
                          props.path,
                          ["str", ["like", x]],
                          undefined
                        ),
                        (it) => {
                          it.active = true;
                          return it;
                        }
                      ),
                    ]);
                  } catch (e) {
                    set_has_errors(true);
                  }
                }
              }}
              InputLeftElement={
                <Row px={"1"}>
                  <Feather
                    name="search"
                    size={24}
                    color={theme.primary}
                    style={{ alignSelf: "center" }}
                  />
                </Row>
              }
              InputRightElement={
                <Row mx={1}>
                  <Row key={"clear"}>
                    {arrow(() => {
                      const result = or_filter
                        .get()
                        .filter_paths.findAny((x) =>
                          compare_paths(x.path, props.path)
                        );
                      if (result.isSome()) {
                        const v = result.get().value;
                        if (v[0] === "str") {
                          let check = false;
                          if (v[1] !== undefined) {
                            if (v[1][0] === "like") {
                              const x = v[1][1];
                              if (!Array.isArray(x)) {
                                if (x !== default_value) {
                                  check = true;
                                }
                              }
                            }
                          }
                          if (check) {
                            return (
                              <Pressable
                                onPress={() => {
                                  try {
                                    const val = default_value;
                                    set_local_val(val);
                                    set_has_errors(false);
                                    props.dispatch([
                                      "filter_path",
                                      and_filter.get(),
                                      or_filter.get(),
                                      "replace",
                                      apply(
                                        new FilterPath(
                                          result.get().label,
                                          props.path,
                                          ["str", undefined],
                                          undefined
                                        ),
                                        (it) => {
                                          it.active = true;
                                          return it;
                                        }
                                      ),
                                    ]);
                                  } catch (e) {}
                                }}
                              >
                                <MaterialIcons
                                  name="clear"
                                  size={24}
                                  color={theme.placeholder}
                                />
                              </Pressable>
                            );
                          }
                        }
                      }
                      return <></>;
                    })}
                  </Row>
                  <Row
                    key={"bsm"}
                    space={"1"}
                    justifyContent={"space-between"}
                    alignItems={"center"}
                  >
                    {props.is_views_editable ? (
                      <Pressable
                        key={"bsm_view_ref"}
                        onPress={props.bsm_view_ref.current?.present}
                      >
                        <Feather
                          name="layout"
                          size={20}
                          color={theme.primary}
                        />
                      </Pressable>
                    ) : (
                      <View key={"bsm_view_ref"} />
                    )}
                    {props.is_sorting_editable ? (
                      <Pressable
                        key={"bsm_sorting_ref"}
                        onPress={props.bsm_sorting_ref.current?.present}
                      >
                        <FontAwesome
                          name="sort-alpha-asc"
                          size={18}
                          color={theme.primary}
                        />
                      </Pressable>
                    ) : (
                      <View key={"bsm_sorting_ref"} />
                    )}
                    {props.is_filters_editable ? (
                      <Pressable
                        key={"bsm_filters_ref"}
                        onPress={props.bsm_filters_ref.current?.present}
                      >
                        <Feather
                          name="filter"
                          size={21}
                          color={theme.primary}
                        />
                      </Pressable>
                    ) : (
                      <View key={"bsm_filters_ref"} />
                    )}
                  </Row>
                </Row>
              }
            />
          </Row>
          <Column flex={1}>{props.variant}</Column>
        </Column>
      );
    }
  }
  return <></>;
}

export function AppHeader(props: { title?: string }): JSX.Element {
  return (
    <>
      <Text bold p={"2"} fontSize={"lg"} color={theme.primary}>
        {props.title ? props.title : "AppName"}
      </Text>
    </>
  );
}

export function ModalHeader(props: {
  title: string;
  RightElement?: JSX.Element;
}): JSX.Element {
  const navigation = useNavigation();
  return (
    <Row
      justifyContent={"space-between"}
      alignItems={"center"}
      px={"2"}
      py={"3"}
    >
      <Pressable
        flexDirection={"row"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        onPress={navigation.goBack}
      >
        <Ionicons
          name="arrow-back-outline"
          size={26}
          color={colors.zinc[200]}
        />
        <Text bold px={"2"} fontSize={"lg"}>
          {props.title}
        </Text>
      </Pressable>
      {props.RightElement ? props.RightElement : <></>}
    </Row>
  );
}
