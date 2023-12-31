import { useEffect, useState } from "react";
import { Theme as ReactNavigationTheme } from "@react-navigation/native";
import { extendTheme } from "native-base";
import { colors } from "./tailwind";
import { getState, subscribe } from "./store";
import { arrow } from "./prelude";

export type ThemeName = "Light" | "Dark";

type Theme = {
  primary: string;
  accent: string;
  background: string;
  card: string;
  border: string;
  placeholder: string;
  label: string;
  text: string;
  error: string;
  notification: string;
};

function get_theme(theme_name: ThemeName): Theme {
  switch (theme_name) {
    case "Light": {
      return {
        primary: colors.rose[500],
        accent: colors.rose[600],
        background: "white",
        card: "white",
        border: colors.zinc[300],
        placeholder: colors.zinc[700],
        label: colors.zinc[800],
        text: colors.zinc[900],
        error: colors.sky[600],
        notification: colors.sky[600],
      };
    }
    case "Dark": {
      return {
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
    }
    default: {
      const _exhaustiveCheck: never = theme_name;
      return _exhaustiveCheck;
    }
  }
}

export function useTheme(): Theme {
  const [theme, set_theme] = useState(get_theme(getState().params.theme));
  useEffect(() => {
    const unsub = subscribe(
      (store) => store.params.theme,
      (theme_name) => set_theme(get_theme(theme_name))
    );
    return unsub;
  }, []);
  return theme;
}

type BS_Theme = {
  primary: string;
  background: string;
  border: string;
  placeholder: string;
  text: string;
  highlight: string;
};

function get_bs_theme(theme_name: ThemeName): BS_Theme {
  const theme = useTheme();
  switch (theme_name) {
    case "Light": {
      return {
        primary: theme.primary,
        background: theme.background,
        border: theme.border,
        placeholder: theme.placeholder,
        text: theme.text,
        highlight: theme.primary,
      };
    }
    case "Dark": {
      return {
        primary: theme.primary,
        background: theme.background,
        border: theme.border,
        placeholder: theme.placeholder,
        text: theme.text,
        highlight: theme.primary,
      };
    }
    default: {
      const _exhaustiveCheck: never = theme_name;
      return _exhaustiveCheck;
    }
  }
}

export function useBSTheme(): BS_Theme {
  const [theme_name, set_theme_name] = useState(getState().params.theme);
  useEffect(() => {
    const unsub = subscribe(
      (store) => store.params.theme,
      (x) => set_theme_name(x)
    );
    return unsub;
  }, []);
  return get_bs_theme(theme_name);
}

function get_rn_theme(theme_name: ThemeName): ReactNavigationTheme {
  const theme = useTheme();
  switch (theme_name) {
    case "Light": {
      return {
        dark: false,
        colors: {
          primary: theme.primary,
          background: theme.background,
          card: theme.card,
          border: theme.border,
          text: theme.text,
          notification: theme.notification,
        },
      };
    }
    case "Dark": {
      return {
        dark: true,
        colors: {
          primary: theme.primary,
          background: theme.background,
          card: theme.card,
          border: theme.border,
          text: theme.text,
          notification: theme.notification,
        },
      };
    }
    default: {
      const _exhaustiveCheck: never = theme_name;
      return _exhaustiveCheck;
    }
  }
}

export function useRNTheme(): ReactNavigationTheme {
  const [theme_name, set_theme_name] = useState(getState().params.theme);
  useEffect(() => {
    const unsub = subscribe(
      (store) => store.params.theme,
      (x) => set_theme_name(x)
    );
    return unsub;
  }, []);
  return get_rn_theme(theme_name);
}

const empty_theme = extendTheme({});
type CustomThemeType = typeof empty_theme;
function useColorScheme(): [ThemeName, keyof CustomThemeType["colors"]] {
  const [theme_name, set_theme_name] = useState(getState().params.theme);
  useEffect(() => {
    const unsub = subscribe(
      (store) => store.params.theme,
      (x) => set_theme_name(x)
    );
    return unsub;
  }, []);
  const convert_scheme = (
    color: keyof typeof colors
  ): keyof CustomThemeType["colors"] => {
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
  };
  return [
    theme_name,
    arrow(() => {
      switch (theme_name) {
        case "Light":
          return convert_scheme("rose");
        case "Dark":
          return convert_scheme("teal");
        default: {
          const _exhaustiveCheck: never = theme_name;
          return _exhaustiveCheck;
        }
      }
    }),
  ];
}

export function useNBTheme(): CustomThemeType {
  const [theme_name, colorScheme] = useColorScheme();
  return extendTheme({
    config: {
      initialColorMode: theme_name === "Light" ? "light" : "dark",
    },
    components: {
      Progress: {
        defaultProps: { colorScheme },
      },
      Radio: { defaultProps: { colorScheme } },
      Switch: { defaultProps: { colorScheme } },
      Tabs: { defaultProps: { colorScheme } },
      AppBar: { defaultProps: { colorScheme } },
      Alert: { defaultProps: { colorScheme } },
      Badge: { defaultProps: { colorScheme } },
      Button: { defaultProps: { colorScheme } },
      Checkbox: {
        defaultProps: { colorScheme },
      },
      CircularProgress: {
        defaultProps: { colorScheme },
      },
      Code: { defaultProps: { colorScheme } },
      FAB: {
        defaultProps: {
          colorScheme,
          renderInPortal: false,
        },
      },
    },
  });
}
