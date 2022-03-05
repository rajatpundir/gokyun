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

import { NavigatorParams as RootNavigatorParams } from "../../";

import Countries from "./countries";
import Languages from "./languages";
import Tags from "./tags";
import Resource_Types from "./Resource_Types";
import Tests from "./Tests";
import { Dimensions } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { tw } from "../../../../lib";

export type NavigatorParams = {
  Countries: undefined;
  Languages: undefined;
  Tags: undefined;
  Resource_Types: undefined;
  Tests: undefined;
};

export default function Navigator(props: ParentNavigatorProps<"System">) {
  return (
    <TopTab.Navigator
      initialRouteName="Tests"
      initialLayout={{ width: Dimensions.get("window").width }}
      screenOptions={{
        lazy: true,
        tabBarScrollEnabled: true,
        tabBarItemStyle: tw.style([], { width: 100 }),
        tabBarLabelStyle: tw.style([], {
          fontSize: 14,
          textTransform: "none",
        }),
      }}
    >
      <TopTab.Screen name="Countries" component={Countries} />
      <TopTab.Screen name="Languages" component={Languages} />
      <TopTab.Screen name="Tags" component={Tags} />
      <TopTab.Screen
        name="Resource_Types"
        component={Resource_Types}
        options={{
          tabBarLabel: "Resource Types",
        }}
      />
      <TopTab.Screen name="Tests" component={Tests} />
    </TopTab.Navigator>
  );
}

export type NavigatorProps<Screen extends keyof NavigatorParams> =
  CompositeScreenProps<
    MaterialTopTabScreenProps<NavigatorParams, Screen>,
    CompositeScreenProps<
      BottomTabScreenProps<ParentNavigatorParams>,
      NativeStackScreenProps<RootNavigatorParams>
    >
  >;

const TopTab = createMaterialTopTabNavigator<NavigatorParams>();
