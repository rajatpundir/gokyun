import { HashSet } from "prelude-ts";
import { get_struct, StructName } from "../schema";
import { errors, ErrMsg } from "./errors";
import { PathPermission } from "./permissions";
import { Err, CustomError } from "./prelude";
import { PathString, Struct } from "./variable";

// TODO. Borrow is an Existence on some field providing ownership

// user_paths and borrow concepts can be merged as below
type UserPath =
  | PathString
  | {
      // Following path starting in higher struct, we should arrive at a field of current which has ownership defined for it
      higher_struct: StructName;
      path: PathString;
      // User path starting in higher_struct
      user_path: UserPath;
    };

function split_path(path: PathString): [string, PathString | undefined] {
  if (path[0].length === 0) {
    return [path[1], undefined];
  } else {
    return [path[0][0], [path[0].slice(1), path[1]]];
  }
}

function get_permissions(struct: Struct, user_path: UserPath) {
  let path_permissions: HashSet<PathPermission> = HashSet.of();
  if (Array.isArray(user_path)) {
    const [field_name, rest] = split_path(user_path);
    if (field_name in struct.fields) {
      const field = struct.fields[field_name];
      if (rest !== undefined) {
        if (field.type === "other") {
          const other_struct = get_struct(field.other as StructName);
        } else {
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      } else {
      }
    } else {
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    }
  } else {
    const higher_struct = get_struct(user_path.higher_struct);
    const [field_name, rest] = split_path(user_path.path);
    if (field_name in higher_struct.fields) {
      const field = higher_struct.fields[field_name];
      if (rest !== undefined) {
        if (field.type === "other") {
          const other_struct = get_struct(field.other as StructName);
        } else {
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      } else {
      }
    } else {
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    }
    user_path;
  }
}
