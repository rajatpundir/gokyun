import * as React from "react";

import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import {
  NavigatorParams as RootNavigatorParams,
  NavigatorProps as RootNavigatorProps,
} from "../main";

import { Dimensions } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ModalHeader, tw } from "../../lib";

import Public from "./public";
import Private from "./private";

export type NavigatorParams = {
  Public: undefined;
  Private: undefined;
};

export default function Navigator(props: RootNavigatorProps<"Resources">) {
  return (
    <>
      <ModalHeader title="Resources" />
      <TopTab.Navigator
        initialRouteName="Public"
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
        <TopTab.Screen name="Public" component={Public} />
        <TopTab.Screen name="Private" component={Private} />
      </TopTab.Navigator>
    </>
  );
}

export type NavigatorProps<Screen extends keyof NavigatorParams> =
  CompositeScreenProps<
    BottomTabScreenProps<NavigatorParams, Screen>,
    NativeStackScreenProps<RootNavigatorParams>
  >;

const TopTab = createMaterialTopTabNavigator<NavigatorParams>();
