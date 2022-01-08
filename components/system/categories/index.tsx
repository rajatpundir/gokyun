import * as React from "react";

import { Platform, StyleSheet, StatusBar as ST } from "react-native";

import { StatusBar } from "expo-status-bar";

import { Text, View } from "../../../main/themed";

import { NavigatorProps as ParentNavigatorProps } from "..";
import { colors } from "../../../main/themed/colors";

export default function Component(props: ParentNavigatorProps<"Categories">) {
  return (
    <View
      style={{
        flexDirection: "column",
        flexGrow: 1,
        backgroundColor: colors.custom.black[900],
      }}
    >
      <Text>ddd</Text>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: ST.currentHeight || 0,
  },
});
