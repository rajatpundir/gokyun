import { color_palette } from "../themed/colors";

const tintColorLight = color_palette.custom.red[900];
const tintColorDark = color_palette.custom.white[900];

export default {
  light: {
    text: color_palette.custom.white[900],
    background: color_palette.custom.black[900],
    tint: tintColorLight,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: color_palette.custom.white[900],
    background: color_palette.custom.black[900],
    tint: tintColorDark,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorDark,
  },
};
