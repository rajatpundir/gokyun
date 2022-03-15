import React, { useEffect, useState } from "react";
import { Keyboard } from "react-native";
import * as Clipboard from "expo-clipboard";
import { HashSet } from "prelude-ts";
import Decimal from "decimal.js";
import { AntDesign, Feather, MaterialIcons } from "@expo/vector-icons";
import {
  Column,
  Input,
  Pressable,
  Row,
  Text,
  ScrollView,
  View,
  Fab,
  Icon,
  useToast,
  Spinner,
} from "native-base";
import { NavigatorProps as ParentNavigatorProps } from "..";
import { get_compose } from "../../../../schema";
import {
  useTheme,
  Resource,
  get_resource,
  arrow,
  unwrap,
  ResourceComponent,
} from "../../../../lib";
import { ids } from "../../../../schema/ids";
import { get_system_constants } from "../../../../lib/commons";

// Higher existence for searching via keywords

export default function Component(props: ParentNavigatorProps<"Link">) {
  const toast = useToast();
  const theme = useTheme();
  const [local_val, set_local_val] = useState("");
  const [has_errors, set_has_errors] = useState(false);
  const default_value = "";
  const [resource, set_resource] = useState(undefined as Resource);
  const [copied_url, set_copied_url] = React.useState(
    undefined as string | undefined
  );
  const [loading, set_loading] = useState(false);
  const [is_keyboard_visible, set_keyboard_visible] = useState(false);
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        set_keyboard_visible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        set_keyboard_visible(false);
      }
    );
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);
  useEffect(() => {
    let mounted = true;
    const fetch_copied_url = () => {
      setInterval(async () => {
        try {
          if (mounted) {
            set_copied_url(
              new URL(await Clipboard.getStringAsync())
                .toString()
                .replace(/\/+$/, "")
            );
          }
        } catch (e) {
          if (mounted) {
            set_copied_url(undefined);
          }
        }
      }, 100);
    };
    fetch_copied_url();
    return () => {
      mounted = false;
    };
  });
  const [tag, set_tag] = useState("");
  const [tags, set_tags] = useState(
    HashSet.of<string>(
      "whatever",
      "forever",
      "foreve33r",
      "for55ever",
      "fo44rever"
    )
  );
  return (
    <>
      <Input
        my={"4"}
        mx={"2"}
        size={"md"}
        maxLength={255}
        placeholder={"Paste link to your resource (image, pdf, etc)"}
        value={local_val}
        isInvalid={has_errors}
        onChangeText={async (x) => {
          try {
            set_resource(undefined);
            set_local_val(x);
            set_has_errors(false);
            set_resource(await get_resource(new URL(x)));
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
                set_resource(undefined);
              }}
            >
              <MaterialIcons name="clear" size={24} color={theme.placeholder} />
            </Pressable>
          ) : (
            arrow(() => {
              if (copied_url !== undefined) {
                return (
                  <Pressable
                    px={1}
                    onPress={async () => {
                      try {
                        set_resource(undefined);
                        set_local_val(copied_url);
                        set_has_errors(false);
                        set_resource(await get_resource(new URL(copied_url)));
                      } catch (e) {
                        set_has_errors(true);
                      }
                    }}
                  >
                    <MaterialIcons
                      name="content-paste"
                      size={24}
                      color={theme.primary}
                    />
                  </Pressable>
                );
              }
              return <></>;
            })
          )
        }
        color={theme.text}
        borderColor={theme.border}
        placeholderTextColor={theme.placeholder}
      />
      {resource !== undefined ? (
        <>
          <ScrollView>
            <Column>
              <Column>
                <Row>
                  <ResourceComponent resource={resource} />
                </Row>
                <Row space={"1"} mx={"2"} mt={"3"} alignItems={"center"}>
                  <Input
                    flex={1}
                    size={"md"}
                    maxLength={255}
                    placeholder={"tag name (eg. red or apple or red-apple)"}
                    value={tag}
                    onChangeText={(x) => set_tag(x.split(" ").join(""))}
                    InputRightElement={
                      tag !== "" ? (
                        <Pressable px={1} onPress={() => set_tag("")}>
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
                    color={theme.text}
                    borderColor={theme.border}
                    placeholderTextColor={theme.placeholder}
                  />
                  <Pressable
                    p={"2"}
                    justifyContent={"center"}
                    alignItems={"center"}
                    borderWidth={"1"}
                    borderColor={theme.border}
                    borderRadius={"sm"}
                    onPress={() => {
                      if (
                        tag !== "" &&
                        tags.length() !==
                          get_system_constants().max_resource_tag_count.value
                      ) {
                        set_tags(tags.add(tag.toLocaleLowerCase()));
                        set_tag("");
                      }
                    }}
                  >
                    <AntDesign name="plus" size={26} color={theme.primary} />
                  </Pressable>
                </Row>
                <Row space={"2"} my={"2"} mx={"2"} flexWrap={"wrap"}>
                  {tags.toArray().map((x) => (
                    <View
                      key={x}
                      my={"1"}
                      px={"1"}
                      py={"0.5"}
                      flexDirection={"row"}
                      alignItems={"center"}
                      borderWidth={"1"}
                      borderRadius={"md"}
                      borderColor={theme.primary}
                      flexShrink={"1"}
                    >
                      <Text>{x}</Text>
                      <Pressable onPress={() => set_tags(tags.remove(x))}>
                        <MaterialIcons
                          name="clear"
                          size={20}
                          color={theme.placeholder}
                        />
                      </Pressable>
                    </View>
                  ))}
                </Row>
              </Column>
            </Column>
          </ScrollView>
          {resource !== undefined && !is_keyboard_visible ? (
            <Fab
              icon={
                <Icon
                  color="white"
                  as={
                    loading ? (
                      <Spinner size={"lg"} color={theme.primary} />
                    ) : (
                      <Feather name="link" />
                    )
                  }
                  size="sm"
                />
              }
              backgroundColor={loading ? theme.background : theme.primary}
              placement="bottom-right"
              size={"md"}
              p={"4"}
              m={"2"}
              onPress={async () => {
                const compose = get_compose("Create_Private_Resource");
                if (unwrap(compose)) {
                  const resource_id: Decimal = arrow(() => {
                    switch (resource.type) {
                      case "image": {
                        switch (resource.subtype) {
                          case "png": {
                            return ids.ResourceType["image/png"]._id;
                          }
                          case "jpeg": {
                            return ids.ResourceType["image/jpeg"]._id;
                          }
                          case "webp": {
                            return ids.ResourceType["image/webp"]._id;
                          }
                          default: {
                            const _exhaustiveCheck: never = resource;
                            return _exhaustiveCheck;
                          }
                        }
                      }
                      case "video": {
                        switch (resource.subtype) {
                          case "mp4": {
                            return ids.ResourceType["video/mp4"]._id;
                          }
                          default: {
                            const _exhaustiveCheck: never = resource;
                            return _exhaustiveCheck;
                          }
                        }
                      }
                      case "application": {
                        switch (resource.subtype) {
                          case "pdf": {
                            return ids.ResourceType["application/pdf"]._id;
                          }
                          default: {
                            const _exhaustiveCheck: never = resource;
                            return _exhaustiveCheck;
                          }
                        }
                      }
                      case "text": {
                        switch (resource.subtype) {
                          case "youtube": {
                            return ids.ResourceType["text/youtube"]._id;
                          }
                          default: {
                            const _exhaustiveCheck: never = resource;
                            return _exhaustiveCheck;
                          }
                        }
                      }
                    }
                  });
                  set_loading(true);
                  const result = await compose.value.run({
                    resource_type: {
                      type: "other",
                      other: "Resource_Type",
                      value: resource_id,
                    },
                    url: {
                      type: "str",
                      value: resource.url,
                    },
                    tags: {
                      type: "list",
                      value: tags.toArray().map((x) => {
                        return {
                          name: {
                            type: "str",
                            value: x,
                          },
                        };
                      }),
                    },
                  });
                  set_loading(false);
                  if (unwrap(result)) {
                    set_resource(undefined);
                    set_local_val("");
                    set_has_errors(false);
                    toast.show({
                      title: "Resource created successfully",
                      status: "success",
                    });
                  } else {
                    toast.show({
                      title: "Resource could not be created",
                      status: "error",
                    });
                  }
                }
              }}
            />
          ) : (
            <></>
          )}
        </>
      ) : (
        <></>
      )}
    </>
  );
}
