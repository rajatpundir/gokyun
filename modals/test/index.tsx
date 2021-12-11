import React from "react";
import { Button, ScrollView, StyleSheet } from "react-native";

import { NavigatorProps as RootNavigatorProps } from "../../App";
import { View, Text } from "../../main/themed";
import { useImmerReducer } from "use-immer";
import {
  State,
  Action,
  reducer,
  get_labeled_path_filters,
  get_creation_paths,
  get_writeable_paths,
  run_triggers,
  compute_checks,
  get_path,
} from "../../main/utils/commons";
import { get_struct } from "../../main/utils/schema";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { log_permissions } from "../../main/utils/permissions";
import { get_variable } from "../../main/utils/db";
import { PathString, Struct, Variable } from "../../main/utils/variable";
import { Label, Field, Check } from "../../main/utils/fields";
import { apply, unwrap } from "../../main/utils/prelude";
import { FontAwesome } from "@expo/vector-icons";

// Design filters for modifying path filters, fields with passed filters cannot be overriden
// Fix react navigation error related to serializability of props passed

// Complete testing Test
export default function Component(
  props: RootNavigatorProps<"Test">
): JSX.Element {
  const struct_name = "Test";
  const struct = get_struct(struct_name);
  const struct2_name = "Test2";
  const struct2 = get_struct(struct2_name);
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
    higher_structs: apply([] as Array<[Struct, PathString]>, (it) => {
      if (unwrap(struct2)) {
        it.push([struct2.value, [[], "z"]]);
      }
      return it;
    }),
    checks: {},
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
    user_paths: [[[], "user"]],
    borrows: [],
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
    user_paths: [[[], "user"]],
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
              get_creation_paths(struct.value, state)
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
                it.paths = get_writeable_paths(struct.value, state, it.paths);
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
              get_creation_paths(struct2.value, state2)
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
                it.paths = get_writeable_paths(struct2.value, state2, it.paths);
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
            <CreateComponent
              struct={struct.value}
              state={state}
              dispatch={dispatch}
            />
            {/* <CreateComponent
              struct={struct2.value}
              state={state2}
              dispatch={dispatch2}
            /> */}
          </>
        );
      } else {
        return (
          <UpdateComponent
            struct={struct.value}
            state={state}
            dispatch={dispatch}
          />
        );
      }
    } else {
      return (
        <ShowComponent
          struct={struct.value}
          state={state}
          dispatch={dispatch}
        />
      );
    }
  }
  return <></>;
}

