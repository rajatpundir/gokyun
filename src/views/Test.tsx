import React from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { useNavigation } from "@react-navigation/native";
import { Pressable, ScrollView, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Text } from "native-base";
import {
  ComponentViews,
  OtherComponent,
  SearchBar,
} from "../lib/utils/component";
import { Label, Field, Check } from "../lib/utils/fields";
import { arrow, unwrap } from "../lib/utils/prelude";
import { Path, PathString, Struct, Variable } from "../lib/utils/variable";
import { replace_variable } from "../lib/utils/db";
import { Action, get_label, get_path, State } from "../lib/utils/commons";
import UserViews from "./User";
import { tw, colors } from "../lib/utils/tailwind";
import { Row, Column } from "native-base";

const views = {
  User: UserViews,
};

const Item = (props: {
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
  path: string | PathString;
  placeholder?: string;
  checks?: ReadonlyArray<{ name: string; message: string }>;
}): JSX.Element => (
  <Row my={"2"}>
    <Column flex={1}>
      <Row alignItems={"center"}>
        <Column w={"20"}>
          <Label {...props} />
        </Column>
        <Column flex={1} flexDirection={"row"} justifyContent={"flex-end"}>
          <Field {...props} />
        </Column>
      </Row>
      {arrow(() => {
        if (props.checks) {
          return (
            <Row mx={"2"} my={"1"}>
              <Column flex={1}>
                {props.checks.map((x) => (
                  <Row>
                    <Check {...props} name={x.name} message={x.message} />
                  </Row>
                ))}
              </Column>
            </Row>
          );
        }
        return <></>;
      })}
    </Column>
  </Row>
);

export default {
  Default: {
    create: (props) => {
      const navigation = useNavigation();

      return (
        <ScrollView style={tw.style(["flex-1", "flex-col"])}>
          <Column px={"3"}>
            <Item {...props} path={"str"} />
            <Item {...props} path={[["z"], "str"]} />
            <Item {...props} path={"lstr"} />
            <Item {...props} path={"clob"} />
            <Item
              {...props}
              path={"u32"}
              checks={[{ name: "u32_is_even", message: "U32 cannot be odd" }]}
            />
            <Item {...props} path={"i32"} />
            <Item {...props} path={"u64"} />
            <Item {...props} path={"i64"} />
            <Item {...props} path={"udouble"} />
            <Item {...props} path={"idouble"} />
            <Item {...props} path={"udecimal"} />
            <Item {...props} path={"idecimal"} />
            <Item {...props} path={"bool"} />
            <Item {...props} path={"date"} />
            <Item {...props} path={"time"} />
            <Item {...props} path={"timestamp"} />
          </Column>
          <View>
            <Field
              {...props}
              path={"user"}
              options={[
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
                        if (value.type === "other" && value.value.equals(-1)) {
                          return (
                            <View>
                              <Text>Select User </Text>
                              {props.state.mode === "write" ? (
                                <FontAwesome
                                  name="edit"
                                  size={24}
                                  color={colors.slate[400]}
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
                              {props.state.mode === "write" ? (
                                <FontAwesome
                                  name="edit"
                                  size={24}
                                  color={colors.slate[400]}
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
                  render_list_element: [
                    (props) => (
                      <OtherComponent {...props} view={views.User["Default"]} />
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
                backgroundColor: colors.slate[700],
                borderRadius: 4,
                borderWidth: 1,
                borderColor: colors.slate[600],
              }}
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
              style={{
                marginVertical: 10,
                marginHorizontal: 5,
                paddingVertical: 10,
                paddingHorizontal: 10,
                backgroundColor: colors.slate[700],
                borderRadius: 4,
                borderWidth: 1,
                borderColor: colors.slate[600],
              }}
            >
              <Text>SAVE</Text>
            </Pressable>
          </View>
        </ScrollView>
      );
    },
    update: () => <></>,
    show: () => <></>,
  },
} as ComponentViews;
