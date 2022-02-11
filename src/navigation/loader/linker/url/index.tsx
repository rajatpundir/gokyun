import React, { useState } from "react";
import { NavigatorProps as ParentNavigatorProps } from "..";
import { Column, Input, Pressable, Row, Text } from "native-base";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../../../lib/utils/theme";

export default function Component(props: ParentNavigatorProps<"URL">) {
  const theme = useTheme();
  const [local_val, set_local_val] = useState("");
  const [has_errors, set_has_errors] = useState(false);
  const default_value = "";
  return (
    <>
      <Column p={"2"}>
        <Row my={"1"}>
          <Text fontSize={"md"} color={theme.primary}>
            Link Resource
          </Text>
        </Row>
        <Row>
          <Input
            flex={1}
            size={"md"}
            maxLength={255}
            placeholder={"Paste link to your resource (image, pdf, etc)"}
            value={local_val}
            isInvalid={has_errors}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                set_has_errors(false);
                // props.dispatch([
                //   "value",
                //   apply(props.path, (it) => {
                //     it.path[1][1] = {
                //       type: value.type,
                //       value: x,
                //     };
                //     return it;
                //   }),
                // ]);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value && local_val !== "" ? (
                <Pressable
                  px={1}
                  onPress={() => {
                    set_local_val(default_value);
                    set_has_errors(false);
                    // props.dispatch([
                    //   "value",
                    //   apply(props.path, (it) => {
                    //     it.path[1][1] = {
                    //       type: value.type,
                    //       value: default_value,
                    //     };
                    //     return it;
                    //   }),
                    // ]);
                  }}
                >
                  <MaterialIcons
                    name="clear"
                    size={24}
                    color={theme.placeholder}
                  />
                </Pressable>
              ) : (
                <></>
              )
            }
            borderColor={theme.border}
          />
        </Row>
        <Row py={"2"} justifyContent={"flex-end"}>
          <Pressable
            justifyContent={"center"}
            alignItems={"center"}
            onPress={() => {}}
            borderColor={theme.primary}
            borderWidth={"1"}
            borderRadius={"xs"}
            px={"2"}
            py={"0.5"}
          >
            <Text bold fontSize={"md"}>
              Fetch
            </Text>
          </Pressable>
        </Row>
      </Column>
    </>
  );
}
