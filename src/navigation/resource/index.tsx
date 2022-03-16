import React from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";

import { NavigatorProps as RootNavigatorProps } from "../main";
import { get_struct } from "../../schema";
import { views } from "../../views";
import { Text } from "native-base";
import { useComponent, useTheme } from "../../lib";

export default function Component(
  props: RootNavigatorProps<"Resource">
): JSX.Element {
  const theme = useTheme();
  const struct = get_struct("Test");
  const [state, dispatch, jsx1] = useComponent({
    struct: struct,
    id: new Decimal(props.route.params.id),
    created_at: new Date(),
    updated_at: new Date(),
    values: props.route.params.values
      ? props.route.params.values
      : HashSet.of(),
    init_values: HashSet.of(),
    extensions: {},
    labels: [
      ["STR", [[], "str"]],
      ["LSTR", [[], "lstr"]],
      ["CLOB", [[], "clob"]],
      ["U32", [[], "u32"]],
      ["I32", [[], "i32"]],
      ["U64", [[], "u64"]],
      ["I64", [[], "i64"]],
      ["UDOUBLE", [[], "udouble"]],
      ["IDOUBLE", [[], "idouble"]],
      ["UDECIMAL", [[], "udecimal"]],
      ["IDECIMAL", [[], "idecimal"]],
      ["BOOL", [[], "bool"]],
      ["DATE", [[], "date"]],
      ["TIME", [[], "time"]],
      ["TIMESTAMP", [[], "timestamp"]],
      ["USER", [[], "user"]],
      ["USER NICKNAME", [["user"], "nickname"]],
    ],
    higher_structs: [],
    entrypoints: [[[], "user"]],
    create: views.Test["Default"].create,
    update: views.Test["Default"].update,
    show: views.Test["Default"].show,
  });

  return (
    <>
      <Text>ABC</Text>
    </>
  );
}
