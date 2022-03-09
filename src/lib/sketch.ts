import { HashSet } from "prelude-ts";
import { StructName } from "../schema/struct";
import { PathPermission } from "./permissions";
import { PathString, WeakEnum } from "./variable";

type PathStrings = ReadonlyArray<
  string | { prefix: string; paths: PathStrings }
>;

type Struct = {
  fields: Record<string, WeakEnum>;
  permissions: {
    private: Record<
      string,
      {
        paths: PathStrings;
        read: PathStrings;
        write: PathStrings;
        inherit?: ReadonlyArray<{
          struct_path: PathString;
          mode: "read" | "write" | "read-write" | "all-read";
        }>;
        borrow?: ReadonlyArray<{
          higher_struct: StructName;
          // path from higher_struct should lead to the the field
          path: PathString;
          read: PathStrings;
          write: PathStrings;
          inherit?: ReadonlyArray<{
            struct_path: PathString;
            mode: "read" | "write" | "read-write" | "all-read";
          }>;
        }>;
      }
    >;
    public: PathStrings;
  };
};

type UserPath =
  | PathString
  | {
      struct: StructName;
      path: UserPath;
    };

export function get_permissions(
  struct: Struct,
  user_paths: ReadonlyArray<UserPath>
): HashSet<PathPermission> {
  let path_permissions: HashSet<PathPermission> = HashSet.of();

  return path_permissions;
}

function contains_path_string(
  list: ReadonlyArray<PathString>,
  path_string: PathString
): boolean {
  return false;
}
