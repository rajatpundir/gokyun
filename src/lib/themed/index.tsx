import * as React from "react";
import {
  View as DefaultView,
  Text as DefaultText,
  TextInput as DefaultTextInput,
} from "react-native";

import { colors } from "./colors";

export type ViewProps = DefaultView["props"];

export function View(props: ViewProps) {
  const { style, ...otherProps } = props;
  return (
    <DefaultView
      style={[
        {
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 3,
          marginBottom: 1,
          paddingVertical: 0,
          borderColor: colors.tailwind.slate[600],
        },
        style,
      ]}
      {...otherProps}
    />
  );
}

export type TextProps = DefaultText["props"];

export function Text(props: TextProps) {
  const { style, ...otherProps } = props;
  return (
    <DefaultText
      style={[
        {
          color: colors.tailwind.slate[200],
          textAlignVertical: "center",
          flexShrink: 1,
          borderColor: colors.tailwind.slate[600],
        },
        style,
      ]}
      {...otherProps}
    />
  );
}

export type TextInputProps = DefaultTextInput["props"];

// Use TextInput from React Native Paper instead
export function TextInput(props: TextInputProps) {
  const { style, ...otherProps } = props;
  return (
    <DefaultTextInput
      selectionColor={colors.tailwind.slate[400]}
      underlineColorAndroid={colors.tailwind.gray[600]}
      placeholderTextColor={colors.tailwind.slate[500]}
      placeholder="Enter text"
      style={[
        {
          color: colors.tailwind.slate[300],
          textAlign: "auto",
          alignSelf: "center",
          paddingLeft: 5,
          paddingRight: 10,
          paddingVertical: 0,
          minHeight: 40,
        },
        style,
      ]}
      {...otherProps}
    />
  );
}