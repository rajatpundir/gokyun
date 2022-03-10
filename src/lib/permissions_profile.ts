import { HashSet } from "prelude-ts";
import { get_struct, StructName } from "../schema";
import { get_path_type } from "./commons";
import { errors, ErrMsg } from "./errors";
import { PathPermission } from "./permissions";
import { apply, arrow, CustomError, Err, Ok, Result, unwrap } from "./prelude";
import {
  compare_paths,
  get_strong_enum,
  PathString,
  split_path,
  Struct,
} from "./variable";

export type Entrypoint =
  | PathString
  | {
      higher_struct: StructName;
      entrypoint: PathString;
    };

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
  let path_permissions: HashSet<PathPermission> = HashSet.of();
  for (const field_name of Object.keys(struct.fields)) {
    if (field_name in struct.permissions.public) {
      const field = struct.fields[field_name];
      path_permissions = path_permissions.add(
        apply(
          new PathPermission([[], [field_name, get_strong_enum(field)]]),
          (it) => {
            it.label = field_name;
            return it;
          }
        )
      );
      if (field.type === "other") {
        const other_struct = get_struct(field.other as StructName);
        path_permissions = path_permissions.addAll(
          get_public_permissions(other_struct).map(
            (x) =>
              new PathPermission([
                [[field_name, other_struct], ...x.path[0]],
                x.path[1],
              ])
          )
        );
      }
    }
  }
  return path_permissions;
}

function get_private_permissions(
  struct: Struct,
  permission_name: string,
  target_struct: Struct,
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
    if (struct.name === target_struct.name) {
      if (permission_name in struct.permissions.private) {
        const permission = struct.permissions.private[permission_name];
        // Add read, write, public permissions
        for (const field_name of Object.keys(struct.fields)) {
          if (
            field_name in permission.read ||
            field_name in permission.write ||
            field_name in struct.permissions.public
          ) {
            const field = struct.fields[field_name];
            const path_permission = apply(
              new PathPermission([[], [field_name, get_strong_enum(field)]]),
              (it) => {
                it.writeable = field_name in permission.write;
                it.label = field_name;
                return it;
              }
            );
            const result = path_permissions.findAny((x) =>
              x.equals(path_permission)
            );
            if (result.isSome()) {
              path_permissions = path_permissions
                .remove(result.get())
                .add(path_permission);
            } else {
              path_permissions = path_permissions.add(path_permission);
            }
            if (field.type === "other") {
              const other_struct = get_struct(field.other as StructName);
              path_permissions = path_permissions.addAll(
                get_public_permissions(other_struct).map(
                  (x) =>
                    new PathPermission([
                      [[field_name, other_struct], ...x.path[0]],
                      x.path[1],
                    ])
                )
              );
            }
          }
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
              const result = get_private_permissions(
                other_struct,
                down.permission_name,
                other_struct,
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
          const higher_struct = get_struct(up.higher_struct as StructName);
          const result = get_path_type(
            higher_struct,
            up.struct_path_from_higher_struct
          );
          if (unwrap(result)) {
            const field_struct_name = result.value;
            if (field_struct_name[0] === "other") {
              const result = get_private_permissions(
                higher_struct,
                up.higher_struct_permission_name,
                target_struct,
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

export function get_permissions(
  target_struct: Struct,
  entrypoints: ReadonlyArray<Entrypoint>
): HashSet<PathPermission> {
  let path_permissions: HashSet<PathPermission> =
    get_public_permissions(target_struct);
  if (entrypoints.length !== 0) {
    let path_permissions: HashSet<PathPermission> = HashSet.of();
    for (const entrypoint of entrypoints) {
      const [source_struct, source_entrypoint] = arrow(() => {
        if (Array.isArray(entrypoint)) {
          return [target_struct, entrypoint];
        } else {
          return [get_struct(entrypoint.higher_struct), entrypoint.entrypoint];
        }
      });
      for (const permission_name of Object.keys(
        target_struct.permissions.private
      )) {
        const permission = target_struct.permissions.private[permission_name];
        if (
          permission.entrypoint !== undefined &&
          compare_paths(permission.entrypoint, source_entrypoint)
        ) {
          const result = get_private_permissions(
            source_struct,
            permission_name,
            target_struct,
            []
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
            console.log("[PERMISSIONS]: Error");
          }
        }
      }
    }
  }
  return path_permissions;
}
