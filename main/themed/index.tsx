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

import Colors from "../constants/Colors";
import useColorScheme from "../hooks/useColorScheme";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];
  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type ViewProps = ThemeProps & DefaultView["props"];

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );
  return (
    <DefaultView
      style={[
        {
          backgroundColor,
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          flexShrink: 1,
          paddingHorizontal: 3,
          marginBottom: 1,
          paddingVertical: 0,
          borderColor: "white",
          // borderWidth: 1,
        },
        style,
      ]}
      {...otherProps}
    />
  );
}

export type TextProps = ThemeProps & DefaultText["props"];

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  return (
    <DefaultText
      style={[
        {
          color,
          textAlignVertical: "center",
          borderColor: "white",
          paddingRight: 5,
          flexShrink: 1,
        },
        style,
      ]}
      {...otherProps}
    />
  );
}

export type TextInputProps = ThemeProps & DefaultTextInput["props"];

export function TextInput(props: TextInputProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  return (
    <DefaultTextInput
      selectionColor={"#ff0000"}
      underlineColorAndroid={"#ff0000"}
      placeholder="Enter text"
      placeholderTextColor={"#64748b"}
      style={[
        {
          color,
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
