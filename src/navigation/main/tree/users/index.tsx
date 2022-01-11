import * as React from "react";
import { NavigatorProps as ParentNavigatorProps } from "..";
import { List } from "../../../../lib/utils/list";
import { unwrap } from "../../../../lib/utils/prelude";
import { get_struct } from "../../../../lib/utils/schema";
import { Filter } from "../../../../lib/utils/db";
import { get_filter_paths } from "../../../../lib/utils/commons";
import { HashSet } from "prelude-ts";
import Decimal from "decimal.js";
import { OtherComponent, SearchBar } from "../../../../lib/utils/component";
import { views } from "../../../../views";

// Show a flat list with a bunch of string, a button at top right to open a modal to add new string
// Some mechanism to update and delete this list
// Edit and Show modes to show or edit this list

export default function Component(
  props: ParentNavigatorProps<"Users">
): JSX.Element {
  const struct_name = "User";
  const struct = get_struct(struct_name);
  if (unwrap(struct)) {
    return (
      <>
        <List
          selected={new Decimal(-1)}
          struct={struct.value}
          user_paths={[]}
          borrows={[]}
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
          render_list_element={[
            (props) => (
              <OtherComponent {...props} view={views.User["Default"]} />
            ),
            {},
          ]}
          render_custom_fields={(props) => (
            <SearchBar
              {...props}
              placeholder="Nickname"
              path={[[], "nickname"]}
            />
          )}
          update_parent_values={() => {}}
        />
      </>
    );
  }
  return <></>;
}
