import React, { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import { NavigatorProps as RootNavigatorProps } from "../../App";
import { View, Text, TextInput } from "../../main/themed";
import { useImmerReducer } from "use-immer";
import {
  State,
  Action,
  reducer,
  get_filter_paths,
  get_creation_paths,
  get_writeable_paths,
  run_triggers,
  compute_checks,
  get_path,
  mark_trigger_dependencies,
} from "../../main/utils/commons";
import { get_struct } from "../../main/utils/schema";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { log_permissions } from "../../main/utils/permissions";
import { Filter, FilterPath, get_variable } from "../../main/utils/db";
import {
  compare_paths,
  Path,
  PathString,
  Struct,
  Variable,
} from "../../main/utils/variable";
import { Label, Field, Check } from "../../main/utils/fields";
import { apply, arrow, unwrap } from "../../main/utils/prelude";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { colors } from "../../main/themed/colors";
import { Action as FilterListAction } from "../selection";

// Create / Update Test component
// List Tests component
// TODO 444 (Running trigger, checks, etc inside fetched other field paths)
// Test if bulk update of values by trigger speeds up component loading
// Fix react navigation error related to serializability of props passed

// Complete testing Test

// Get working on creating actual app components for real by fifth of Jan!

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
            struct.value,
            true,
            undefined,
            state.id as Decimal,
            get_filter_paths(struct.value, state)
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
            struct2.value,
            true,
            undefined,
            state2.id as Decimal,
            get_filter_paths(struct2.value, state2)
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
              limit: new Decimal(10),
              title: "Select User",
              element: arrow(() => {
                const result = get_path(props.state, [[], "user"]);
                if (unwrap(result)) {
                  const path = result.value;
                  if (path.writeable) {
                    const value = path.path[1][1];
                    if (value.type === "other" && value.value.equals(-1)) {
                      return (
                        <View>
                          <Text>Select User</Text>
                          {props.state.mode === "write" ? (
                            <FontAwesome name="edit" size={24} color="white" />
                          ) : (
                            <></>
                          )}
                        </View>
                      );
                    } else {
                      return (
                        <View>
                          <Field {...props} path={[["user"], "nickname"]} />
                          {props.state.mode === "write" ? (
                            <FontAwesome name="edit" size={24} color="white" />
                          ) : (
                            <></>
                          )}
                        </View>
                      );
                    }
                  }
                }
                return <></>;
              }),
              labels: [
                ["Nickname", [[], "nickname"]],
                ["Knows english", [[], "knows_english"]],
                ["Mobile", [[], "mobile"]],
                ["Product Count", [[], "product_count"]],
              ],
              render_list_element: [
                (props: {
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
                      labels: [],
                      // user_paths and borrows fields does not play much role, since parent had already deduced permissions
                      user_paths: [],
                      borrows: [],
                    }
                  );
                  useEffect(() => {
                    // Mark triggers, checks, etc
                    // Writeable fields would already have been correctly marked
                    dispatch([
                      "values",
                      mark_trigger_dependencies(
                        props.variable.struct,
                        state.values as HashSet<Path>,
                        state
                      ),
                    ]);
                  }, [props.variable.struct, props.variable.paths]);
                  // TODO. Try running trigger, checks, etc here.
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
                          <View
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              borderRadius: 5,
                              paddingVertical: 5,
                              marginVertical: 5,
                              backgroundColor: colors.tailwind.gray[800],
                              borderWidth: 2,
                            }}
                          >
                            <View>
                              <Label {...it} path={"nickname"} />
                              <Field {...it} path={"nickname"} />
                            </View>
                            <View>
                              <Label {...it} path={"knows_english"} />
                              <Field {...it} path={"knows_english"} />
                            </View>
                            <View>
                              <Label {...it} path={"mobile"} />
                              <Field {...it} path={"mobile"} />
                            </View>
                            <View>
                              <Label {...it} path={"product_count"} />
                              <Field {...it} path={"product_count"} />
                            </View>
                            <Pressable
                              onPress={() =>
                                props.disptach_values(props.variable)
                              }
                              style={{
                                alignSelf: "flex-end",
                                paddingVertical: 10,
                                paddingRight: 5,
                              }}
                            >
                              <Text
                                style={{
                                  backgroundColor: colors.custom.red[900],
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  fontWeight: "bold",
                                  borderRadius: 2,
                                }}
                              >
                                OK
                              </Text>
                            </Pressable>
                          </View>
                        );
                      } else {
                        return (
                          <View
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              borderRadius: 5,
                              paddingVertical: 5,
                              marginVertical: 5,
                              backgroundColor: colors.tailwind.gray[900],
                            }}
                          >
                            <View>
                              <Label {...it} path={"nickname"} />
                              <Field {...it} path={"nickname"} />
                            </View>
                            <View>
                              <Label {...it} path={"knows_english"} />
                              <Field {...it} path={"knows_english"} />
                            </View>
                            <View>
                              <Label {...it} path={"mobile"} />
                              <Field {...it} path={"mobile"} />
                            </View>
                            <View>
                              <Label {...it} path={"product_count"} />
                              <Field {...it} path={"product_count"} />
                            </View>
                            <Pressable
                              onPress={() =>
                                props.disptach_values(props.variable)
                              }
                              style={{
                                alignSelf: "flex-end",
                                paddingVertical: 10,
                                paddingRight: 5,
                              }}
                            >
                              <Text
                                style={{
                                  backgroundColor: colors.custom.red[900],
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  fontWeight: "bold",
                                  borderRadius: 2,
                                }}
                              >
                                OK
                              </Text>
                            </Pressable>
                          </View>
                        );
                      }
                    }
                  );
                },
                {
                  Compact: (props: {
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
                        labels: [],
                        // user_paths and borrows fields does not play much role, since parent had already deduced permissions
                        user_paths: [],
                        borrows: [],
                      }
                    );
                    useEffect(() => {
                      // Mark triggers, checks, etc
                      // Writeable fields would already have been correctly marked
                      dispatch([
                        "values",
                        mark_trigger_dependencies(
                          props.variable.struct,
                          state.values as HashSet<Path>,
                          state
                        ),
                      ]);
                    }, [props.variable.struct, props.variable.paths]);
                    // TODO. Try running trigger, checks, etc here.
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
                            <View
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                borderRadius: 5,
                                paddingVertical: 5,
                                marginVertical: 5,
                                backgroundColor: colors.tailwind.gray[800],
                                borderWidth: 2,
                              }}
                            >
                              <View>
                                <Label {...it} path={"nickname"} />
                                <Field {...it} path={"nickname"} />
                              </View>
                              <Pressable
                                onPress={() =>
                                  props.disptach_values(props.variable)
                                }
                                style={{
                                  alignSelf: "flex-end",
                                  paddingVertical: 10,
                                  paddingRight: 5,
                                }}
                              >
                                <Text
                                  style={{
                                    backgroundColor: colors.custom.red[900],
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    fontWeight: "bold",
                                    borderRadius: 2,
                                  }}
                                >
                                  OK
                                </Text>
                              </Pressable>
                            </View>
                          );
                        } else {
                          return (
                            <View
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                borderRadius: 5,
                                paddingVertical: 5,
                                marginVertical: 5,
                                backgroundColor: colors.tailwind.gray[900],
                              }}
                            >
                              <View>
                                <Label {...it} path={"nickname"} />
                                <Field {...it} path={"nickname"} />
                              </View>
                              <Pressable
                                onPress={() =>
                                  props.disptach_values(props.variable)
                                }
                                style={{
                                  alignSelf: "flex-end",
                                  paddingVertical: 10,
                                  paddingRight: 5,
                                }}
                              >
                                <Text
                                  style={{
                                    backgroundColor: colors.custom.red[900],
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    fontWeight: "bold",
                                    borderRadius: 2,
                                  }}
                                >
                                  OK
                                </Text>
                              </Pressable>
                            </View>
                          );
                        }
                      }
                    );
                  },
                },
              ],
              render_custom_fields: (props: {
                filters: HashSet<Filter>;
                dispatch: React.Dispatch<FilterListAction>;
                show_views: () => void;
                show_sorting: () => void;
                show_filters: () => void;
              }) => {
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
                        marginBottom: 8,
                      }}
                    >
                      <Feather
                        name="search"
                        size={24}
                        color={colors.tailwind.slate[400]}
                        style={{ alignSelf: "center" }}
                      />
                      <TextInput
                        placeholder="Nickname"
                        value={arrow(() => {
                          const result = filter
                            .get()
                            .filter_paths.findAny((x) =>
                              compare_paths(x.path, [[], "nickname"])
                            );
                          if (result.isSome()) {
                            const v = result.get().value;
                            if (
                              v[0] === "str" &&
                              v[1] !== undefined &&
                              v[1][0] === "like"
                            ) {
                              if (typeof v[1][1] === "string") {
                                return v[1][1];
                              }
                            }
                          }
                          return "";
                        })}
                        onChangeText={(x) => {
                          console.log(x);
                          props.dispatch([
                            "filters",
                            filter.get(),
                            "replace",
                            apply(
                              new FilterPath(
                                "Nickname",
                                [[], "nickname"],
                                ["str", ["like", x]],
                                undefined
                              ),
                              (it) => {
                                it.active = true;
                                return it;
                              }
                            ),
                          ]);
                        }}
                        style={{
                          flexGrow: 1,
                        }}
                      />
                      <>
                        <Pressable
                          onPress={props.show_views}
                          style={{
                            padding: 2,
                            marginHorizontal: 1,
                            alignSelf: "center",
                          }}
                        >
                          <Feather
                            name="layout"
                            size={20}
                            color={colors.tailwind.slate[400]}
                            style={{ alignSelf: "center" }}
                          />
                        </Pressable>
                        <Pressable
                          onPress={props.show_sorting}
                          style={{
                            padding: 2,
                            marginHorizontal: 1,
                            alignSelf: "center",
                          }}
                        >
                          <FontAwesome
                            name="unsorted"
                            size={20}
                            color={colors.tailwind.slate[400]}
                            style={{ alignSelf: "center" }}
                          />
                        </Pressable>
                        <Pressable
                          onPress={props.show_filters}
                          style={{
                            padding: 2,
                            marginHorizontal: 1,
                            alignSelf: "center",
                          }}
                        >
                          <FontAwesome
                            name="filter"
                            size={20}
                            color={colors.tailwind.slate[400]}
                            style={{ alignSelf: "center" }}
                          />
                        </Pressable>
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
              },
            },
          ]}
        />
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
