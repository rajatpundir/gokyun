import * as React from "react";
import { NavigatorProps as ParentNavigatorProps } from "..";
import { List } from "../../../../lib/list";
import { unwrap } from "../../../../lib/prelude";
import { get_struct } from "../../../../schema/struct";
import { OrFilter } from "../../../../lib/db";
import { get_filter_paths } from "../../../../lib/commons";
import { HashSet } from "prelude-ts";
import Decimal from "decimal.js";
import { OtherComponent, SearchWrapper } from "../../../../lib/component";
import { views } from "../../../../views";

export default function Component(
  props: ParentNavigatorProps<"Users">
): JSX.Element {
  const struct = get_struct("User");
  if (unwrap(struct)) {
    return (
      <>
        <List
          selected={new Decimal(-1)}
          struct={struct.value}
          level={undefined}
          filters={[
            new OrFilter(
              0,
              [false, undefined],
              [false, undefined],
              [false, undefined],
              get_filter_paths(
                struct.value,
                [
                  ["Nickname", [[], "nickname"]],
                  ["Knows english", [[], "knows_english"]],
                  ["Mobile", [[], "mobile"]],
                  ["Product Count", [[], "product_count"]],
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
                  <OtherComponent {...props} view={views.User["Default"]} />
                ),
                {
                  ABC: (props) => (
                    <OtherComponent {...props} view={views.User["Default"]} />
                  ),
                  DEF: (props) => (
                    <OtherComponent {...props} view={views.User["Default"]} />
                  ),
                },
              ],
            },
          ]}
          RenderVariant={(props) => (
            <SearchWrapper
              {...props}
              placeholder="Nickname"
              path={[[], "nickname"]}
              is_views_editable
              is_sorting_editable
              is_filters_editable
            />
          )}
        />
      </>
    );
  }
  return <></>;
}
