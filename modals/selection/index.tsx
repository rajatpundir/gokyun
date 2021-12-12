import React from "react";
import { Draft } from "immer";
import { useEffect } from "react";
import { FlatList } from "react-native-gesture-handler";
import { useImmerReducer } from "use-immer";
import { NavigatorProps as RootNavigatorProps } from "../../App";
import { Filter, get_variables, PathFilter } from "../../main/utils/db";
import { Struct, Variable } from "../../main/utils/variable";
import { View, Text } from "../../main/themed";
import Decimal from "decimal.js";
import { Switch } from "react-native";
import { unwrap } from "../../main/utils/prelude";

type State = {
  struct: Struct;
  active: boolean;
  level: Decimal | undefined;
  filters: ReadonlyArray<Filter>;
  limit_offset: [Decimal, Decimal] | undefined;
  variables: Array<Variable>;
};

type Action = ["variables", Array<Variable>];

export function reducer(state: Draft<State>, action: Action) {
  switch (action[0]) {
    case "variables": {
      state.variables = action[1] as any;
      break;
    }
    default: {
      const _exhaustiveCheck: never = action[0];
      return _exhaustiveCheck;
    }
  }
}

// First, display what is there on top of component
// Render filter component on top instead of using bottom sheet from the start
// Whats passed from above for filtering is absolute
// Modification to filters should only be able to search in a subset
// Apart from original filters, store modified filters separately for SQLLite and for backend

export default function Component(props: RootNavigatorProps<"SelectionModal">) {
  const [state, dispatch] = useImmerReducer<State, Action>(reducer, {
    struct: props.route.params.struct,
    active: props.route.params.active,
    level: props.route.params.level,
    filters: props.route.params.filters,
    limit_offset: props.route.params.limit_offset,
    variables: [],
  });
  useEffect(() => {
    props.navigation.setOptions({ headerTitle: props.route.params.title });
    const get_vars = async () => {
      const variables = await get_variables(
        state.struct,
        state.active,
        state.level,
        state.filters,
        state.limit_offset
      );
      if (unwrap(variables)) {
        dispatch(["variables", variables.value]);
      }
    };
    get_vars();
  }, [
    state.struct,
    state.active,
    state.level,
    state.filters,
    state.limit_offset,
  ]);
  return (
    <View style={{ flex: 1 }}>
      <View>
        <View>
          <Text>Active</Text>
          <Switch value={state.active} />
        </View>
        <View>
          <Text>Level</Text>
          <Text>{state.level ? state.level.toString() : "0"}</Text>
        </View>
      </View>
      <FlatList
        data={state.variables}
        renderItem={(list_item) => (
          <props.route.params.render_list_element
            selected={props.route.params.selected}
            variable={list_item.item}
            disptach_values={props.route.params.disptach_values}
          />
        )}
        keyExtractor={(list_item: Variable) => list_item.id.valueOf()}
      />
    </View>
  );
}
