import Decimal from "decimal.js";
import { Immutable, Draft } from "immer";
import { cloneDeep } from "lodash";
import { HashSet } from "prelude-ts";
import { FilterPath } from "./db";
import { ErrMsg, errors } from "./errors";
import {
  LispExpression,
  Symbol,
  Text,
  Num,
  Bool,
  Deci,
  LispResult,
} from "./lisp";
import { get_permissions, PathPermission } from "./permissions";
import {
  apply,
  CustomError,
  Err,
  Ok,
  Result,
  unwrap,
  Option,
  arrow,
} from "./prelude";
import { get_struct } from "../schema/struct";
import {
  Path,
  Variable,
  PathString,
  StrongEnum,
  Struct,
  compare_paths,
  concat_path_strings,
  WeakEnum,
} from "./variable";

export type State = Immutable<{
  id: Decimal;
  created_at: Date;
  updated_at: Date;
  values: HashSet<Path>;
  init_values: HashSet<Path>;
  mode: "read" | "write";
  event_trigger: number;
  check_trigger: number;
  extensions: Record<
    string,
    {
      struct: Struct;
      state: State;
      dispatch: React.Dispatch<Action>;
    }
  >;
  labels: Array<[string, PathString]>;
  higher_structs: Array<[Struct, PathString]>;
  user_paths: Array<PathString>;
  borrows: Array<string>;
  checks: Record<string, Result<boolean>>;
  found: boolean | undefined;
}>;

export type Action =
  | ["value", Path]
  | ["values", HashSet<Path>]
  | ["variable", Variable]
  | [
      "extension",
      Record<
        string,
        {
          struct: Struct;
          state: State;
          dispatch: React.Dispatch<Action>;
        }
      >
    ]
  | ["event_trigger"]
  | ["check_trigger"]
  | ["check", string, Result<boolean>]
  | ["mode", "read" | "write"]
  | ["reload", Decimal]
  | ["found", boolean | undefined];

export function reducer(state: Draft<State>, action: Action) {
  switch (action[0]) {
    case "value": {
      const result = state.values.findAny((x) => x.equals(action[1]));
      if (result.isSome()) {
        const path: Path = result.get();
        if (path.writeable || path.trigger_output) {
          state.values = apply(state.values.remove(path), (vals) => {
            return vals.add(
              apply(path, (path) => {
                path.path[1] = [path.path[1][0], action[1].path[1][1]];
                path.modified = true;
                return path;
              })
            );
          });
          if (path.trigger_dependency) {
            state.event_trigger += 1;
          }
          if (path.check_dependency) {
            state.check_trigger += 1;
          }
        }
      }
      break;
    }
    case "values": {
      for (const value of action[1]) {
        const result = state.values.findAny((x) => x.equals(value));
        if (result.isSome()) {
          const path: Path = result.get();
          state.values = apply(state.values.remove(path), (vals) => {
            return vals.add(
              apply(path, (path) => {
                path.path[0] = value.path[0];
                path.path[1] = [path.path[1][0], value.path[1][1]];
                path.modified = value.modified;
                return path;
              })
            );
          });
          if (path.trigger_dependency) {
            state.event_trigger += 1;
          }
          if (path.check_dependency) {
            state.check_trigger += 1;
          }
        }
      }
      break;
    }
    case "variable": {
      state.created_at = action[1].created_at;
      state.updated_at = action[1].updated_at;
      state.values = get_writeable_paths(
        action[1].struct,
        state,
        action[1].paths
      );
      state.init_values = cloneDeep(state.values);
      state.event_trigger += 1;
      state.check_trigger += 1;
      state.found = true;
      break;
    }
    case "extension": {
      state.extensions = action[1] as any;
      break;
    }
    case "event_trigger": {
      state.event_trigger += 1;
      break;
    }
    case "check_trigger": {
      state.check_trigger += 1;
      break;
    }
    case "check": {
      state.checks[action[1]] = action[2];
      break;
    }
    case "mode": {
      state.mode = action[1];
      if (state.mode === "read") {
        state.checks = {};
        // Code for dispatch['values', HashSet<Path>] is repeated for loading initial values
        for (const value of state.init_values) {
          const result = state.values.findAny((x) => x.equals(value));
          if (result.isSome()) {
            const path: Path = result.get();
            state.values = apply(state.values.remove(path), (vals) => {
              return vals.add(
                apply(path, (path) => {
                  path.path[0] = value.path[0];
                  path.path[1] = [path.path[1][0], value.path[1][1]];
                  path.modified = value.modified;
                  return path;
                })
              );
            });
            if (path.trigger_dependency) {
              state.event_trigger += 1;
            }
            if (path.check_dependency) {
              state.check_trigger += 1;
            }
          }
        }
      }
      break;
    }
    case "reload": {
      state.id = new Decimal(action[1].toNumber());
      state.mode = action[1].equals(-1) ? "write" : "read";
      state.event_trigger = 0;
      state.check_trigger = 0;
      state.checks = {};
      state.found = undefined;
      break;
    }
    case "found": {
      state.found = action[1];
      break;
    }
    default: {
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
    }
  }
}

