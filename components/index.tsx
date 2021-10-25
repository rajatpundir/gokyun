import { FontAwesome } from "@expo/vector-icons";
import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import Colors from "../main/constants/Colors";
import useColorScheme from "../main/hooks/useColorScheme";
import { Pressable } from "react-native";
import * as React from "react";

import Clans from "./clans";
import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StackParams } from "../App";

export type NavigatorParams = {
  Clans: undefined;
  TT: undefined;
};

export type NavigatorProps<Screen extends keyof NavigatorParams> =
  CompositeScreenProps<
    BottomTabScreenProps<NavigatorParams, Screen>,
    NativeStackScreenProps<StackParams>
  >;

const BottomTab = createBottomTabNavigator<NavigatorParams>();

export function MainBottomTabNavigator() {
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
          //   tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
          //   headerRight: () => (
          //     <Pressable
          //       onPress={() => navigation.navigate("Modal")}
          //       style={({ pressed }) => ({
          //         opacity: pressed ? 0.5 : 1,
          //       })}
          //     >
          //       <FontAwesome
          //         name="info-circle"
          //         size={25}
          //         color={Colors[colorScheme].text}
          //         style={{ marginRight: 15 }}
          //       />
          //     </Pressable>
          //   ),
        })}
      />
      <BottomTab.Screen
        name="TT"
        component={Clans}
        options={{
          title: "TT",
          //   tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
        }}
      />
    </BottomTab.Navigator>
  );
}

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={30} style={{ marginBottom: -3 }} {...props} />;
}
