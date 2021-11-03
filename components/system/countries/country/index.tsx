import React, { useEffect, useState } from "react";
import { Immutable, Draft } from "immer";
import { useImmerReducer } from "use-immer";
import { HashSet, Option, Vector } from "prelude-ts";
import { Path, StrongEnum, Struct } from "../../../../main/utils/variable";
import { get_structs } from "../../../../main/utils/schema";

import { Text, View } from "../../../../main/themed";
import { TextInput } from "react-native";

const struct: Option<Struct> = get_structs()
  .filter((s) => s.name === "Country")
  .single();

type State = Immutable<{
  struct: Struct;
  id: number | undefined;
  values: {
    name: [
      ["name"],
      {
        type: "str";
        value: string;
      }
    ];
  };
}>;

type Action = [Path, StrongEnum];

function reducer(state: Draft<State>, action: Action) {}

export default function Component(props: {
  id: number | undefined;
  // ownership paths and borrow paths will be provided
  ownership: ReadonlyArray<string>;
  borrow: ReadonlyArray<string>;
}): JSX.Element {
  if (struct.isSome()) {
    if (props.id === undefined) {
      const init: State = {
        struct: struct.get(),
        id: undefined,
        values: {
          name: [
            ["name"],
            {
              type: "str",
              value: "",
            },
          ],
        },
      };
      const [state, dispatch] = useImmerReducer<State, Action>(reducer, init);

      return (
        <>
          <View>
            <Text>Name</Text>
            <TextInput
              // style={styles.input}
              // onChangeText={onChangeText}
              value={state.values.name[1].value}
            />
          </View>
        </>
      );
    } else {
      return <Text>Component will show or update or delete</Text>;
    }
  } else {
    // return new Err(new CustomError([errors.ErrUnexpected] as Message));
    return <Text>Component will show or update or delete</Text>;
  }
}
