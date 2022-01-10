import React, { useEffect, useLayoutEffect } from "react";
import { Pressable, ScrollView } from "react-native";

import { NavigatorProps as RootNavigatorProps } from "../../App";
import { View, Text, TextInput } from "../../main/themed";
import { useImmerReducer } from "use-immer";
import {
  State,
  Action,
  reducer,
  run_triggers,
  compute_checks,
  get_path,
  mark_trigger_dependencies,
} from "../../main/utils/commons";
import { get_struct } from "../../main/utils/schema";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { Filter, FilterPath, replace_variable } from "../../main/utils/db";
import {
  compare_paths,
  Path,
  PathString,
  Struct,
  Variable,
} from "../../main/utils/variable";
import { Label, Field, Check } from "../../main/utils/fields";
import { apply, arrow, unwrap } from "../../main/utils/prelude";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { colors } from "../../main/themed/colors";
import { ListAction } from "../../main/utils/list";
import { useNavigation } from "@react-navigation/native";
import { useComponent } from "../../main/utils/component";
import { render } from "mustache";

// Create, Read, Update, Delete

// List Tests component

// Complete testing Test

// Get working on creating actual app components for real by fifth of Jan!

export default function Component(
  props: RootNavigatorProps<"Test">
): JSX.Element {
  const struct1 = get_struct("Test");
  const struct2 = get_struct("Test2");
  if (unwrap(struct1) && unwrap(struct2)) {
    const [state1, dispatch1, jsx1] = useComponent({
      struct: struct1.value,
      id: new Decimal(props.route.params.id),
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
      values: HashSet.of(),
      init_values: HashSet.of(),
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
      higher_structs: [[struct2.value, [[], "z"]]],
      user_paths: [[[], "user"]],
      borrows: [],
      create: CreateComponent,
      update: UpdateComponent,
      show: ShowComponent,
    });

    const [state2, dispatch2, jsx2] = useComponent({
      struct: struct2.value,
      id: new Decimal(props.route.params.id),
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
      values: HashSet.of(),
      init_values: HashSet.of(),
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
      create: CreateComponent,
      update: UpdateComponent,
      show: ShowComponent,
    });

    useLayoutEffect(() => {
      // state1 is getting embedded so state.values is necessary dependency for the effect
      dispatch2([
        "extension",
        {
          ...state2.extensions,
          z: {
            struct: struct1.value,
            state: state1,
            dispatch: dispatch1,
          },
        },
      ]);
    }, [state1.values]);

    useLayoutEffect(() => dispatch2(["event_trigger"]), [state1.event_trigger]);

    useLayoutEffect(() => dispatch2(["check_trigger"]), [state1.check_trigger]);

    useEffect(() => {
      const set_title = async (title: string) => {
        props.navigation.setOptions({ headerTitle: title });
      };
      if (state1.mode === "write") {
        if (state1.id.equals(-1)) {
          set_title("Create Test");
        } else {
          set_title("Update Test");
        }
      } else {
        set_title("Test");
      }
    }, []);

    return (
      <>
        {jsx1}
        {/* {jsx2} */}
      </>
    );
  }
  return <></>;
}

