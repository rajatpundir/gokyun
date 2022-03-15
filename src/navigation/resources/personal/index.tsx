import React, { useEffect, useState } from "react";
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
import { Draft } from "immer";
import { Struct } from "../../../lib/variable";
import { useImmerReducer } from "use-immer";

type State = {
  resource_type: "image" | "video" | "pdf" | "youtube";
  struct: Struct;
  entrypoints: ReadonlyArray<Entrypoint>;
  init_filter: OrFilter;
};

type Action = ["resource_type", State["resource_type"]];

function reducer(state: Draft<State>, action: Action) {
  switch (action[0]) {
    case "resource_type": {
      state.resource_type = action[1];
      state.init_filter = new OrFilter(
        0,
        [false, undefined],
        [false, undefined],
        [false, undefined],
        apply(
          get_filter_paths(
            state.struct as Struct,
            [
              ["url", [[], "url"]],
              ["tag_count", [[], "tag_count"]],
              ["owner", [[], "owner"]],
            ],
            state.entrypoints
          ),
          (it) => {
            switch (state.resource_type) {
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
                const _exhaustiveCheck: never = state.resource_type;
                return _exhaustiveCheck;
              }
            }
          }
        )
      );
      break;
    }
    default: {
      const _exhaustiveCheck: never = action[0];
      return _exhaustiveCheck;
    }
  }
}

export default function Component(props: ParentNavigatorProps<"Personal">) {
  const theme = useTheme();
  const struct = get_struct("Private_Resource");
  const entrypoints: Array<Entrypoint> = [[[], "owner"]];
  const [state, dispatch] = useImmerReducer<State, Action>(reducer, {
    resource_type: "image",
    struct: struct,
    entrypoints: entrypoints,
    init_filter: new OrFilter(
      0,
      [false, undefined],
      [false, undefined],
      [false, undefined],
      get_filter_paths(
        struct as Struct,
        [
          ["url", [[], "url"]],
          ["tag_count", [[], "tag_count"]],
          ["owner", [[], "owner"]],
        ],
        entrypoints
      )
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
        })
    ),
  });

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
                  switch (state.resource_type) {
                    case "image":
                      return "Images";
                    case "video":
                      return "Videos";
                    case "pdf":
                      return "PDF";
                    case "youtube":
                      return "YouTube";
                    default: {
                      const _exhaustiveCheck: never = state.resource_type;
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
          <Menu.Item onPress={() => dispatch(["resource_type", "image"])}>
            <Text color={theme.text}>Images</Text>
          </Menu.Item>
          <Menu.Item onPress={() => dispatch(["resource_type", "video"])}>
            <Text color={theme.text}>Videos</Text>
          </Menu.Item>
          <Menu.Item onPress={() => dispatch(["resource_type", "pdf"])}>
            <Text color={theme.text}>PDF</Text>
          </Menu.Item>
          <Menu.Item onPress={() => dispatch(["resource_type", "youtube"])}>
            <Text color={theme.text}>YouTube</Text>
          </Menu.Item>
        </Menu>
      </Row>
      <List
        selected={new Decimal(-1)}
        struct={struct}
        init_filter={state.init_filter}
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
