import React from "react";
import { Draft } from "immer";
import { useEffect } from "react";
import { FlatList } from "react-native-gesture-handler";
import { useImmerReducer } from "use-immer";
import { NavigatorProps as RootNavigatorProps } from "../../App";
import { Filter, FilterPath, get_variables } from "../../main/utils/db";
import { Struct, Variable } from "../../main/utils/variable";
import { View, Text } from "../../main/themed";
import Decimal from "decimal.js";
import { Pressable, ScrollView, SectionList, Switch } from "react-native";
import { get_array_item, unwrap } from "../../main/utils/prelude";
import { FilterComponent } from "./filter";
import { HashSet } from "prelude-ts";

type State = {
  struct: Struct;
  active: boolean;
  level: Decimal | undefined;
  filters: [Filter, ReadonlyArray<Filter>];
  limit_offset: [Decimal, Decimal] | undefined;
  variables: Array<Variable>;
};

export type Action =
  | ["variables", Array<Variable>]
  | ["active", boolean]
  | ["level", Decimal | undefined]
  | ["limit_offset", [Decimal, Decimal] | undefined]
  | ["filter", "add"]
  | ["filter", "remove", number]
  | [
      "filters",
      number,
      "id",
      [
        boolean,
        (
          | ["==" | "!=" | ">=" | "<=" | ">" | "<", Decimal]
          | ["between" | "not_between", [Decimal, Decimal]]
          | undefined
        )
      ]
    ]
  | [
      "filters",
      number,
      "created_at" | "updated_at",
      [
        boolean,
        (
          | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
          | ["between" | "not_between", [Date, Date]]
          | undefined
        )
      ]
    ]
  | ["filters", number, "remove", FilterPath]
  | ["filters", number, "replace", FilterPath];

export function reducer(state: Draft<State>, action: Action) {
  switch (action[0]) {
    case "variables": {
      state.variables = action[1] as any;
      break;
    }
    case "active": {
      state.active = action[1];
      break;
    }
    case "level": {
      state.level = action[1];
      break;
    }
    case "limit_offset": {
      state.limit_offset = action[1];
      break;
    }
    case "filter": {
      switch (action[1]) {
        case "add": {
          state.filters[1].push({
            id: [false, undefined],
            created_at: [false, undefined],
            updated_at: [false, undefined],
            filter_paths: HashSet.of(),
          });
          break;
        }
        case "remove": {
          if (action[2] > -1 && action[2] < state.filters[1].length) {
            state.filters[1] = [
              ...state.filters[1].splice(0, action[2]),
              ...state.filters[1].splice(action[2], state.filters[1].length),
            ];
          }
          break;
        }
      }
      break;
    }
    case "filters": {
      const result = get_array_item(state.filters[1], action[1]);
      if (unwrap(result)) {
        const filter = result.value;
        switch (action[2]) {
          case "id": {
            filter.id = action[3];
            break;
          }
          case "created_at": {
            filter.created_at = action[3];
            break;
          }
          case "updated_at": {
            filter.updated_at = action[3];
            break;
          }
          case "replace": {
            filter.filter_paths = filter.filter_paths.add(action[3]);
            break;
          }
          case "remove": {
            filter.filter_paths = filter.filter_paths.remove(action[3]);
            break;
          }
          default: {
            const _exhaustiveCheck: never = action[2];
            return _exhaustiveCheck;
          }
        }
      }
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
      <ScrollView>
        <View>
          <Text>Active</Text>
          <Switch
            value={state.active}
            onValueChange={(x) => dispatch(["active", x])}
          />
        </View>
        <View>
          <Text>Level</Text>
          <Switch
            value={!state.level ? true : false}
            onValueChange={(x) =>
              dispatch(["level", x ? undefined : new Decimal(0)])
            }
          />
          <Text>{state.level ? state.level.toString() : "0"}</Text>
        </View>
        <Pressable
          onPress={() => {
            dispatch(["filter", "add"]);
          }}
        >
          <Text>Add Filter</Text>
        </Pressable>
      </ScrollView>
      <SectionList
        sections={state.filters[1].map((x, index) => ({
          index: index,
          data: [x],
        }))}
        renderSectionHeader={({ section: { index } }) => {
          return <Text>Filter {index}</Text>;
        }}
        renderItem={(list_item) => {
          return (
            <FilterComponent
              key={list_item.index}
              init_filter={state.filters[0]}
              filter={list_item.item}
              index={list_item.index}
              dispatch={dispatch}
            />
          );
        }}
      />
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