function mark_check_dependency(
  struct: Struct,
  paths: HashSet<Path>
): HashSet<Path> {
  let marked_paths: HashSet<Path> = HashSet.of();
  for (const path of paths) {
    const path_string: PathString = [
      path.path[0].map((x) => x[0]),
      path.path[1][0],
    ];
    let is_check_dependency = false;
    for (const check_name of Object.keys(struct.checks)) {
      const check = struct.checks[check_name];
      const expr = check[0];
      for (const ref_path_string of expr.get_paths()) {
        if (compare_paths(ref_path_string, path_string)) {
          is_check_dependency = true;
          break;
        }
      }
    }
    marked_paths = marked_paths.add(
      apply(path, (it) => {
        if (is_check_dependency) {
          it.check_dependency = true;
        }
        return it;
      })
    );
  }
  return marked_paths;
}

function mark_trigger_outputs(
  struct: Struct,
  paths: HashSet<Path>,
  state: State
): HashSet<Path> {
  let marked_paths: HashSet<Path> = HashSet.of();
  for (const path of paths) {
    const path_string: PathString = [
      path.path[0].map((x) => x[0]),
      path.path[1][0],
    ];
    let is_trigger_output = false;
    for (const trigger_name of Object.keys(struct.triggers)) {
      const trigger = struct.triggers[trigger_name];
      if (trigger.operation.op === "update") {
        for (const field of trigger.operation.path_updates) {
          const ref_path_string = field[0];
          if (compare_paths(ref_path_string, path_string)) {
            is_trigger_output = true;
            break;
          }
        }
      }
    }
    for (const [higher_struct, higher_path_string] of state.higher_structs) {
      for (const trigger_name of Object.keys(higher_struct.triggers)) {
        const trigger = higher_struct.triggers[trigger_name];
        if (trigger.operation.op === "update") {
          for (const field of trigger.operation.path_updates) {
            const ref_path_string = field[0];
            if (
              compare_paths(
                ref_path_string as PathString,
                concat_path_strings(
                  higher_path_string as PathString,
                  path_string
                )
              )
            ) {
              is_trigger_output = true;
              break;
            }
          }
        }
      }
    }
    marked_paths = marked_paths.add(
      apply(path, (it) => {
        if (is_trigger_output) {
          it.writeable = false;
          it.trigger_output = true;
        }
        return it;
      })
    );
  }
  return mark_check_dependency(struct, marked_paths);
}

export function mark_trigger_dependencies(
  struct: Struct,
  paths: HashSet<Path>,
  state: State
): HashSet<Path> {
  let marked_paths: HashSet<Path> = HashSet.of();
  for (const path of paths) {
    const path_string: PathString = [
      path.path[0].map((x) => x[0]),
      path.path[1][0],
    ];
    let is_trigger_dependency = false;
    for (const trigger_name of Object.keys(struct.triggers)) {
      const trigger = struct.triggers[trigger_name];
      if (trigger.operation.op === "update") {
        for (const field of trigger.operation.path_updates) {
          const expr = field[1];
          for (const used_path of expr.get_paths()) {
            if (compare_paths(used_path, path_string)) {
              is_trigger_dependency = true;
              break;
            }
          }
        }
      }
    }
    marked_paths = marked_paths.add(
      apply(path, (it) => {
        if (is_trigger_dependency) {
          it.trigger_dependency = true;
        }
        return it;
      })
    );
  }
  return mark_trigger_outputs(struct, marked_paths, state);
}

