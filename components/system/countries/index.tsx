import * as React from "react";

import {
  Platform,
  StyleSheet,
  StatusBar as ST,
  TouchableOpacity,
  Pressable,
} from "react-native";

import { StatusBar } from "expo-status-bar";

import { Text, View } from "../../../main/themed";
import { HashSet, Option } from "prelude-ts";
import { SimpleLineIcons } from "@expo/vector-icons";
import { get_structs } from "../../../main/utils/schema";
import { Path, Struct } from "../../../main/utils/variable";
import { NavigatorProps as ParentNavigatorProps } from "..";
import {
  get_permissions,
  get_user_path_permissions,
  get_valid_user_path,
  log_permissions,
} from "../../../main/utils/permissions";
import { useNavigation } from "@react-navigation/core";
import { unwrap } from "../../../main/utils/prelude";
import Decimal from "decimal.js";
import { Immutable } from "immer";
import {
  getState,
  setState,
  subscribe,
  useStore,
} from "../../../main/utils/store";

// Add a ContainerH and ContainerV components
// Move StatusBar with default style into above
// Remove linking for now
// Test dark mode, make it black instead and remove all animation effects

// Show a flat list with a bunch of string, a button at top right to open a modal to add new string
// Some mechanism to update and delete this list
// Edit and Show modes to show or edit this list

function A() {
  const [x, setX] = React.useState(getState().db_updation_toggle);
  subscribe((s) => {
    setX(s.db_updation_toggle);
  });
  console.log("A", x);
  return (
    <>
      <Pressable
        onPress={() => {
          console.log("A is toggling toggle");
          getState().toggle_db_update_toggle();
        }}
      >
        <Text>AAAAAAAAAAAAAAAA</Text>
      </Pressable>
    </>
  );
}

function B() {
  const [x, setX] = React.useState(getState().db_updation_toggle);
  subscribe((s) => {
    setX(s.db_updation_toggle);
  });
  console.log("B", x);
  return (
    <>
      <Pressable
        onPress={() => {
          console.log("B is toggling toggle");
          getState().toggle_db_update_toggle();
        }}
      >
        <Text>BBBBBBBBBBBBBBB</Text>
      </Pressable>
    </>
  );
}

const struct: Option<Struct> = get_structs()
  .filter((s) => s.name === "User")
  .single();

export default function Component(props: ParentNavigatorProps<"Countries">) {
  const navigation = useNavigation();

  if (struct.isSome()) {
    // const x = get_valid_user_path(
    //   struct.get(),
    //   [["alliance", "wallet"], "user"],
    //   false
    // );
    // if (unwrap(x)) {
    //   console.log(
    //     x.value[0].map((q) => q[0]),
    //     x.value[1]
    //   );
    // }
    // console.log();
    log_permissions(struct.get(), [], []);
  } else {
    console.log("---nothing---");
  }

  return (
    <View
      style={{
        flexDirection: "column",
        flexGrow: 1,
      }}
    >
      {/* <A />
      <B />
      <A /> */}
      <Pressable
      // onPress={() => {
      //   if (struct.isSome()) {
      //     const permissions = get_permissions(struct.get(), [["user"]], []);
      //     if (unwrap(permissions)) {
      //       navigation.navigate("VariablesModal", {
      //         struct: struct.get(),
      //         permissions: permissions.value,
      //         requested_paths: HashSet.of(),
      //         selected: new Decimal(0),
      //         set_selected: (selected: Decimal) => {},
      //         filters: [],
      //         limit: new Decimal(10),
      //         offset: new Decimal(0),
      //         render_item: (
      //           struct: Immutable<Struct>,
      //           id: Immutable<Decimal>,
      //           paths: Immutable<HashSet<Path>>,
      //           selected: Immutable<Decimal>,
      //           set_selected: (selected: Decimal) => void
      //         ) => {
      //           return (
      //             <>
      //               <Text>PKPKPKPK</Text>
      //               {/* <TextInput
      //                 value={"9i09i09i09i09"}
      //                 keyboardType={"number-pad"}
      //                 onChangeText={
      //                   (x) => {}
      //                 }
      //               /> */}
      //             </>
      //           );
      //         },
      //       });
      //     }
      //   }
      // }}
      >
        <Text>GOTO VARIABLES MODAL</Text>
      </Pressable>

      {/* Floating button */}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => console.log("000")}
        style={styles.touchableOpacityStyle}
      >
        <SimpleLineIcons name="plus" size={36} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: ST.currentHeight || 0,
  },
  item: {
    backgroundColor: "#f9c2ff",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 32,
  },
  touchableOpacityStyle: {
    position: "absolute",
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    right: 30,
    bottom: 30,
  },
});
