import * as React from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";

import { NavigatorProps as ParentNavigatorProps } from "..";
import { get_struct } from "../../../../../schema";
import { views } from "../../../../../views";
import { Fab, Icon } from "native-base";
import { AntDesign } from "@expo/vector-icons";
import {
  OrFilter,
  get_filter_paths,
  List,
  OtherComponent,
  SearchWrapper,
  Entrypoint,
} from "../../../../../lib";

export default function Component(props: ParentNavigatorProps<"Tests">) {
  const struct = get_struct("Test");
  const entrypoints: Array<Entrypoint> = [[[], "user"]];
  return (
    <>
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
                <OtherComponent {...props} view={views.Test["Card"]} />
              ),
              {},
            ],
          },
        ]}
        searchable={true}
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
