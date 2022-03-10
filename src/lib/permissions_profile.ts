import { HashSet } from "prelude-ts";
import { StructName } from "../schema";
import { get_path_type } from "./commons";
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
          struct_path_from_higher_struct: PathString;
          higher_struct: StructName;
          higher_struct_permission_name: string;
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

function get_perms(
  struct: Struct,
  permission_name: string,
  target_struct_name: StructName,
  parent_stack: ReadonlyArray<[StructName, string]>
): Result<HashSet<PathPermission>> {
  if (
    parent_stack.filter((x) => x[0] === struct.name && x[1] === permission_name)
      .length === 0
  ) {
    const stack: ReadonlyArray<[StructName, string]> = [
      ...parent_stack,
      [struct.name as StructName, permission_name],
    ];
    let path_permissions: HashSet<PathPermission> = HashSet.of();
    if (struct.name === target_struct_name) {
      if (permission_name in struct.permissions.private) {
        const permission = struct.permissions.private[permission_name];
        // Add read, write, public permissions
        for (const field_name of Object.keys(struct.fields)) {
        }
        // traverse all downs recursively
        for (const down of permission.down) {
          const result = get_path_permission(struct, down.struct_path);
          if (unwrap(result)) {
            const prefix_path_permission = result.value;
            if (prefix_path_permission.path[1][1].type === "other") {
              const other_struct = get_struct(
                prefix_path_permission.path[1][1].other as StructName
              );
              const result = get_perms(
                other_struct,
                down.permission_name,
                other_struct.name as StructName,
                stack
              );
              if (unwrap(result)) {
                for (const path_permission of result.value.map(
                  (x) =>
                    new PathPermission([
                      [
                        ...prefix_path_permission.path[0],
                        [
                          prefix_path_permission.path[1][0],
                          other_struct as any,
                        ],
                        ...x.path[0],
                      ],
                      x.path[1],
                    ])
                )) {
                  const result = path_permissions.findAny((x) =>
                    x.equals(path_permission)
                  );
                  if (result.isSome()) {
                    if (!result.get().writeable) {
                      path_permissions = path_permissions
                        .remove(result.get())
                        .add(path_permission);
                    }
                  } else {
                    path_permissions = path_permissions.add(path_permission);
                  }
                }
              } else {
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            } else {
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        }
        // traverse all ups recursively
        for (const up of permission.up) {
          const higher_struct = get_struct(up.higher_struct);
          const result = get_path_type(
            higher_struct as any,
            up.struct_path_from_higher_struct
          );
          if (unwrap(result)) {
            const field_struct_name = result.value;
            if (field_struct_name[0] === "other") {
              const result = get_perms(
                higher_struct,
                up.higher_struct_permission_name,
                target_struct_name,
                stack
              );
              if (unwrap(result)) {
                for (const path_permission of result.value) {
                  const result = path_permissions.findAny((x) =>
                    x.equals(path_permission)
                  );
                  if (result.isSome()) {
                    if (!result.get().writeable) {
                      path_permissions = path_permissions
                        .remove(result.get())
                        .add(path_permission);
                    }
                  } else {
                    path_permissions = path_permissions.add(path_permission);
                  }
                }
              } else {
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
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
    }
    return new Ok(path_permissions);
  } else {
    return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  }
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
