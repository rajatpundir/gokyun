import * as React from "react";

import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  MaterialTopTabScreenProps,
  createMaterialTopTabNavigator,
} from "@react-navigation/material-top-tabs";

import {
  NavigatorParams as ParentNavigatorParams,
  NavigatorProps as ParentNavigatorProps,
} from "../index";

import { NavigatorParams as RootParentNavigatorParams } from "../../App";

import Countries from "./countries";
import Languages from "./languages";
import Tags from "./tags";
import Categories from "./categories";
import { Dimensions } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../main/themed/colors";

export type NavigatorParams = {
  Countries: undefined;
  Languages: undefined;
  Tags: undefined;
  Categories: undefined;
};

export type NavigatorProps<Screen extends keyof NavigatorParams> =
  CompositeScreenProps<
    MaterialTopTabScreenProps<NavigatorParams, Screen>,
    CompositeScreenProps<
      BottomTabScreenProps<ParentNavigatorParams>,
      NativeStackScreenProps<RootParentNavigatorParams>
    >
  >;

const TopTab = createMaterialTopTabNavigator<NavigatorParams>();

export function Navigator({ navigation }: ParentNavigatorProps<"System">) {
  return (
    <TopTab.Navigator
      initialRouteName="Countries"
      initialLayout={{ width: Dimensions.get("window").width }}
      screenOptions={{
        lazy: true,
        tabBarActiveTintColor: colors.custom.red[900],
        tabBarInactiveTintColor: "#9b9baf",
        tabBarScrollEnabled: true,
        tabBarLabelStyle: {
          fontSize: 13,
          textTransform: "none",
        },
        tabBarItemStyle: { width: 100 },
        tabBarStyle: { backgroundColor: colors.custom.black[900] },
        tabBarIndicatorStyle: {
          backgroundColor: colors.custom.red[900],
        },
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
