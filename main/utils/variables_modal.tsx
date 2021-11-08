import Decimal from "decimal.js";
import { Draft, Immutable } from "immer";
import { useImmerReducer } from "use-immer";
import { HashSet } from "prelude-ts";
import * as React from "react";
import { Text, FlatList } from "react-native";

import { NavigatorProps as RootNavigatorProps } from "../../App";
import { get_variables } from "./sqlite";
import { Struct, Path, StrongEnum } from "./variable";
import { apply, unwrap, Ok } from "./prelude";

export type State = Immutable<{
  limit: Decimal;
  offset: Decimal;
  filters: ReadonlyArray<ReadonlyArray<Path>>;
  variables: ReadonlyArray<{
    struct: Struct;
    id: Decimal;
    paths: HashSet<Path>;
  }>;
}>;

export type Action =
  | ["limit", Decimal]
  | ["offset", Decimal]
  | ["filters", Array<Array<Path>>]
  | [
      "variables",
      Array<{
        struct: Struct;
        id: Decimal;
        paths: HashSet<Path>;
      }>
    ];

export function reducer(state: Draft<State>, action: Action) {
  switch (action[0]) {
    case "limit": {
      state.limit = action[1];
      break;
    }
    case "offset": {
      state.offset = action[1];
      break;
    }
    case "filters": {
      state.filters = action[1];
      break;
    }
    case "variables": {
      state.variables = action[1] as any;
      break;
    }
    default: {
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
    }
  }
}

export function VariablesModal(
  props: RootNavigatorProps<"VariablesModal">
): JSX.Element {
  const init: State = {
    limit: new Decimal(10),
    offset: new Decimal(0),
    filters: [],
    variables: [],
  };
  const [state, dispatch] = useImmerReducer<State, Action>(reducer, init);
  const variables = get_variables(
    props.route.params.struct,
    props.route.params.permissions,
    props.route.params.requested_paths,
    state.filters,
    state.limit,
    state.offset
  );
  return (
    <>
      <Text>Show button to open Filter Action Sheet</Text>
      <FlatList
        data={variables}
        renderItem={(list_item) => {
          return props.route.params.render_item(
            list_item.item.struct,
            list_item.item.id,
            list_item.item.paths,
            props.route.params.selected,
            props.route.params.set_selected
          );
        }}
        keyExtractor={(list_item) => list_item.id.toString()}
      />
    </>
  );
}
