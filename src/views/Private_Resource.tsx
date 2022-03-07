import React from "react";
import { Column, Text } from "native-base";
import { ComponentViews, arrow, useTheme, Field } from "../lib";

const views = {};

const common_default_component: ComponentViews[string]["show"] = (props) => {
  const theme = useTheme();
  return (
    <Column
      p={"2"}
      m={"1"}
      borderWidth={"1"}
      borderRadius={"md"}
      borderColor={theme.border}
      backgroundColor={arrow(() => {
        if (props.selected) {
          return theme.background;
        }
        return theme.background;
      })}
    >
      <Text>
        {props.state.id.toString()}
        {": "}
        <Field {...props} path={[[], "url"]} />
      </Text>
    </Column>
  );
};

export default {
  Default: {
    create: () => <></>,
    update: common_default_component,
    show: common_default_component,
  },
} as ComponentViews;
