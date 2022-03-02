import React, { useEffect, useRef, useState } from "react";
import VideoPlayer from "expo-video-player";
import * as Clipboard from "expo-clipboard";
import { WebView } from "react-native-webview";
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
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useBSTheme, useTheme } from "../../../../lib/theme";
import { arrow, get_resource, Resource, unwrap } from "../../../../lib/prelude";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Portal } from "@gorhom/portal";
import { tw } from "../../../../lib/tailwind";
import { get_struct } from "../../../../schema";
import { useComponent } from "../../../../lib/component";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { views } from "../../../../views";

// Higher existence for searching via keywords

// Distinct structs for private and public resources

export default function Component(props: ParentNavigatorProps<"Link">) {
  const theme = useTheme();
  const bs_theme = useBSTheme();
  const [local_val, set_local_val] = useState("");
  const [has_errors, set_has_errors] = useState(false);
  const default_value = "";
  const [resource, set_resource] = useState(undefined as Resource);
  const bsm_ref = useRef<BottomSheetModal>(null);
  const [copied_url, set_copied_url] = React.useState(
    undefined as string | undefined
  );
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
  return (
    <ScrollView>
      <Column px={"2"}>
        <Row my={"4"}>
          <Input
            flex={1}
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
                  <MaterialIcons
                    name="clear"
                    size={24}
                    color={theme.placeholder}
                  />
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
                            set_resource(
                              await get_resource(new URL(copied_url))
                            );
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
        </Row>
        {resource !== undefined ? (
          <Column
            borderColor={theme.border}
            borderWidth={"1"}
            borderRadius={"xs"}
          >
            <Row>
              {arrow(() => {
                switch (resource.type) {
                  case "image": {
                    switch (resource.subtype) {
                      case "png":
                      case "jpeg":
                      case "webp": {
                        return (
                          <Image
                            source={{
                              uri: resource.url,
                            }}
                            resizeMode="contain"
                            width={"full"}
                            height={resource.height}
                            maxHeight={"80"}
                            alt="*"
                            fallbackElement={
                              <Text fontSize={"xs"} color={theme.error}>
                                * Unable to load image, please check url
                              </Text>
                            }
                          />
                        );
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
                        return (
                          <VideoPlayer
                            videoProps={{
                              source: {
                                uri: resource.url,
                              },
                              resizeMode: "contain",
                            }}
                            fullscreen={{
                              visible: false,
                            }}
                            style={{
                              height: 240,
                              videoBackgroundColor: theme.background,
                            }}
                          />
                        );
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
                        return (
                          <Column flex={"1"}>
                            <WebView
                              source={{
                                uri: `http://docs.google.com/gview?embedded=true&url=${resource.url}`,
                              }}
                              nestedScrollEnabled={true}
                              style={{ height: 240 }}
                            />
                          </Column>
                        );
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
                        return (
                          <Column flex={"1"}>
                            <WebView
                              originWhitelist={["*"]}
                              source={{
                                html: `
                                  <html>
                                  <style>
                                      html {
                                      overflow: hidden;
                                      background-color: black;
                                      }
                                      html,
                                      body,
                                      div,
                                      iframe {
                                      margin: 0px;
                                      padding: 0px;
                                      height: 100%;
                                      border: none;
                                      display: block;
                                      width: 100%;
                                      border: none;
                                      overflow: hidden;
                                      }
                                  </style>
                                  <body>
                                    <iframe src="https://www.youtube-nocookie.com/embed/${resource.url}?controls=0"></iframe>
                                  </body>
                                  </html>`,
                              }}
                              style={{ height: 210 }}
                            />
                          </Column>
                        );
                      }
                      default: {
                        const _exhaustiveCheck: never = resource;
                        return _exhaustiveCheck;
                      }
                    }
                  }
                  default: {
                    const _exhaustiveCheck: never = resource;
                    return _exhaustiveCheck;
                  }
                }
              })}
            </Row>
            <Row justifyContent={"flex-end"} m={"2"}>
              <Pressable
                onPress={() => bsm_ref.current?.present()}
                flexDirection={"row"}
                justifyContent={"center"}
                alignItems={"center"}
                backgroundColor={theme.primary}
                borderRadius={"xs"}
                px={"3"}
                py={"1"}
              >
                <Text bold fontSize={"md"} color={"white"}>
                  Link{" "}
                </Text>
                <Feather name="link" size={16} color={"white"} />
              </Pressable>
            </Row>
            <Portal>
              <BottomSheetModal
                ref={bsm_ref}
                snapPoints={["50%", "82%"]}
                index={0}
                backgroundStyle={tw.style(["border"], {
                  backgroundColor: bs_theme.background,
                  borderColor: bs_theme.primary,
                })}
              >
                <Row
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  borderBottomColor={bs_theme.primary}
                  borderBottomWidth={"1"}
                  px={"3"}
                  pb={"2"}
                >
                  <Text bold color={bs_theme.text}>
                    Link Resource
                  </Text>
                  <Row space={"2"}>
                    <Pressable
                      onPress={() => {}}
                      backgroundColor={bs_theme.primary}
                      borderRadius={"xs"}
                      px={"2"}
                      py={"0.5"}
                    >
                      <Text bold color={"white"}>
                        Confirm
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => bsm_ref.current?.close()}
                      borderColor={bs_theme.primary}
                      borderWidth={"1"}
                      borderRadius={"xs"}
                      px={"2"}
                      py={"0.5"}
                    >
                      <Text color={bs_theme.text}>Close</Text>
                    </Pressable>
                  </Row>
                </Row>
                {arrow(() => {
                  return <></>;
                })}
              </BottomSheetModal>
            </Portal>
          </Column>
        ) : (
          <></>
        )}
      </Column>
    </ScrollView>
  );
}

export function ResourceComponent() {
  const struct = get_struct("Resource");
  if (unwrap(struct)) {
    const [state, dispatch, jsx] = useComponent({
      struct: struct.value,
      id: new Decimal(-1),
      created_at: new Date(),
      updated_at: new Date(),
      values: HashSet.of(),
      init_values: HashSet.of(),
      extensions: {},
      labels: [
        ["type", [[], "type"]],
        ["type name", [["type"], "name"]],
        ["url", [[], "lstr"]],
        ["name", [[], "str"]],
      ],
      higher_structs: [],
      user_paths: [[[], "user"]],
      borrows: [],
      create: views.Test["Default"].create,
      update: views.Test["Default"].update,
      show: views.Test["Default"].show,
    });
  }
}
