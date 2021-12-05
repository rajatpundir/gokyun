import * as React from "react";

import { Platform, StyleSheet } from "react-native";

import { StatusBar } from "expo-status-bar";

import { Text, View } from "../../main/themed";

import { NavigatorProps as ParentNavigatorProps } from "..";

// Add a ContainerH and ContainerV components
// Move StatusBar with default style into above
// Remove linking for now
// Test dark mode, make it black instead and remove all animation effects

// Show a flat list with a bunch of string, a button at top right to open a modal to add new string
// Some mechanism to update and delete this list
// Edit and Show modes to show or edit this list

export default function Component({
  navigation,
}: ParentNavigatorProps<"Users">) {
  return (
    <View
      style={{
        flexDirection: "column-reverse",
      }}
    >
      <View lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Text>Users1</Text>
      <View>
        <Text>Users2</Text>
      </View>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   alignItems: "center",
  //   justifyContent: "center",
  // },
  // title: {
  //   fontSize: 20,
  //   fontWeight: "bold",
  // },
  // separator: {
  //   marginVertical: 30,
  //   height: 1,
  //   width: "80%",
  // },
});
