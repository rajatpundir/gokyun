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

import URL from "./url";
import Scrapper from "./scrapper";
import Upload from "./upload";
import Links from "./links";

export type NavigatorParams = {
  URL: undefined;
  Scrapper: undefined;
  Upload: undefined;
  Links: undefined;
};

export default function Navigator(props: ParentNavigatorProps<"Linker">) {
  return (
    <TopTab.Navigator
      initialRouteName="URL"
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
      <TopTab.Screen name="URL" component={URL} />
      <TopTab.Screen name="Scrapper" component={Scrapper} />
      <TopTab.Screen name="Upload" component={Upload} />
      <TopTab.Screen name="Links" component={Links} />
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
