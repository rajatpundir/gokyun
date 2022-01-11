import * as React from "react";

import { Platform, StyleSheet } from "react-native";

import { StatusBar } from "expo-status-bar";

import { NavigatorProps as ParentNavigatorProps } from "..";
import { View, Text } from "../../../../lib/themed";

export default function Component({
  navigation,
}: ParentNavigatorProps<"Clans">) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clans</Text>
      <View style={styles.separator} />
      <Text>Clans</Text>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
