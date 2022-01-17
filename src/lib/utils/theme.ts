import {
  DarkTheme,
  Theme as ReactNavigationTheme,
} from "@react-navigation/native";
import { DefaultTheme as PaperTheme } from "react-native-paper";
import { extendTheme } from "native-base";
import { colors } from "./tailwind";

export const theme = {
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

export const bs_theme = {
  primary: colors.sky[600],
  background: colors.slate[900],
};

export const theme_rn: ReactNavigationTheme = {
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: theme.primary,
    background: theme.background,
    card: theme.card,
    border: theme.border,
    text: theme.text,
    notification: theme.notification,
  },
};

export const theme_rnp: ReactNativePaper.Theme = {
  ...PaperTheme,
  dark: true,
  roundness: 5,
  colors: {
    ...PaperTheme.colors,
    primary: theme.primary,
    accent: theme.accent,
    background: theme.background,
    placeholder: theme.placeholder,
    text: theme.text,
    error: theme.error,
  },
};

export const theme_nb = extendTheme({
  config: {
    initialColorMode: "dark",
  },
});
