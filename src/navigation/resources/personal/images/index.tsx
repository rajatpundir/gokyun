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
} from "../../../../lib";
import { get_struct } from "../../../../schema";
import { views } from "../../../../views";

export default function Component(props: ParentNavigatorProps<"Images">) {
  const struct = get_struct("Private_Resource");
  const entrypoints: Array<Entrypoint> = [[[], "owner"]];
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
          get_filter_paths(struct, [["url", [[], "url"]]], entrypoints)
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
  );
}
