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

import Search from "./search";
import Linker from "./linker";
import { AppHeader } from "../../lib/utils/component";
import { tw } from "../../lib/utils/tailwind";

export type NavigatorParams = {
  Search: undefined;
  Linker: undefined;
};

export default function Navigator(props: RootNavigatorProps<"Loader">) {
  return (
    <>
      <AppHeader />
      <BottomTab.Navigator
        initialRouteName="Linker"
        screenOptions={{
          lazy: true,
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: { fontSize: 14 },
          tabBarItemStyle: { paddingBottom: 0 },
        }}
      >
        <BottomTab.Screen
          name="Search"
          component={Search}
          options={{
            title: "Search",
            tabBarIcon: ({ color }) => (
              <Feather
                name="search"
                size={30}
                color={color}
                style={tw.style([], { margin: -6 })}
              />
            ),
          }}
        />
        <BottomTab.Screen
          name="Linker"
          component={Linker}
          options={{
            tabBarIcon: ({ color }) => (
              <Feather
                name="link"
                size={30}
                color={color}
                style={tw.style([], { margin: -6 })}
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
