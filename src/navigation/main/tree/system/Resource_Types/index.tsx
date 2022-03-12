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
  Entrypoint,
} from "../../../../../lib";
import { get_struct } from "../../../../../schema";
import { views } from "../../../../../views";

export default function Component(
  props: ParentNavigatorProps<"Resource_Types">
) {
  const struct = get_struct("Resource_Type");
  const entrypoints: Array<Entrypoint> = [];
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
            [
              ["type", [[], "type"]],
              ["subtype", [[], "subtype"]],
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
