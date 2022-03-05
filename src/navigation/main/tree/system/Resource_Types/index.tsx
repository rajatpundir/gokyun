import * as React from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";

import { NavigatorProps as ParentNavigatorProps } from "..";
import {
  OrFilter,
  get_filter_paths,
  OtherComponent,
  List,
  Identity,
} from "../../../../../lib";
import { get_struct } from "../../../../../schema";
import { views } from "../../../../../views";

export default function Component(
  props: ParentNavigatorProps<"Resource_Types">
) {
  const struct = get_struct("Resource_Type");
  return (
    <List
      selected={new Decimal(-1)}
      struct={struct}
      level={undefined}
      filters={[
        new OrFilter(
          0,
          [false, undefined],
          [false, undefined],
          [false, undefined],
          get_filter_paths(
            struct,
            [
              ["type", [[], "type"]],
              ["subtype", [[], "subtype"]],
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
          user_paths: [[[], "user"]],
          borrows: [],
          RenderElement: [
            (props) => (
              <OtherComponent
                {...props}
                view={views.Resource_Type["Default"]}
              />
            ),
            {},
          ],
        },
      ]}
      RenderVariant={(props) => <Identity {...props} />}
    />
  );
}
