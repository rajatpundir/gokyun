import React from "react";
import { Draft } from "immer";
import { useEffect } from "react";
import { FlatList } from "react-native-gesture-handler";
import { useImmerReducer } from "use-immer";
import { NavigatorProps as RootNavigatorProps } from "../../App";
import { get_variables, PathFilter } from "../../main/utils/db";
import {
  apply,
  CustomError,
  Err,
  fold,
  is_decimal,
  Ok,
  Result,
  unwrap,
} from "../../main/utils/prelude";
import {
  compare_paths,
  PathString,
  Struct,
  Variable,
} from "../../main/utils/variable";
import { View, Text } from "../../main/themed";
import Decimal from "decimal.js";
import { Switch } from "react-native";
import { errors, ErrMsg } from "../../main/utils/errors";
import { HashSet } from "prelude-ts";

type State = {
  struct: Struct;
  variable_filters: {
    active: boolean;
    level: Decimal | undefined;
    id: ReadonlyArray<
      | ["==" | "!=" | ">=" | "<=" | ">" | "<", Decimal]
      | ["between" | "not_between", [Decimal, Decimal]]
      | undefined
    >;
    created_at: ReadonlyArray<
      | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
      | ["between" | "not_between", [Date, Date]]
      | undefined
    >;
    updated_at: ReadonlyArray<
      | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
      | ["between" | "not_between", [Date, Date]]
      | undefined
    >;
  };
  path_filters: Array<[string, PathFilter]>;
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
    variable_filters: props.route.params.variable_filters,
    path_filters: props.route.params.path_filters,
    limit_offset: props.route.params.limit_offset,
    variables: [],
  });
  useEffect(() => {
    props.navigation.setOptions({ headerTitle: props.route.params.title });
    const get_vars = async () => {
      const variables = await get_variables(
        state.struct,
        state.variable_filters,
        state.path_filters,
        state.limit_offset
      );
      if (unwrap(variables)) {
        dispatch(["variables", variables.value]);
      }
    };
    get_vars();
  }, [
    state.struct,
    state.variable_filters,
    state.path_filters,
    state.limit_offset,
  ]);
  return (
    <View style={{ flex: 1 }}>
      <View>
        <View>
          <Text>Active</Text>
          <Switch value={state.variable_filters.active} />
        </View>
        <View>
          <Text>Level</Text>
          <Text>
            {state.variable_filters.level
              ? state.variable_filters.level.toString()
              : "0"}
          </Text>
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

type FilterPathValue =
  | [
      "str" | "lstr" | "clob",
      "==" | "!=" | ">=" | "<=" | ">" | "<" | "like" | "glob",
      string | PathString
    ]
  | [
      "str" | "lstr" | "clob",
      "between" | "not_between",
      [string | PathString, string | PathString]
    ]
  | [
      (
        | "i32"
        | "u32"
        | "i64"
        | "u64"
        | "idouble"
        | "udouble"
        | "idecimal"
        | "udecimal"
      ),
      "==" | "!=" | ">=" | "<=" | ">" | "<",
      Decimal | PathString
    ]
  | [
      (
        | "i32"
        | "u32"
        | "i64"
        | "u64"
        | "idouble"
        | "udouble"
        | "idecimal"
        | "udecimal"
      ),
      "between" | "not_between",
      [Decimal | PathString, Decimal | PathString]
    ]
  | ["bool", "==" | "!=", boolean | PathString]
  | [
      "date" | "time" | "timestamp",
      "==" | "!=" | ">=" | "<=" | ">" | "<",
      Date | PathString
    ]
  | [
      "date" | "time" | "timestamp",
      "between" | "not_between",
      [Decimal | PathString, Decimal | PathString]
    ]
  | ["other", "==" | "!=", Decimal | PathString, Struct];

class FilterPath {
  label: string;
  active: boolean = false;
  path: PathString;
  value: FilterPathValue;
  ordering: [Decimal, boolean] | undefined;

  constructor(
    label: string,
    path: PathString,
    value: FilterPathValue,
    ordering: [Decimal, boolean] | undefined
  ) {
    this.label = label;
    this.path = path;
    this.value = value;
    this.ordering = ordering;
  }

  equals(other: FilterPath): boolean {
    if (!other) {
      return false;
    }
    return compare_paths(this.path, other.path);
  }

  hashCode(): number {
    return 0;
  }

  toString(): string {
    return String({
      path: this.path,
      value: this.value,
    });
  }
}

type Filter = {
  id:
    | ["==" | "!=" | ">=" | "<=" | ">" | "<", Decimal]
    | ["between" | "not_between", [Decimal, Decimal]]
    | undefined;
  created_at:
    | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
    | ["between" | "not_between", [Date, Date]]
    | undefined;
  updated_at:
    | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
    | ["between" | "not_between", [Date, Date]]
    | undefined;
  filter_paths: HashSet<FilterPath>;
};

function get_variable_filters(
  active: boolean,
  level: Decimal | undefined,
  filters: ReadonlyArray<Filter>
): {
  active: boolean;
  level: Decimal | undefined;
  id: ReadonlyArray<
    | ["==" | "!=" | ">=" | "<=" | ">" | "<", Decimal]
    | ["between" | "not_between", [Decimal, Decimal]]
    | undefined
  >;
  created_at: ReadonlyArray<
    | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
    | ["between" | "not_between", [Date, Date]]
    | undefined
  >;
  updated_at: ReadonlyArray<
    | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
    | ["between" | "not_between", [Date, Date]]
    | undefined
  >;
} {
  return {
    active: active,
    level: level,
    id: filters.map((x) => x.id),
    created_at: filters.map((x) => x.created_at),
    updated_at: filters.map((x) => x.updated_at),
  };
}

const get_flattened_path = (x: PathString) => [...x[0], x[1]];

function get_path_filters(filters: Array<Filter>) {
  let path_filters: Array<[string, PathFilter]> = [];
  const used_filter_paths: HashSet<FilterPath> = apply(
    HashSet.of<FilterPath>(),
    (it) => {
      for (let filter of filters) {
        for (let filter_path of filter.filter_paths) {
          if (filter_path.active) {
            it = it.add(filter_path);
          }
        }
      }
      return it;
    }
  );
  for (let filter_path of used_filter_paths) {
    const field_struct_name = filter_path.value[0];
    switch (field_struct_name) {
      case "str":
      case "lstr":
      case "clob": {
        const field_filters_1: Array<
          | [
              "==" | "!=" | ">=" | "<=" | ">" | "<" | "like" | "glob",
              string | ReadonlyArray<string>
            ]
          | undefined
        > = [];
        const field_filters_2: Array<
          | [
              "between" | "not_between",
              [string | ReadonlyArray<string>, string | ReadonlyArray<string>]
            ]
          | undefined
        > = [];
        for (let filter of filters) {
          let check = true;
          const result = filter.filter_paths.findAny((x) =>
            x.equals(filter_path)
          );
          if (result.isSome()) {
            const other_filter_path = result.get();
            if (other_filter_path.value[0] === field_struct_name) {
              const op = other_filter_path.value[1];
              switch (op) {
                case "==":
                case "!=":
                case ">=":
                case "<=":
                case ">":
                case "<":
                case "like":
                case "glob": {
                  field_filters_2.push(undefined);
                  const value = other_filter_path.value[2];
                  if (typeof value === "object") {
                    field_filters_1.push([op, get_flattened_path(value)]);
                  } else {
                    field_filters_1.push([op, value]);
                  }
                  break;
                }
                case "between":
                case "not_between": {
                  field_filters_1.push(undefined);
                  const [value1, value2] = other_filter_path.value[2];
                  if (typeof value1 === "object") {
                    if (typeof value2 === "object") {
                      field_filters_2.push([
                        op,
                        [
                          get_flattened_path(value1),
                          get_flattened_path(value2),
                        ],
                      ]);
                    } else {
                      field_filters_2.push([
                        op,
                        [get_flattened_path(value1), value2],
                      ]);
                    }
                  } else {
                    if (typeof value2 === "object") {
                      field_filters_2.push([
                        op,
                        [value1, get_flattened_path(value2)],
                      ]);
                    } else {
                      field_filters_2.push([op, [value1, value2]]);
                    }
                  }
                  break;
                }
                default: {
                  const _exhaustiveCheck: never = op;
                  return _exhaustiveCheck;
                }
              }
              check = false;
            }
          }
          if (check) {
            field_filters_1.push(undefined);
            field_filters_2.push(undefined);
          }
        }
        if (
          fold(false, field_filters_1, (acc, val) => {
            if (!acc) {
              if (val !== undefined) {
                return true;
              }
            }
            return acc;
          })
        ) {
          path_filters.push([
            filter_path.label,
            [
              get_flattened_path(filter_path.path),
              field_struct_name,
              filter_path.ordering,
              field_filters_1,
            ],
          ]);
        }
        if (
          fold(false, field_filters_2, (acc, val) => {
            if (!acc) {
              if (val !== undefined) {
                return true;
              }
            }
            return acc;
          })
        ) {
          path_filters.push([
            filter_path.label,
            [
              get_flattened_path(filter_path.path),
              field_struct_name,
              filter_path.ordering,
              field_filters_2,
            ],
          ]);
        }
        break;
      }
      case "i32":
      case "u32":
      case "i64":
      case "u64":
      case "idouble":
      case "udouble":
      case "idecimal":
      case "udecimal": {
        const op = filter_path.value[1];
        switch (op) {
          case "==":
          case "!=":
          case ">=":
          case "<=":
          case ">":
          case "<": {
            const value = filter_path.value[2];
            const field_filters: Array<
              | [
                  "==" | "!=" | ">=" | "<=" | ">" | "<",
                  Decimal | ReadonlyArray<string>
                ]
              | undefined
            > = [];
            break;
          }
          case "between":
          case "not_between": {
            const value = filter_path.value[2];
            const field_filters: Array<
              | [
                  "between" | "not_between",
                  [
                    Decimal | ReadonlyArray<string>,
                    Decimal | ReadonlyArray<string>
                  ]
                ]
              | undefined
            > = [];
            break;
          }
          default: {
            const _exhaustiveCheck: never = op;
            return _exhaustiveCheck;
          }
        }
        break;
      }
      case "bool": {
        const op = filter_path.value[1];
        switch (op) {
          case "==":
          case "!=": {
            const value = filter_path.value[2];
            const field_filters: Array<
              ["==" | "!=", boolean | ReadonlyArray<string>] | undefined
            > = [];
            break;
          }
          default: {
            const _exhaustiveCheck: never = op;
            return _exhaustiveCheck;
          }
        }
        break;
      }
      case "date":
      case "time":
      case "timestamp": {
        const op = filter_path.value[1];
        switch (op) {
          case "==":
          case "!=":
          case ">=":
          case "<=":
          case ">":
          case "<": {
            const value = filter_path.value[2];
            const field_filters: Array<
              | [
                  "==" | "!=" | ">=" | "<=" | ">" | "<",
                  Date | ReadonlyArray<string>
                ]
              | undefined
            > = [];
            break;
          }
          case "between":
          case "not_between": {
            const value = filter_path.value[2];
            const field_filters: Array<
              | [
                  "between" | "not_between",
                  [
                    Decimal | ReadonlyArray<string>,
                    Decimal | ReadonlyArray<string>
                  ]
                ]
              | undefined
            > = [];
            break;
          }
          default: {
            const _exhaustiveCheck: never = op;
            return _exhaustiveCheck;
          }
        }
        break;
      }
      case "other": {
        const op = filter_path.value[1];
        switch (op) {
          case "==":
          case "!=": {
            const value = filter_path.value[2];
            const field_filters: Array<
              ["==" | "!=", Decimal | ReadonlyArray<string>] | undefined
            > = [];
            break;
          }
          default: {
            const _exhaustiveCheck: never = op;
            return _exhaustiveCheck;
          }
        }
        break;
      }
      default: {
        const _exhaustiveCheck: never = field_struct_name;
        return _exhaustiveCheck;
      }
    }
  }

  if (filters.length !== 0) {
    const first = filters[0];
    for (let [label1, filter_path1] of first.filter_paths) {
      const path = get_flattened_path(filter_path1[0]);
      const field_struct_name = filter_path1[1];
      const ops = filter_path1[2];
      const ordering = filter_path1[4];
      switch (field_struct_name) {
        case "str":
        case "lstr":
        case "clob": {
          switch (ops) {
            case "==":
            case "!=":
            case ">=":
            case "<=":
            case ">":
            case "<":
            case "like":
            case "glob": {
              const field_filters: Array<
                | [
                    "==" | "!=" | ">=" | "<=" | ">" | "<" | "like" | "glob",
                    string | ReadonlyArray<string>
                  ]
                | undefined
              > = [];
              for (let filter of filters) {
                let check = true;
                for (let [_, filter_path2] of filter.filter_paths) {
                  if (
                    filter_path2[1] === field_struct_name &&
                    filter_path2[2] === ops &&
                    compare_paths(filter_path1[0], filter_path2[0])
                  ) {
                    const value = filter_path2[3];
                    if (typeof value === "object") {
                      field_filters.push([ops, get_flattened_path(value)]);
                    } else {
                      field_filters.push([ops, value]);
                    }
                    check = false;
                    break;
                  }
                }
                if (check) {
                  field_filters.push(undefined);
                }
              }
              path_filters.push([
                label1,
                [path, field_struct_name, ordering, field_filters],
              ]);
              break;
            }
            case "between":
            case "not_between": {
              const field_filters: Array<
                | [
                    "between" | "not_between",
                    [
                      string | ReadonlyArray<string>,
                      string | ReadonlyArray<string>
                    ]
                  ]
                | undefined
              > = [];
              const [value1, value2] = filter_path1[3];
              if (typeof value1 === "object") {
                if (typeof value2 === "object") {
                  field_filters.push([
                    ops,
                    [get_flattened_path(value1), get_flattened_path(value2)],
                  ]);
                } else {
                  field_filters.push([
                    ops,
                    [get_flattened_path(value1), value2],
                  ]);
                }
              } else {
                if (typeof value2 === "object") {
                  field_filters.push([
                    ops,
                    [value1, get_flattened_path(value2)],
                  ]);
                } else {
                  field_filters.push([ops, [value1, value2]]);
                }
              }
              break;
            }
            default: {
              const _exhaustiveCheck: never = ops;
              return _exhaustiveCheck;
            }
          }
          break;
        }
        case "i32":
        case "u32":
        case "i64":
        case "u64": {
          break;
        }
        case "idouble":
        case "udouble":
        case "idecimal":
        case "udecimal": {
          break;
        }
        case "bool": {
          break;
        }
        case "date":
        case "time":
        case "timestamp": {
          break;
        }
        case "other": {
          break;
        }
        default: {
          const _exhaustiveCheck: never = field_struct_name;
          return _exhaustiveCheck;
        }
      }
    }
  }

  return path_filters;
}
