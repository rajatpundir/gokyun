import { HashSet } from "prelude-ts";
import { StructName } from "../schema";
import { errors, ErrMsg } from "./errors";
import { PathPermission } from "./permissions";
import { apply, CustomError, Err, Ok, Result, unwrap } from "./prelude";
import {
  compare_paths,
  get_strong_enum,
  PathString,
  split_path,
  WeakEnum,
} from "./variable";

type Struct = {
  name: string;
  fields: Record<string, WeakEnum>;
  permissions: {
    private: Record<
      string,
      {
        // entrypoint points to a field with User type
        entrypoint?: PathString;
        read: ReadonlyArray<string>;
        write: ReadonlyArray<string>;
        down: ReadonlyArray<{
          struct_path: PathString;
          permission_name: string;
        }>;
        up: ReadonlyArray<{
          higher_struct: StructName;
          // source and target will have same types and values
          // Path arising from higher_struct
          source: PathString;
          // Path arising from current struct
          target: PathString;
          permission_name: string;
        }>;
      }
    >;
    public: ReadonlyArray<string>;
  };
};

type Entrypoint = {
  source_struct: StructName;
  entrypoint: PathString;
  target_struct: StructName;
};

function get_struct(x: StructName): Struct {
  return {} as any;
}

export function get_permissions(entrypoints: ReadonlyArray<Entrypoint>) {
  let path_permissions: HashSet<PathPermission> = HashSet.of();
  for (const { source_struct, entrypoint, target_struct } of entrypoints.map(
    (x) => {
      return {
        source_struct: get_struct(x.source_struct),
        entrypoint: x.entrypoint,
        target_struct: get_struct(x.target_struct),
      };
    }
  )) {
    let current_struct = source_struct;
    for (const permission_name of Object.keys(
      current_struct.permissions.private
    )) {
      const permission = current_struct.permissions.private[permission_name];
      if (
        permission.entrypoint !== undefined &&
        compare_paths(permission.entrypoint, entrypoint)
      ) {
        if (current_struct.name === target_struct.name) {
          // add read, write permissions, traverse down
          const result = get_down_permissions(current_struct, permission_name);
          if (unwrap(result)) {
            result.value;
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        } else {
          // traverse up and down, push entries to stack for cycle detection
        }
      }
    }
  }
}

function get_down_permissions(
  struct: Struct,
  permission_name: string
): Result<HashSet<PathPermission>> {
  let path_permissions: HashSet<PathPermission> = HashSet.of();
  if (permission_name in struct.permissions.private) {
    const permission = struct.permissions.private[permission_name];
    // process read, write and public permissions
    for (const field_name of Object.keys(struct.fields)) {
      if (
        field_name in permission.read ||
        field_name in permission.write ||
        field_name in struct.permissions.public
      ) {
        const field = struct.fields[field_name];
        path_permissions = path_permissions.add(
          apply(
            new PathPermission([[], [field_name, get_strong_enum(field)]]),
            (it) => {
              it.writeable = field_name in permission.write;
              it.label = field_name;
              return it;
            }
          )
        );
        if (field.type === "other") {
          const other_struct = get_struct(field.other as StructName);
          path_permissions = path_permissions.addAll(
            get_public_permissions(other_struct).map((x) =>
              apply(
                new PathPermission([
                  [[field_name, other_struct as any], ...x.path[0]],
                  x.path[1],
                ]),
                (it) => {
                  it.writeable = false;
                  it.label = x.label;
                  return it;
                }
              )
            )
          );
        }
      }
    }
    // process down permissions
    for (const down of permission.down) {
      const result = get_path_permission(struct, down.struct_path);
      if (unwrap(result)) {
        const path_permission = result.value;
        const value = path_permission.path[1][1];
        if (value.type === "other") {
          const other_struct = get_struct(value.other as StructName);
          const result = get_down_permissions(
            other_struct,
            down.permission_name
          );
          if (unwrap(result)) {
            path_permissions = path_permissions.addAll(
              result.value.map((x) =>
                apply(
                  new PathPermission([
                    [
                      ...path_permission.path[0],
                      [path_permission.path[1][0], other_struct as any],
                      ...x.path[0],
                    ],
                    x.path[1],
                  ]),
                  (it) => {
                    it.writeable = false;
                    it.label = x.label;
                    return it;
                  }
                )
              )
            );
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        } else {
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      } else {
        return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
      }
    }
  } else {
    return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  }
  return new Ok(path_permissions);
}

function get_path_permission(
  struct: Struct,
  path: PathString
): Result<PathPermission> {
  const [first, rest] = split_path(path);
  if (first in struct.fields) {
    const field = struct.fields[first];
    if (rest === undefined) {
      return new Ok(new PathPermission([[], [first, get_strong_enum(field)]]));
    } else {
      if (field.type === "other") {
        return get_path_permission(get_struct(field.other as StructName), rest);
      }
    }
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

function get_public_permissions(struct: Struct): HashSet<PathPermission> {
  return {} as any;
}
