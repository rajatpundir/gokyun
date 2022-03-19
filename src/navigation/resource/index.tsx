import React from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";

import { NavigatorProps as RootNavigatorProps } from "../main";
import { get_struct } from "../../schema";
import { views } from "../../views";
import { useComponent, useTheme } from "../../lib";

export default function Component(
  props: RootNavigatorProps<"Resource">
): JSX.Element {
  const theme = useTheme();
  const struct = get_struct("Test");
  const [state, dispatch, jsx] = useComponent({
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
      ["type", [["resource_type"], "type"]],
      ["subtype", [["resource_type"], "subtype"]],
      ["url", [[], "url"]],
      ["tag_count", [[], "tag_count"]],
      ["owner", [[], "owner"]],
    ],
    higher_structs: [],
    entrypoints: [[[], "user"]],
    create: views.Private_Resource["Modal"].create,
    update: views.Private_Resource["Modal"].update,
    show: views.Private_Resource["Modal"].show,
  });
  return jsx;
}