export function get_labeled_permissions(
  permissions: HashSet<PathPermission>,
  labels: Immutable<Array<[string, PathString]>>
): HashSet<PathPermission> {
  let path_permissions: HashSet<PathPermission> = HashSet.of();
  for (const [label, path] of labels) {
    for (const permission of permissions) {
      if (
        compare_paths(
          [permission.path[0].map((x) => x[0]), permission.path[1][0]],
          path as PathString
        )
      ) {
        path_permissions = path_permissions.add(
          apply(permission, (it) => {
            it.label = label;
            return it;
          })
        );
        break;
      }
    }
  }
  return path_permissions;
}

export function get_creation_paths(
  struct: Struct,
  state: State
): HashSet<Path> {
  const labeled_permissions: HashSet<PathPermission> = get_labeled_permissions(
    get_permissions(
      struct,
      state.user_paths as PathString[],
      state.borrows as string[]
    ),
    state.labels
  );
  let paths: HashSet<Path> = HashSet.of();
  for (const permission of labeled_permissions) {
    paths = paths.add(
      apply(
        new Path(permission.label, [
          permission.path[0].map((x) => [
            x[0],
            {
              struct: x[1],
              id: new Decimal(-1),
              created_at: new Date(),
              updated_at: new Date(),
            },
          ]),
          permission.path[1],
        ]),
        (it) => {
          it.writeable = permission.writeable;
          return it;
        }
      )
    );
  }
  return mark_trigger_dependencies(struct, paths, state);
}

export function get_writeable_paths(
  struct: Struct,
  state: State,
  paths: HashSet<Path>
): HashSet<Path> {
  const permissions: HashSet<PathPermission> = get_permissions(
    struct,
    state.user_paths as PathString[],
    state.borrows as string[]
  );
  let writeable_paths: HashSet<Path> = HashSet.of();
  for (const path of paths) {
    for (const permission of permissions) {
      if (
        compare_paths(
          [permission.path[0].map((x) => x[0]), permission.path[1][0]],
          [path.path[0].map((x) => x[0]), path.path[1][0]]
        )
      ) {
        writeable_paths = writeable_paths.add(
          apply(path, (it) => {
            it.writeable = permission.writeable;
            return it;
          })
        );
        break;
      }
    }
  }
  return mark_trigger_dependencies(struct, writeable_paths, state);
}

export function get_filter_paths(
  struct: Struct,
  labels: Array<[string, PathString]>,
  user_paths: Array<PathString>,
  borrows: Array<string>
): HashSet<FilterPath> {
  const permissions: HashSet<PathPermission> = get_permissions(
    struct,
    user_paths as PathString[],
    borrows as string[]
  );
  const labeled_permissions: HashSet<PathPermission> = get_labeled_permissions(
    permissions,
    labels
  );
  let filter_paths: HashSet<FilterPath> = HashSet.of();
  for (const permission of labeled_permissions) {
    const path = apply(
      permission.path[0].map((x) => x[0]),
      (it) => {
        it.push(permission.path[1][0]);
        return it;
      }
    );
    const path_string: PathString = [
      permission.path[0].map((x) => x[0]),
      permission.path[1][0],
    ];
    const field: StrongEnum = permission.path[1][1];
    switch (field.type) {
      case "str":
      case "lstr":
      case "clob":
      case "i32":
      case "u32":
      case "i64":
      case "u64":
      case "idouble":
      case "udouble":
      case "idecimal":
      case "udecimal":
      case "bool":
      case "date":
      case "time":
      case "timestamp": {
        filter_paths = filter_paths.add(
          apply(
            new FilterPath(
              permission.label,
              path_string,
              [field.type, undefined],
              undefined
            ),
            (it) => {
              it.active = true;
              return it;
            }
          )
        );
        break;
      }
      case "other": {
        const other_struct = get_struct(field.other);
        if (unwrap(other_struct)) {
          filter_paths = filter_paths.add(
            apply(
              new FilterPath(
                permission.label,
                path_string,
                [field.type, undefined, other_struct.value],
                undefined
              ),
              (it) => {
                it.active = true;
                return it;
              }
            )
          );
        }
        break;
      }
      default: {
        const _exhaustiveCheck: never = field;
        return _exhaustiveCheck;
      }
    }
  }
  return filter_paths;
}