function CreateComponent(props: {
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
}): JSX.Element {
  const navigation = useNavigation();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.custom.black[900] }}>
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
                          <Text>Select User </Text>
                          {props.state.mode === "write" ? (
                            <FontAwesome
                              name="edit"
                              size={24}
                              color={colors.tailwind.slate[400]}
                            />
                          ) : (
                            <></>
                          )}
                        </View>
                      );
                    } else {
                      return (
                        <View>
                          <Field {...props} path={[["user"], "nickname"]} />
                          <Text> </Text>
                          {props.state.mode === "write" ? (
                            <FontAwesome
                              name="edit"
                              size={24}
                              color={colors.tailwind.slate[400]}
                            />
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
                  struct: Struct;
                  variable: Variable;
                  selected: boolean;
                  update_parent_values: (variable: Variable) => void;
                }) => {
                  const render_jsx = (it: {
                    struct: Struct;
                    state: State;
                    dispatch: React.Dispatch<Action>;
                  }) => {
                    if (!props.variable.id.equals(-1) && props.selected) {
                      return (
                        <View
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            borderRadius: 5,
                            paddingVertical: 5,
                            marginVertical: 5,
                            backgroundColor: colors.tailwind.slate[800],
                            borderWidth: 1,
                          }}
                        >
                          <View>
                            <Text>Unique ID</Text>
                            <Text>{state.id.toString()}</Text>
                          </View>
                          <View>
                            <Text>Created</Text>
                            <Text>{state.created_at.toString()}</Text>
                          </View>
                          <View>
                            <Text>Updated</Text>
                            <Text>{state.updated_at.toString()}</Text>
                          </View>
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
                            backgroundColor: colors.tailwind.slate[900],
                          }}
                        >
                          <View>
                            <Text>Unique ID</Text>
                            <Text>{state.id.toString()}</Text>
                          </View>
                          <View>
                            <Text>Created</Text>
                            <Text>{state.created_at.toString()}</Text>
                          </View>
                          <View>
                            <Text>Updated</Text>
                            <Text>{state.updated_at.toString()}</Text>
                          </View>
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
                              props.update_parent_values(props.variable)
                            }
                            style={{
                              alignSelf: "flex-end",
                              paddingVertical: 10,
                              paddingRight: 5,
                            }}
                          >
                            <Text
                              style={{
                                backgroundColor: colors.tailwind.slate[700],
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
                  };

                  const [state, dispatch, jsx] = useComponent({
                    struct: props.struct,
                    id: props.variable.id,
                    active: props.variable.active,
                    created_at: props.variable.created_at,
                    updated_at: props.variable.updated_at,
                    values: props.variable.paths,
                    init_values: props.variable.paths,
                    extensions: {},
                    // Labels received from above already exist on values
                    labels: [],
                    higher_structs: [],
                    user_paths: [],
                    borrows: [],
                    create: render_jsx,
                    update: render_jsx,
                    show: render_jsx,
                  });

                  useEffect(() => {
                    // Mark triggers, checks, etc
                    // Writeable fields would already have been correctly marked
                    dispatch([
                      "values",
                      mark_trigger_dependencies(
                        props.struct,
                        state.values as HashSet<Path>,
                        state
                      ),
                    ]);
                  }, [props.struct, props.variable.paths]);

                  return jsx;
                },
                {},
              ],
              render_custom_fields: (props: {
                filters: HashSet<Filter>;
                dispatch: React.Dispatch<ListAction>;
                show_views: (props: { element: JSX.Element }) => JSX.Element;
                show_sorting: (props: { element: JSX.Element }) => JSX.Element;
                show_filters: (props: { element: JSX.Element }) => JSX.Element;
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
                        color={colors.tailwind.slate[300]}
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
                        <View
                          style={{
                            alignSelf: "center",
                            paddingHorizontal: 0,
                            marginHorizontal: 0,
                          }}
                        >
                          <props.show_views
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
                        </View>
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
      <View
        style={{
          justifyContent: "flex-end",
          borderTopWidth: 1,
          marginHorizontal: 0,
          marginTop: 10,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            marginVertical: 10,
            marginHorizontal: 5,
            paddingVertical: 10,
            paddingHorizontal: 10,
            backgroundColor: colors.tailwind.slate[700],
            borderRadius: 4,
            borderWidth: 1,
            borderColor: colors.tailwind.slate[600],
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 15,
              paddingRight: 0,
            }}
          >
            Cancel
          </Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            try {
              await replace_variable(
                new Decimal(0),
                new Variable(
                  props.struct,
                  props.state.id as Decimal,
                  props.state.active,
                  props.state.created_at,
                  props.state.updated_at,
                  props.state.values as HashSet<Path>
                )
              );
              navigation.goBack();
            } catch (e) {}
          }}
          style={{
            marginVertical: 10,
            marginHorizontal: 5,
            paddingVertical: 10,
            paddingHorizontal: 10,
            backgroundColor: colors.tailwind.slate[700],
            borderRadius: 4,
            borderWidth: 1,
            borderColor: colors.tailwind.slate[600],
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 15,
              paddingRight: 0,
            }}
          >
            SAVE
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function UpdateComponent(props: {
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
}): JSX.Element {
  // props.dispatch(["mode", "read"])
  return (
    <View style={{ flex: 1, backgroundColor: colors.custom.black[900] }}>
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
    <View style={{ flex: 1, backgroundColor: colors.custom.black[900] }}>
      <View>
        <Label {...props} path={"str"} />
        <Field {...props} path={"str"} />
      </View>
    </View>
  );
}
