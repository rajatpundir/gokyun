import * as React from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";

import { NavigatorProps as ParentNavigatorProps } from "..";
import { get_filter_paths } from "../../../../../lib/utils/commons";
import {
  OtherComponent,
  SearchWrapper,
} from "../../../../../lib/utils/component";
import { Filter } from "../../../../../lib/utils/db";
import { List } from "../../../../../lib/utils/list";
import { unwrap } from "../../../../../lib/utils/prelude";
import { get_struct } from "../../../../../lib/utils/schema";
import { views } from "../../../../../views";
import { Fab, Icon } from "native-base";
import { AntDesign } from "@expo/vector-icons";

// Show a flat list with a bunch of string, a button at top right to open a modal to add new string
// Some mechanism to update and delete this list
// Edit and Show modes to show or edit this list

export default function Component(props: ParentNavigatorProps<"Tests">) {
  const struct = get_struct("Test");
  if (unwrap(struct)) {
    return (
      <>
        <List
          selected={new Decimal(-1)}
          struct={struct.value}
          active={true}
          level={undefined}
          filters={[
            new Filter(
              0,
              [false, undefined],
              [false, undefined],
              [false, undefined],
              get_filter_paths(
                struct.value,
                [
                  ["STR", [[], "str"]],
                  ["LSTR", [[], "lstr"]],
                  ["CLOB", [[], "clob"]],
                  ["I32", [[], "i32"]],
                  ["U32", [[], "u32"]],
                  ["I64", [[], "i64"]],
                  ["U64", [[], "u64"]],
                  ["IDOUBLE", [[], "idouble"]],
                  ["UDOUBLE", [[], "udouble"]],
                  ["IDECIMAL", [[], "idecimal"]],
                  ["UDECIMAL", [[], "udecimal"]],
                  ["BOOL", [[], "bool"]],
                  ["DATE", [[], "date"]],
                  ["TIME", [[], "time"]],
                  ["TIMESTAMP", [[], "timestamp"]],
                  ["USER", [[], "user"]],
                  ["USER NICKNAME", [["user"], "nickname"]],
                ],
                [],
                []
              )
            ),
            HashSet.of(),
          ]}
          limit={new Decimal(10)}
          options={[
            "list",
            {
              user_paths: [],
              borrows: [],
              RenderElement: [
                (props) => (
                  <OtherComponent {...props} view={views.Test["Card"]} />
                ),
                {},
              ],
            },
          ]}
          RenderVariant={(props) => (
            <SearchWrapper
              {...props}
              placeholder="STR"
              path={[[], "str"]}
              is_sorting_editable
              is_filters_editable
            />
          )}
        />
        <Fab
          onPress={() => props.navigation.navigate("Test", { id: -1 })}
          icon={<Icon color="white" as={<AntDesign name="plus" />} size="sm" />}
          placement="bottom-right"
          size={"md"}
          p={"4"}
          m={"2"}
        />
      </>
    );
  }
  return <></>;
}