function add_symbol(
  symbols: Record<string, Symbol>,
  path: PathString,
  field: StrongEnum
): Record<string, Symbol> {
  if (path[0].length === 0) {
    const symbol_name = path[1];
    symbols[symbol_name] = arrow(() => {
      switch (field.type) {
        case "str":
        case "lstr":
        case "clob": {
          return new Symbol({
            value: new Ok(new Text(field.value)),
            values: {},
          });
        }
        case "i32":
        case "u32":
        case "i64":
        case "u64": {
          return new Symbol({
            value: new Ok(new Num(field.value.toNumber())),
            values: {},
          });
        }
        case "idouble":
        case "udouble":
        case "idecimal":
        case "udecimal": {
          return new Symbol({
            value: new Ok(new Deci(field.value.toNumber())),
            values: {},
          });
        }
        case "bool": {
          return new Symbol({
            value: new Ok(new Bool(field.value)),
            values: {},
          });
        }
        case "date":
        case "time":
        case "timestamp": {
          return new Symbol({
            value: new Ok(new Num(field.value.getTime())),
            values: {},
          });
        }
        case "other": {
          return new Symbol({
            value: new Ok(new Num(field.value.toNumber())),
            values: {},
          });
        }
        default: {
          const _exhaustiveCheck: never = field;
          return _exhaustiveCheck;
        }
      }
    });
  } else {
    const symbol_name = path[0][0];
    symbols[symbol_name] = new Symbol({
      value: undefined,
      values: add_symbol(
        apply({}, (it) => {
          if (symbol_name in symbols) {
            return symbols[symbol_name].value.values;
          }
          return it;
        }),
        [path[0].slice(1), path[1]],
        field
      ),
    });
  }
  return symbols;
}

export function get_symbols(
  state: State,
  expr: LispExpression
): Result<Readonly<Record<string, Symbol>>> {
  let symbols: Record<string, Symbol> = {};
  const dependencies = expr.get_paths();
  for (const dependency of dependencies) {
    const result = get_path(state, dependency);
    if (unwrap(result)) {
      const path = result.value;
      symbols = add_symbol(
        symbols,
        [path.path[0].map((x) => x[0]), path.path[1][0]],
        path.path[1][1]
      );
    } else {
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    }
  }
  return new Ok(symbols);
}

