import React from "react";
import { StyleSheet } from "react-native";

import { NavigatorProps as RootNavigatorProps } from "../../App";
import { Text, View } from "../../main/themed";
import { useImmerReducer } from "use-immer";
import {
  Action,
  get_labeled_path_filters,
  get_top_writeable_paths,
  get_writeable_paths,
  reducer,
  State,
  get_path,
} from "../../main/utils/commons";
import { get_struct } from "../../main/utils/schema";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { get_permissions } from "../../main/utils/permissions";
import { get_variable } from "../../main/utils/db";
import { PathString } from "../../main/utils/variable";
import { Str } from "../../main/utils/fields";
import { apply, unwrap } from "../../main/utils/prelude";

export default function Component(
  props: RootNavigatorProps<"Country">
): JSX.Element {
  const struct = get_struct("Country");
  const [used_paths, borrows]: [Array<PathString>, Array<string>] = [[], []];
  const labels: Array<[string, PathString]> = [["Country Name", [[], "name"]]];
  const [state, dispatch] = useImmerReducer<State, Action>(reducer, {
    id: new Decimal(props.route.params.id),
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
    values: HashSet.of(),
    mode: new Decimal(props.route.params.id).equals(-1) ? "write" : "read",
  });
  React.useEffect(() => {
    const set_title = async (title: string) => {
      props.navigation.setOptions({ headerTitle: title });
    };
    if (unwrap(struct)) {
      if (state.mode === "write") {
        if (state.id.equals(new Decimal(-1))) {
          set_title("Create Country");
        } else {
          set_title("Update Country");
        }
      } else {
        set_title("Country");
      }
    }
    const update_values = async () => {
      if (unwrap(struct)) {
        const path_permissions = get_permissions(
          struct.value,
          used_paths,
          borrows
        );
        if (!state.id.equals(-1)) {
          const result = await get_variable(
            undefined,
            struct.value,
            state.id as Decimal,
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
    update_values();
  }, [state.id]);
  if (unwrap(struct)) {
    if (state.mode === "write") {
      if (state.id.equals(new Decimal(-1))) {
        return create_struct(state, dispatch);
      } else {
        return update_struct(state, dispatch);
      }
    } else {
      return show_struct(state, dispatch);
    }
  }
  return <></>;
}

function create_struct(
  state: State,
  dispatch: React.Dispatch<Action>
): JSX.Element {
  return (
    <View style={{ flex: 1 }}>
      {apply(get_path(state.values, [[], "name"]), (path) => {
        if (unwrap(path)) {
          return (
            <View>
              <Text>{path.value.label}</Text>
              <Str
                mode={"read"}
                state={state}
                dispatch={dispatch}
                path={path.value}
              />
            </View>
          );
        }
        return undefined;
      })}
    </View>
  );
}

function update_struct(
  state: State,
  dispatch: React.Dispatch<Action>
): JSX.Element {
  return (
    <View style={{ flex: 1 }}>
      {apply(get_path(state.values, [[], "name"]), (path) => {
        if (unwrap(path)) {
          return (
            <View>
              <Text>{path.value.label}</Text>
              <Str
                mode={"read"}
                state={state}
                dispatch={dispatch}
                path={path.value}
              />
            </View>
          );
        }
        return undefined;
      })}
    </View>
  );
}

function show_struct(
  state: State,
  dispatch: React.Dispatch<Action>
): JSX.Element {
  return (
    <View style={{ flex: 1 }}>
      {apply(get_path(state.values, [[], "name"]), (path) => {
        if (unwrap(path)) {
          return (
            <View>
              <Text>{path.value.label}</Text>
              <Str
                mode={"read"}
                state={state}
                dispatch={dispatch}
                path={path.value}
              />
            </View>
          );
        }
        return undefined;
      })}
    </View>
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
