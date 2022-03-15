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
} from "../../../lib";
import { get_struct } from "../../../schema";
import { views } from "../../../views";
import { NavigatorProps as ParentNavigatorProps } from "..";

export default function Component(props: ParentNavigatorProps<"Community">) {
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
            get_filter_paths(
              struct,
              [
                ["type", [["resource_type"], "type"]],
                ["subtype", [["resource_type"], "subtype"]],
                ["url", [[], "url"]],
                ["tag_count", [[], "tag_count"]],
                ["owner", [[], "owner"]],
              ],
              entrypoints
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
