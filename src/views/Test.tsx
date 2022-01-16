import React from "react";
import { HashSet } from "prelude-ts";
import { useNavigation } from "@react-navigation/native";
import { Pressable, ScrollView, View } from "react-native";
import Decimal from "decimal.js";
import { FontAwesome } from "@expo/vector-icons";
import { Text } from "native-base";
import {
  ComponentViews,
  OtherComponent,
  SearchBar,
} from "../lib/utils/component";
import { Label, Field, Check } from "../lib/utils/fields";
import { arrow, unwrap } from "../lib/utils/prelude";
import { Path, PathString, Variable } from "../lib/utils/variable";
import { replace_variable } from "../lib/utils/db";
import { get_label, get_path } from "../lib/utils/commons";
import UserViews from "./User";
import { tw, colors } from "../lib/utils/tailwind";
import { Row, Column } from "native-base";

const views = {
  User: UserViews,
};

export default {
  Default: {
    create: (props) => {
      const navigation = useNavigation();
      const item = (
        path: string | PathString,
        placeholder?: string,
        checks?: ReadonlyArray<JSX.Element>
      ) => {
        return (
          <Row my={"2"}>
            <Column flex={1}>
              <Row alignItems={"center"}>
                <Column w={"20"}>
                  <Label {...props} path={path} />
                </Column>
                <Column
                  flex={1}
                  flexDirection={"row"}
                  justifyContent={"flex-end"}
                >
                  <Field {...props} path={path} placeholder={placeholder} />
                </Column>
              </Row>
              {arrow(() => {
                if (checks) {
                  return (
                    <Row mx={"2"} my={"1"}>
                      <Column flex={1}>
                        {checks.map((x) => (
                          <Row>{x}</Row>
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
      };
      return (
        <ScrollView style={tw.style(["flex-1", "flex-col"])}>
          <Column px={"3"}>
            {item("str")}
            {item([["z"], "str"])}
            {item("lstr")}
            {item("clob")}
            {item("u32", get_label(props.state, "u32"), [
              <Check
                {...props}
                name="u32_is_even"
                message="U32 cannot be odd"
              />,
            ])}
            {item("i32")}
            {item("u64")}
            {item("i64")}
            {item("udouble")}
            {item("idouble")}
            {item("udecimal")}
            {item("idecimal")}
            {item("bool")}
            {item("date")}
            {item("time")}
            {item("timestamp")}
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
