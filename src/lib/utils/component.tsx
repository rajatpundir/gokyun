import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { useLayoutEffect } from "react";
import { useImmerReducer } from "use-immer";
import { Filter, FilterPath, get_variable } from "./db";
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
import { ListAction } from "./list";
import { View, Text, TextInput } from "../themed";
import { colors } from "../themed/colors";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Pressable } from "react-native";

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
        if (state.init_values.length() === 0) {
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
          }
        }
      }
    };
    update_values();
  }, []);
  useLayoutEffect(() => {
    run_triggers(props.struct, state, dispatch);
  }, [state.event_trigger]);
  useLayoutEffect(() => {
    compute_checks(props.struct, state, dispatch);
  }, [state.check_trigger]);
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
        return (
          <props.update
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
  });
  return [state, dispatch, jsx];
}

export function useOtherComponent(props: {
  struct: Struct;
  user_paths: Array<PathString>;
  borrows: Array<string>;
  variable: Variable;
  selected: boolean;
  update_parent_values: () => void;
  view: ComponentViews[string];
}): [State, React.Dispatch<Action>, JSX.Element] {
  const [state, dispatch, jsx] = useComponent({
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
  return useOtherComponent(props)[2];
}

export function SearchBar(props: {
  init_filter: Filter;
  filters: HashSet<Filter>;
  dispatch: React.Dispatch<ListAction>;
  show_views: [(props: { element: JSX.Element }) => JSX.Element, boolean];
  show_sorting: (props: { element: JSX.Element }) => JSX.Element;
  show_filters: (props: { element: JSX.Element }) => JSX.Element;
  placeholder: string;
  path: PathString;
  is_views_editable?: boolean;
  is_sorting_editable?: boolean;
  is_filters_editable?: boolean;
}): JSX.Element {
  const filter = props.filters.findAny((x) => x.index === 0);
  if (filter.isSome()) {
    return (
      <View
        style={{
          borderWidth: 1,
          borderRadius: 5,
          borderColor: colors.tailwind.slate[500],
          paddingVertical: 2,
          paddingHorizontal: 10,
          marginHorizontal: 20,
          marginBottom: 10,
        }}
      >
        <Feather
          name="search"
          size={24}
          color={colors.tailwind.slate[300]}
          style={{ alignSelf: "center" }}
        />
        <TextInput
          placeholder={props.placeholder}
          value={arrow(() => {
            const result = filter
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
            return "";
          })}
          onChangeText={(x) => {
            const result = props.init_filter.filter_paths.findAny((x) =>
              compare_paths(x.path, props.path)
            );
            if (result.isSome()) {
              props.dispatch([
                "filters",
                filter.get(),
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
            }
          }}
          style={{
            flexGrow: 1,
          }}
        />
        <>
          {!props.show_views[1] &&
          (props.is_views_editable === undefined || props.is_views_editable) ? (
            <View
              style={{
                alignSelf: "center",
                paddingHorizontal: 0,
                marginHorizontal: 0,
              }}
            >
              {apply(props.show_views[0], (ShowViews) => (
                <ShowViews
                  element={
                    <Feather
                      name="layout"
                      size={20}
                      color={colors.tailwind.slate[400]}
                      style={{
                        alignSelf: "center",
                        padding: 4,
                        marginHorizontal: 0,
                      }}
                    />
                  }
                />
              ))}
            </View>
          ) : (
            <></>
          )}
          {props.is_sorting_editable === undefined ||
          props.is_sorting_editable ? (
            <View
              style={{
                alignSelf: "center",
                paddingHorizontal: 0,
                marginHorizontal: 0,
              }}
            >
              <props.show_sorting
                element={
                  <FontAwesome
                    name="sort-alpha-asc"
                    size={20}
                    color={colors.tailwind.slate[400]}
                    style={{
                      alignSelf: "center",
                      padding: 4,
                      marginHorizontal: 0,
                    }}
                  />
                }
              />
            </View>
          ) : (
            <></>
          )}
          {props.is_filters_editable === undefined ||
          props.is_filters_editable === true ? (
            <View
              style={{
                alignSelf: "center",
                paddingHorizontal: 0,
                marginHorizontal: 0,
              }}
            >
              <props.show_filters
                element={
                  <Ionicons
                    name="filter"
                    size={20}
                    color={colors.tailwind.slate[400]}
                    style={{
                      alignSelf: "center",
                      padding: 3,
                      marginHorizontal: 0,
                    }}
                  />
                }
              />
            </View>
          ) : (
            <></>
          )}
        </>
      </View>
    );
  } else {
    props.dispatch([
      "filter",
      "replace",
      new Filter(
        0,
        [false, undefined],
        [false, undefined],
        [false, undefined],
        HashSet.of()
      ),
    ]);
  }
  return <></>;
}

export function AppHeader(props: { title?: string }): JSX.Element {
  return (
    <Text
      style={{
        fontSize: 20,
        fontWeight: "bold",
        paddingVertical: 10,
        paddingHorizontal: 10,
      }}
    >
      {props.title ? props.title : "AppName"}
    </Text>
  );
}

export function ModalHeader(props: { title: string }): JSX.Element {
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={navigation.goBack}
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 10,
      }}
    >
      <Ionicons
        name="arrow-back-outline"
        size={26}
        color={colors.tailwind.zinc[200]}
      />
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          paddingHorizontal: 5,
        }}
      >
        {props.title}
      </Text>
    </Pressable>
  );
}
