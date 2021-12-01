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
  get_symbols,
} from "../../main/utils/commons";
import { get_struct } from "../../main/utils/schema";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { get_permissions, log_permissions } from "../../main/utils/permissions";
import { get_variable } from "../../main/utils/db";
import { PathString, Struct } from "../../main/utils/variable";
import { Label, Field } from "../../main/utils/fields";
import { apply, unwrap } from "../../main/utils/prelude";
import { Bool, Deci, Num, Text } from "../../main/utils/lisp";

// Test triggers
// Push some users into DB
// Get user selected to return a variable along with requested paths
// Complete testing Test
export default function Component(
  props: RootNavigatorProps<"Test">
): JSX.Element {
  const struct = get_struct("Test");
  const [user_paths, borrows]: [Array<PathString>, Array<string>] = [[], []];
  const labels: Array<[string, PathString]> = [
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
  ];
  const [state, dispatch] = useImmerReducer<State, Action>(reducer, {
    id: new Decimal(props.route.params.id),
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
    values: HashSet.of(),
    mode: new Decimal(props.route.params.id).equals(-1) ? "write" : "read",
    trigger_toggle: false,
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
        const path_permissions = get_permissions(
          struct.value,
          user_paths,
          borrows
        );
        log_permissions(struct.value, user_paths, borrows);
        if (!state.id.equals(-1)) {
          const result = await get_variable(
            undefined,
            struct.value,
            state.id as Decimal,
            true,
            get_labeled_path_filters(path_permissions, labels)
          );
          if (unwrap(result)) {
            const variable = result.value;
            dispatch([
              "variable",
              apply(variable, (it) => {
                it.paths = get_writeable_paths(
                  struct.value,
                  it.paths,
                  path_permissions
                );
                return it;
              }),
            ]);
          }
        } else {
          for (let path of get_top_writeable_paths(
            struct.value,
            path_permissions,
            labels
          )) {
            dispatch(["value", path]);
          }
        }
      }
    };
    update_values();
  }, [state.mode, state.id]);
  React.useEffect(() => {
    if (unwrap(struct)) {
      run_triggers(struct.value, state, dispatch);
    }
  }, [state.trigger_toggle]);
  if (unwrap(struct)) {
    if (state.mode === "write") {
      if (state.id.equals(new Decimal(-1))) {
        return create_struct({ state, dispatch });
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

async function run_triggers(
  struct: Struct,
  state: State,
  dispatch: React.Dispatch<Action>
) {
  for (let trigger_name of Object.keys(struct.triggers)) {
    const trigger = struct.triggers[trigger_name];
    if (trigger.operation.op === "update") {
      if (state.mode === "write") {
        if (state.id.equals(new Decimal(-1))) {
          // Variable will be created
          if (trigger.event.includes("after_creation")) {
            for (let path_update of trigger.operation.path_updates) {
              const path_string: PathString = path_update[0];
              const expr = path_update[1];
              const result = get_symbols(state.values, expr);
              if (unwrap(result)) {
                const symbols = result.value;
                for (let value of state.values) {
                  if (
                    value.path[0].length === path_string[0].length &&
                    value.path[1][0] === path_string[1]
                  ) {
                    let check = true;
                    for (let [index, field_name] of path_string[0].entries()) {
                      if (value.path[index][0] !== field_name) {
                        check = false;
                      }
                    }
                    if (check) {
                      const field = value.path[1][1];
                      switch (field.type) {
                        case "str":
                        case "lstr":
                        case "clob": {
                          const result = expr.get_result(symbols);
                          if (unwrap(result)) {
                            if (result.value instanceof Text) {
                              dispatch([
                                "value",
                                apply(value, (it) => {
                                  it.path[1] = [
                                    it.path[1][0],
                                    {
                                      type: field.type,
                                      value: result.value.value as string,
                                    },
                                  ];
                                  return it;
                                }),
                              ]);
                            }
                          }
                          break;
                        }
                        case "i32":
                        case "u32":
                        case "i64":
                        case "u64": {
                          const result = expr.get_result(symbols);
                          if (unwrap(result)) {
                            if (result.value instanceof Num) {
                              dispatch([
                                "value",
                                apply(value, (it) => {
                                  it.path[1] = [
                                    it.path[1][0],
                                    {
                                      type: field.type,
                                      value: new Decimal(
                                        result.value.value as number
                                      ),
                                    },
                                  ];
                                  return it;
                                }),
                              ]);
                            }
                          }
                          break;
                        }
                        case "idouble":
                        case "udouble":
                        case "idecimal":
                        case "udecimal": {
                          const result = expr.get_result(symbols);
                          if (unwrap(result)) {
                            if (result.value instanceof Deci) {
                              dispatch([
                                "value",
                                apply(value, (it) => {
                                  it.path[1] = [
                                    it.path[1][0],
                                    {
                                      type: field.type,
                                      value: new Decimal(
                                        result.value.value as number
                                      ),
                                    },
                                  ];
                                  return it;
                                }),
                              ]);
                            }
                          }
                          break;
                        }
                        case "bool": {
                          const result = expr.get_result(symbols);
                          if (unwrap(result)) {
                            if (result.value instanceof Bool) {
                              result.value.value;
                              dispatch([
                                "value",
                                apply(value, (it) => {
                                  it.path[1] = [
                                    it.path[1][0],
                                    {
                                      type: field.type,
                                      value: result.value.value as boolean,
                                    },
                                  ];
                                  return it;
                                }),
                              ]);
                            }
                          }
                          break;
                        }
                        case "date":
                        case "time":
                        case "timestamp": {
                          const result = expr.get_result(symbols);
                          if (unwrap(result)) {
                            if (result.value instanceof Num) {
                              dispatch([
                                "value",
                                apply(value, (it) => {
                                  it.path[1] = [
                                    it.path[1][0],
                                    {
                                      type: field.type,
                                      value: new Date(
                                        result.value.value as number
                                      ),
                                    },
                                  ];
                                  return it;
                                }),
                              ]);
                            }
                          }
                          break;
                        }
                        case "other": {
                          const result = expr.get_result(symbols);
                          if (unwrap(result)) {
                            if (result.value instanceof Num) {
                              dispatch([
                                "value",
                                apply(value, (it) => {
                                  it.path[1] = [
                                    it.path[1][0],
                                    {
                                      type: field.type,
                                      other: field.other,
                                      value: new Decimal(
                                        result.value.value as number
                                      ),
                                    },
                                  ];
                                  return it;
                                }),
                              ]);
                            }
                          }
                          break;
                        }
                        default: {
                          const _exhaustiveCheck: never = field;
                          return _exhaustiveCheck;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } else {
          // For now, assume that there is no concept of child affecting parent.
          // Variable will be updated
          // paths in variable and that of previous parent may be affected
          if (trigger.event.includes("before_update")) {
          }
          // paths in variable and that of parent may be affected
          if (trigger.event.includes("after_update")) {
          }
        }
      } else {
        // Variable is being shown
        // Deletion of child items may effect paths in parent
        if (trigger.event.includes("before_deletion")) {
        }
      }
    }
  }
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
