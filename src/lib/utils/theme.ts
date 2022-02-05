import { useEffect, useState } from "react";
import {
  DarkTheme,
  Theme as ReactNavigationTheme,
} from "@react-navigation/native";
import { extendTheme } from "native-base";
import { DefaultTheme as PaperTheme } from "react-native-paper";
import { colors } from "./tailwind";
import { getState, subscribe } from "./store";

export type ThemeName = "Dark" | "Light";

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
    case "Light": {
      return {
        primary: colors.rose[500],
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
  const [theme, set_theme] = useState(get_theme(getState().theme));
  useEffect(() => {
    const unsub = subscribe(
      (store) => store.theme,
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

// export const bs_theme = {
//   primary: colors.sky[600],
//   background: colors.slate[900],
//   border: colors.slate[600],
//   placeholder: colors.slate[500],
//   text: colors.slate[400],
//   highlight: colors.blue[500],
// };

function get_bs_theme(theme_name: ThemeName): BS_Theme {
  const theme = useTheme();
  switch (theme_name) {
    case "Dark": {
      return {
        primary: theme.primary,
        background: theme.background,
        border: theme.border,
        placeholder: theme.placeholder,
        text: theme.text,
        highlight: colors.teal[500],
      };
    }
    case "Light": {
      return {
        primary: theme.primary,
        background: theme.background,
        border: theme.border,
        placeholder: theme.placeholder,
        text: theme.text,
        highlight: colors.rose[500],
      };
    }
    default: {
      const _exhaustiveCheck: never = theme_name;
      return _exhaustiveCheck;
    }
  }
}

export function useBSTheme(): BS_Theme {
  const [theme_name, set_theme_name] = useState(getState().theme);
  useEffect(() => {
    const unsub = subscribe(
      (store) => store.theme,
      (x) => set_theme_name(x)
    );
    return unsub;
  }, []);
  return get_bs_theme(theme_name);
}

function get_rn_theme(theme_name: ThemeName): ReactNavigationTheme {
  const theme = useTheme();
  switch (theme_name) {
    case "Dark": {
      return {
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
    }
    case "Light": {
      return {
        dark: false,
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
    }
    default: {
      const _exhaustiveCheck: never = theme_name;
      return _exhaustiveCheck;
    }
  }
}

export function useRNTheme(): ReactNavigationTheme {
  const [theme_name, set_theme_name] = useState(getState().theme);
  useEffect(() => {
    const unsub = subscribe(
      (store) => store.theme,
      (x) => set_theme_name(x)
    );
    return unsub;
  }, []);
  return get_rn_theme(theme_name);
}

function get_rnp_theme(theme_name: ThemeName): ReactNativePaper.Theme {
  const theme = useTheme();
  switch (theme_name) {
    case "Dark": {
      return {
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
    }
    case "Light": {
      return {
        ...PaperTheme,
        dark: false,
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
    }
    default: {
      const _exhaustiveCheck: never = theme_name;
      return _exhaustiveCheck;
    }
  }
}

export function useRNPTheme(): ReactNativePaper.Theme {
  const [theme_name, set_theme_name] = useState(getState().theme);
  useEffect(() => {
    const unsub = subscribe(
      (store) => store.theme,
      (x) => set_theme_name(x)
    );
    return unsub;
  }, []);
  return get_rnp_theme(theme_name);
}

const empty_theme = extendTheme({});
type CustomThemeType = typeof empty_theme;
function useColorScheme(): keyof CustomThemeType["colors"] {
  const [theme_name, set_theme_name] = useState(getState().theme);
  useEffect(() => {
    const unsub = subscribe(
      (store) => store.theme,
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
  switch (theme_name) {
    case "Dark":
      return convert_scheme("teal");
    case "Light":
      return convert_scheme("rose");
    default: {
      const _exhaustiveCheck: never = theme_name;
      return _exhaustiveCheck;
    }
  }
}

export function useNBTheme(): CustomThemeType {
  const color_scheme = useColorScheme();
  return extendTheme({
    config: {
      initialColorMode: "dark",
    },
    components: {
      Progress: {
        defaultProps: { colorScheme: color_scheme },
      },
      Radio: { defaultProps: { colorScheme: color_scheme } },
      Switch: { defaultProps: { colorScheme: color_scheme } },
      Tabs: { defaultProps: { colorScheme: color_scheme } },
      AppBar: { defaultProps: { colorScheme: color_scheme } },
      Alert: { defaultProps: { colorScheme: color_scheme } },
      Badge: { defaultProps: { colorScheme: color_scheme } },
      Button: { defaultProps: { colorScheme: color_scheme } },
      Checkbox: {
        defaultProps: { colorScheme: color_scheme },
      },
      CircularProgress: {
        defaultProps: { colorScheme: color_scheme },
      },
      Code: { defaultProps: { colorScheme: color_scheme } },
      FAB: {
        defaultProps: {
          colorScheme: color_scheme,
          renderInPortal: false,
        },
      },
    },
  });
}
