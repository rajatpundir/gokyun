import {
  DarkTheme,
  Theme as ReactNavigationTheme,
} from "@react-navigation/native";
import { DefaultTheme as PaperTheme } from "react-native-paper";
import { extendTheme } from "native-base";
import { colors } from "./tailwind";

const color_scheme = "teal";

export const theme = {
  primary: colors.teal[500],
  accent: colors.teal[600],
  background: colors.zinc[900],
  card: colors.zinc[900],
  border: colors.zinc[700],
  placeholder: colors.zinc[300],
  label: colors.zinc[200],
  text: colors.zinc[100],
  error: colors.sky[600],
  notification: colors.sky[600],
};

export const bs_theme = {
  primary: theme.primary,
  background: theme.background,
  border: theme.border,
  placeholder: theme.placeholder,
  text: theme.text,
  highlight: colors.teal[500],
};

// export const bs_theme = {
//   primary: colors.sky[600],
//   background: colors.slate[900],
//   border: colors.slate[600],
//   placeholder: colors.slate[500],
//   text: colors.slate[400],
//   highlight: colors.blue[500],
// };

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

const empty_theme = extendTheme({});
type CustomThemeType = typeof empty_theme;
export const theme_nb: CustomThemeType = extendTheme({
  config: {
    initialColorMode: "dark",
  },
  components: {
    Progress: { defaultProps: { colorScheme: get_color_scheme(color_scheme) } },
    Radio: { defaultProps: { colorScheme: get_color_scheme(color_scheme) } },
    Switch: { defaultProps: { colorScheme: get_color_scheme(color_scheme) } },
    Tabs: { defaultProps: { colorScheme: get_color_scheme(color_scheme) } },
    AppBar: { defaultProps: { colorScheme: get_color_scheme(color_scheme) } },
    Alert: { defaultProps: { colorScheme: get_color_scheme(color_scheme) } },
    Badge: { defaultProps: { colorScheme: get_color_scheme(color_scheme) } },
    Button: { defaultProps: { colorScheme: get_color_scheme(color_scheme) } },
    Checkbox: { defaultProps: { colorScheme: get_color_scheme(color_scheme) } },
    CircularProgress: {
      defaultProps: { colorScheme: get_color_scheme(color_scheme) },
    },
    Code: { defaultProps: { colorScheme: get_color_scheme(color_scheme) } },
    FAB: {
      defaultProps: {
        colorScheme: get_color_scheme(color_scheme),
        renderInPortal: false,
      },
    },
  },
});

export function get_color_scheme(
  color: keyof typeof colors
): keyof CustomThemeType["colors"] {
  switch (color) {
    case "slate":
      return "blueGray";
    case "gray":
      return "coolGray";
    case "zinc":
      // values for dark are reversed
      return "dark";
    case "neutral":
      return "trueGray";
    case "stone":
      return "warmGray";
    case "red":
      return "red";
    case "orange":
      return "orange";
    case "amber":
      return "amber";
    case "yellow":
      return "yellow";
    case "lime":
      return "lime";
    case "green":
      return "green";
    case "emerald":
      return "emerald";
    case "teal":
      return "teal";
    case "cyan":
      return "cyan";
    case "sky":
      return "lightBlue";
    case "blue":
      return "blue";
    case "indigo":
      return "indigo";
    case "violet":
      return "violet";
    case "purple":
      return "purple";
    case "fuchsia":
      return "fuchsia";
    case "pink":
      return "pink";
    case "rose":
      return "rose";
    default: {
      const _exhaustiveCheck: never = color;
      return _exhaustiveCheck;
    }
  }
}
