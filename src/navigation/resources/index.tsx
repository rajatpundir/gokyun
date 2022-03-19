import React from "react";

import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import {
  NavigatorParams as RootNavigatorParams,
  NavigatorProps as RootNavigatorProps,
} from "../main";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ModalHeader, tw } from "../../lib";

import Linker from "./linker";
import Shared from "./shared";
import Personal from "./personal";
import { dimensions } from "../../lib/commons";

export type NavigatorParams = {
  Linker: undefined;
  Shared: undefined;
  Personal: undefined;
};

export default function Navigator(props: RootNavigatorProps<"Resources">) {
  return (
    <>
      <ModalHeader title="Resources" />
      <TopTab.Navigator
        initialRouteName="Personal"
        screenOptions={{
          lazy: true,
          tabBarScrollEnabled: true,
          tabBarItemStyle: tw.style([], {
            width: dimensions.width / 3.5,
          }),
          tabBarLabelStyle: tw.style([], {
            fontSize: 14,
            textTransform: "none",
          }),
        }}
      >
        <TopTab.Screen name="Linker" component={Linker} />
        <TopTab.Screen name="Personal" component={Personal} />
        <TopTab.Screen name="Shared" component={Shared} />
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
