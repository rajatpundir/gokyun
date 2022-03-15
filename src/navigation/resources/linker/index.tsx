import * as React from "react";

import { NavigatorProps as ParentNavigatorProps } from "..";

import {
  createBottomTabNavigator,
  BottomTabScreenProps,
} from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CompositeScreenProps } from "@react-navigation/native";

import { NavigatorParams as RootNavigatorParams } from "../../main";

import Link from "./link";
import Upload from "./upload";
import { Feather } from "@expo/vector-icons";
import { tw } from "../../../lib";

export type NavigatorParams = {
  Link: undefined;
  Upload: undefined;
};

export default function Navigator(props: ParentNavigatorProps<"Linker">) {
  return (
    <BottomTab.Navigator
      initialRouteName="Link"
      screenOptions={{
        lazy: true,
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 12 },
        tabBarItemStyle: { paddingTop: 2, paddingBottom: 4 },
      }}
    >
      <BottomTab.Screen
        name="Link"
        component={Link}
        options={{
          title: "Link",
          tabBarIcon: ({ color }) => (
            <Feather
              name="link"
              size={24}
              color={color}
              style={tw.style([], { marginBottom: -6 })}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="Upload"
        component={Upload}
        options={{
          title: "Upload",
          tabBarIcon: ({ color }) => (
            <Feather
              name="upload"
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

// export function Loader(props: RootNavigatorProps<"Search">): JSX.Element {
//   const api = create({
//     baseURL: `https://pixabay.com/`,
//   });
//   useEffect(() => {
//     const x = async () => {
//       console.log("##############################");
//       const response = await api.get("/");
//       //   console.log("===============", response.data);
//       const root = cheerio.load(response.data as string);
//       root("img").each((index, element) => {
//         console.log("------------------------");
//         const x = root(element).attr();
//         console.log(x["alt"]);
//         console.log(x["src"]);
//         console.log("------------------------");
//       });
//       console.log("##############################");
//     };
//     x();
//   }, []);
//   return (
//     <>
//       <ModalHeader title={"Linker"} />
//     </>
//   );
// }
