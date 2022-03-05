import React, { useLayoutEffect } from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";

import { NavigatorProps as RootNavigatorProps } from "../main";
import { get_fx, get_struct } from "../../schema";
import { views } from "../../views";
import { Row, Pressable, Text } from "native-base";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import {
  unwrap,
  useComponent,
  ModalHeader,
  replace_variable,
  Variable,
  arrow,
  increment_struct_counter,
  get_struct_counter,
  DeleteButton,
  useTheme,
  Path,
  apply,
  get_fx_args,
} from "../../lib";

export default function Component(
  props: RootNavigatorProps<"Test">
): JSX.Element {
  const theme = useTheme();
  const struct1 = get_struct("Test");
  const struct2 = get_struct("Test2");
  const [state1, dispatch1, jsx1] = useComponent({
    struct: struct1,
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
    higher_structs: [[struct2, [[], "z"]]],
    user_paths: [[[], "user"]],
    borrows: [],
    create: views.Test["Default"].create,
    update: views.Test["Default"].update,
    show: views.Test["Default"].show,
  });

  const [state2, dispatch2, jsx2] = useComponent({
    struct: struct2,
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
          struct: struct1,
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
                      if (state1.id.equals(-1)) {
                        const fx = get_fx("Create_Test");
                        const args = get_fx_args(
                          {
                            str: [[], "str"],
                            lstr: [[], "lstr"],
                            clob: [[], "clob"],
                            u32: [[], "u32"],
                            i32: [[], "i32"],
                            u64: [[], "u64"],
                            i64: [[], "i64"],
                            udouble: [[], "udouble"],
                            idouble: [[], "idouble"],
                            udecimal: [[], "udecimal"],
                            idecimal: [[], "idecimal"],
                            bool: [[], "bool"],
                            date: [[], "date"],
                            time: [[], "time"],
                            timestamp: [[], "timestamp"],
                            user: [[], "user"],
                          },
                          state1.values as HashSet<Path>
                        );
                        if (unwrap(fx) && unwrap(args)) {
                          const result = await fx.value.exec(
                            args.value,
                            new Decimal(0)
                          );
                          console.log("===", result);
                          if (unwrap(result)) {
                            props.navigation.goBack();
                          }
                        }
                      } else {
                        await replace_variable(
                          new Decimal(0),
                          new Variable(
                            struct1,
                            state1.id as Decimal,
                            state1.created_at,
                            state1.updated_at,
                            state1.values as HashSet<Path>
                          )
                        );
                      }
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
                    <MaterialIcons name="clear" size={16} color={theme.text} />
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
                      const fx = get_fx("Delete_Test");
                      if (unwrap(fx)) {
                        await fx.value.exec(
                          {
                            test: {
                              type: "other",
                              other: struct1.name,
                              value: state1.id as Decimal,
                            },
                          },
                          new Decimal(0)
                        );
                      }
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