function dispatch_result(
  state: State,
  dispatch: React.Dispatch<Action>,
  path_string: PathString,
  expr_result: LispResult
) {
  for (const value of state.values) {
    if (
      value.path[0].length === path_string[0].length &&
      value.path[1][0] === path_string[1]
    ) {
      let check = true;
      for (const [index, field_name] of path_string[0].entries()) {
        if (value.path[index][0] !== field_name) {
          check = false;
        }
      }
      if (check) {
        const field = value.path[1][1];
        switch (field.type) {
          case "str":
          case "lstr":
          case "clob": {
            const result = expr_result.get_text({});
            if (unwrap(result)) {
              result.value.value;
              dispatch([
                "value",
                apply(value, (it) => {
                  it.path[1] = [
                    it.path[1][0],
                    {
                      type: field.type,
                      value: result.value.value,
                    },
                  ];
                  return it;
                }),
              ]);
            }
            break;
          }
          case "i32":
          case "u32":
          case "i64":
          case "u64": {
            if (expr_result instanceof Num) {
              dispatch([
                "value",
                apply(value, (it) => {
                  it.path[1] = [
                    it.path[1][0],
                    {
                      type: field.type,
                      value: new Decimal(expr_result.value as number),
                    },
                  ];
                  return it;
                }),
              ]);
            }
            break;
          }
          case "idouble":
          case "udouble":
          case "idecimal":
          case "udecimal": {
            if (expr_result instanceof Deci) {
              dispatch([
                "value",
                apply(value, (it) => {
                  it.path[1] = [
                    it.path[1][0],
                    {
                      type: field.type,
                      value: new Decimal(expr_result.value as number),
                    },
                  ];
                  return it;
                }),
              ]);
            }
            break;
          }
          case "bool": {
            if (expr_result instanceof Bool) {
              dispatch([
                "value",
                apply(value, (it) => {
                  it.path[1] = [
                    it.path[1][0],
                    {
                      type: field.type,
                      value: expr_result.value as boolean,
                    },
                  ];
                  return it;
                }),
              ]);
            }
            break;
          }
          case "date":
          case "time":
          case "timestamp": {
            if (expr_result instanceof Num) {
              dispatch([
                "value",
                apply(value, (it) => {
                  it.path[1] = [
                    it.path[1][0],
                    {
                      type: field.type,
                      value: new Date(expr_result.value as number),
                    },
                  ];
                  return it;
                }),
              ]);
            }
            break;
          }
          case "other": {
            if (expr_result instanceof Num) {
              dispatch([
                "value",
                apply(value, (it) => {
                  it.path[1] = [
                    it.path[1][0],
                    {
                      type: field.type,
                      other: field.other,
                      value: new Decimal(expr_result.value as number),
                    },
                  ];
                  return it;
                }),
              ]);
            }
            break;
          }
          default: {
            const _exhaustiveCheck: never = field;
            return _exhaustiveCheck;
          }
        }
      }
    }
  }
}

function run_path_updates(
  state: State,
  dispatch: React.Dispatch<Action>,
  path_updates: ReadonlyArray<[PathString, LispExpression]>,
  extension_update: [PathString, LispResult] | undefined
) {
  let parent_updates: Array<
    [State, React.Dispatch<Action>, PathString, LispResult]
  > = [];
  if (extension_update !== undefined) {
    const path_string: PathString = extension_update[0];
    const expr_result: LispResult = extension_update[1];
    const first: string = apply(path_string[1], (it) => {
      if (path_string[0].length !== 0) {
        return path_string[0][0];
      }
      return it;
    });
    if (first in state.extensions) {
      const extension = state.extensions[first];
      parent_updates.push([
        extension.state,
        extension.dispatch,
        [path_string[0].slice(1), path_string[1]],
        expr_result,
      ]);
    } else {
      dispatch_result(state, dispatch, path_string, expr_result);
    }
  }
  for (const path_update of path_updates) {
    const path_string: PathString = path_update[0];
    const expr = path_update[1];
    const result = get_symbols(state, expr);
    if (unwrap(result)) {
      const symbols = result.value;
      const expr_result = expr.get_result(symbols);
      if (unwrap(expr_result)) {
        const first: string = apply(path_string[1], (it) => {
          if (path_string[0].length !== 0) {
            return path_string[0][0];
          }
          return it;
        });
        if (first in state.extensions) {
          const extension = state.extensions[first];
          parent_updates.push([
            extension.state,
            extension.dispatch,
            [path_string[0].slice(1), path_string[1]],
            expr_result.value,
          ]);
        } else {
          dispatch_result(state, dispatch, path_string, expr_result.value);
        }
      }
    }
  }
  for (const [
    extension_state,
    extension_dispatch,
    path_string,
    expr_result,
  ] of parent_updates) {
    run_path_updates(
      extension_state,
      extension_dispatch,
      [],
      [path_string, expr_result]
    );
  }
}

export async function run_triggers(
  struct: Struct,
  state: State,
  dispatch: React.Dispatch<Action>,
  mounted: boolean
) {
  if (mounted) {
    for (const trigger_name of Object.keys(struct.triggers)) {
      const trigger = struct.triggers[trigger_name];
      if (trigger.operation.op === "update") {
        if (state.id.equals(-1)) {
          if (trigger.event.includes("after_creation")) {
            run_path_updates(
              state,
              dispatch,
              trigger.operation.path_updates,
              undefined
            );
          }
        } else {
          if (trigger.event.includes("after_update")) {
            run_path_updates(
              state,
              dispatch,
              trigger.operation.path_updates,
              undefined
            );
          }
        }
      }
    }
  }
}

