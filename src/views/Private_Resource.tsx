import React, { useEffect, useState } from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { Column, Row, Text, Image } from "native-base";
import {
  ComponentViews,
  arrow,
  useTheme,
  Field,
  List,
  get_filter_paths,
  Identity,
  OrFilter,
  OtherComponent,
  Entrypoint,
  apply,
  FilterPath,
  compare_paths,
  get_path_string,
  get_resource,
  Resource,
} from "../lib";
import { get_struct } from "../schema";
import Private_Resource_Tag from "./Private_Resource_Tag";
import WebView from "react-native-webview";
import VideoPlayer from "expo-video-player";

const views = { Private_Resource_Tag };

const common_default_component: ComponentViews[string]["show"] = (props) => {
  const theme = useTheme();
  const [resource, set_resource] = useState(undefined as Resource);
  useEffect(() => {
    arrow(async () => {
      const url = props.state.values.findAny((x) =>
        compare_paths(get_path_string(x), [[], "url"])
      );
      const mime_type = props.state.values.findAny((x) =>
        compare_paths(get_path_string(x), [["resource_type"], "type"])
      );
      const mime_subtype = props.state.values.findAny((x) =>
        compare_paths(get_path_string(x), [["resource_type"], "subtype"])
      );
      if (url.isSome() && mime_type.isSome() && mime_subtype.isSome()) {
        const url_value = url.get().path[1][1];
        const mime_type_value = mime_type.get().path[1][1];
        const mime_subtype_value = mime_subtype.get().path[1][1];
        if (
          url_value.type === "str" &&
          mime_type_value.type === "str" &&
          mime_subtype_value.type === "str"
        ) {
          set_resource(await get_resource(new URL(url_value.value)));
          console.log(
            url_value.value,
            mime_type_value.value,
            mime_subtype_value.value
          );
        }
      }
    });
  }, [props.state.values]);
  return (
    <Column
      p={"2"}
      m={"1"}
      borderWidth={"1"}
      borderRadius={"md"}
      borderColor={theme.border}
      backgroundColor={arrow(() => {
        if (props.selected) {
          return theme.background;
        }
        return theme.background;
      })}
    >
      <Text>
        {"Tag count: "}
        <Field {...props} path={[[], "tag_count"]} />
      </Text>
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
        </Column>
      ) : (
        <></>
      )}
      {arrow(() => {
        const struct = get_struct("Private_Resource_Tag");
        const entrypoints: Array<Entrypoint> = [
          [["private_resource"], "owner"],
        ];
        return (
          <List
            selected={new Decimal(-1)}
            struct={struct}
            filters={[
              new OrFilter(
                0,
                [false, undefined],
                [false, undefined],
                [false, undefined],
                get_filter_paths(
                  struct,
                  [
                    ["tag", [[], "tag"]],
                    ["name", [["tag"], "name"]],
                  ],
                  entrypoints
                ).add(
                  apply(
                    new FilterPath(
                      "private_resource",
                      [[], "private_resource"],
                      [
                        "other",
                        ["==", props.state.id as Decimal],
                        get_struct("Private_Resource"),
                      ],
                      undefined
                    ),
                    (it) => {
                      it.active = true;
                      return it;
                    }
                  )
                )
              ),
              HashSet.of(),
            ]}
            limit={new Decimal(10)}
            options={[
              "list",
              {
                entrypoints: entrypoints,
                RenderElement: [
                  (props) => (
                    <OtherComponent
                      {...props}
                      view={views.Private_Resource_Tag["Default"]}
                    />
                  ),
                  {},
                ],
              },
            ]}
            RenderVariant={(props) => <Identity {...props} />}
          />
        );
      })}
    </Column>
  );
};

export default {
  Default: {
    create: () => <></>,
    update: common_default_component,
    show: common_default_component,
  },
} as ComponentViews;
