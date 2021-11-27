import React from "react";
import { StyleSheet } from "react-native";

import { NavigatorProps as RootNavigatorProps } from "../../App";
import { Text, View } from "../../main/themed";
import { TextInput } from "react-native";
import { useImmerReducer } from "use-immer";
import {
  Action,
  apply,
  reducer,
  State,
  unwrap,
} from "../../main/utils/prelude";
import { get_struct } from "../../main/utils/schema";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { get_permissions, PathPermission } from "../../main/utils/permissions";
import { get_variable, PathFilter } from "../../main/utils/db";
import { Path, PathString, StrongEnum } from "../../main/utils/variable";
import { useNavigation } from "@react-navigation/core";

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

function get_labeled_path_filters(
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

function get_top_writeable_paths(
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

function get_writeable_paths(
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

// Labels(Shortlisted paths)
// -> PathPermission(s) for shortlisted paths(subset for creation)
// -> PathFilter(s)
// -> Path(s)

export default function Component(
  props: RootNavigatorProps<"Country">
): JSX.Element {
  const labels: Array<[string, PathString]> = [["Country Name", [[], "name"]]];
  const used_paths: Array<PathString> = [];
  const borrows: Array<string> = [];
  const struct = get_struct("Country");
  const [state, dispatch] = useImmerReducer<State, Action>(reducer, {
    id: new Decimal(props.route.params.id),
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
    values: HashSet.of(),
    mode: props.route.params.id === -1 ? "write" : "read",
  });
  React.useEffect(() => {
    const x = async () => {
      if (unwrap(struct)) {
        const path_permissions = get_permissions(
          struct.value,
          used_paths,
          borrows
        );
        if (props.route.params.id !== -1) {
          // fetch values from database
          const result = await get_variable(
            undefined,
            struct.value,
            new Decimal(props.route.params.id),
            true,
            get_labeled_path_filters(path_permissions, labels)
          );
          if (unwrap(result)) {
            const variable = result.value;
            dispatch([
              "variable",
              apply(variable, (it) => {
                it.paths = get_writeable_paths(it.paths, path_permissions);
                return it;
              }),
            ]);
          }
        } else {
          for (let path of get_top_writeable_paths(path_permissions, labels)) {
            dispatch(["values", path]);
          }
        }
      }
    };
    x();
  }, []);
  if (unwrap(struct)) {
    const path_permissions = get_permissions(struct.value, used_paths, borrows);
    if (state.mode === "write") {
      if (state.id.equals(new Decimal(-1))) {
        // do whatever with values
        return (
          <>
            <View>
              <Text>Create your country</Text>
              <TextInput />
            </View>
          </>
        );
      } else {
        // do whatever with values
        return (
          <>
            <View>
              <Text>Update your country</Text>
              <TextInput />
            </View>
          </>
        );
      }
    } else {
      // do whatever with values
      return (
        <>
          <View>
            <Text>Read your country</Text>
            <TextInput />
          </View>
        </>
      );
    }
  }
  const navigation = useNavigation();
  navigation.goBack();
  return (
    <>
      <View>
        <Text>There is no such thing as a Country</Text>
        <TextInput />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "grey",
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
  },
});