export async function compute_checks(
  struct: Struct,
  state: State,
  dispatch: React.Dispatch<Action>,
  mounted: boolean
) {
  if (mounted) {
    for (const check_name of Object.keys(struct.checks)) {
      let computed_result: Result<boolean> = new Err(
        new CustomError([errors.ErrUnexpected] as ErrMsg)
      );
      const check = struct.checks[check_name];
      const expr = check[0];
      const result = get_symbols(state, expr as LispExpression);
      if (unwrap(result)) {
        const symbols = result.value;
        const expr_result = expr.get_result(symbols);
        if (unwrap(expr_result)) {
          if (expr_result.value instanceof Bool) {
            computed_result = new Ok(expr_result.value.value as boolean);
          }
        }
      }
      dispatch(["check", check_name, computed_result]);
    }
  }
}

export function get_path(state: State, path_string: PathString): Option<Path> {
  const first: string = apply(path_string[1], (it) => {
    if (path_string[0].length !== 0) {
      return path_string[0][0];
    }
    return it;
  });
  if (first in state.extensions) {
    const extension = state.extensions[first];
    const nested_path = get_path(extension.state, [
      path_string[0].slice(1),
      path_string[1],
    ]);
    if (unwrap(nested_path)) {
      let label = "";
      for (const [path_label, path] of state.labels) {
        if (
          path[0].length === path_string[0].length &&
          path[1] === path_string[1]
        ) {
          let check = true;
          for (const [index, field_name] of path_string[0].entries()) {
            if (path[0][index] !== field_name) {
              check = false;
            }
          }
          if (check) {
            label = path_label;
            break;
          }
        }
      }
      return new Ok(
        apply(nested_path.value, (it) => {
          return new Path(label, [
            [
              [
                first,
                {
                  struct: extension.struct as Struct,
                  id: extension.state.id as Decimal,
                  created_at: extension.state.created_at,
                  updated_at: extension.state.updated_at,
                },
              ],
            ],
            it.path[1],
          ]);
        })
      );
    }
  } else {
    for (const path of state.values) {
      if (
        path.path[0].length === path_string[0].length &&
        path.path[1][0] === path_string[1]
      ) {
        let check = true;
        for (const [index, [field_name, _]] of path.path[0].entries()) {
          if (path_string[0][index] !== field_name) {
            check = false;
            break;
          }
        }
        if (check) {
          return new Ok(path);
        }
      }
    }
  }
  return undefined;
}

export function get_label(state: State, path: PathString | string): string {
  const path_string: PathString = arrow(() => {
    if (typeof path === "string") {
      return [[], path];
    } else {
      return path;
    }
  });
  return apply(get_path(state, path_string), (it) => {
    if (unwrap(it)) {
      return it.value.label;
    }
    return "";
  });
}

// export const dimensions = {
//   width: Dimensions.get("window").width,
//   height: Dimensions.get("window").height,
//   isSmallDevice: Dimensions.get("window").width < 375,
// };

export function get_validated_decimal(
  field_struct_name:
    | "i32"
    | "u32"
    | "i64"
    | "u64"
    | "idouble"
    | "udouble"
    | "idecimal"
    | "udecimal",
  value: string
): Decimal {
  const x = value || "0";
  switch (field_struct_name) {
    case "i32":
      return Decimal.clamp(new Decimal(x).truncated(), -2147483648, 2147483648);
    case "u32":
      return Decimal.clamp(new Decimal(x).truncated(), 0, 2147483648);
    case "i64":
      return Decimal.clamp(
        new Decimal(x).truncated(),
        "-9223372036854775807",
        "9223372036854775807"
      );
    case "u64":
      return Decimal.clamp(
        new Decimal(x).truncated(),
        0,
        "9223372036854775807"
      );
    case "idouble":
      return new Decimal(x);
    case "udouble":
      return new Decimal(x).abs();
    case "idecimal":
      return new Decimal(x);
    case "udecimal":
      return new Decimal(x).abs();
    default: {
      const _exhaustiveCheck: never = field_struct_name;
      return _exhaustiveCheck;
    }
  }
}

