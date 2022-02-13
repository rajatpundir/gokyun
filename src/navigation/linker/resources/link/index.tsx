import React, { useRef, useState } from "react";
import VideoPlayer from "expo-video-player";
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
import { useBSTheme, useTheme } from "../../../../lib/utils/theme";
import {
  arrow,
  get_resource,
  Resource,
  unwrap,
} from "../../../../lib/utils/prelude";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Portal } from "@gorhom/portal";
import { tw } from "../../../../lib/utils/tailwind";
import { get_struct } from "../../../../lib/utils/schema";
import { useComponent } from "../../../../lib/utils/component";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { views } from "../../../../views";

// Higher existence for searching via tags

// Get to implementing Transformer

export default function Component(props: ParentNavigatorProps<"Link">) {
  const theme = useTheme();
  const bs_theme = useBSTheme();
  const [local_val, set_local_val] = useState("");
  const [has_errors, set_has_errors] = useState(false);
  const default_value = "";
  const [resource, set_resource] = useState(undefined as Resource);
  const bsm_ref = useRef<BottomSheetModal>(null);
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
                <></>
              )
            }
            borderColor={theme.border}
          />
        </Row>
        {resource !== undefined ? (
          <Column
            my={"4"}
            borderColor={theme.border}
            borderWidth={"1"}
            borderRadius={"xs"}
          >
            <Row>
              {arrow(() => {
                switch (resource.type) {
                  case "png":
                  case "jpg":
                  case "jpeg":
                  case "bmp":
                  case "gif":
                  case "webp":
                  case "image": {
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
                  case "m4v":
                  case "mp4":
                  case "mov":
                  case "3gp":
                  case "mp3": {
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
                                  <iframe
                                  width="100%" height="100%"
                                  title="YouTube video player"
                                  src="https://www.youtube-nocookie.com/embed/${resource.id}"
                                  ></iframe>
                              </body>
                              </html>`,
                          }}
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
                <Text bold fontSize={"md"}>
                  Link{" "}
                </Text>
                <Feather name="link" size={16} color={theme.text} />
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
                  <Text bold>Link Resource</Text>
                  <Row space={"2"}>
                    <Pressable
                      onPress={() => {}}
                      backgroundColor={bs_theme.primary}
                      borderRadius={"xs"}
                      px={"2"}
                      py={"0.5"}
                    >
                      <Text bold>Confirm</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => bsm_ref.current?.close()}
                      borderColor={bs_theme.primary}
                      borderWidth={"1"}
                      borderRadius={"xs"}
                      px={"2"}
                      py={"0.5"}
                    >
                      <Text>Close</Text>
                    </Pressable>
                  </Row>
                </Row>
                {arrow(() => {
                  const struct = get_struct("Test");
                  if (unwrap(struct)) {
                    // const [state1, dispatch1, jsx1] = useComponent({
                    //   struct: struct.value,
                    //   id: new Decimal(-1),
                    //   active: true,
                    //   created_at: new Date(),
                    //   updated_at: new Date(),
                    //   values: HashSet.of(),
                    //   init_values: HashSet.of(),
                    //   extensions: {},
                    //   labels: [
                    //     ["STR", [[], "str"]],
                    //     ["LSTR", [[], "lstr"]],
                    //     ["CLOB", [[], "clob"]],
                    //     ["U32", [[], "u32"]],
                    //     ["I32", [[], "i32"]],
                    //     ["U64", [[], "u64"]],
                    //     ["I64", [[], "i64"]],
                    //     ["UDOUBLE", [[], "udouble"]],
                    //     ["IDOUBLE", [[], "idouble"]],
                    //     ["UDECIMAL", [[], "udecimal"]],
                    //     ["IDECIMAL", [[], "idecimal"]],
                    //     ["BOOL", [[], "bool"]],
                    //     ["DATE", [[], "date"]],
                    //     ["TIME", [[], "time"]],
                    //     ["TIMESTAMP", [[], "timestamp"]],
                    //     ["USER", [[], "user"]],
                    //     ["USER NICKNAME", [["user"], "nickname"]],
                    //   ],
                    //   higher_structs: [],
                    //   user_paths: [[[], "user"]],
                    //   borrows: [],
                    //   create: views.Test["Default"].create,
                    //   update: views.Test["Default"].update,
                    //   show: views.Test["Default"].show,
                    // });
                  }
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