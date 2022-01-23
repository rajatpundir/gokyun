import * as React from "react";

import { Pressable } from "react-native";

import { Option } from "prelude-ts";
import { NavigatorProps as ParentNavigatorProps } from "..";
import { useNavigation } from "@react-navigation/core";

import { getState, subscribe } from "../../../../../lib/utils/store";
import { get_structs } from "../../../../../lib/utils/schema";
import { Struct } from "../../../../../lib/utils/variable";
import { Column, Fab, Icon, Text } from "native-base";
import { theme } from "../../../../../lib/utils/theme";
import { AntDesign } from "@expo/vector-icons";

// Show a flat list with a bunch of string, a button at top right to open a modal to add new string
// Some mechanism to update and delete this list
// Edit and Show modes to show or edit this list

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
      <Fab
        m={"2"}
        onPress={() => navigation.navigate("Test", { id: -1 })}
        renderInPortal={false}
        placement="bottom-right"
        icon={<Icon color="white" as={<AntDesign name="plus" />} size="sm" />}
        backgroundColor={theme.primary}
      />
    </>
  );
}
