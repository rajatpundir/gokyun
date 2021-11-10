import React, { useEffect, useCallback, useMemo, useRef } from "react";
import { Draft, Immutable } from "immer";
import { useImmerReducer } from "use-immer";
import { HashSet } from "prelude-ts";
import Decimal from "decimal.js";
import { Text, FlatList, TextInput, View, StyleSheet } from "react-native";

import BottomSheet from "@gorhom/bottom-sheet";

import { NavigatorProps as RootNavigatorProps } from "../../App";
import { get_variables } from "./sqlite";
import { Struct, Path, PathFilter } from "./variable";

export type State = Immutable<{
  filters: ReadonlyArray<[boolean, HashSet<PathFilter>]>;
  limit: Decimal;
  offset: Decimal;
  variables: ReadonlyArray<{
    struct: Struct;
    id: Decimal;
    paths: HashSet<Path>;
  }>;
}>;

export type Action =
  | ["filters", Array<[boolean, HashSet<PathFilter>]>]
  | ["limit", Decimal]
  | ["offset", Decimal]
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
    case "filters": {
      state.filters = action[1];
      break;
    }
    case "limit": {
      state.limit = action[1];
      break;
    }
    case "offset": {
      state.offset = action[1];
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
    filters: props.route.params.filters,
    limit: props.route.params.limit,
    offset: props.route.params.offset,
    variables: [],
  };
  const [state, dispatch] = useImmerReducer<State, Action>(reducer, init);
  useEffect(() => {
    const update_variables = async () => {
      const variables = await get_variables(
        props.route.params.struct,
        props.route.params.permissions,
        props.route.params.requested_paths,
        state.filters,
        state.limit,
        state.offset
      );
      dispatch(["variables", variables]);
    };
    update_variables();
  }, [state.filters, state.limit, state.offset]);

  // ref
  const bottomSheetRef = useRef<BottomSheet>(null);

  // variables
  const snapPoints = useMemo(() => ["25%", "50%"], []);

  // callbacks
  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  return (
    <>
      <Text>Show button to open Filter Action Sheet</Text>
      <FlatList
        data={state.variables}
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
      <View>
        <Text>Limit</Text>
        <TextInput
          value={state.limit.toString()}
          onChangeText={(x) => dispatch(["limit", new Decimal(x).truncated()])}
        />
        <Text>Offset</Text>
        <TextInput
          value={state.offset.toString()}
          onChangeText={(x) => dispatch(["offset", new Decimal(x).truncated()])}
        />
      </View>
    </>
  );
}
