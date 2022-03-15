import * as React from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";

import { NavigatorProps as ParentNavigatorProps } from "..";
import {
  OrFilter,
  get_filter_paths,
  OtherComponent,
  Identity,
  List,
  Entrypoint,
  useTheme,
} from "../../../lib";
import { get_struct } from "../../../schema";
import { views } from "../../../views";
import { Pressable, Row, Text } from "native-base";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function Component(props: ParentNavigatorProps<"Personal">) {
  const theme = useTheme();
  const struct = get_struct("Private_Resource");
  const entrypoints: Array<Entrypoint> = [[[], "owner"]];
  const [resource_type, set_resource_type] = useState(
    "image" as "image" | "video" | "pdf" | "youtube"
  );
  return (
    <>
      <Row alignContent={"center"} mx={"1"} my={"2"}>
        <Text fontSize={"md"} color={theme.label}>
          Filter
        </Text>
        <Row alignContent={"center"} space={"2"} mx={"3"}>
          <Pressable
            flexDirection={"row"}
            alignContent={"center"}
            onPress={() => set_resource_type("image")}
          >
            {resource_type === "image" ? (
              <Ionicons
                name="radio-button-on"
                size={18}
                color={theme.primary}
                style={{ marginTop: 1 }}
              />
            ) : (
              <Ionicons
                name="radio-button-off"
                size={18}
                color={theme.primary}
                style={{ marginTop: 1 }}
              />
            )}
            <Text>Images</Text>
          </Pressable>
          <Pressable
            flexDirection={"row"}
            onPress={() => set_resource_type("video")}
          >
            {resource_type === "video" ? (
              <Ionicons
                name="radio-button-on"
                size={18}
                color={theme.primary}
                style={{ marginTop: 1 }}
              />
            ) : (
              <Ionicons
                name="radio-button-off"
                size={18}
                color={theme.primary}
                style={{ marginTop: 1 }}
              />
            )}
            <Text>Videos</Text>
          </Pressable>
          <Pressable
            flexDirection={"row"}
            onPress={() => set_resource_type("pdf")}
          >
            {resource_type === "pdf" ? (
              <Ionicons
                name="radio-button-on"
                size={18}
                color={theme.primary}
                style={{ marginTop: 1 }}
              />
            ) : (
              <Ionicons
                name="radio-button-off"
                size={18}
                color={theme.primary}
                style={{ marginTop: 1 }}
              />
            )}
            <Text>Docs</Text>
          </Pressable>
          <Pressable
            flexDirection={"row"}
            onPress={() => set_resource_type("youtube")}
          >
            {resource_type === "youtube" ? (
              <Ionicons
                name="radio-button-on"
                size={18}
                color={theme.primary}
                style={{ marginTop: 1 }}
              />
            ) : (
              <Ionicons
                name="radio-button-off"
                size={18}
                color={theme.primary}
                style={{ marginTop: 1 }}
              />
            )}
            <Text>YouTube</Text>
          </Pressable>
        </Row>
      </Row>
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
                ["type", [["resource_type"], "type"]],
                ["subtype", [["resource_type"], "subtype"]],
                ["url", [[], "url"]],
                ["tag_count", [[], "tag_count"]],
                ["owner", [[], "owner"]],
              ],
              entrypoints
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
