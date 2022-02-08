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

import Image from "./images";
import Video from "./videos";
import Docs from "./docs";
import Apps from "./apps";

export type NavigatorParams = {
  Images: undefined;
  Videos: undefined;
  Docs: undefined;
  Apps: undefined;
};

export default function Navigator(props: ParentNavigatorProps<"Linker">) {
  return (
    <TopTab.Navigator
      initialRouteName="Images"
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
      <TopTab.Screen name="Images" component={Image} />
      <TopTab.Screen name="Videos" component={Video} />
      <TopTab.Screen name="Docs" component={Docs} />
      <TopTab.Screen name="Apps" component={Apps} />
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
