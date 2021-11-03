import * as React from "react";

import {
  FlatList,
  Platform,
  StyleSheet,
  StatusBar as ST,
  Button,
  TouchableOpacity,
  Image,
} from "react-native";

import { StatusBar } from "expo-status-bar";

import { Text, View } from "../../../main/themed";
import { HashSet, Option } from "prelude-ts";
import { FontAwesome, SimpleLineIcons } from "@expo/vector-icons";
import { Immutable, Draft } from "immer";
import { get_structs } from "../../../main/utils/schema";
import { Struct } from "../../../main/utils/variable";
import {
  validate_ownership_path,
  get_permissions,
} from "../../../main/utils/permissions";

// Add a ContainerH and ContainerV components
// Move StatusBar with default style into above
// Remove linking for now
// Test dark mode, make it black instead and remove all animation effects

// Show a flat list with a bunch of string, a button at top right to open a modal to add new string
// Some mechanism to update and delete this list
// Edit and Show modes to show or edit this list

const DATA = [
  {
    id: "bd7acbea-c1b1-46c2-aed5-3ad53abb28ba",
    title: "First Item",
  },
  {
    id: "3ac68afc-c605-48d3-a4f8-fbd91aa97f63",
    title: "Second Item",
  },
  {
    id: "58694a0f-3da1-471f-bd96-145571e29d72",
    title: "Third Item",
  },
];

const DATA2 = [
  {
    id: "bd7acbea-c1b1-46c2-aed5-3ad53abb28ba",
    title: "First Item",
  },
  {
    id: "3ac68afc-c605-48d3-a4f8-fbd91aa97f63",
    title: "Second Item",
  },
];

const Item = ({ title }: { title: string }) => (
  <View style={styles.item}>
    <Text style={styles.title}>{title}</Text>
  </View>
);

const struct: Option<Struct> = get_structs()
  .filter((s) => s.name === "Alliance_Member")
  .single();

export default function Component() {
  if (struct.isSome()) {
    // console.log(get_permissions(struct.get(), []));
    console.log(validate_ownership_path(struct.get(), ["member"]));
    console.log("=======================");
    console.log(
      get_permissions(struct.get(), [["alliance", "wallet", "user"]], [])
    );
    console.log("=======================");
  } else {
    console.log("---nothing---");
  }
  const renderItem = ({ item }) => <Item title={item.title} />;
  return (
    <View
      style={{
        flexDirection: "column",
        flexGrow: 1,
      }}
    >
      <FlatList
        data={DATA2}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => console.log("000")}
        style={styles.touchableOpacityStyle}
      >
        <SimpleLineIcons name="plus" size={36} color="white" />
      </TouchableOpacity>
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
