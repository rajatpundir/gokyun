import React from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { ScrollView, Row, Text } from "native-base";
import {
  ComponentViews,
  OtherComponent,
  SearchBar,
} from "../lib/utils/component";
import { Field } from "../lib/utils/fields";
import { arrow, unwrap } from "../lib/utils/prelude";
import { Path, Variable } from "../lib/utils/variable";
import { replace_variable } from "../lib/utils/db";
import { get_path } from "../lib/utils/commons";
import { tw } from "../lib/utils/tailwind";
import { theme } from "../lib/utils/theme";
import { SBS } from "../templates/SBS";
import UserViews from "./User";

const views = {
  User: UserViews,
};

export default {
  Default: {
    create: (props) => {
      const navigation = useNavigation();
      return (
        <ScrollView m={"2"}>
          <SBS
            {...props}
            fields={[
              {
                path: "str",
              },
              {
                path: [["z"], "str"],
              },
              {
                path: "lstr",
              },
              {
                path: "clob",
              },
              {
                path: "u32",
                checks: [{ name: "u32_is_even", message: "U32 cannot be odd" }],
              },
              {
                path: "i32",
              },
              {
                path: "u64",
              },
              {
                path: "i64",
              },
              {
                path: "udouble",
              },
              {
                path: "idouble",
              },
              {
                path: "udecimal",
              },
              {
                path: "idecimal",
              },
              {
                path: "bool",
              },
              {
                path: "date",
              },
              {
                path: "time",
              },
              {
                path: "timestamp",
              },
              {
                path: "user",
                options: [
                  "other",
                  {
                    title: "Select User",
                    limit: new Decimal(10),
                    user_paths: [],
                    borrows: [],
                    labels: [
                      ["Nickname", [[], "nickname"]],
                      ["Knows english", [[], "knows_english"]],
                      ["Mobile", [[], "mobile"]],
                      ["Product Count", [[], "product_count"]],
                    ],
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
                    render_list_element: [
                      (props) => (
                        <OtherComponent
                          {...props}
                          view={views.User["Default"]}
                        />
                      ),
                      {},
                    ],
                    render_custom_fields: (props) => (
                      <SearchBar
                        {...props}
                        placeholder="Nickname"
                        path={[[], "nickname"]}
                      />
                    ),
                  },
                ],
              },
            ]}
          />
          <Row justifyContent={"flex-end"} my={"2"}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={tw.style(["px-4", "py-2", "rounded", "border", "mx-2"], {
                borderColor: theme.primary,
              })}
            >
              <Text>Cancel</Text>
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
              style={tw.style(["px-4", "py-2", "rounded"], {
                backgroundColor: theme.primary,
              })}
            >
              <Text fontWeight={"bold"}>Save</Text>
            </Pressable>
          </Row>
        </ScrollView>
      );
    },
    update: () => <></>,
    show: () => <></>,
  },
} as ComponentViews;
