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

import { NavigatorParams as RootNavigatorParams } from "../../main";

import { Dimensions } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { tw } from "../../../lib/utils/tailwind";

import Link from "./link";
import Scrap from "./scrap";
import Upload from "./upload";
import Resources from "./links";

export type NavigatorParams = {
  Links: undefined;
  Link: undefined;
  Scrap: undefined;
  Upload: undefined;
};

export default function Navigator(props: ParentNavigatorProps<"Resources">) {
  return (
    <TopTab.Navigator
      initialRouteName="Link"
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
      <TopTab.Screen
        name="Links"
        component={Resources}
        options={{ tabBarLabel: "Resources" }}
      />
      <TopTab.Screen name="Link" component={Link} />
      <TopTab.Screen name="Scrap" component={Scrap} />
      <TopTab.Screen name="Upload" component={Upload} />
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
