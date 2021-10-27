import * as React from "react";

import { Platform, StyleSheet } from "react-native";

import { StatusBar } from "expo-status-bar";

import { Text, View } from "../../main/themed";

export default function Component() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Guilds</Text>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <Text>Guilds</Text>
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
