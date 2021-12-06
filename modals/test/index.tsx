import React from "react";
import { ScrollView, StyleSheet } from "react-native";

import { NavigatorProps as RootNavigatorProps } from "../../App";
import { View } from "../../main/themed";
import { useImmerReducer } from "use-immer";
import {
  State,
  Action,
  reducer,
  get_labeled_path_filters,
  get_top_writeable_paths,
  get_writeable_paths,
  run_triggers,
  compute_checks,
} from "../../main/utils/commons";
import { get_struct } from "../../main/utils/schema";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { log_permissions } from "../../main/utils/permissions";
import { get_variable } from "../../main/utils/db";
import { PathString, Struct, Variable } from "../../main/utils/variable";
import { Label, Field, Check } from "../../main/utils/fields";
import { apply, unwrap } from "../../main/utils/prelude";

// Push some users into DB
// Get user selected to return a variable along with requested paths
// Complete testing Test
export default function Component(
  props: RootNavigatorProps<"Test">
): JSX.Element {
  const struct = get_struct("Test");
  const struct2 = get_struct("Test2");
  const [state, dispatch] = useImmerReducer<State, Action>(reducer, {
    id: new Decimal(props.route.params.id),
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
    values: HashSet.of(),
    mode: new Decimal(props.route.params.id).equals(-1) ? "write" : "read",
    event_trigger: 0,
    check_trigger: 0,
    extensions: {},
    labels: [
      ["STR", [[], "str"]],
      ["LSTR", [[], "lstr"]],
      ["CLOB", [[], "clob"]],
      ["U32", [[], "u32"]],
      ["I32", [[], "i32"]],
      ["U64", [[], "u64"]],
      ["I64", [[], "i64"]],
      ["UDOUBLE", [[], "udouble"]],
      ["IDOUBLE", [[], "idouble"]],
      ["UDECIMAL", [[], "udecimal"]],
      ["IDECIMAL", [[], "idecimal"]],
      ["BOOL", [[], "bool"]],
      ["DATE", [[], "date"]],
      ["TIME", [[], "time"]],
      ["TIMESTAMP", [[], "timestamp"]],
      ["USER", [[], "user"]],
      ["USER NICKNAME", [["user"], "nickname"]],
    ],
    higher_structs: apply([] as Array<[Struct, PathString]>, (it) => {
      if (unwrap(struct2)) {
        it.push([struct2.value, [[], "z"]]);
      }
      return it;
    }),
    user_paths: [],
    borrows: [],
    checks: {},
  });
  const [state2, dispatch2] = useImmerReducer<State, Action>(reducer, {
    id: new Decimal(props.route.params.id),
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
    values: HashSet.of(),
    mode: new Decimal(props.route.params.id).equals(-1) ? "write" : "read",
    event_trigger: 0,
    check_trigger: 0,
    extensions: {},
    labels: [
      ["STR2", [[], "str"]],
      ["STR3", [["z"], "str"]],
      ["LSTR2", [[], "lstr"]],
      ["CLOB2", [[], "clob"]],
      ["U322", [[], "u32"]],
      ["I322", [[], "i32"]],
      ["U642", [[], "u64"]],
      ["I642", [[], "i64"]],
      ["UDOUBLE2", [[], "udouble"]],
      ["IDOUBLE2", [[], "idouble"]],
      ["UDECIMAL2", [[], "udecimal"]],
      ["IDECIMAL2", [[], "idecimal"]],
      ["BOOL2", [[], "bool"]],
      ["DATE2", [[], "date"]],
      ["TIME2", [[], "time"]],
      ["TIMESTAMP2", [[], "timestamp"]],
      ["USER2", [[], "user"]],
      ["USER NICKNAME2", [["user"], "nickname"]],
    ],
    higher_structs: [],
    user_paths: [],
    borrows: [],
    checks: {},
  });
  React.useEffect(() => {
    const set_title = async (title: string) => {
      props.navigation.setOptions({ headerTitle: title });
    };
    if (unwrap(struct)) {
      if (state.mode === "write") {
        if (state.id.equals(new Decimal(-1))) {
          set_title("Create Test");
        } else {
          set_title("Update Test");
        }
      } else {
        set_title("Test");
      }
    }
    const update_values = async () => {
      if (unwrap(struct)) {
        log_permissions(
          struct.value,
          state.user_paths as PathString[],
          state.borrows as string[]
        );
        if (state.id.equals(-1)) {
          dispatch([
            "variable",
            new Variable(
              struct.value,
              new Decimal(-1),
              state.active,
              state.created_at,
              state.updated_at,
              get_top_writeable_paths(struct.value, state)
            ),
          ]);
        } else {
          const result = await get_variable(
            undefined,
            struct.value,
            state.id as Decimal,
            true,
            get_labeled_path_filters(struct.value, state)
          );
          if (unwrap(result)) {
            dispatch([
              "variable",
              apply(result.value, (it) => {
                it.paths = get_writeable_paths(struct.value, it.paths, state);
                return it;
              }),
            ]);
          }
        }
      }
      if (unwrap(struct2)) {
        log_permissions(
          struct2.value,
          state2.user_paths as PathString[],
          state2.borrows as string[]
        );
        if (state2.id.equals(-1)) {
          dispatch2([
            "variable",
            new Variable(
              struct2.value,
              new Decimal(-1),
              state2.active,
              state2.created_at,
              state2.updated_at,
              get_top_writeable_paths(struct2.value, state2)
            ),
          ]);
        } else {
          const result = await get_variable(
            undefined,
            struct2.value,
            state2.id as Decimal,
            true,
            get_labeled_path_filters(struct2.value, state2)
          );
          if (unwrap(result)) {
            dispatch2([
              "variable",
              apply(result.value, (it) => {
                it.paths = get_writeable_paths(struct2.value, it.paths, state2);
                return it;
              }),
            ]);
          }
        }
      }
    };
    update_values();
  }, [state2.mode, state2.id]);
  React.useEffect(() => {
    // state is getting embedded so state.values is necessary dependency for the effect
    if (unwrap(struct)) {
      dispatch2([
        "extension",
        apply({}, (it) => {
          if (unwrap(struct)) {
            return {
              ...state2.extensions,
              z: {
                struct: struct.value,
                state: state,
                dispatch: dispatch,
              },
            };
          }
          return it;
        }),
      ]);
    }
  }, [state.values]);
  React.useEffect(() => {
    if (unwrap(struct)) {
      run_triggers(struct.value, state, dispatch);
      dispatch2(["event_trigger"]);
    }
  }, [state.event_trigger]);
  React.useEffect(() => {
    if (unwrap(struct2)) {
      run_triggers(struct2.value, state2, dispatch2);
    }
  }, [state2.event_trigger]);
  React.useEffect(() => {
    if (unwrap(struct)) {
      compute_checks(struct.value, state, dispatch);
      dispatch2(["check_trigger"]);
    }
  }, [state.check_trigger]);
  React.useEffect(() => {
    if (unwrap(struct2)) {
      compute_checks(struct2.value, state2, dispatch2);
    }
  }, [state2.check_trigger]);
  if (unwrap(struct) && unwrap(struct2)) {
    if (state.mode === "write") {
      if (state.id.equals(new Decimal(-1))) {
        return (
          <>
            {create_struct({ state, dispatch })}
            {create_struct({ state: state2, dispatch: dispatch2 })}
          </>
        );
      } else {
        return update_struct({ state, dispatch });
      }
    } else {
      return show_struct({ state, dispatch });
    }
  }
  return <></>;
}

