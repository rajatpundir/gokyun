import * as React from "react";

import { Option } from "prelude-ts";
import { NavigatorProps as ParentNavigatorProps } from "..";
import { useNavigation } from "@react-navigation/core";

import { getState, subscribe } from "../../../../../lib/utils/store";
import { get_structs } from "../../../../../lib/utils/schema";
import { Struct } from "../../../../../lib/utils/variable";
import { Column, Pressable, Text } from "native-base";

function A() {
  const [x, setX] = React.useState(getState().db_updation_toggle);
  subscribe((s) => {
    setX(s.db_updation_toggle);
  });
  console.log("A", x);
  return (
    <>
      <Pressable
        onPress={() => {
          console.log("A is toggling toggle");
          getState().toggle_db_update_toggle();
        }}
      >
        <Text>AAAAAAAAAAAAAAAA</Text>
      </Pressable>
    </>
  );
}

function B() {
  const [x, setX] = React.useState(getState().db_updation_toggle);
  subscribe((s) => {
    setX(s.db_updation_toggle);
  });
  console.log("B", x);
  return (
    <>
      <Pressable
        onPress={() => {
          console.log("B is toggling toggle");
          getState().toggle_db_update_toggle();
        }}
      >
        <Text>BBBBBBBBBBBBBBB</Text>
      </Pressable>
    </>
  );
}

const struct: Option<Struct> = get_structs()
  .filter((s) => s.name === "User")
  .single();

export default function Component(props: ParentNavigatorProps<"Countries">) {
  const navigation = useNavigation();

  // if (struct.isSome()) {
  //   log_permissions(struct.get(), [], []);
  // } else {
  //   console.log("---nothing---");
  // }

  return (
    <>
      <Column>
        {/* <A />
      <B />
      <A /> */}
      </Column>
    </>
  );
}
