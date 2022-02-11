import React, { useState } from "react";
import { NavigatorProps as ParentNavigatorProps } from "..";
import { Column, Input, Pressable, Row, Text, Image } from "native-base";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../../../lib/utils/theme";
import { apply, arrow } from "../../../../lib/utils/prelude";

export default function Component(props: ParentNavigatorProps<"URL">) {
  const theme = useTheme();
  const [local_val, set_local_val] = useState("");
  const [has_errors, set_has_errors] = useState(false);
  const default_value = "";
  const [url, set_url] = useState(undefined as URL | undefined);
  const check_url = async (url: string) => (await fetch(url)).ok;
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
            onChangeText={async (x) => {
              try {
                set_url(undefined);
                set_local_val(x);
                set_has_errors(false);
                const val = new URL(x);
                const result = await check_url(val.toString());
                if (result) {
                  set_url(val);
                }
              } catch (e) {
                console.log(e);
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
                    set_url(undefined);
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
        {url !== undefined ? (
          <Column my={"4"}>
            <Row>
              <Image
                source={{
                  uri: apply(url.toString(), (it) => it.replace(/\/+$/, "")),
                }}
                resizeMode="contain"
                alt="Unable to load image, please check url"
                width={"full"}
                height={"48"}
              />
            </Row>
            <Row justifyContent={"flex-end"}>
              <Pressable
                onPress={() => {}}
                justifyContent={"center"}
                alignItems={"center"}
                backgroundColor={theme.primary}
                borderRadius={"xs"}
                px={"3"}
                py={"1"}
              >
                <Text bold fontSize={"md"}>
                  Add
                </Text>
              </Pressable>
            </Row>
          </Column>
        ) : (
          <></>
        )}
      </Column>
    </>
  );
}
