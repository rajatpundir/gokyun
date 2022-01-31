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

import { NavigatorParams as RootParentNavigatorParams } from "../../";

import Countries from "./countries";
import Languages from "./languages";
import Tags from "./tags";
import Categories from "./categories";
import Tests from "./tests";
import { Dimensions } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { tw } from "../../../../lib/utils/tailwind";

export type NavigatorParams = {
  Countries: undefined;
  Languages: undefined;
  Tags: undefined;
  Categories: undefined;
  Tests: undefined;
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

export function Navigator(props: ParentNavigatorProps<"System">) {
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
      <TopTab.Screen name="Categories" component={Categories} />
      <TopTab.Screen name="Tests" component={Tests} />
    </TopTab.Navigator>
  );
}

export default Navigator;
