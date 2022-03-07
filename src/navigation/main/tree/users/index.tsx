import * as React from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { NavigatorProps as ParentNavigatorProps } from "..";
import { get_struct } from "../../../../schema";
import { views } from "../../../../views";
import {
  OrFilter,
  get_filter_paths,
  OtherComponent,
  SearchWrapper,
  List,
  PathString,
} from "../../../../lib";

export default function Component(
  props: ParentNavigatorProps<"Users">
): JSX.Element {
  const struct = get_struct("User");
  const user_paths: Array<PathString> = [];
  const borrows: Array<string> = [];
  return (
    <>
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
                ["Nickname", [[], "nickname"]],
                ["Knows english", [[], "knows_english"]],
                ["Mobile", [[], "mobile"]],
                ["Product Count", [[], "product_count"]],
              ],
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
