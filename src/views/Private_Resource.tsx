import React from "react";
import { Column, Text } from "native-base";
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
  PathString,
} from "../lib";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { get_struct } from "../schema";
import Private_Resource_Tag from "./Private_Resource_Tag";

const views = { Private_Resource_Tag };

const common_default_component: ComponentViews[string]["show"] = (props) => {
  const theme = useTheme();
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
        {props.state.id.toString()}
        {": "}
        <Field {...props} path={[[], "url"]} />
      </Text>
      {arrow(() => {
        const struct = get_struct("Private_Resource_Tag");
        const user_paths: Array<PathString> = [[[], "private_resource"]];
        const borrows: Array<string> = [];
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
                  [["tag", [[], "tag"]]],
                  user_paths,
                  borrows
                )
              ),
              HashSet.of(),
            ]}
            limit={new Decimal(10)}
            options={[
              "list",
              {
                user_paths: user_paths,
                borrows: borrows,
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
