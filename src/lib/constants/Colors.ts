import { colors } from "../themed/colors";

const tintColorLight = colors.custom.red[900];
const tintColorDark = colors.custom.white[900];

export default {
  light: {
    text: colors.tailwind.slate[400],
    background: colors.custom.black[900],
    tint: tintColorLight,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: colors.tailwind.slate[400],
    background: colors.custom.black[900],
    tint: tintColorDark,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorDark,
  },
};