export function get_decimal_keyboard_type(
  field_struct_name:
    | "i32"
    | "u32"
    | "i64"
    | "u64"
    | "idouble"
    | "udouble"
    | "idecimal"
    | "udecimal"
) {
  switch (field_struct_name) {
    case "u32":
    case "u64":
      return "number-pad";
  }
  return "numbers-and-punctuation";
}

export function get_path_with_type(
  struct: Struct,
  path: PathString
): Result<
  [PathString, [Exclude<WeakEnum["type"], "other">] | ["other", Struct]]
> {
  const [check, field_name] = [
    path[0].length !== 0,
    path[0].length !== 0 ? path[0][0] : path[1],
  ];
  if (field_name in struct.fields) {
    const field = struct.fields[field_name];
    if (check && field.type === "other") {
      const other_struct = get_struct(field.other);
      if (unwrap(other_struct)) {
        return get_path_with_type(other_struct.value, [
          path[0].slice(1),
          path[1],
        ]);
      }
    } else {
      if (field.type === "other") {
        const other_struct = get_struct(field.other);
        if (unwrap(other_struct)) {
          return new Ok([path, [field.type, other_struct.value]] as [
            PathString,
            [Exclude<WeakEnum["type"], "other">] | ["other", Struct]
          ]);
        }
      } else {
        return new Ok([path, [field.type]] as [
          PathString,
          [Exclude<WeakEnum["type"], "other">] | ["other", Struct]
        ]);
      }
    }
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

export function get_symbols_for_paths(
  paths: HashSet<Path>
): Record<string, Symbol> {
  const symbols: Record<string, Symbol> = {};
  const firsts: HashSet<string> = paths.map((path) =>
    path.path[0].length !== 0 ? path.path[0][0][0] : path.path[1][0]
  );
  for (const first of firsts) {
    const filtered_paths = paths.filter(
      (path) =>
        first ===
        (path.path[0].length !== 0 ? path.path[0][0][0] : path.path[1][0])
    );
    symbols[first] = arrow(() => {
      const sub_symbols: Record<string, Symbol> = get_symbols_for_paths(
        filtered_paths
          .filter((path) => path.path[0].length !== 0)
          .map(
            (path) =>
              new Path(path.label, [path.path[0].slice(1), path.path[1]])
          )
      );
      const filtered_path = filtered_paths.findAny(
        (path) => path.path[0].length === 0
      );
      if (filtered_path.isSome()) {
        const value = filtered_path.get().path[1][1];
        switch (value.type) {
          case "str":
          case "lstr":
          case "clob": {
            return new Symbol({
              value: new Ok(new Text(value.value)),
              values: sub_symbols,
            });
          }
          case "i32":
          case "u32":
          case "i64":
          case "u64": {
            return new Symbol({
              value: new Ok(new Num(value.value.toNumber())),
              values: sub_symbols,
            });
          }
          case "idouble":
          case "udouble":
          case "idecimal":
          case "udecimal": {
            return new Symbol({
              value: new Ok(new Deci(value.value.toNumber())),
              values: sub_symbols,
            });
          }
          case "bool": {
            return new Symbol({
              value: new Ok(new Bool(value.value)),
              values: sub_symbols,
            });
          }
          case "date":
          case "time":
          case "timestamp": {
            return new Symbol({
              value: new Ok(new Num(value.value.getTime())),
              values: sub_symbols,
            });
          }
          case "other": {
            return new Symbol({
              value: new Ok(new Num(value.value.toNumber())),
              values: sub_symbols,
            });
          }
          default: {
            const _exhaustiveCheck: never = value;
            return _exhaustiveCheck;
          }
        }
      } else {
        return new Symbol({
          value: undefined,
          values: sub_symbols,
        });
      }
    });
  }
  return symbols;
}
