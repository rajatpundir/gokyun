import { Draft } from "immer";
import { useEffect } from "react";
import { FlatList } from "react-native-gesture-handler";
import { useImmerReducer } from "use-immer";
import { NavigatorProps as RootNavigatorProps } from "../../App";
import { get_variables } from "../../main/utils/db";
import { unwrap } from "../../main/utils/prelude";
import { Variable } from "../../main/utils/variable";

type State = {
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

export default function Component(props: RootNavigatorProps<"SelectionModal">) {
  const [state, dispatch] = useImmerReducer<State, Action>(reducer, {
    variables: [],
  });
  useEffect(() => {
    const get_vars = async () => {
      const variables = await get_variables(
        props.route.params.struct,
        props.route.params.variable_filters,
        props.route.params.path_filters,
        props.route.params.limit_offset
      );
      if (unwrap(variables)) {
        dispatch(["variables", variables.value]);
      }
    };
  }, [
    props.route.params.struct,
    props.route.params.variable_filters,
    props.route.params.path_filters,
    props.route.params.limit_offset,
  ]);
  return (
    <FlatList
      data={state.variables}
      renderItem={(list_item) =>
        props.route.params.render_list_element(
          list_item.item,
          props.route.params.disptach_values
        )
      }
      keyExtractor={(list_item: Variable) => list_item.id.valueOf()}
    />
  );
}
