import {
  DarkTheme,
  Theme as ReactNavigationTheme,
} from "@react-navigation/native";
import { DefaultTheme as PaperTheme } from "react-native-paper";
import { extendTheme } from "native-base";
import { colors } from "./tailwind";

export const palette = {
  primary: colors.red[600],
  accent: colors.sky[600],
  background: colors.zinc[900],
  card: colors.zinc[900],
  border: colors.zinc[800],
  placeholder: colors.zinc[300],
  text: colors.zinc[100],
  error: colors.blue[900],
  notification: colors.sky[600],
};

export const theme_rn: ReactNavigationTheme = {
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: palette.primary,
    background: palette.background,
    card: palette.card,
    border: palette.border,
    text: palette.text,
    notification: palette.notification,
  },
};

export const theme_rnp: ReactNativePaper.Theme = {
  ...PaperTheme,
  dark: true,
  roundness: 5,
  colors: {
    ...PaperTheme.colors,
    primary: palette.primary,
    accent: palette.accent,
    background: palette.background,
    placeholder: palette.placeholder,
    text: palette.text,
    error: palette.error,
  },
};

export const theme_nb = extendTheme({
  config: {
    initialColorMode: "dark",
  },
});
