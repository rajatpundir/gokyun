import React, { useState } from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import {
  Column,
  Input,
  Menu,
  Pressable,
  Row,
  ScrollView,
  Text,
  View,
} from "native-base";
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
  Variable,
} from "../../../lib";
import { get_struct } from "../../../schema";
import { views } from "../../../views";
import { NavigatorProps as ParentNavigatorProps } from "..";

export default function Component(props: ParentNavigatorProps<"Gallery">) {
  const theme = useTheme();
  const struct = get_struct("Private_Resource");
  const entrypoints: Array<Entrypoint> = [[[], "owner"]];
  const [resource_type, set_resource_type] = useState(
    "image" as "image" | "video" | "pdf" | "youtube"
  );
  const [variable, set_variable] = useState(undefined as Variable | undefined);
  return (
    <Column flex={"1"} justifyContent={"space-between"} pb={"2"}>
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
          <Menu.Item
            onPress={() => {
              set_resource_type("image");
              set_variable(undefined);
            }}
          >
            <Text color={theme.text}>Images</Text>
          </Menu.Item>
          <Menu.Item
            onPress={() => {
              set_resource_type("video");
              set_variable(undefined);
            }}
          >
            <Text color={theme.text}>Videos</Text>
          </Menu.Item>
          <Menu.Item
            onPress={() => {
              set_resource_type("pdf");
              set_variable(undefined);
            }}
          >
            <Text color={theme.text}>PDF</Text>
          </Menu.Item>
          <Menu.Item
            onPress={() => {
              set_resource_type("youtube");
              set_variable(undefined);
            }}
          >
            <Text color={theme.text}>YouTube</Text>
          </Menu.Item>
        </Menu>
      </Row>
      <Column flex={"1"} justifyContent={"space-between"}>
        {variable !== undefined ? (
          <ScrollView>
            <OtherComponent
              struct={variable.struct}
              entrypoints={entrypoints}
              variable={
                new Variable(
                  variable.struct,
                  variable.id,
                  variable.created_at,
                  variable.updated_at,
                  variable.paths
                )
              }
              selected={false}
              on_select={() => {}}
              view={views.Private_Resource["Default"]}
            />
          </ScrollView>
        ) : (
          <></>
        )}
        <Row>
          <List
            selected={variable !== undefined ? variable.id : new Decimal(-1)}
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
                horizontal: true,
                entrypoints: entrypoints,
                RenderElement: [
                  (props) => (
                    <OtherComponent
                      {...props}
                      view={views.Private_Resource["Card"]}
                    />
                  ),
                  {},
                ],
              },
            ]}
            RenderVariant={(props) => <Identity {...props} />}
            on_select={(x) => set_variable(x)}
          />
        </Row>
      </Column>
    </Column>
  );
}