function CreateComponent(props: {
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
}): JSX.Element {
  return (
    <ScrollView style={{ flex: 1 }}>
      <View>
        <Label {...props} path={"str"} />
        <Field {...props} path={"str"} />
      </View>
      <View>
        <Label {...props} path={[["z"], "str"]} />
        <Field {...props} path={[["z"], "str"]} />
      </View>
      <View>
        <Label {...props} path={"lstr"} />
        <Field {...props} path={"lstr"} />
      </View>
      <View>
        <Label {...props} path={"clob"} />
        <Field {...props} path={"clob"} />
      </View>
      <View>
        <Label {...props} path={"u32"} />
        <Field {...props} path={"u32"} />
        <Check {...props} name="u32_is_even" message="U32 cannot be odd" />
      </View>
      <View>
        <Label {...props} path={"i32"} />
        <Field {...props} path={"i32"} />
      </View>
      <View>
        <Label {...props} path={"u64"} />
        <Field {...props} path={"u64"} />
      </View>
      <View>
        <Label {...props} path={"i64"} />
        <Field {...props} path={"i64"} />
      </View>
      <View>
        <Label {...props} path={"udouble"} />
        <Field {...props} path={"udouble"} />
      </View>
      <View>
        <Label {...props} path={"idouble"} />
        <Field {...props} path={"idouble"} />
      </View>
      <View>
        <Label {...props} path={"udecimal"} />
        <Field {...props} path={"udecimal"} />
      </View>
      <View>
        <Label {...props} path={"idecimal"} />
        <Field {...props} path={"idecimal"} />
      </View>
      <View>
        <Label {...props} path={"bool"} />
        <Field {...props} path={"bool"} />
      </View>
      <View>
        <Label {...props} path={"date"} />
        <Field {...props} path={"date"} />
      </View>
      <View>
        <Label {...props} path={"time"} />
        <Field {...props} path={"time"} />
      </View>
      <View>
        <Label {...props} path={"timestamp"} />
        <Field {...props} path={"timestamp"} />
      </View>
      <View>
        <Label {...props} path={"user"} />
        <Field
          {...props}
          path={"user"}
          options={[
            "other",
            {
              title: "Select User",
              element: apply(undefined, () => {
                const result = get_path(props.state, [[], "user"]);
                if (unwrap(result)) {
                  const path = result.value;
                  if (path.writeable) {
                    const value = path.path[1][1];
                    if (value.type === "other" && value.value.equals(-1)) {
                      return (
                        <>
                          <Text>Select User</Text>
                          {props.state.mode === "write" ? (
                            <FontAwesome name="edit" size={24} color="white" />
                          ) : (
                            <></>
                          )}
                        </>
                      );
                    } else {
                      return (
                        <>
                          <Field {...props} path={[["user"], "nickname"]} />
                          {props.state.mode === "write" ? (
                            <FontAwesome name="edit" size={24} color="white" />
                          ) : (
                            <></>
                          )}
                        </>
                      );
                    }
                  }
                }
                return <></>;
              }),
              render_list_element: (props: {
                selected: number;
                variable: Variable;
                disptach_values: (variable: Variable) => void;
              }) => {
                const [state, dispatch] = useImmerReducer<State, Action>(
                  reducer,
                  {
                    id: props.variable.id,
                    active: props.variable.active,
                    created_at: props.variable.created_at,
                    updated_at: props.variable.updated_at,
                    values: props.variable.paths,
                    mode: "read",
                    event_trigger: 0,
                    check_trigger: 0,
                    extensions: {},
                    higher_structs: [],
                    checks: {},
                    labels: [["NICKNAME", [[], "nickname"]]],
                    user_paths: [],
                    borrows: [],
                  }
                );
                return apply(
                  {
                    struct: props.variable.struct,
                    state: state,
                    dispatch: dispatch,
                  },
                  (it) => {
                    if (
                      !props.variable.id.equals(-1) &&
                      props.variable.id.equals(props.selected)
                    ) {
                      return (
                        <View style={{ flex: 1 }}>
                          <View>
                            <Label {...it} path={"nickname"} />
                            <Field {...it} path={"nickname"} />
                            <Button
                              title="OK"
                              onPress={() =>
                                props.disptach_values(props.variable)
                              }
                            />
                          </View>
                        </View>
                      );
                    } else {
                      return (
                        <View style={{ flex: 1 }}>
                          <View>
                            <Label {...it} path={"nickname"} />
                            <Field {...it} path={"nickname"} />
                            <Button
                              title="OK"
                              onPress={() =>
                                props.disptach_values(props.variable)
                              }
                            />
                          </View>
                        </View>
                      );
                    }
                  }
                );
              },
            },
          ]}
        />
      </View>
      <View>
        <Label {...props} path={[["user"], "nickname"]} />
        <Field {...props} path={[["user"], "nickname"]} />
      </View>
    </ScrollView>
  );
}

function UpdateComponent(props: {
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
}): JSX.Element {
  return (
    <View style={{ flex: 1 }}>
      <View>
        <Label {...props} path={"str"} />
        <Field {...props} path={"str"} />
      </View>
    </View>
  );
}

function ShowComponent(props: {
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
}): JSX.Element {
  return (
    <View style={{ flex: 1 }}>
      <View>
        <Label {...props} path={"str"} />
        <Field {...props} path={"str"} />
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
