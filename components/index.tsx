import * as React from "react";

import { FontAwesome } from "@expo/vector-icons";

import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";

import Colors from "../main/constants/Colors";
import useColorScheme from "../main/hooks/useColorScheme";
import { StackParams } from "../App";

import Clans from "./clans";
import Alliances from "./alliances";
import Guilds from "./guilds";

export type NavigatorParams = {
  Clans: undefined;
  Alliances: undefined;
  Guilds: undefined;
};

export type NavigatorProps<Screen extends keyof NavigatorParams> =
  CompositeScreenProps<
    BottomTabScreenProps<NavigatorParams, Screen>,
    NativeStackScreenProps<StackParams>
  >;

const BottomTab = createBottomTabNavigator<NavigatorParams>();

function NavigatorItemIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={30} style={{ marginBottom: -3 }} {...props} />;
}

export function Navigator() {
  const colorScheme = useColorScheme();

  return (
    <BottomTab.Navigator
      initialRouteName="Clans"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
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
    </BottomTab.Navigator>
  );
}
