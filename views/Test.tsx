import React from "react";
import { Pressable, ScrollView } from "react-native";
import {
  ComponentViews,
  OtherComponent,
  SearchBar,
} from "../main/utils/component";
import { Label, Field, Check } from "../main/utils/fields";
import { View, Text } from "../main/themed";
import { colors } from "../main/themed/colors";
import { arrow, unwrap } from "../main/utils/prelude";
import { useNavigation } from "@react-navigation/native";
import Decimal from "decimal.js";
import { FontAwesome } from "@expo/vector-icons";
import { views } from ".";
import { Path, Variable } from "../main/utils/variable";
import { replace_variable } from "../main/utils/db";
import { HashSet } from "prelude-ts";
import { get_path } from "../main/utils/commons";

export default {
  Default: {
    create: (props) => {
      const navigation = useNavigation();
      return (
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.custom.black[900] }}
        >
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
    },
    update: () => <></>,
    show: () => <></>,
  },
} as ComponentViews;
