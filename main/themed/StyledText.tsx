import * as React from "react";

import { Text, TextProps } from "../../main/themed/Themed";

export function MonoText(props: TextProps) {
  return (
    <Text {...props} style={[props.style, { fontFamily: "space-mono" }]} />
  );
}
