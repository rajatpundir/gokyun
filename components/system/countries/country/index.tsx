import React from "react";
import { StyleSheet } from "react-native";
import { useImmerReducer } from "use-immer";
import { HashSet, Vector } from "prelude-ts";
import { Struct } from "../../../../main/utils/variable";

import { Text, View } from "../../../../main/themed";
import { TextInput } from "react-native";
import { Action, State, reducer } from "../../../../main/utils/prelude";

// 1. Get whitelisted fields
// Check if creating/updating/deleting/showing
// If creating, show top level fields with write access, and others as read fields as they come
//

export default function Component(props: {
  navigation: any;
  struct: Struct;
  permissions: [HashSet<Vector<string>>, HashSet<Vector<string>>];
  id: number | undefined;
}): JSX.Element {
  // const init: State = {
  // struct: props.struct,
  // id: props.id,
  // values: get_paths(props.permissions, []),
  // };
  // const [state, dispatch] = useImmerReducer<State, Action>(reducer, init);

  // if (state.id === undefined) {
  return (
    <>
      <View>
        <Text>Name</Text>
        <TextInput />
      </View>
    </>
  );
  // } else {
  //   return <Text>Component will show or update or delete</Text>;
  // }
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
