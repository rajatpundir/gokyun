import React, { useEffect, useLayoutEffect } from "react";
import { Pressable, ScrollView } from "react-native";

import { NavigatorProps as RootNavigatorProps } from "../../App";
import { View, Text, TextInput } from "../../main/themed";
import { State, Action, get_path } from "../../main/utils/commons";
import { get_struct } from "../../main/utils/schema";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { Filter, FilterPath, replace_variable } from "../../main/utils/db";
import {
  compare_paths,
  Path,
  Struct,
  Variable,
} from "../../main/utils/variable";
import { Label, Field, Check } from "../../main/utils/fields";
import { apply, arrow, unwrap } from "../../main/utils/prelude";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { colors } from "../../main/themed/colors";
import { ListAction } from "../../main/utils/list";
import { useNavigation } from "@react-navigation/native";
import {
  OtherComponent,
  SearchBar,
  useComponent,
} from "../../main/utils/component";
import { views } from "../../views";

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
