import React from "react";
import Decimal from "decimal.js";
import { useNavigation } from "@react-navigation/native";
import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { ScrollView, Row, Text, Pressable, Column } from "native-base";
import UserViews from "./User";
import { HashSet } from "prelude-ts";
import { cloneDeep } from "lodash";
import {
  ComponentViews,
  useBSTheme,
  Template,
  arrow,
  get_path,
  unwrap,
  Field,
  OtherComponent,
  RenderListElement,
  RenderListVariantProps,
  SearchWrapper,
  compare_paths,
  get_path_string,
  replace_variable,
  Variable,
  increment_struct_counter,
  get_struct_counter,
  DeleteButton,
  remove_variables_in_db,
  useTheme,
  apply,
  Path,
} from "../lib";

const views = {
  User: UserViews,
};

const common_default_component: ComponentViews[string]["create"] = (props) => {
  const theme = useTheme();
  const bs_theme = useBSTheme();
  const navigation = useNavigation();
  return (
    <ScrollView m={"2"}>
      <Template
        {...props}
        type={"CV"}
        fields={["str", [["z"], "str"], "lstr", "clob"]}
      />
      <Template
        {...props}
        type={"CH"}
        fields={[
          "i32",
          {
            path: "u32",
            checks: [{ name: "u32_is_even", message: "U32 cannot be odd" }],
          },
          "i64",
          "u64",
          "idouble",
          "udouble",
          "idecimal",
          "udecimal",
        ]}
      />
      <Template {...props} type={"RH"} fields={["bool", "date"]} />
      <Template {...props} type={"RV"} fields={["time", "timestamp"]} />
      <Template
        {...props}
        type={"CH"}
        fields={[
          {
            path: "user",
            options: [
              "other",
              {
                limit: new Decimal(10),
                labels: [
                  ["Nickname", [[], "nickname"]],
                  ["Knows english", [[], "knows_english"]],
                  ["Mobile", [[], "mobile"]],
                  ["Product Count", [[], "product_count"]],
                ],
                options: [
                  "list",
                  {
                    user_paths: [],
                    borrows: [],
                    element: arrow(() => {
                      const result = get_path(props.state, [[], "user"]);
                      if (unwrap(result)) {
                        const path = result.value;
                        if (path.writeable) {
                          const value = path.path[1][1];
                          if (
                            value.type === "other" &&
                            value.value.equals(-1)
                          ) {
                            return (
                              <Row>
                                <Text color={theme.text}>Select User </Text>
                                {props.state.mode === "write" ? (
                                  <FontAwesome
                                    name="edit"
                                    size={24}
                                    color={theme.placeholder}
                                  />
                                ) : (
                                  <></>
                                )}
                              </Row>
                            );
                          } else {
                            return (
                              <Row>
                                <Field
                                  {...props}
                                  path={[["user"], "nickname"]}
                                />

                                {props.state.mode === "write" ? (
                                  <>
                                    <Text> </Text>
                                    <FontAwesome
                                      name="edit"
                                      size={24}
                                      color={theme.placeholder}
                                    />
                                  </>
                                ) : (
                                  <></>
                                )}
                              </Row>
                            );
                          }
                        }
                      }
                      return <></>;
                    }),
                    RenderElement: [
                      (props) => (
                        <OtherComponent
                          {...props}
                          view={views.User["Default"]}
                        />
                      ),
                      {},
                    ] as RenderListElement,
                    title: "Select User",
                  },
                ],
                RenderVariant: (props: RenderListVariantProps) => (
                  <SearchWrapper
                    {...props}
                    placeholder="Nickname"
                    path={[[], "nickname"]}
                    is_views_editable
                    is_sorting_editable
                    is_filters_editable
                  />
                ),
              },
            ],
          },
        ]}
      />
      <Template
        {...props}
        type={"CH"}
        fields={[
          {
            path: "user",
            options: [
              "other",
              {
                limit: new Decimal(10),
                labels: [
                  ["Nickname", [[], "nickname"]],
                  ["Knows english", [[], "knows_english"]],
                  ["Mobile", [[], "mobile"]],
                  ["Product Count", [[], "product_count"]],
                ],
                options: [
                  "menu",
                  {
                    element: arrow(() => {
                      const result = get_path(props.state, [[], "user"]);
                      if (unwrap(result)) {
                        const path = result.value;
                        if (path.writeable) {
                          const value = path.path[1][1];
                          return (
                            <>
                              {apply(
                                value.type === "other" &&
                                  value.value.equals(-1),
                                (it) => {
                                  if (it) {
                                    return (
                                      <Text color={theme.text}>
                                        Select User{" "}
                                      </Text>
                                    );
                                  } else {
                                    return (
                                      <Field
                                        {...props}
                                        path={[["user"], "nickname"]}
                                      />
                                    );
                                  }
                                }
                              )}
                              {apply(props.state.mode === "write", (it) => {
                                if (it) {
                                  return (
                                    <MaterialCommunityIcons
                                      name="menu-down"
                                      size={20}
                                      color={theme.text}
                                    />
                                  );
                                }
                                return <></>;
                              })}
                            </>
                          );
                        }
                      }
                      return <></>;
                    }),
                    RenderElement: (variable) => {
                      const result = variable.paths.findAny((x) =>
                        compare_paths(get_path_string(x), [[], "nickname"])
                      );
                      if (result.isSome()) {
                        const path = result.get();
                        if (path.path[1][1].type === "str") {
                          return path.path[1][1].value;
                        }
                      }
                      return variable.id.toString();
                    },
                  },
                ],
              },
            ],
          },
        ]}
      />
      <Template
        {...props}
        type={"CH"}
        fields={[
          {
            path: "user",
            options: [
              "other",
              {
                limit: new Decimal(10),
                labels: [
                  ["Nickname", [[], "nickname"]],
                  ["Knows english", [[], "knows_english"]],
                  ["Mobile", [[], "mobile"]],
                  ["Product Count", [[], "product_count"]],
                ],
                options: [
                  "sheet",
                  {
                    element: arrow(() => {
                      const result = get_path(props.state, [[], "user"]);
                      if (unwrap(result)) {
                        const path = result.value;
                        if (path.writeable) {
                          const value = path.path[1][1];
                          if (
                            value.type === "other" &&
                            value.value.equals(-1)
                          ) {
                            return (
                              <Row>
                                <Text color={theme.text}>Select User </Text>
                                {props.state.mode === "write" ? (
                                  <>
                                    <Text> </Text>
                                    <FontAwesome
                                      name="edit"
                                      size={24}
                                      color={theme.placeholder}
                                    />
                                  </>
                                ) : (
                                  <></>
                                )}
                              </Row>
                            );
                          } else {
                            return (
                              <Row>
                                <Field
                                  {...props}
                                  path={[["user"], "nickname"]}
                                />
                                {props.state.mode === "write" ? (
                                  <>
                                    <Text> </Text>
                                    <FontAwesome
                                      name="edit"
                                      size={24}
                                      color={theme.placeholder}
                                    />
                                  </>
                                ) : (
                                  <></>
                                )}
                              </Row>
                            );
                          }
                        }
                      }
                      return <></>;
                    }),
                    RenderElement: (variable) => (selected: boolean) =>
                      (
                        <Row py={"0.5"}>
                          {selected ? (
                            <Ionicons
                              name="radio-button-on"
                              size={24}
                              color={bs_theme.primary}
                            />
                          ) : (
                            <Ionicons
                              name="radio-button-off"
                              size={24}
                              color={bs_theme.primary}
                            />
                          )}
                          <Text pl={1} color={theme.text}>
                            {arrow(() => {
                              const result = variable.paths.findAny((x) =>
                                compare_paths(get_path_string(x), [
                                  [],
                                  "nickname",
                                ])
                              );
                              if (result.isSome()) {
                                const path = result.get();
                                if (path.path[1][1].type === "str") {
                                  return path.path[1][1].value;
                                }
                              }
                              return variable.id.toString();
                            })}
                          </Text>
                        </Row>
                      ),
                  },
                ],
              },
            ],
          },
        ]}
      />
    </ScrollView>
  );
};

