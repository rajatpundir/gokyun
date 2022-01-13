import * as React from "react";

import { Platform, StyleSheet, StatusBar as ST, Pressable } from "react-native";

import { StatusBar } from "expo-status-bar";

import { Option } from "prelude-ts";
import { SimpleLineIcons } from "@expo/vector-icons";
import { NavigatorProps as ParentNavigatorProps } from "..";
import { useNavigation } from "@react-navigation/core";

import { View, Text } from "../../../../../lib/themed";
import { getState, subscribe } from "../../../../../lib/utils/store";
import { get_structs } from "../../../../../lib/utils/schema";
import { Struct } from "../../../../../lib/utils/variable";

// Add a ContainerH and ContainerV components
// Move StatusBar with default style into above

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
    <View
      style={{
        flexDirection: "column",
        flexGrow: 1,
      }}
    >
      {/* <A />
      <B />
      <A /> */}

      {/* Floating button */}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
      <Pressable
        onPress={() => navigation.navigate("Test", { id: -1 })}
        style={styles.touchableOpacityStyle}
      >
        <SimpleLineIcons name="plus" size={36} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: ST.currentHeight || 0,
  },
  item: {
    backgroundColor: "#f9c2ff",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 32,
  },
  touchableOpacityStyle: {
    position: "absolute",
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    right: 30,
    bottom: 30,
  },
});
