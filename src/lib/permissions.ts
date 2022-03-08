import { HashSet } from "prelude-ts";
import { ErrMsg, errors } from "./errors";
import {
  Result,
  Ok,
  unwrap,
  Err,
  CustomError,
  unwrap_array,
  apply,
} from "./prelude";
import { get_struct, StructName } from "../schema/struct";
import { get_strong_enum, PathString, StrongEnum, Struct } from "./variable";

// TODO. Borrow is an Existence on some field providing ownership

// user_paths and borrow concepts can be merged as below
type UserPath =
  | PathString
  | {
      // Following path starting in higher struct, we should arrive at a field of current which has ownership defined for it
      higher_struct: StructName;
      borrowed_field: PathString;
      // User path starting in higher_struct
      user_path: UserPath;
    };

// Cache computed permissions for same input

export class PathPermission {
  path: [Array<[string, Struct]>, [string, StrongEnum]];
  writeable: boolean = false;
  label: string = "";

  constructor(path: [Array<[string, Struct]>, [string, StrongEnum]]) {
    this.path = path;
  }

  equals(other: PathPermission): boolean {
    if (!other) {
      return false;
    }
    if (this.path[0].length !== other.path[0].length) {
      return false;
    } else {
      for (let i = 0; i < this.path[0].length; i++) {
        const [this_field_name, this_struct] = this.path[0][i];
        const [other_field_name, other_struct] = this.path[0][i];
        if (
          this_field_name !== other_field_name ||
          !this_struct.equals(other_struct)
        ) {
          return false;
        }
      }
      if (
        this.path[1][0] !== other.path[1][0] ||
        this.path[1][1].type !== other.path[1][1].type
      ) {
        return false;
      }
    }
    return true;
  }

  hashCode(): number {
    return 0;
  }

  toString(): string {
    return `[${this.path[0].map((x) => x[0]).join(".")}] ${this.path[1][0]}`;
  }
}

