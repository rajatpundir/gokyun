import React from "react";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalProvider } from "@gorhom/portal";
import { NativeBaseProvider } from "native-base";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { registerRootComponent } from "expo";
import { StatusBar } from "expo-status-bar";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { NavigatorScreenParams } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import MainNavigator, { NavigatorParams as MainNavigatorParams } from "./tree";
import { useDeviceContext } from "twrnc";

import { HashSet } from "prelude-ts";

import { FontAwesome } from "@expo/vector-icons";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import {
  apply,
  SelectionModalProps,
  useRNTheme,
  useNBTheme,
  tw,
  SelectionModal,
  Path,
  useTheme,
} from "../../lib";
import { LogBox } from "react-native";
import { load_data } from "../../schema/load_data";

import Test from "../test";
import Search from "../search";
import Resources from "../resources";
import Resource from "../resource";
import Gallery from "../gallery";

// Ignore react navigation error related to serializability of props passed
LogBox.ignoreLogs(["Require cycle:"]);

export type NavigatorParams = {
  Main: NavigatorScreenParams<MainNavigatorParams> | undefined;
  SelectionModal: SelectionModalProps;
  Search: undefined;
  Resources: undefined;
  Test: {
    id: number;
    values?: HashSet<Path>;
  };
  Resource: {
    id: number;
    values?: HashSet<Path>;
  };
  Gallery: {};
};

function Component() {
  const theme = useTheme();
  const theme_rn = useRNTheme();
  const theme_nb = useNBTheme();

  useDeviceContext(tw);
  return apply(useAssets(), (is_loading_complete) => {
    if (is_loading_complete) {
      return (
        <GestureHandlerRootView style={tw.style(["flex-1"])}>
          <NativeBaseProvider theme={theme_nb}>
            <BottomSheetModalProvider>
              <PortalProvider>
                <SafeAreaProvider>
                  <SafeAreaView style={tw.style(["flex-1"])}>
                    <NavigationContainer theme={theme_rn}>
                      <Stack.Navigator initialRouteName="Resources">
                        <Stack.Group
                          screenOptions={{
                            headerShown: false,
                          }}
                        >
                          <Stack.Screen name="Main" component={MainNavigator} />
                          <Stack.Group
                            screenOptions={{
                              presentation: "modal",
                            }}
                          >
                            <Stack.Screen
                              name="SelectionModal"
                              component={SelectionModal}
                            />
                            <Stack.Screen
                              name="Resources"
                              component={Resources}
                            />
                            <Stack.Screen
                              name="Resource"
                              component={Resource}
                            />
                            <Stack.Screen name="Gallery" component={Gallery} />
                            <Stack.Screen name="Search" component={Search} />
                            <Stack.Screen name="Test" component={Test} />
                          </Stack.Group>
                        </Stack.Group>
                      </Stack.Navigator>
                    </NavigationContainer>
                  </SafeAreaView>
                  <StatusBar backgroundColor={theme.background} />
                </SafeAreaProvider>
              </PortalProvider>
            </BottomSheetModalProvider>
          </NativeBaseProvider>
        </GestureHandlerRootView>
      );
    }
    return <></>;
  });
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends NavigatorParams {}
  }
}

export type NavigatorProps<Screen extends keyof NavigatorParams> =
  NativeStackScreenProps<NavigatorParams, Screen>;

const Stack = createNativeStackNavigator<NavigatorParams>();

registerRootComponent(Component);

function useAssets() {
  const [isLoadingComplete, setLoadingComplete] = React.useState(false);

  // Load any resources or data that we need prior to rendering the app
  React.useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        SplashScreen.preventAutoHideAsync();

        // Load fonts
        await Font.loadAsync({
          ...FontAwesome.font,
          "space-mono": require("../../../assets/fonts/SpaceMono-Regular.ttf"),
        });
        await load_data();
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  return isLoadingComplete;
}
