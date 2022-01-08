import * as React from "react";
import { NavigatorProps as ParentNavigatorProps } from "..";
import { Pressable } from "react-native";
import { Text, TextInput, View } from "../../main/themed";
import { useImmerReducer } from "use-immer";
import { List, ListAction } from "../../main/utils/list";
import { apply, arrow, unwrap } from "../../main/utils/prelude";
import { get_struct } from "../../main/utils/schema";
import { Filter, FilterPath } from "../../main/utils/db";
import {
  Action,
  reducer,
  compute_checks,
  get_filter_paths,
  mark_trigger_dependencies,
  run_triggers,
  State,
} from "../../main/utils/commons";
import { HashSet } from "prelude-ts";
import Decimal from "decimal.js";
import { compare_paths, Path, Variable } from "../../main/utils/variable";
import { colors } from "../../main/themed/colors";
import { Field, Label } from "../../main/utils/fields";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";

// Show a flat list with a bunch of string, a button at top right to open a modal to add new string
// Some mechanism to update and delete this list
// Edit and Show modes to show or edit this list

export default function Component(
  props: ParentNavigatorProps<"Users">
): JSX.Element {
  const struct_name = "User";
  const struct = get_struct(struct_name);
  return (
    <View
      style={{
        flex: 1,
        flexDirection: "column",
        paddingHorizontal: 8,
        backgroundColor: colors.custom.black[900],
      }}
    >
      {arrow(() => {
        if (unwrap(struct)) {
          return (
            <List
              selected={-1}
              struct={struct.value}
              active={true}
              level={undefined}
              filters={[
                new Filter(
                  0,
                  [false, undefined],
                  [false, undefined],
                  [false, undefined],
                  get_filter_paths(
                    struct.value,
                    [
                      ["Nickname", [[], "nickname"]],
                      ["Knows english", [[], "knows_english"]],
                      ["Mobile", [[], "mobile"]],
                      ["Product Count", [[], "product_count"]],
                    ],
                    [],
                    []
                  )
                ),
                HashSet.of(),
              ]}
              limit={new Decimal(10)}
              render_list_element={[
                (props: {
                  selected: number;
                  variable: Variable;
                  disptach_values: (variable: Variable) => void;
                }) => {
                  const struct_name = "User";
                  const struct = get_struct(struct_name);
                  const [state, dispatch] = useImmerReducer<State, Action>(
                    reducer,
                    {
                      id: props.variable.id,
                      active: props.variable.active,
                      created_at: props.variable.created_at,
                      updated_at: props.variable.updated_at,
                      values: props.variable.paths,
                      init_values: props.variable.paths,
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
                  React.useEffect(() => {
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
                  React.useEffect(() => {
                    if (unwrap(struct)) {
                      run_triggers(struct.value, state, dispatch);
                    }
                  }, [state.event_trigger]);
                  React.useEffect(() => {
                    if (unwrap(struct)) {
                      compute_checks(struct.value, state, dispatch);
                    }
                  }, [state.check_trigger]);
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
                          </View>
                        );
                      }
                    }
                  );
                },
                {},
              ]}
              disptach_values={() => {}}
              render_custom_fields={(props: {
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
                        marginHorizontal: 10,
                        marginTop: 4,
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
              }}
            />
          );
        }
        return <></>;
      })}
    </View>
  );
}
