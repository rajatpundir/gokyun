import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { useLayoutEffect } from "react";
import { useImmerReducer } from "use-immer";
import { get_variable } from "./db";
import { apply, arrow, unwrap } from "./prelude";
import { Path, PathString, Struct, Variable } from "./variable";
import {
  State,
  Action,
  reducer,
  get_filter_paths,
  get_creation_paths,
  get_writeable_paths,
  run_triggers,
  compute_checks,
} from "./commons";

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
  create: (props: {
    struct: Struct;
    state: State;
    dispatch: React.Dispatch<Action>;
    selected: boolean;
  }) => JSX.Element;
  update: (props: {
    struct: Struct;
    state: State;
    dispatch: React.Dispatch<Action>;
    selected: boolean;
  }) => JSX.Element;
  show: (props: {
    struct: Struct;
    state: State;
    dispatch: React.Dispatch<Action>;
    selected: boolean;
  }) => JSX.Element;
  selected?: boolean;
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
          dispatch([
            "variable",
            apply(result.value, (it) => {
              it.paths = get_writeable_paths(props.struct, state, it.paths);
              return it;
            }),
          ]);
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
            selected={!!props.selected}
          />
        );
      } else {
        return (
          <props.update
            struct={props.struct}
            state={state}
            dispatch={dispatch}
            selected={!!props.selected}
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
        />
      );
    }
  });
  return [state, dispatch, jsx];
}
