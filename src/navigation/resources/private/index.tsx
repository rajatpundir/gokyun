import * as React from "react";

import { NavigatorProps as ParentNavigatorProps } from "..";

import {
  createBottomTabNavigator,
  BottomTabScreenProps,
} from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CompositeScreenProps } from "@react-navigation/native";

import { NavigatorParams as RootNavigatorParams } from "../../main";

import Images from "./images";
import Videos from "./videos";
import Docs from "./docs";
import YouTube from "./youtube";
import { AntDesign, Entypo, Feather, Ionicons } from "@expo/vector-icons";
import { tw } from "../../../lib";

export type NavigatorParams = {
  Images: undefined;
  Videos: undefined;
  Docs: undefined;
  YouTube: undefined;
};

export default function Navigator(props: ParentNavigatorProps<"Private">) {
  return (
    <BottomTab.Navigator
      initialRouteName="Images"
      screenOptions={{
        lazy: true,
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 12 },
        tabBarItemStyle: { paddingTop: 2, paddingBottom: 4 },
      }}
    >
      <BottomTab.Screen
        name="Images"
        component={Images}
        options={{
          title: "Images",
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="images"
              size={24}
              color={color}
              style={tw.style([], { marginBottom: -6 })}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="Videos"
        component={Videos}
        options={{
          title: "Videos",
          tabBarIcon: ({ color }) => (
            <Entypo
              name="folder-video"
              size={24}
              color={color}
              style={tw.style([], { marginBottom: -6 })}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="Docs"
        component={Docs}
        options={{
          title: "Docs",
          tabBarIcon: ({ color }) => (
            <AntDesign
              name="pdffile1"
              size={24}
              color={color}
              style={tw.style([], { marginBottom: -4 })}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="YouTube"
        component={YouTube}
        options={{
          title: "YouTube",
          tabBarIcon: ({ color }) => (
            <Feather
              name="youtube"
              size={24}
              color={color}
              style={tw.style([], { marginBottom: -6 })}
            />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
}

export type NavigatorProps<Screen extends keyof NavigatorParams> =
  CompositeScreenProps<
    BottomTabScreenProps<NavigatorParams, Screen>,
    NativeStackScreenProps<RootNavigatorParams>
  >;

const BottomTab = createBottomTabNavigator<NavigatorParams>();
