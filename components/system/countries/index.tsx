import * as React from "react";

import { FlatList, Platform, StyleSheet, StatusBar as ST } from "react-native";

import { StatusBar } from "expo-status-bar";

import PagerView from "react-native-pager-view";

import { Text, View } from "../../../main/themed";

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

export default function Component() {
  const renderItem = ({ item }) => <Item title={item.title} />;
  return (
    <View
      style={{
        flexDirection: "column",
        flexGrow: 1,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          flexGrow: 1,
        }}
      >
        <FlatList
          horizontal={true}
          data={DATA2}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      </View>
      <View
        style={{
          flexDirection: "column-reverse",
          flexGrow: 1,
        }}
      >
        <PagerView style={styles.viewPager} initialPage={0}>
          <View style={styles.page} key="1">
            <Text>First page</Text>
            <Text>Swipe ➡️</Text>
          </View>
          <View style={styles.page} key="2">
            <Text>Second page</Text>
            <FlatList
              data={DATA}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
            />
          </View>
          <View style={styles.page} key="3">
            <Text>Third page</Text>
            <Text>System1</Text>
            <View>
              <Text>System2</Text>
            </View>
          </View>
        </PagerView>
      </View>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
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
  viewPager: {
    flex: 1,
  },
  page: {
    // justifyContent: "center",
    // alignItems: "center",
  },
});

// const styles = StyleSheet.create({
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
// });
