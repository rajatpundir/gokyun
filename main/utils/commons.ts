import Decimal from "decimal.js";
import { Immutable, Draft } from "immer";
import { HashSet } from "prelude-ts";
import { PathFilter } from "./db";
import { ErrMsg, errors } from "./errors";
import { LispExpression, Symbol, Text, Num, Bool, Deci } from "./lisp";
import { PathPermission } from "./permissions";
import { apply, CustomError, Err, Ok, Result, unwrap } from "./prelude";
import { Path, Variable, PathString, StrongEnum, Struct } from "./variable";

export type State = Immutable<{
  id: Decimal;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  values: HashSet<Path>;
  mode: "read" | "write";
  trigger: boolean;
}>;

export type Action =
  | ["id", Decimal]
  | ["active", boolean]
  | ["created_at", Date]
  | ["updated_at", Date]
  | ["value", Path]
  | ["variable", Variable];

export function reducer(state: Draft<State>, action: Action) {
  switch (action[0]) {
    case "id": {
      state.id = action[1];
      break;
    }
    case "active": {
      state.active = action[1];
      break;
    }
    case "created_at": {
      state.created_at = action[1];
      break;
    }
    case "updated_at": {
      state.updated_at = action[1];
      break;
    }
    case "value": {
      if (action[1].writeable || action[1].trigger_output) {
        state.values = apply(state.values.remove(action[1]), (it) => {
          return it.add(action[1]);
        });
        if (action[1].trigger_dependency) {
          state.trigger = !state.trigger;
        }
      }
      break;
    }
    case "variable": {
      state.active = action[1].active;
      state.created_at = action[1].created_at;
      state.updated_at = action[1].updated_at;
      state.values = action[1].paths;
      state.trigger = !state.trigger;
      break;
    }
    default: {
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
    }
  }
}

