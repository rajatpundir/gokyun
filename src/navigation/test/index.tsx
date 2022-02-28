import React, { useLayoutEffect } from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";

import { NavigatorProps as RootNavigatorProps } from "../main";
import { get_struct } from "../../schema/struct";
import { apply, arrow, unwrap } from "../../lib/prelude";
import { views } from "../../views";
import { DeleteButton, ModalHeader, useComponent } from "../../lib/component";
import { Row, Pressable, Text } from "native-base";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { get_struct_counter, increment_struct_counter } from "../../lib/db";
import {
  replace_variable,
  remove_variables_in_db,
} from "../../lib/db_variables";
import { Path, Variable } from "../../lib/variable";
import { useTheme } from "../../lib/theme";

export default function Component(
  props: RootNavigatorProps<"Test">
): JSX.Element {
  const theme = useTheme();
  const struct1 = get_struct("Test");
  const struct2 = get_struct("Test2");
  if (unwrap(struct1) && unwrap(struct2)) {
    const [state1, dispatch1, jsx1] = useComponent({
      struct: struct1.value,
      id: new Decimal(props.route.params.id),
      created_at: new Date(),
      updated_at: new Date(),
      values: props.route.params.values
        ? props.route.params.values
        : HashSet.of(),
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
      create: views.Test["Default"].create,
      update: views.Test["Default"].update,
      show: views.Test["Default"].show,
    });

    const [state2, dispatch2, jsx2] = useComponent({
      struct: struct2.value,
      id: new Decimal(props.route.params.id),
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
      create: views.Test["Default"].create,
      update: views.Test["Default"].update,
      show: views.Test["Default"].show,
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

    return (
      <>
        <ModalHeader
          title={apply("", (it) => {
            if (state1.mode === "write") {
              if (state1.id.equals(-1)) {
                return "Create Test";
              } else {
                return "Update Test";
              }
            } else {
              return "Test";
            }
          })}
          RightElement={
            <>
              {state1.found || state1.values.length() !== 0 ? (
                state1.mode === "write" ? (
                  <Row space={"2"}>
                    <Pressable
                      onPress={async () => {
                        try {
                          await replace_variable(
                            new Decimal(0),
                            new Variable(
                              struct1.value,
                              await arrow(async () => {
                                if (state1.id.equals(-1)) {
                                  await increment_struct_counter(
                                    struct1.value.name
                                  );
                                  const result = await get_struct_counter(
                                    struct1.value.name
                                  );
                                  if (unwrap(result)) {
                                    props.navigation.goBack();
                                    return result.value;
                                  }
                                }
                                return state1.id as Decimal;
                              }),
                              state1.created_at,
                              state1.updated_at,
                              state1.values as HashSet<Path>
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
                        if (state1.id.equals(-1)) {
                          props.navigation.goBack();
                        } else {
                          dispatch1(["mode", "read"]);
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
                      <MaterialIcons
                        name="clear"
                        size={16}
                        color={theme.text}
                      />
                    </Pressable>
                  </Row>
                ) : (
                  <Row space={"2"}>
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
                          struct1.value.name,
                          [state1.id as Decimal]
                        );
                        props.navigation.goBack();
                      }}
                    />
                    <Pressable
                      onPress={() => dispatch1(["mode", "write"])}
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
                  </Row>
                )
              ) : (
                <></>
              )}
            </>
          }
        />
        {jsx1}
        {/* {jsx2} */}
      </>
    );
  }
  return <></>;
}