function create_struct(reducer: {
  state: State;
  dispatch: React.Dispatch<Action>;
}): JSX.Element {
  return (
    <ScrollView style={{ flex: 1 }}>
      <View>
        <Label {...reducer} path={"str"} />
        <Field {...reducer} path={"str"} />
      </View>
      <View>
        <Label {...reducer} path={[["z"], "str"]} />
        <Field {...reducer} path={[["z"], "str"]} />
      </View>
      <View>
        <Label {...reducer} path={"lstr"} />
        <Field {...reducer} path={"lstr"} />
      </View>
      <View>
        <Label {...reducer} path={"clob"} />
        <Field {...reducer} path={"clob"} />
      </View>
      <View>
        <Label {...reducer} path={"u32"} />
        <Field {...reducer} path={"u32"} />
        <Check {...reducer} name="u32_is_even" message="U32 cannot be odd" />
      </View>
      <View>
        <Label {...reducer} path={"i32"} />
        <Field {...reducer} path={"i32"} />
      </View>
      <View>
        <Label {...reducer} path={"u64"} />
        <Field {...reducer} path={"u64"} />
      </View>
      <View>
        <Label {...reducer} path={"i64"} />
        <Field {...reducer} path={"i64"} />
      </View>
      <View>
        <Label {...reducer} path={"udouble"} />
        <Field {...reducer} path={"udouble"} />
      </View>
      <View>
        <Label {...reducer} path={"idouble"} />
        <Field {...reducer} path={"idouble"} />
      </View>
      <View>
        <Label {...reducer} path={"udecimal"} />
        <Field {...reducer} path={"udecimal"} />
      </View>
      <View>
        <Label {...reducer} path={"idecimal"} />
        <Field {...reducer} path={"idecimal"} />
      </View>
      <View>
        <Label {...reducer} path={"bool"} />
        <Field {...reducer} path={"bool"} />
      </View>
      <View>
        <Label {...reducer} path={"date"} />
        <Field {...reducer} path={"date"} />
      </View>
      <View>
        <Label {...reducer} path={"time"} />
        <Field {...reducer} path={"time"} />
      </View>
      <View>
        <Label {...reducer} path={"timestamp"} />
        <Field {...reducer} path={"timestamp"} />
      </View>
    </ScrollView>
  );
}

function update_struct(reducer: {
  state: State;
  dispatch: React.Dispatch<Action>;
}): JSX.Element {
  return (
    <View style={{ flex: 1 }}>
      <View>
        <Label {...reducer} path={"str"} />
        <Field {...reducer} path={"str"} />
      </View>
    </View>
  );
}

function show_struct(reducer: {
  state: State;
  dispatch: React.Dispatch<Action>;
}): JSX.Element {
  return (
    <View style={{ flex: 1 }}>
      <View>
        <Label {...reducer} path={"str"} />
        <Field {...reducer} path={"str"} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "grey",
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
  },
});
