import React from "react";
import { Pressable, View } from "native-base";
import { ComponentViews, useTheme, Field } from "../lib";
import { MaterialIcons } from "@expo/vector-icons";

const views = {};

const common_default_component: ComponentViews[string]["show"] = (props) => {
  const theme = useTheme();
  return (
    <View
      my={"1"}
      px={"1"}
      py={"0.5"}
      flexDirection={"row"}
      alignItems={"center"}
      borderWidth={"1"}
      borderRadius={"md"}
      borderColor={theme.primary}
      flexShrink={"1"}
    >
      <Field {...props} path={[["tag"], "name"]} />
    </View>
  );
};

const common_edit_component: ComponentViews[string]["show"] = (props) => {
  const theme = useTheme();
  return (
    <View
      my={"1"}
      px={"1"}
      py={"0.5"}
      flexDirection={"row"}
      alignItems={"center"}
      borderWidth={"1"}
      borderRadius={"md"}
      borderColor={theme.primary}
      flexShrink={"1"}
    >
      <Field {...props} path={[["tag"], "name"]} />
      <Pressable onPress={() => {}}>
        <MaterialIcons name="clear" size={20} color={theme.placeholder} />
      </Pressable>
    </View>
  );
};

export default {
  Default: {
    create: () => <></>,
    update: common_default_component,
    show: common_default_component,
  },
  Edit: {
    create: () => <></>,
    update: common_edit_component,
    show: common_edit_component,
  },
} as ComponentViews;
