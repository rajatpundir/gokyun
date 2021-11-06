import * as React from "react";

import { FontAwesome } from "@expo/vector-icons";

import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";

import { StackParams as ParentNavigatorParams } from "../App";

import Clans from "./clans";
import Alliances from "./alliances";
import Guilds from "./guilds";
import Users from "./users";
import System from "./system";
import { Platform } from "react-native";

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

function NavigatorItemIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={30} style={{ marginBottom: -3 }} {...props} />;
}

export function Navigator() {
  return (
    <BottomTab.Navigator
      initialRouteName="System"
      screenOptions={{
        lazy: true,
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#9b9baf",
        tabBarLabelStyle: { fontSize: 11 },
        tabBarStyle: { backgroundColor: "#000" },
        headerStyle: { backgroundColor: "#000", height: 55 },
      }}
    >
      <BottomTab.Screen
        name="Clans"
        component={Clans}
        options={({ navigation }: NavigatorProps<"Clans">) => ({
          title: "Clans",
          tabBarIcon: ({ color }) => (
            <NavigatorItemIcon name="code" color={color} />
          ),
        })}
      />
      <BottomTab.Screen
        name="Alliances"
        component={Alliances}
        options={{
          title: "Alliances",
          tabBarIcon: ({ color }) => (
            <NavigatorItemIcon name="code" color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Guilds"
        component={Guilds}
        options={{
          title: "Guilds",
          tabBarIcon: ({ color }) => (
            <NavigatorItemIcon name="code" color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Users"
        component={Users}
        options={{
          title: "Users",
          tabBarIcon: ({ color }) => (
            <NavigatorItemIcon name="code" color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="System"
        component={System}
        options={({ navigation }: NavigatorProps<"System">) => ({
          title: "System",
          tabBarIcon: ({ color }) => (
            <NavigatorItemIcon name="code" color={color} />
          ),
        })}
      />
    </BottomTab.Navigator>
  );
}