// Function to determine if PathString points to a field with 'User' struct
function get_valid_user_path(
  struct: Struct,
  path: PathString,
  borrowed: boolean
): Result<[Array<[string, Struct]>, string, boolean]> {
  const [init, last] = path;
  if (init.length === 0) {
    if (last in struct.fields) {
      const field = struct.fields[last];
      if (field.type === "other" && field.other === "User") {
        return new Ok([[], last, borrowed] as [
          Array<[string, Struct]>,
          string,
          boolean
        ]);
      }
    }
  } else {
    const field_name: string = init[0];
    if (field_name in struct.fields) {
      const field = struct.fields[field_name];
      if (field.type == "other") {
        const next_struct = get_struct(field.other as StructName);
        const result = get_valid_user_path(
          next_struct,
          [init.slice(1), last],
          borrowed
        );
        if (unwrap(result)) {
          return new Ok([
            apply([[field_name, next_struct] as [string, Struct]], (it) => {
              return it.concat(result.value[0]);
            }),
            result.value[1],
            borrowed,
          ] as [Array<[string, Struct]>, string, boolean]);
        }
      }
    }
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

function get_public_permissions(
  struct: Struct,
  prefix: Array<[string, Struct]> = []
): HashSet<PathPermission> {
  let path_permissions: HashSet<PathPermission> = HashSet.of();
  for (const field_name of struct.permissions.public) {
    if (field_name in struct.fields) {
      const field = struct.fields[field_name];
      const path_permission = new PathPermission([
        prefix,
        [field_name, get_strong_enum(field)],
      ]);
      if (!path_permissions.contains(path_permission)) {
        path_permissions = path_permissions.add(path_permission);
      }
      if (field.type === "other") {
        const next_struct = get_struct(field.other as StructName);
        const nested_path_permissions = get_public_permissions(next_struct, [
          ...prefix,
          [field_name, next_struct],
        ]);
        for (const permission of nested_path_permissions) {
          if (!path_permissions.contains(permission)) {
            path_permissions = path_permissions.add(permission);
          }
        }
      }
    }
  }
  return path_permissions;
}

function get_user_path_permissions(
  struct: Struct,
  user_path: [Array<[string, Struct]>, string, boolean],
  prefix: Array<[string, Struct]> = []
): HashSet<PathPermission> {
  let path_permissions: HashSet<PathPermission> = HashSet.of();
  const [init, last, borrowed] = user_path;
  if (init.length === 0) {
    if (last in struct.fields && last in struct.permissions.ownership) {
      const permissions = struct.permissions.ownership[last];
      for (const field_name of permissions.write) {
        if (field_name in struct.fields) {
          const field = struct.fields[field_name];
          const path_permission = apply(
            new PathPermission([prefix, [field_name, get_strong_enum(field)]]),
            (it) => {
              if (!borrowed) {
                it.writeable = true;
              }
              return it;
            }
          );
          // Remove and add, as existing permission may not be writeable
          path_permissions = path_permissions.remove(path_permission);
          path_permissions = path_permissions.add(path_permission);
          if (field.type === "other") {
            const next_struct = get_struct(field.other as StructName);
            const nested_path_permissions = get_public_permissions(
              next_struct,
              [...prefix, [field_name, next_struct]]
            );
            for (const permission of nested_path_permissions) {
              if (!path_permissions.contains(permission)) {
                path_permissions = path_permissions.add(permission);
              }
            }
          }
        }
      }
      for (const field_name of permissions.read) {
        if (field_name in struct.fields) {
          const field = struct.fields[field_name];
          const path_permission = new PathPermission([
            prefix,
            [field_name, get_strong_enum(field)],
          ]);
          if (!path_permissions.contains(path_permission)) {
            path_permissions = path_permissions.add(path_permission);
          }
          if (field.type === "other") {
            const next_struct = get_struct(field.other as StructName);
            const nested_path_permissions = get_public_permissions(
              next_struct,
              [...prefix, [field_name, next_struct]]
            );
            for (const permission of nested_path_permissions) {
              if (!path_permissions.contains(permission)) {
                path_permissions = path_permissions.add(permission);
              }
            }
          }
        }
      }
    }
  } else {
    const [first, next_struct] = init[0];
    if (first in struct.fields && first in struct.permissions.ownership) {
      const permissions = struct.permissions.ownership[first];
      for (const field_name of permissions.write) {
        if (field_name in struct.fields) {
          const field = struct.fields[field_name];
          const path_permission = apply(
            new PathPermission([prefix, [field_name, get_strong_enum(field)]]),
            (it) => {
              if (!borrowed) {
                it.writeable = true;
              }
              return it;
            }
          );
          // Remove and add, as existing permission may not be writeable
          path_permissions = path_permissions.remove(path_permission);
          path_permissions = path_permissions.add(path_permission);
        }
      }
      for (const field_name of permissions.read) {
        if (field_name in struct.fields) {
          const field = struct.fields[field_name];
          const path_permission = new PathPermission([
            prefix,
            [field_name, get_strong_enum(field)],
          ]);
          if (!path_permissions.contains(path_permission)) {
            path_permissions = path_permissions.add(path_permission);
          }
        }
      }
      // Add permission for owning field itself as readable path if not present
      const field = struct.fields[first];
      const path_permission = new PathPermission([
        prefix,
        [first, get_strong_enum(field)],
      ]);
      path_permissions = path_permissions.add(path_permission);
      // Get permissions for next level
      path_permissions = path_permissions.addAll(
        get_user_path_permissions(
          next_struct,
          [init.slice(1), last, borrowed],
          [...prefix, init[0]]
        )
      );
    }
  }
  for (const field_name of struct.permissions.public) {
    if (field_name in struct.fields) {
      const field = struct.fields[field_name];
      const path_permission = new PathPermission([
        prefix,
        [field_name, get_strong_enum(field)],
      ]);
      if (!path_permissions.contains(path_permission)) {
        path_permissions = path_permissions.add(path_permission);
      }
      if (field.type === "other") {
        const next_struct = get_struct(field.other as StructName);
        const nested_path_permissions = get_public_permissions(next_struct, [
          ...prefix,
          [field_name, next_struct],
        ]);
        for (const permission of nested_path_permissions) {
          if (!path_permissions.contains(permission)) {
            path_permissions = path_permissions.add(permission);
          }
        }
      }
    }
  }
  return path_permissions;
}

export function get_permissions(
  struct: Struct,
  user_paths: Array<PathString>,
  borrows: Array<string>
): HashSet<PathPermission> {
  let path_permissions: HashSet<PathPermission> =
    get_public_permissions(struct);
  const result = unwrap_array(
    apply([], (it: Array<[PathString, boolean]>) => {
      for (const borrow_name of borrows) {
        if (borrow_name in struct.permissions.borrow) {
          const borrow = struct.permissions.borrow[borrow_name];
          it.push([borrow.user_path, true]);
        }
      }
      for (const path of user_paths) {
        it.push([path, false]);
      }
      return it;
    }).map((x) => get_valid_user_path(struct, x[0], x[1]))
  );
  if (unwrap(result)) {
    const valid_user_paths = result.value;
    for (const valid_user_path of valid_user_paths) {
      path_permissions = path_permissions.addAll(
        get_user_path_permissions(struct, valid_user_path)
      );
    }
  }
  return path_permissions;
}

export function log_permissions(
  struct: Struct,
  user_paths: Array<PathString>,
  borrows: Array<string>
) {
  const path_permissions = get_permissions(struct, user_paths, borrows);
  console.log("\n=======================");
  console.log("STRUCT: ", struct.name);
  console.log("\n=======================");
  console.log("READ PERMISSIONS");
  for (const permission of path_permissions.filter((x) => !x.writeable)) {
    console.log(permission.toString());
  }
  console.log("\n=======================");
  console.log("WRITE PERMISSIONS");
  for (const permission of path_permissions.filter((x) => x.writeable)) {
    console.log(permission.toString());
  }
  console.log("\n=======================");
}
