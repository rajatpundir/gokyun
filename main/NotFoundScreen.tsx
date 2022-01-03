import * as React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { NavigatorProps as ParentNavigatorProps } from "../App";
import { colors } from "./themed/colors";

export default function NotFoundScreen(
  props: ParentNavigatorProps<"NotFound">
) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This screen doesn't exist.</Text>
      <TouchableOpacity
        onPress={() => props.navigation.replace("Main")}
        style={styles.link}
      >
        <Text style={styles.linkText}>Go to home screen!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.tailwind.slate[400],
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: "#2e78b7",
  },
});
