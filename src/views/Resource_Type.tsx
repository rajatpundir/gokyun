import React from "react";
import { Column, Row, Text } from "native-base";
import { ComponentViews, arrow, Template, useTheme, Field } from "../lib";

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
        <Field {...props} path={[[], "type"]} />
        {"/"}
        <Field {...props} path={[[], "subtype"]} />
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
