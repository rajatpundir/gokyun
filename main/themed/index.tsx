/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

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
          borderColor: colors.tailwind.gray[600],
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
          color: colors.custom.white[900],
          textAlignVertical: "center",
          paddingRight: 5,
          flexShrink: 1,
          borderColor: colors.tailwind.gray[900],
        },
        style,
      ]}
      {...otherProps}
    />
  );
}

export type TextInputProps = DefaultTextInput["props"];

export function TextInput(props: TextInputProps) {
  const { style, ...otherProps } = props;
  return (
    <DefaultTextInput
      selectionColor={colors.custom.red[900]}
      underlineColorAndroid={colors.custom.red[900]}
      placeholder="Enter text"
      placeholderTextColor={colors.tailwind.slate[500]}
      style={[
        {
          height: 40,
          textAlign: "auto",
          paddingRight: 5,
        },
        style,
      ]}
      {...otherProps}
    />
  );
}
