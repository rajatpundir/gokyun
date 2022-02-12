import React, { useState } from "react";
import { NavigatorProps as ParentNavigatorProps } from "..";
import {
  Column,
  Input,
  Pressable,
  Row,
  Text,
  Image,
  ScrollView,
} from "native-base";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../../../lib/utils/theme";
import {
  apply,
  arrow,
  check_url,
  get_image_size,
} from "../../../../lib/utils/prelude";

type ResourceType = undefined | "Image" | "Video";

export default function Component(props: ParentNavigatorProps<"URL">) {
  const theme = useTheme();
  const [local_val, set_local_val] = useState("");
  const [has_errors, set_has_errors] = useState(false);
  const default_value = "";
  const [resource_type, set_resource_type] = useState(
    undefined as ResourceType
  );
  const [url, set_url] = useState(undefined as URL | undefined);
  const [image_width, set_image_width] = useState(0);
  const [image_height, set_image_height] = useState(0);
  return (
    <ScrollView>
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
                apply(await get_image_size(new URL(x)), (it) => {
                  set_url(it[0]);
                  set_image_width(it[1]);
                  set_image_height(it[2]);
                });
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
          <Column my={"4"} bgColor={"amber.100"}>
            <Row>
              <Image
                source={{
                  uri: url.toString().replace(/\/+$/, ""),
                }}
                resizeMode="contain"
                width={"full"}
                height={image_height}
                maxHeight={"80"}
                alt="*"
                fallbackElement={
                  <Text fontSize={"xs"} color={theme.error}>
                    * Unable to load image, please check url
                  </Text>
                }
              />
            </Row>
            <Row justifyContent={"flex-end"} bgColor={"amber.200"}>
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
    </ScrollView>
  );
}
