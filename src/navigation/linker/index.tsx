import * as React from "react";

import {
  createBottomTabNavigator,
  BottomTabScreenProps,
} from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CompositeScreenProps } from "@react-navigation/native";

import { Feather } from "@expo/vector-icons";

import {
  NavigatorParams as RootNavigatorParams,
  NavigatorProps as RootNavigatorProps,
} from "../main";

import Resources from "./resources";
import { ModalHeader, tw } from "../../lib";

export type NavigatorParams = {
  Resources: undefined;
};

export default function Navigator(props: RootNavigatorProps<"Linker">) {
  return (
    <>
      <ModalHeader title="Linker" />
      <BottomTab.Navigator
        initialRouteName="Resources"
        screenOptions={{
          lazy: true,
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: { fontSize: 14 },
          tabBarItemStyle: { paddingBottom: 0 },
        }}
      >
        <BottomTab.Screen
          name="Resources"
          component={Resources}
          options={{
            tabBarIcon: ({ color }) => (
              <Feather
                name="box"
                size={28}
                color={color}
                style={tw.style([], { marginBottom: -4 })}
              />
            ),
          }}
        />
      </BottomTab.Navigator>
    </>
  );
}

export type NavigatorProps<Screen extends keyof NavigatorParams> =
  CompositeScreenProps<
    BottomTabScreenProps<NavigatorParams, Screen>,
    NativeStackScreenProps<RootNavigatorParams>
  >;

const BottomTab = createBottomTabNavigator<NavigatorParams>();
