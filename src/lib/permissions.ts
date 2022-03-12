import { HashSet } from "prelude-ts";
import {
  get_path_type,
  get_struct,
  StructName,
  structs,
} from "../schema/struct";
import { errors, ErrMsg } from "./errors";
import { apply, arrow, CustomError, Err, Ok, Result, unwrap } from "./prelude";
import {
  compare_paths,
  get_strong_enum,
  PathString,
  split_path,
  StrongEnum,
  Struct,
} from "./variable";

// TODO. Add fields for marking trigger output, its dependencies and check dependencies.
// This will simplify commons.ts

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
    if (struct.permissions.public.includes(field_name)) {
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
            permission.read.includes(field_name) ||
            permission.write.includes(field_name) ||
            struct.permissions.public.includes(field_name)
          ) {
            const field = struct.fields[field_name];
            const path_permission = apply(
              new PathPermission([[], [field_name, get_strong_enum(field)]]),
              (it) => {
                it.writeable = permission.write.includes(field_name);
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
        if (permission.up !== undefined) {
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
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            } else {
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
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

export type Entrypoint =
  | PathString
  | {
      higher_struct: StructName;
      entrypoint: PathString;
    };

export function get_permissions(
  target_struct: Struct,
  entrypoints: ReadonlyArray<Entrypoint>
): HashSet<PathPermission> {
  let path_permissions: HashSet<PathPermission> =
    get_public_permissions(target_struct);
  if (entrypoints.length !== 0) {
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
  // Mark outputs of trigger updates as non-writeable
  for (const struct_name of Object.keys(structs)) {
    const struct = get_struct(struct_name as StructName);
    for (const trigger_name of Object.keys(struct.triggers)) {
      const trigger = struct.triggers[trigger_name];
      if (trigger.operation.op === "update") {
        for (const path of trigger.operation.path_updates.map((x) => x[0])) {
          const result = get_path_permission(struct, path);
          if (unwrap(result)) {
            if (result.value.path[0].length !== 0) {
              const value =
                result.value.path[0][result.value.path[0].length - 1];
              if (value[1].name === target_struct.name) {
                const result = path_permissions.findAny(
                  (x) => x.path[0].length === 0 && x.path[1][0] === value[0]
                );
                if (result.isSome()) {
                  path_permissions = path_permissions.remove(result.get());
                  path_permissions = path_permissions.add(
                    apply(result.get(), (it) => {
                      it.writeable = false;
                      return it;
                    })
                  );
                }
              }
            }
          }
        }
      }
    }
  }
  return path_permissions;
}

export function log_permissions(
  target_struct: Struct,
  entrypoints: ReadonlyArray<Entrypoint>
) {
  const path_permissions = get_permissions(target_struct, entrypoints);
  console.log("\n=======================");
  console.log("STRUCT: ", target_struct.name);
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
