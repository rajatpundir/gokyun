import * as React from "react";

import { FontAwesome } from "@expo/vector-icons";

import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  MaterialTopTabScreenProps,
  createMaterialTopTabNavigator,
} from "@react-navigation/material-top-tabs";

import Colors from "../../main/constants/Colors";
import useColorScheme from "../../main/hooks/useColorScheme";
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

const BottomTab = createMaterialTopTabNavigator<NavigatorParams>();

export function Navigator() {
  const colorScheme = useColorScheme();

  return (
    <BottomTab.Navigator
      initialRouteName="Countries"
      initialLayout={{ width: Dimensions.get("window").width }}
      screenOptions={{
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
      <BottomTab.Screen
        name="Countries"
        component={Countries}
        // options={({ navigation }: NavigatorProps<"Countries">) => ({
        //   title: "Countries",
        // })}
      />
      <BottomTab.Screen
        name="Languages"
        component={Languages}
        // options={({ navigation }: NavigatorProps<"Languages">) => ({
        //   title: "Languages",
        // })}
      />
      <BottomTab.Screen
        name="Tags"
        component={Tags}
        // options={({ navigation }: NavigatorProps<"Tags">) => ({
        //   title: "Tags",
        // })}
      />
      <BottomTab.Screen
        name="Categories"
        component={Categories}
        // options={({ navigation }: NavigatorProps<"Categories">) => ({
        //   title: "Categories",
        // })}
      />
    </BottomTab.Navigator>
  );
}

export default Navigator;
