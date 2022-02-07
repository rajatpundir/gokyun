import React from "react";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalProvider } from "@gorhom/portal";
import { Provider as PaperProvider } from "react-native-paper";
import { NativeBaseProvider } from "native-base";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { registerRootComponent } from "expo";
import { StatusBar } from "expo-status-bar";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { NavigatorScreenParams } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import useAssets from "../../lib/hooks/useAssets";

import MainNavigator, { NavigatorParams as MainNavigatorParams } from "./tree";
import { useDeviceContext } from "twrnc";
import { tw } from "../../lib/utils/tailwind";
import { apply } from "../../lib/utils/prelude";
import {
  useTheme,
  useRNTheme,
  useNBTheme,
  useRNPTheme,
} from "../../lib/utils/theme";
import { SelectionModal, SelectionModalProps } from "../../lib/utils/list";

import Test from "../test";
import Loader from "../loader";
import { HashSet } from "prelude-ts";
import { Path } from "../../lib/utils/variable";

// Ignore react navigation error related to serializability of props passed

export type NavigatorParams = {
  Main: NavigatorScreenParams<MainNavigatorParams> | undefined;
  SelectionModal: SelectionModalProps;
  Loader: {};
  Test: {
    id: number;
    values?: HashSet<Path>;
  };
};

function Component() {
  const theme = useTheme();
  const theme_rn = useRNTheme();
  const theme_nb = useNBTheme();
  const theme_rnp = useRNPTheme();

  useDeviceContext(tw);
  return apply(useAssets(), (is_loading_complete) => {
    if (is_loading_complete) {
      return (
        <GestureHandlerRootView style={tw.style(["flex-1"])}>
          <PaperProvider theme={theme_rnp}>
            <NativeBaseProvider theme={theme_nb}>
              <BottomSheetModalProvider>
                <PortalProvider>
                  <SafeAreaProvider>
                    <SafeAreaView style={tw.style(["flex-1"])}>
                      <NavigationContainer theme={theme_rn}>
                        <Stack.Navigator initialRouteName="Loader">
                          <Stack.Group
                            screenOptions={{
                              headerShown: false,
                            }}
                          >
                            <Stack.Screen
                              name="Main"
                              component={MainNavigator}
                            />
                            <Stack.Screen name="Loader" component={Loader} />
                            <Stack.Group
                              screenOptions={{
                                presentation: "modal",
                              }}
                            >
                              <Stack.Screen
                                name="SelectionModal"
                                component={SelectionModal}
                              />
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
          </PaperProvider>
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
