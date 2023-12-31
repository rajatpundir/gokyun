import React, { useState } from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { Input, Menu, Pressable, Row, Text } from "native-base";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  OrFilter,
  get_filter_paths,
  OtherComponent,
  Identity,
  List,
  Entrypoint,
  useTheme,
  arrow,
  apply,
  FilterPath,
} from "../../../lib";
import { get_struct } from "../../../schema";
import { views } from "../../../views";
import { NavigatorProps as ParentNavigatorProps } from "..";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";

// TODO. Launch Resource modal on click to edit resource tags, delete or convert it

// TODO. Inside Resource modal, click on resource will open specific resource in its own modal

// TODO. Generate tags via input, search via generated tags

// TODO. Integrate authentication via google

// TODO. Integrate google drive

export default function Component(props: ParentNavigatorProps<"Personal">) {
  const theme = useTheme();
  const struct = get_struct("Private_Resource");
  const entrypoints: Array<Entrypoint> = [[[], "owner"]];
  const [resource_type, set_resource_type] = useState(
    "image" as "image" | "video" | "pdf" | "youtube"
  );
  return (
    <>
      <Row
        justifyContent={"space-between"}
        space={"1"}
        mx={"2"}
        mt={"3"}
        mb={"1"}
      >
        <Input
          flex={"1"}
          size={"md"}
          maxLength={255}
          placeholder={"Search"}
          value={""}
          onChangeText={() => {}}
          color={theme.text}
          borderColor={theme.border}
          placeholderTextColor={theme.placeholder}
        />
        <Menu
          mx={"2"}
          shouldOverlapWithTrigger={true}
          backgroundColor={theme.background}
          borderColor={theme.border}
          trigger={(menu_props) => (
            <Pressable
              {...menu_props}
              flexDirection={"row"}
              alignItems={"center"}
              borderColor={theme.border}
              borderWidth={"1"}
              borderRadius={"sm"}
              px={"1.5"}
            >
              <Text color={theme.text}>
                {arrow(() => {
                  switch (resource_type) {
                    case "image":
                      return "Images";
                    case "video":
                      return "Videos";
                    case "pdf":
                      return "PDF";
                    case "youtube":
                      return "YouTube";
                    default: {
                      const _exhaustiveCheck: never = resource_type;
                      return _exhaustiveCheck;
                    }
                  }
                })}
              </Text>
              <MaterialCommunityIcons
                name="menu-down"
                size={20}
                color={theme.text}
              />
            </Pressable>
          )}
        >
          <Menu.Item onPress={() => set_resource_type("image")}>
            <Text color={theme.text}>Images</Text>
          </Menu.Item>
          <Menu.Item onPress={() => set_resource_type("video")}>
            <Text color={theme.text}>Videos</Text>
          </Menu.Item>
          <Menu.Item onPress={() => set_resource_type("pdf")}>
            <Text color={theme.text}>PDF</Text>
          </Menu.Item>
          <Menu.Item onPress={() => set_resource_type("youtube")}>
            <Text color={theme.text}>YouTube</Text>
          </Menu.Item>
        </Menu>
      </Row>
      <List
        selected={new Decimal(-1)}
        struct={struct}
        init_filter={
          new OrFilter(
            0,
            [false, undefined],
            [false, undefined],
            [false, undefined],
            apply(
              get_filter_paths(
                struct,
                [
                  ["url", [[], "url"]],
                  ["tag_count", [[], "tag_count"]],
                  ["owner", [[], "owner"]],
                ],
                entrypoints
              ),
              (it) => {
                switch (resource_type) {
                  case "image": {
                    return it
                      .addAll([
                        new FilterPath(
                          "type",
                          [["resource_type"], "type"],
                          ["str", ["==", "image"]],
                          undefined
                        ),
                        new FilterPath(
                          "subtype",
                          [["resource_type"], "subtype"],
                          ["str", undefined],
                          undefined
                        ),
                      ])
                      .map((x) => {
                        x.active = true;
                        return x;
                      });
                  }
                  case "video": {
                    return it
                      .addAll([
                        new FilterPath(
                          "type",
                          [["resource_type"], "type"],
                          ["str", ["==", "video"]],
                          undefined
                        ),
                        new FilterPath(
                          "subtype",
                          [["resource_type"], "subtype"],
                          ["str", undefined],
                          undefined
                        ),
                      ])
                      .map((x) => {
                        x.active = true;
                        return x;
                      });
                  }
                  case "pdf": {
                    return it
                      .addAll([
                        new FilterPath(
                          "type",
                          [["resource_type"], "type"],
                          ["str", ["==", "application"]],
                          undefined
                        ),
                        new FilterPath(
                          "subtype",
                          [["resource_type"], "subtype"],
                          ["str", ["==", "pdf"]],
                          undefined
                        ),
                      ])
                      .map((x) => {
                        x.active = true;
                        return x;
                      });
                  }
                  case "youtube": {
                    return it
                      .addAll([
                        new FilterPath(
                          "type",
                          [["resource_type"], "type"],
                          ["str", ["==", "text"]],
                          undefined
                        ),
                        new FilterPath(
                          "subtype",
                          [["resource_type"], "subtype"],
                          ["str", ["==", "youtube"]],
                          undefined
                        ),
                      ])
                      .map((x) => {
                        x.active = true;
                        return x;
                      });
                  }
                  default: {
                    const _exhaustiveCheck: never = resource_type;
                    return _exhaustiveCheck;
                  }
                }
              }
            )
          )
        }
        filters={HashSet.of()}
        limit={new Decimal(10)}
        options={[
          "list",
          {
            entrypoints: entrypoints,
            RenderElement: [
              (props) => (
                <OtherComponent
                  {...props}
                  view={views.Private_Resource["Default"]}
                />
              ),
              {},
            ],
          },
        ]}
        RenderVariant={(props) => <Identity {...props} />}
      />
    </>
  );
}
