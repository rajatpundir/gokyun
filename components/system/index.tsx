import * as React from "react";

import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  MaterialTopTabScreenProps,
  createMaterialTopTabNavigator,
} from "@react-navigation/material-top-tabs";

import { StackParams as ParentNavigatorParams } from "../../App";

import Countries from "./countries";
import Languages from "./languages";
import Tags from "./tags";
import Categories from "./categories";
import { Dimensions } from "react-native";

export type NavigatorParams = {
  Countries: undefined;
  Languages: undefined;
  Tags: undefined;
  Categories: undefined;
};

export type NavigatorProps<Screen extends keyof NavigatorParams> =
  CompositeScreenProps<
    MaterialTopTabScreenProps<NavigatorParams, Screen>,
    BottomTabScreenProps<ParentNavigatorParams>
  >;

const TopTab = createMaterialTopTabNavigator<NavigatorParams>();

export function Navigator() {
  return (
    <TopTab.Navigator
      initialRouteName="Countries"
      initialLayout={{ width: Dimensions.get("window").width }}
      screenOptions={{
        lazy: true,
        tabBarActiveTintColor: "#ff0000",
        tabBarInactiveTintColor: "#9b9baf",
        tabBarScrollEnabled: true,
        tabBarLabelStyle: {
          fontSize: 13,
          textTransform: "none",
        },
        tabBarItemStyle: { width: 100 },
        tabBarStyle: { backgroundColor: "#000" },
        tabBarIndicatorStyle: { backgroundColor: "#ff0000" },
      }}
    >
      <TopTab.Screen
        name="Countries"
        component={Countries}
        // options={({ navigation }: NavigatorProps<"Countries">) => ({
        //   title: "Countries",
        // })}
      />
      <TopTab.Screen
        name="Languages"
        component={Languages}
        // options={({ navigation }: NavigatorProps<"Languages">) => ({
        //   title: "Languages",
        // })}
      />
      <TopTab.Screen
        name="Tags"
        component={Tags}
        // options={({ navigation }: NavigatorProps<"Tags">) => ({
        //   title: "Tags",
        // })}
      />
      <TopTab.Screen
        name="Categories"
        component={Categories}
        // options={({ navigation }: NavigatorProps<"Categories">) => ({
        //   title: "Categories",
        // })}
      />
    </TopTab.Navigator>
  );
}

export default Navigator;
