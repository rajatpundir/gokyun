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
  is_decimal,
  Ok,
  Result,
  unwrap,
} from "../../main/utils/prelude";
import { PathString, Struct, Variable } from "../../main/utils/variable";
import { View, Text } from "../../main/themed";
import Decimal from "decimal.js";
import { Switch } from "react-native";
import { errors, ErrMsg } from "../../main/utils/errors";

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

type FilterPath =
  | [
      PathString,
      "str" | "lstr" | "clob",
      [Decimal, boolean] | undefined,
      (
        | [
            "==" | "!=" | ">=" | "<=" | ">" | "<" | "like" | "glob",
            string | PathString
          ]
        | undefined
      )
    ]
  | [
      PathString,
      "str" | "lstr" | "clob",
      [Decimal, boolean] | undefined,
      (
        | [
            "between" | "not_between",
            [string | PathString, string | PathString]
          ]
        | undefined
      )
    ]
  | [
      PathString,
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
      [Decimal, boolean] | undefined,
      ["==" | "!=" | ">=" | "<=" | ">" | "<", Decimal | PathString] | undefined
    ]
  | [
      PathString,
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
      [Decimal, boolean] | undefined,
      (
        | [
            "between" | "not_between",
            [Decimal | PathString, Decimal | PathString]
          ]
        | undefined
      )
    ]
  | [
      PathString,
      "bool",
      [Decimal, boolean] | undefined,
      ["==" | "!=", boolean | PathString] | undefined
    ]
  | [
      PathString,
      "date" | "time" | "timestamp",
      [Decimal, boolean] | undefined,
      ["==" | "!=" | ">=" | "<=" | ">" | "<", Date | PathString] | undefined
    ]
  | [
      PathString,
      "date" | "time" | "timestamp",
      [Decimal, boolean] | undefined,
      (
        | [
            "between" | "not_between",
            [Decimal | PathString, Decimal | PathString]
          ]
        | undefined
      )
    ]
  | [
      PathString,
      "other",
      [Decimal, boolean] | undefined,
      ["==" | "!=", Decimal | PathString] | undefined,
      Struct
    ];

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
  path_filters: Array<[string, FilterPath]>;
};

function get_array_length(x: ReadonlyArray<any> | undefined) {
  if (x !== undefined) {
    return x.length;
  }
  return 0;
}

function get_array_item<T>(
  x: ReadonlyArray<T> | undefined,
  i: number
): T | undefined {
  if (x !== undefined) {
    if (i >= 0 && i < x.length) {
      return x[i];
    }
  }
  return undefined;
}

function get_path_string(x: ReadonlyArray<string>): Result<PathString> {
  if (x.length !== 0) {
    return new Ok([x.slice(0, x.length - 1), x[x.length - 1]] as PathString);
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

function get_string_or_path_string(
  x: string | ReadonlyArray<string>
): Result<string | PathString> {
  if (typeof x === "object") {
    if (x.length !== 0) {
      return new Ok([x.slice(0, x.length - 1), x[x.length - 1]] as PathString);
    }
  } else {
    return new Ok(x);
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

function get_decimal_or_path_string(
  x: Decimal | ReadonlyArray<string>
): Result<Decimal | PathString> {
  if (is_decimal(x)) {
    return new Ok(x);
  } else {
    if (x.length !== 0) {
      return new Ok([x.slice(0, x.length - 1), x[x.length - 1]] as PathString);
    }
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

function get_boolean_or_path_string(
  x: boolean | ReadonlyArray<string>
): Result<boolean | PathString> {
  if (typeof x === "object") {
    if (x.length !== 0) {
      return new Ok([x.slice(0, x.length - 1), x[x.length - 1]] as PathString);
    }
  } else {
    return new Ok(x);
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

function get_date_or_path_string(
  x: Date | ReadonlyArray<string>
): Result<Date | PathString> {
  if (x instanceof Date) {
    return new Ok(x);
  } else {
    if (x.length !== 0) {
      return new Ok([x.slice(0, x.length - 1), x[x.length - 1]] as PathString);
    }
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

function get_filters(
  struct: Struct,
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
  },
  path_filters: Array<[string, PathFilter]>
): Array<Filter> {
  const filter_count = Math.max(
    1,
    get_array_length(variable_filters.id),
    get_array_length(variable_filters.created_at),
    get_array_length(variable_filters.updated_at),
    ...path_filters.map((x) => get_array_length(x[1][3]))
  );
  let filters: Array<Filter> = [];
  for (let i = 0; i < filter_count; i++) {
    get_array_item(variable_filters.id, i);
    get_array_item(variable_filters.created_at, i);
    get_array_item(variable_filters.updated_at, i);
    apply([] as Array<[string, PathFilter]>, (it) => {
      for (let [label, pf] of path_filters) {
        const path_string = get_path_string(pf[0]);
        if (unwrap(path_string)) {
          const field_struct_name = pf[1];
          switch (field_struct_name) {
            case "str":
            case "lstr":
            case "clob": {
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
    });
  }
  return filters;
}
