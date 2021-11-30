import Decimal from "decimal.js";
import { Immutable, Draft } from "immer";
import { HashSet } from "prelude-ts";
import { PathFilter } from "./db";
import { ErrMsg, errors } from "./errors";
import { LispExpression, Symbol, Text, Num, Deci, Bool } from "./lisp";
import { PathPermission } from "./permissions";
import { apply, CustomError, Err, Ok, Result } from "./prelude";
import { Path, Variable, PathString, StrongEnum } from "./variable";

export type State = Immutable<{
  id: Decimal;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  values: HashSet<Path>;
  mode: "read" | "write";
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
      if (action[1].writeable) {
        state.values = apply(state.values.remove(action[1]), (it) => {
          return it.add(action[1]);
        });
      }
      break;
    }
    case "variable": {
      state.id = action[1].id;
      state.active = action[1].active;
      state.created_at = action[1].created_at;
      state.updated_at = action[1].updated_at;
      state.values = action[1].paths;
      break;
    }
    default: {
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
    }
  }
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
  return paths;
}

export function get_writeable_paths(
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
  return writeable_paths;
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
            value: new Ok(new Num(field.value.toNumber())),
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
