import * as React from "react";

import { FontAwesome } from "@expo/vector-icons";

import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";

import {
  NavigatorParams as ParentNavigatorParams,
  NavigatorProps as ParentNavigatorProps,
} from "..";

import Clans from "./clans";
import Alliances from "./alliances";
import Guilds from "./guilds";
import Users from "./users";
import System from "./system";

export type NavigatorParams = {
  Clans: undefined;
  Alliances: undefined;
  Guilds: undefined;
  Users: undefined;
  System: undefined;
};

export type NavigatorProps<Screen extends keyof NavigatorParams> =
  CompositeScreenProps<
    BottomTabScreenProps<NavigatorParams, Screen>,
    NativeStackScreenProps<ParentNavigatorParams>
  >;

const BottomTab = createBottomTabNavigator<NavigatorParams>();

export function Navigator(props: ParentNavigatorProps<"Main">) {
  return (
    <BottomTab.Navigator
      initialRouteName="System"
      screenOptions={{
        lazy: true,
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 14 },
      }}
    >
      <BottomTab.Screen
        name="Clans"
        component={Clans}
        options={{
          title: "Clans",
          tabBarIcon: ({ color }) => (
            <FontAwesome
              name="code"
              size={30}
              color={color}
              style={{ margin: -3 }}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="Alliances"
        component={Alliances}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome
              name="code"
              size={30}
              color={color}
              style={{ margin: -3 }}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="Guilds"
        component={Guilds}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome
              name="code"
              size={30}
              color={color}
              style={{ margin: -3 }}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="Users"
        component={Users}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome
              name="code"
              size={30}
              color={color}
              style={{ margin: -3 }}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="System"
        component={System}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome
              name="code"
              size={30}
              color={color}
              style={{ margin: -3 }}
            />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
}