export default {
  Default: {
    create: common_default_component,
    update: common_default_component,
    show: common_default_component,
  },
  Card: arrow(() => {
    const common: ComponentViews[string]["create"] = (props) => {
      const theme = useTheme();
      const navigation = useNavigation();
      return (
        <Column
          p={"2"}
          m={"1"}
          borderWidth={"1"}
          borderRadius={"md"}
          borderColor={theme.border}
          backgroundColor={theme.background}
        >
          <Row justifyContent={"space-between"}>
            <Column>
              <Text bold color={theme.label}>
                Unique ID
              </Text>
            </Column>
            <Column>
              <Text color={theme.text}>{props.state.id.toString()}</Text>
            </Column>
          </Row>
          <Template
            {...props}
            type={"CH"}
            fields={[
              "str",
              "lstr",
              "clob",
              "i32",
              {
                path: "u32",
                checks: [{ name: "u32_is_even", message: "U32 cannot be odd" }],
              },
              "i64",
              "u64",
              "idouble",
              "udouble",
              "idecimal",
              "udecimal",
              "bool",
              "date",
              "time",
              "timestamp",
              [["user"], "nickname"],
            ]}
          />
          {props.state.mode === "write" ? (
            <Row
              justifyContent={"flex-start"}
              alignItems={"center"}
              space={"2"}
            >
              <Pressable
                onPress={async () => {
                  try {
                    await replace_variable(
                      new Decimal(0),
                      new Variable(
                        props.struct,
                        await arrow(async () => {
                          if (props.state.id.equals(-1)) {
                            await increment_struct_counter(props.struct.name);
                            const result = await get_struct_counter(
                              props.struct.name
                            );
                            if (unwrap(result)) {
                              return result.value;
                            }
                          }
                          return props.state.id as Decimal;
                        }),
                        props.state.created_at,
                        props.state.updated_at,
                        props.state.values as HashSet<Path>
                      )
                    );
                  } catch (e) {}
                }}
                flexDirection={"row"}
                alignItems={"center"}
                px={"3"}
                py={"2"}
                rounded={"sm"}
                backgroundColor={theme.primary}
              >
                <Text fontWeight={"bold"} color={"white"}>
                  Save{" "}
                </Text>
                <Feather name="check" size={16} color={"white"} />
              </Pressable>
              <Pressable
                onPress={() => {
                  if (props.state.id.equals(-1)) {
                  } else {
                    props.dispatch(["mode", "read"]);
                  }
                }}
                flexDirection={"row"}
                alignItems={"center"}
                px={"2"}
                py={"1.5"}
                rounded={"sm"}
                borderWidth={"1"}
                borderColor={theme.primary}
              >
                <Text color={theme.text}>Cancel </Text>
                <MaterialIcons name="clear" size={16} color={theme.text} />
              </Pressable>
            </Row>
          ) : (
            <Row
              justifyContent={"flex-start"}
              alignItems={"center"}
              space={"2"}
            >
              <Pressable
                onPress={() =>
                  navigation.navigate("Test", {
                    id: props.state.id.toNumber(),
                    values: cloneDeep(props.state.values as HashSet<Path>),
                  })
                }
                flexDirection={"row"}
                alignItems={"center"}
                px={"2"}
                py={"1.5"}
                rounded={"sm"}
                borderWidth={"1"}
                borderColor={theme.primary}
              >
                <Text bold color={theme.text}>
                  Open{" "}
                </Text>
                <Ionicons name="open-outline" size={16} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={() => props.dispatch(["mode", "write"])}
                flexDirection={"row"}
                alignItems={"center"}
                px={"2"}
                py={"1.5"}
                rounded={"sm"}
                borderWidth={"1"}
                borderColor={theme.primary}
              >
                <Text bold color={theme.text}>
                  Edit{" "}
                </Text>
                <Feather name="edit-3" size={16} color={theme.text} />
              </Pressable>
              <DeleteButton
                message="Delete Test?"
                element={
                  <Row
                    justifyContent={"space-between"}
                    alignItems={"center"}
                    px={"2"}
                    py={"1.5"}
                    rounded={"sm"}
                    borderWidth={"1"}
                    borderColor={theme.primary}
                  >
                    <Text bold color={theme.text}>
                      Delete{" "}
                    </Text>
                    <MaterialIcons
                      name="delete-outline"
                      size={16}
                      color={theme.text}
                    />
                  </Row>
                }
                onPress={async () => {
                  await remove_variables_in_db(
                    new Decimal(0),
                    props.struct.name,
                    [props.state.id as Decimal]
                  );
                }}
              />
            </Row>
          )}
        </Column>
      );
    };
    return {
      create: (props) => <></>,
      update: common,
      show: common,
    } as ComponentViews[string];
  }),
} as ComponentViews;
