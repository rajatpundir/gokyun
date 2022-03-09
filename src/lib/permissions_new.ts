import { HashSet } from "prelude-ts";
import { get_struct, StructName } from "../schema";
import { get_path_with_type } from "./commons";
import { errors, ErrMsg } from "./errors";
import { PathPermission } from "./permissions";
import { Err, CustomError, apply, Result, Ok, unwrap } from "./prelude";
import { get_strong_enum, PathString, split_path, Struct } from "./variable";

// TODO. Borrow is an Existence on some field providing ownership

type UserPath =
  | PathString
  | {
      // Following path starting in higher struct, we should arrive at a field of current which has ownership defined for it
      higher_struct: StructName;
      struct_path: PathString;
      borrow_field: string;
      readonly?: boolean;
      // User path starting in higher_struct
      user_path: UserPath;
    };

export function get_permissions(
  struct: Struct,
  user_paths: ReadonlyArray<UserPath>
): HashSet<PathPermission> {
  let path_permissions: HashSet<PathPermission> = HashSet.of();
  for (const user_path of user_paths) {
    const result = get_private_permissions(struct, user_path);
    if (unwrap(result)) {
      path_permissions = path_permissions.addAll(result.value);
    } else {
      console.log("[ERROR] Permissions:", user_path);
    }
  }
  path_permissions = path_permissions.addAll(get_public_permissions(struct));
  if (true) {
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
  return path_permissions;
}

function get_private_permissions(
  struct: Struct,
  user_path: UserPath
): Result<HashSet<PathPermission>> {
  let path_permissions: HashSet<PathPermission> = HashSet.of();
  if (Array.isArray(user_path)) {
    const [field_name, rest] = split_path(user_path);
    if (field_name in struct.fields) {
      const field = struct.fields[field_name];
      if (rest !== undefined) {
        if (
          field.type === "other" &&
          field_name in struct.permissions.ownership
        ) {
          const other_struct = get_struct(field.other as StructName);
          const result = get_private_permissions(other_struct, rest);
          if (unwrap(result)) {
            path_permissions = path_permissions.addAll(
              result.value.map((x) =>
                apply(
                  new PathPermission([
                    [[field_name, other_struct], ...x.path[0]],
                    x.path[1],
                  ]),
                  (it) => {
                    it.writeable = x.writeable;
                    it.label = x.label;
                    return it;
                  }
                )
              )
            );
            const ownership = struct.permissions.ownership[field_name];
            for (const owned_field_name of ownership.write) {
              if (owned_field_name in struct.fields) {
                const owned_field = struct.fields[owned_field_name];
                path_permissions = path_permissions.add(
                  apply(
                    new PathPermission([
                      [],
                      [owned_field_name, get_strong_enum(owned_field)],
                    ]),
                    (it) => {
                      it.writeable = true;
                      it.label = owned_field_name;
                      return it;
                    }
                  )
                );
              } else {
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            }
            for (const owned_field_name of ownership.read) {
              if (owned_field_name in struct.fields) {
                const owned_field = struct.fields[owned_field_name];
                path_permissions = path_permissions.add(
                  apply(
                    new PathPermission([
                      [],
                      [owned_field_name, get_strong_enum(owned_field)],
                    ]),
                    (it) => {
                      it.label = owned_field_name;
                      return it;
                    }
                  )
                );
              } else {
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            }
            if (
              !(field_name in ownership.write || field_name in ownership.read)
            ) {
              path_permissions = path_permissions.add(
                apply(
                  new PathPermission([
                    [],
                    [field_name, get_strong_enum(field)],
                  ]),
                  (it) => {
                    it.label = field_name;
                    return it;
                  }
                )
              );
            }
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        } else {
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      } else {
        if (
          field.type === "other" &&
          field.other === "User" &&
          field_name in struct.permissions.ownership
        ) {
          const ownership = struct.permissions.ownership[field_name];
          for (const owned_field_name of ownership.write) {
            if (owned_field_name in struct.fields) {
              const owned_field = struct.fields[owned_field_name];
              path_permissions = path_permissions.add(
                apply(
                  new PathPermission([
                    [],
                    [owned_field_name, get_strong_enum(owned_field)],
                  ]),
                  (it) => {
                    it.writeable = true;
                    it.label = owned_field_name;
                    return it;
                  }
                )
              );
            } else {
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
          }
          for (const owned_field_name of ownership.read) {
            if (owned_field_name in struct.fields) {
              const owned_field = struct.fields[owned_field_name];
              path_permissions = path_permissions.add(
                apply(
                  new PathPermission([
                    [],
                    [owned_field_name, get_strong_enum(owned_field)],
                  ]),
                  (it) => {
                    it.label = owned_field_name;
                    return it;
                  }
                )
              );
            } else {
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
          }
          if (
            !(field_name in ownership.write || field_name in ownership.read)
          ) {
            path_permissions = path_permissions.add(
              apply(
                new PathPermission([[], [field_name, get_strong_enum(field)]]),
                (it) => {
                  it.label = field_name;
                  return it;
                }
              )
            );
          }
        } else {
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      }
    } else {
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    }
  } else {
    const higher_struct = get_struct(user_path.higher_struct);
    const result = get_path_with_type(higher_struct, user_path.struct_path);
    if (unwrap(result)) {
      const field_struct_name = result.value[1];
      if (
        field_struct_name[0] === "other" &&
        field_struct_name[1].name === struct.name
      ) {
        if (user_path.borrow_field in struct.fields) {
          const field = struct.fields[user_path.borrow_field];
          if (user_path.borrow_field in struct.permissions.ownership) {
            const ownership =
              struct.permissions.ownership[user_path.borrow_field];
            if (
              unwrap(
                get_private_permissions(higher_struct, user_path.user_path)
              )
            ) {
              for (const owned_field_name of ownership.write) {
                if (owned_field_name in struct.fields) {
                  const owned_field = struct.fields[owned_field_name];
                  path_permissions = path_permissions.add(
                    apply(
                      new PathPermission([
                        [],
                        [owned_field_name, get_strong_enum(owned_field)],
                      ]),
                      (it) => {
                        if (
                          user_path.readonly !== undefined &&
                          user_path.readonly === false
                        ) {
                          it.writeable = true;
                        }
                        it.label = owned_field_name;
                        return it;
                      }
                    )
                  );
                } else {
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
              for (const owned_field_name of ownership.read) {
                if (owned_field_name in struct.fields) {
                  const owned_field = struct.fields[owned_field_name];
                  path_permissions = path_permissions.add(
                    apply(
                      new PathPermission([
                        [],
                        [owned_field_name, get_strong_enum(owned_field)],
                      ]),
                      (it) => {
                        it.label = owned_field_name;
                        return it;
                      }
                    )
                  );
                } else {
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
              if (
                !(
                  user_path.borrow_field in ownership.write ||
                  user_path.borrow_field in ownership.read
                )
              ) {
                path_permissions = path_permissions.add(
                  apply(
                    new PathPermission([
                      [],
                      [user_path.borrow_field, get_strong_enum(field)],
                    ]),
                    (it) => {
                      it.label = user_path.borrow_field;
                      return it;
                    }
                  )
                );
              }
            } else {
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
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
  }
  for (const path_permission of path_permissions.toArray()) {
    const field_name = path_permission.path[1][0];
    const value = path_permission.path[1][1];
    if (value.type === "other") {
      const other_struct = get_struct(value.other as StructName);
      path_permissions = path_permissions.addAll(
        get_public_permissions(other_struct).map((x) =>
          apply(
            new PathPermission([
              [
                ...path_permission.path[0],
                [field_name, other_struct],
                ...x.path[0],
              ],
              x.path[1],
            ]),
            (it) => {
              it.writeable = x.writeable;
              it.label = x.label;
              return it;
            }
          )
        )
      );
    }
  }
  return new Ok(path_permissions);
}

function get_public_permissions(struct: Struct): HashSet<PathPermission> {
  let path_permissions: HashSet<PathPermission> = HashSet.of();
  for (const field_name of Object.keys(struct.fields)) {
    const field = struct.fields[field_name];
    if (field_name in struct.permissions.public) {
      if (field.type !== "other") {
        path_permissions = path_permissions.add(
          apply(
            new PathPermission([[], [field_name, get_strong_enum(field)]]),
            (it) => {
              it.label = field_name;
              return it;
            }
          )
        );
      } else {
        const other_struct = get_struct(field.other as StructName);
        path_permissions = path_permissions.addAll(
          get_public_permissions(other_struct).map((x) =>
            apply(
              new PathPermission([
                [[field_name, other_struct], ...x.path[0]],
                x.path[1],
              ]),
              (it) => {
                it.label = x.label;
                return it;
              }
            )
          )
        );
      }
    }
  }
  return path_permissions;
}