function mark_trigger_outputs(struct: Struct, paths: HashSet<Path>) {
  let marked_paths: HashSet<Path> = HashSet.of();
  for (let path of paths) {
    const path_string: PathString = [
      path.path[0].map((x) => x[0]),
      path.path[1][0],
    ];
    let is_trigger_output = false;
    for (let trigger_name of Object.keys(struct.triggers)) {
      const trigger = struct.triggers[trigger_name];
      if (trigger.operation.op === "update") {
        for (let field of trigger.operation.path_updates) {
          const ref_path_string = field[0];
          if (
            ref_path_string[0].length === path_string[0].length &&
            ref_path_string[1] === path_string[1]
          ) {
            let check = true;
            for (let [index, other_field_name] of path_string[0].entries()) {
              if (ref_path_string[index] !== other_field_name) {
                check = false;
              }
            }
            if (check) {
              is_trigger_output = true;
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
  return marked_paths;
}

function mark_trigger_dependencies(struct: Struct, paths: HashSet<Path>) {
  let marked_paths: HashSet<Path> = HashSet.of();
  for (let path of paths) {
    const path_string: PathString = [
      path.path[0].map((x) => x[0]),
      path.path[1][0],
    ];
    for (let trigger_name of Object.keys(struct.triggers)) {
      const trigger = struct.triggers[trigger_name];
      if (trigger.operation.op !== "update") {
        for (let field_name of Object.keys(trigger.operation.fields)) {
          const expr = trigger.operation.fields[field_name];
          for (let used_path of expr.get_paths()) {
            if (
              path_string[0].length === used_path[0].length &&
              path_string[1] === used_path[1]
            ) {
              let check = true;
              for (let [index, other_field_name] of path_string[0].entries()) {
                if (used_path[index] !== other_field_name) {
                  check = false;
                }
              }
              if (check) {
                marked_paths = marked_paths.add(
                  apply(path, (it) => {
                    it.trigger_dependency = true;
                    return it;
                  })
                );
                break;
              }
            }
          }
        }
      } else {
        for (let field of trigger.operation.path_updates) {
          const expr = field[1];
          for (let used_path of expr.get_paths()) {
            if (
              path_string[0].length === used_path[0].length &&
              path_string[1] === used_path[1]
            ) {
              let check = true;
              for (let [index, other_field_name] of path_string[0].entries()) {
                if (used_path[index] !== other_field_name) {
                  check = false;
                }
              }
              if (check) {
                marked_paths = marked_paths.add(
                  apply(path, (it) => {
                    it.trigger_dependency = true;
                    return it;
                  })
                );
                break;
              }
            }
          }
        }
      }
    }
    if (!marked_paths.contains(path)) {
      marked_paths = marked_paths.add(path);
    }
  }
  return mark_trigger_outputs(struct, marked_paths);
}

function get_shortlisted_permissions(
  permissions: HashSet<PathPermission>,
  labels: Array<[string, PathString]>
): HashSet<PathPermission> {
  let path_permissions: HashSet<PathPermission> = HashSet.of();
  for (let [label, path] of labels) {
    for (let permission of permissions) {
      if (
        permission.path[0].length === path[0].length &&
        permission.path[1][0] === path[1]
      ) {
        let check = true;
        for (let [index, field_name] of path[0].entries()) {
          if (permission.path[0][index][0] !== field_name) {
            check = false;
            break;
          }
        }
        if (check) {
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
  }
  return path_permissions;
}

export function get_labeled_path_filters(
  permissions: HashSet<PathPermission>,
  labels: Array<[string, PathString]>
): Array<[string, PathFilter]> {
  const labeled_permissions: HashSet<PathPermission> =
    get_shortlisted_permissions(permissions, labels);
  const path_filters: Array<[string, PathFilter]> = [];
  for (let permission of labeled_permissions) {
    const path = apply(
      permission.path[0].map((x) => x[0]),
      (it) => {
        it.push(permission.path[1][0]);
        return it;
      }
    );
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
        path_filters.push([
          permission.label,
          [path, field.type, undefined, []],
        ]);
        break;
      }
      case "other": {
        path_filters.push([
          permission.label,
          [path, field.type, undefined, [], field.other],
        ]);
        break;
      }
      default: {
        const _exhaustiveCheck: never = field;
        return _exhaustiveCheck;
      }
    }
  }
  return path_filters;
}

export function get_top_writeable_paths(
  struct: Struct,
  permissions: HashSet<PathPermission>,
  labels: Array<[string, PathString]>
): HashSet<Path> {
  const labeled_permissions: HashSet<PathPermission> =
    get_shortlisted_permissions(permissions, labels);
  let paths: HashSet<Path> = HashSet.of();
  for (let permission of labeled_permissions) {
    if (permission.path[0].length === 0) {
      paths = paths.add(
        apply(new Path(permission.label, [[], permission.path[1]]), (it) => {
          it.writeable = true;
          return it;
        })
      );
    }
  }
  return mark_trigger_dependencies(struct, paths);
}

export function get_writeable_paths(
  struct: Struct,
  paths: HashSet<Path>,
  permissions: HashSet<PathPermission>
): HashSet<Path> {
  let writeable_paths: HashSet<Path> = HashSet.of();
  for (let path of paths) {
    for (let permission of permissions) {
      if (
        permission.path[0].length === path.path[0].length &&
        permission.path[1][0] === path.path[1][0]
      ) {
        let check = true;
        for (let [index, [field_name, _]] of path.path[0].entries()) {
          if (permission.path[0][index][0] !== field_name) {
            check = false;
            break;
          }
        }
        if (check) {
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
  }
  return mark_trigger_dependencies(struct, writeable_paths);
}

function add_symbol(
  symbols: Record<string, Symbol>,
  path: PathString,
  field: StrongEnum
): Record<string, Symbol> {
  if (path[0].length === 0) {
    const symbol_name = path[1];
    symbols[symbol_name] = apply(undefined, () => {
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
    symbols[symbol_name].value.values = add_symbol(
      apply({}, (it) => {
        if (symbol_name in symbols) {
          return symbols[symbol_name].value.values;
        }
        return it;
      }),
      [path[0].slice(1), path[1]],
      field
    );
  }
  return symbols;
}

export function get_symbols(
  paths: Immutable<HashSet<Path>>,
  expr: LispExpression
): Result<Readonly<Record<string, Symbol>>> {
  let symbols: Record<string, Symbol> = {};
  const dependencies = expr.get_paths();
  for (let dependency of dependencies) {
    for (let path of paths) {
      if (
        path.path[0].length === dependency[0].length &&
        path.path[1][0] === dependency[1]
      ) {
        let check = true;
        for (let [index, field_name] of dependency[0].entries()) {
          if (path.path[0][index][0] !== field_name) {
            check = false;
          }
        }
        if (check) {
          symbols = add_symbol(
            symbols,
            [path.path[0].map((x) => x[0]), path.path[1][0]],
            path.path[1][1]
          );
        } else {
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      }
    }
  }
  return new Ok(symbols);
}

function run_path_updates(
  state: State,
  dispatch: React.Dispatch<Action>,
  path_updates: ReadonlyArray<[PathString, LispExpression]>
) {
  for (let path_update of path_updates) {
    const path_string: PathString = path_update[0];
    const expr = path_update[1];
    const result = get_symbols(state.values, expr);
    if (unwrap(result)) {
      const symbols = result.value;
      for (let value of state.values) {
        if (
          value.path[0].length === path_string[0].length &&
          value.path[1][0] === path_string[1]
        ) {
          let check = true;
          for (let [index, field_name] of path_string[0].entries()) {
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
                const result = expr.get_result(symbols);
                if (unwrap(result)) {
                  if (result.value instanceof Text) {
                    dispatch([
                      "value",
                      apply(value, (it) => {
                        it.path[1] = [
                          it.path[1][0],
                          {
                            type: field.type,
                            value: result.value.value as string,
                          },
                        ];
                        return it;
                      }),
                    ]);
                  }
                }
                break;
              }
              case "i32":
              case "u32":
              case "i64":
              case "u64": {
                const result = expr.get_result(symbols);
                if (unwrap(result)) {
                  if (result.value instanceof Num) {
                    dispatch([
                      "value",
                      apply(value, (it) => {
                        it.path[1] = [
                          it.path[1][0],
                          {
                            type: field.type,
                            value: new Decimal(result.value.value as number),
                          },
                        ];
                        return it;
                      }),
                    ]);
                  }
                }
                break;
              }
              case "idouble":
              case "udouble":
              case "idecimal":
              case "udecimal": {
                const result = expr.get_result(symbols);
                if (unwrap(result)) {
                  if (result.value instanceof Deci) {
                    dispatch([
                      "value",
                      apply(value, (it) => {
                        it.path[1] = [
                          it.path[1][0],
                          {
                            type: field.type,
                            value: new Decimal(result.value.value as number),
                          },
                        ];
                        return it;
                      }),
                    ]);
                  }
                }
                break;
              }
              case "bool": {
                const result = expr.get_result(symbols);
                if (unwrap(result)) {
                  if (result.value instanceof Bool) {
                    result.value.value;
                    dispatch([
                      "value",
                      apply(value, (it) => {
                        it.path[1] = [
                          it.path[1][0],
                          {
                            type: field.type,
                            value: result.value.value as boolean,
                          },
                        ];
                        return it;
                      }),
                    ]);
                  }
                }
                break;
              }
              case "date":
              case "time":
              case "timestamp": {
                const result = expr.get_result(symbols);
                if (unwrap(result)) {
                  if (result.value instanceof Num) {
                    dispatch([
                      "value",
                      apply(value, (it) => {
                        it.path[1] = [
                          it.path[1][0],
                          {
                            type: field.type,
                            value: new Date(result.value.value as number),
                          },
                        ];
                        return it;
                      }),
                    ]);
                  }
                }
                break;
              }
              case "other": {
                const result = expr.get_result(symbols);
                if (unwrap(result)) {
                  if (result.value instanceof Num) {
                    dispatch([
                      "value",
                      apply(value, (it) => {
                        it.path[1] = [
                          it.path[1][0],
                          {
                            type: field.type,
                            other: field.other,
                            value: new Decimal(result.value.value as number),
                          },
                        ];
                        return it;
                      }),
                    ]);
                  }
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
  }
}

export async function run_triggers(
  struct: Struct,
  state: State,
  dispatch: React.Dispatch<Action>
) {
  for (let trigger_name of Object.keys(struct.triggers)) {
    const trigger = struct.triggers[trigger_name];
    if (trigger.operation.op === "update") {
      if (state.mode === "write") {
        if (state.id.equals(-1)) {
          if (trigger.event.includes("after_creation")) {
            run_path_updates(state, dispatch, trigger.operation.path_updates);
          }
        } else {
          if (trigger.event.includes("after_update")) {
            run_path_updates(state, dispatch, trigger.operation.path_updates);
          }
        }
      }
    }
  }
}
