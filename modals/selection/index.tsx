import React from "react";
import { Draft } from "immer";
import { useEffect } from "react";
import { FlatList } from "react-native-gesture-handler";
import { useImmerReducer } from "use-immer";
import { NavigatorProps as RootNavigatorProps } from "../../App";
import { Filter, FilterPath, get_variables } from "../../main/utils/db";
import { Struct, Variable } from "../../main/utils/variable";
import { View, Text, TextInput } from "../../main/themed";
import Decimal from "decimal.js";
import { Switch } from "react-native";
import { apply, unwrap } from "../../main/utils/prelude";

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
        {/* // Render Filters and their filter paths */}
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

function render_filter(filter: Filter): JSX.Element {
  return (
    <>
      {apply(undefined, () => {
        const [active, value] = filter.id;
        if (value !== undefined) {
          return (
            <>
              <Switch value={active} onValueChange={(x) => {}} />
              <Text>ID</Text>
              {apply(undefined, () => {
                const op = value[0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    return (
                      <>
                        <TextInput
                          keyboardType={"number-pad"}
                          value={value[1].toString()}
                          onChangeText={() => {}}
                        />
                      </>
                    );
                  }
                  case "between":
                  case "not_between": {
                    return (
                      <>
                        <TextInput
                          keyboardType={"number-pad"}
                          value={value[1][0].toString()}
                          onChangeText={() => {}}
                        />
                        <TextInput
                          keyboardType={"number-pad"}
                          value={value[1][1].toString()}
                          onChangeText={() => {}}
                        />
                      </>
                    );
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              })}
            </>
          );
        }
        return null;
      })}
      {apply(undefined, () => {
        const [active, value] = filter.created_at;
        if (value !== undefined) {
          return (
            <>
              <Switch value={active} onValueChange={(x) => {}} />
              <Text>Created At</Text>
              {apply(undefined, () => {
                const op = value[0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    return (
                      <>
                        <TextInput
                          keyboardType={"number-pad"}
                          value={value[1].toString()}
                          onChangeText={() => {}}
                        />
                      </>
                    );
                  }
                  case "between":
                  case "not_between": {
                    return (
                      <>
                        <TextInput
                          keyboardType={"number-pad"}
                          value={value[1][0].toString()}
                          onChangeText={() => {}}
                        />
                        <TextInput
                          keyboardType={"number-pad"}
                          value={value[1][1].toString()}
                          onChangeText={() => {}}
                        />
                      </>
                    );
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              })}
            </>
          );
        }
        return null;
      })}
      {apply(undefined, () => {
        const [active, value] = filter.updated_at;
        if (value !== undefined) {
          return (
            <>
              <Switch value={active} onValueChange={(x) => {}} />
              <Text>Updated At</Text>
              {apply(undefined, () => {
                const op = value[0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    return (
                      <>
                        <TextInput
                          keyboardType={"number-pad"}
                          value={value[1].toString()}
                          onChangeText={() => {}}
                        />
                      </>
                    );
                  }
                  case "between":
                  case "not_between": {
                    return (
                      <>
                        <TextInput
                          keyboardType={"number-pad"}
                          value={value[1][0].toString()}
                          onChangeText={() => {}}
                        />
                        <TextInput
                          keyboardType={"number-pad"}
                          value={value[1][1].toString()}
                          onChangeText={() => {}}
                        />
                      </>
                    );
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              })}
            </>
          );
        }
        return null;
      })}
    </>
  );
}

function render_filter_path(filter_path: FilterPath) {
  return (
    <>
      <Switch value={filter_path.active} onValueChange={(x) => {}} />
      <Text>{filter_path.label}</Text>
      {apply(undefined, () => {
        if (filter_path.active) {
          const field_struct_name = filter_path.value[0];
          switch (field_struct_name) {
            case "str":
            case "lstr":
            case "clob": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<":
                  case "like":
                  case "glob": {
                    const value = filter_path.value[1][1];
                    if (typeof value === "string") {
                      value;
                    } else {
                      value;
                    }
                    break;
                  }
                  case "between":
                  case "not_between": {
                    const [value1, value2] = filter_path.value[1][1];
                    break;
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
              break;
            }
            case "i32": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    break;
                  }
                  case "between":
                  case "not_between": {
                    break;
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
              break;
            }
            case "u32": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    break;
                  }
                  case "between":
                  case "not_between": {
                    break;
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
              break;
            }
            case "i64": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    break;
                  }
                  case "between":
                  case "not_between": {
                    break;
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
              break;
            }
            case "u64": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    break;
                  }
                  case "between":
                  case "not_between": {
                    break;
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
              break;
            }
            case "idouble":
            case "idecimal": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    break;
                  }
                  case "between":
                  case "not_between": {
                    break;
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
              break;
            }
            case "udouble":
            case "udecimal": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    break;
                  }
                  case "between":
                  case "not_between": {
                    break;
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
              break;
            }
            case "bool": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=": {
                    break;
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
              break;
            }
            case "date":
            case "time":
            case "timestamp": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    break;
                  }
                  case "between":
                  case "not_between": {
                    break;
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
              break;
            }
            case "other": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=": {
                    break;
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
              break;
            }
            default: {
              const _exhaustiveCheck: never = field_struct_name;
              return _exhaustiveCheck;
            }
          }
        }
        return null;
      })}
    </>
  );
}
