import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { NavigatorScreenParams } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinkingOptions } from "@react-navigation/native";

import useCachedResources from "./main/hooks/useCachedResources";
import useColorScheme from "./main/hooks/useColorScheme";
import { MainBottomTabNavigator, NavigatorParams } from "./components";
import NotFoundScreen from "./main/NotFoundScreen";

declare global {
  namespace ReactNavigation {
    interface RootParamList extends StackParams {}
  }
}

export type StackParams = {
  Root: NavigatorScreenParams<NavigatorParams> | undefined;
  NotFound: undefined;
};

export type StackProps<Screen extends keyof StackParams> =
  NativeStackScreenProps<StackParams, Screen>;

const linking: LinkingOptions<StackParams> = {
  prefixes: [Linking.makeUrl("/")],
  config: {
    screens: {
      Root: {
        screens: {
          Clans: {
            screens: {
              Clans: "one",
            },
          },
          TT: {
            screens: {
              TabTwoScreen: "two",
            },
          },
        },
      },
      NotFound: "*",
    },
  },
};

const Stack = createNativeStackNavigator<StackParams>();

export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();
  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider>
        <NavigationContainer
          linking={linking}
          theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack.Navigator>
            <Stack.Screen
              name="Root"
              component={MainBottomTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="NotFound"
              component={NotFoundScreen}
              options={{ title: "Oops!" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar />
      </SafeAreaProvider>
    );
  }
}
