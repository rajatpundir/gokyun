import React from "react";
import Decimal from "decimal.js";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, Row, Text, Pressable, Column } from "native-base";
import {
  ComponentViews,
  OtherComponent,
  SearchWrapper,
} from "../lib/utils/component";
import { Field } from "../lib/utils/field";
import { Template } from "../lib/utils/templates";
import { apply, arrow, unwrap } from "../lib/utils/prelude";
import { compare_paths, get_path_string } from "../lib/utils/variable";
import { get_path } from "../lib/utils/commons";
import UserViews from "./User";
import { RenderListVariantProps, RenderListElement } from "../lib/utils/list";
import { useTheme } from "../lib/utils/theme";

const views = {
  User: UserViews,
};

const common_default_component: ComponentViews[string]["create"] = (props) => {
  const theme = useTheme();
  const navigation = useNavigation();
  return (
    <ScrollView m={"2"}>
      <Template
        {...props}
        type={"CLA"}
        fields={["str", [["z"], "str"], "lstr", "clob"]}
      />
      <Template
        {...props}
        type={"CLB"}
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
      <Template {...props} type={"RLB"} fields={["bool", "date"]} />
      <Template {...props} type={"RLA"} fields={["time", "timestamp"]} />
      <Template
        {...props}
        type={"CLB"}
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
                                <Text>Select User </Text>
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
                                <Text> </Text>
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
        type={"CLB"}
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
                                    return <Text>Select User </Text>;
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
        type={"CLB"}
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
                                <Text>Select User </Text>
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
                                <Text> </Text>
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
                          }
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
    </ScrollView>
  );
};

export default {
  Default: {
    create: common_default_component,
    update: common_default_component,
    show: common_default_component,
  },
  Card: {
    create: (props) => <></>,
    update: (props) => <></>,
    show: (props) => {
      const theme = useTheme();
      const navigation = useNavigation();
      return (
        <Pressable
          onPress={() =>
            navigation.navigate("Test", { id: props.state.id.toNumber() })
          }
        >
          <Column
            p={"2"}
            m={"1"}
            borderWidth={"1"}
            borderRadius={"md"}
            borderColor={theme.border}
            backgroundColor={arrow(() => {
              if (props.selected) {
                return theme.border;
              }
              return theme.background;
            })}
          >
            <Row justifyContent={"space-between"}>
              <Column>
                <Text bold color={theme.label}>
                  Unique ID
                </Text>
              </Column>
              <Column>
                <Text>{props.state.id.toString()}</Text>
              </Column>
            </Row>
            <Template
              {...props}
              type={"CLB"}
              fields={[
                "str",
                "lstr",
                "clob",
                "i32",
                "u32",
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
          </Column>
        </Pressable>
      );
    },
  },
} as ComponentViews;
