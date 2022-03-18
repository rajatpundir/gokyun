import React, { useEffect, useState } from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { Column, Pressable, Row, Text } from "native-base";
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
  ResourceComponent,
} from "../lib";
import { get_struct } from "../schema";
import Private_Resource_Tag from "./Private_Resource_Tag";
import { RenderWrappedItemProps } from "../lib/list_variants";
import { useNavigation } from "@react-navigation/native";
import { dimensions } from "../lib/commons";

const views = { Private_Resource_Tag };

export default {
  Default: {
    create: () => <></>,
    update: () => <></>,
    show: (props) => {
      const navigation = useNavigation();
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
            }
          }
        });
      }, [props.state.values]);
      return (
        <Column
          my={"2"}
          backgroundColor={arrow(() => {
            if (props.selected) {
              return theme.background;
            }
            return theme.background;
          })}
        >
          <Text>
            {"Tags: "}
            <Field {...props} path={[[], "tag_count"]} />
          </Text>
          {resource !== undefined ? (
            <Column>
              <Row>
                <ResourceComponent resource={resource} />
              </Row>
              <Column p={"2"}>
                {arrow(() => {
                  const struct = get_struct("Private_Resource_Tag");
                  const entrypoints: Array<Entrypoint> = [
                    [["private_resource"], "owner"],
                  ];
                  return (
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
                        )
                      }
                      filters={HashSet.of()}
                      limit={new Decimal(10)}
                      options={[
                        "row",
                        {
                          entrypoints: entrypoints,
                          RenderElement: (props: RenderWrappedItemProps) => (
                            <OtherComponent
                              {...props}
                              view={views.Private_Resource_Tag["Default"]}
                            />
                          ),
                        },
                      ]}
                      RenderVariant={(props) => <Identity {...props} />}
                    />
                  );
                })}
              </Column>
            </Column>
          ) : (
            <></>
          )}
        </Column>
      );
    },
  },
  Card: {
    create: () => <></>,
    update: () => <></>,
    show: (props) => {
      const navigation = useNavigation();
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
            }
          }
        });
      }, [props.state.values]);
      return (
        <>
          {resource !== undefined ? (
            <Pressable
              onPress={props.on_select}
              height={100}
              m={"0.5"}
              borderColor={arrow(() => {
                if (props.selected) {
                  return theme.primary;
                }
                return theme.border;
              })}
              borderWidth={arrow(() => {
                if (props.selected) {
                  return "2";
                }
                return "1";
              })}
            >
              <ResourceComponent
                resource={resource}
                display={["row", dimensions.width / 3.1]}
              />
            </Pressable>
          ) : (
            <></>
          )}
        </>
      );
    },
  },
} as ComponentViews;
