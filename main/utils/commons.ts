import Decimal from "decimal.js";
import { Immutable, Draft } from "immer";
import { HashSet } from "prelude-ts";
import { PathFilter } from "./db";
import { PathPermission } from "./permissions";
import { apply, Ok, Option } from "./prelude";
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
  | ["values", Path]
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
    case "values": {
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
