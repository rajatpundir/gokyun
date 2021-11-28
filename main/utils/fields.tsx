import * as React from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  Pressable,
  Platform,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import Decimal from "decimal.js";

import { apply } from "./prelude";
import { Action, State } from "./commons";
import { useState } from "react";
import { Path } from "./variable";

type ComponentProps = {
  mode: "read" | "write";
  state: State;
  dispatch: React.Dispatch<Action>;
  path: Path;
};

export function Str(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const value = props.path.path[1][1];
  if (value.type === "str") {
    if (
      props.path.writeable &&
      (state.id.equals(new Decimal(-1)) || props.mode === "write")
    ) {
      return (
        <TextInput
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
          value={value.value}
          onChangeText={(x) =>
            dispatch([
              "values",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "str",
                  value: x,
                };
                return it;
              }),
            ])
          }
        />
      );
    } else {
      return (
        <Text
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
        >
          {value.value}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

export function Lstr(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const value = props.path.path[1][1];
  if (value.type === "lstr") {
    if (
      props.path.writeable &&
      (state.id.equals(new Decimal(-1)) || props.mode === "write")
    ) {
      return (
        <TextInput
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
          value={value.value}
          onChangeText={(x) =>
            dispatch([
              "values",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "lstr",
                  value: x,
                };
                return it;
              }),
            ])
          }
        />
      );
    } else {
      return (
        <Text
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
        >
          {value.value}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

export function Clob(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const value = props.path.path[1][1];
  if (value.type === "clob") {
    if (
      props.path.writeable &&
      (state.id.equals(new Decimal(-1)) || props.mode === "write")
    ) {
      return (
        <TextInput
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
          value={value.value}
          onChangeText={(x) =>
            dispatch([
              "values",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "clob",
                  value: x,
                };
                return it;
              }),
            ])
          }
        />
      );
    } else {
      return (
        <Text
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
        >
          {value.value}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

export function I_32(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const value = props.path.path[1][1];
  if (value.type === "i32") {
    if (
      props.path.writeable &&
      (state.id.equals(new Decimal(-1)) || props.mode === "write")
    ) {
      return (
        <TextInput
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
          keyboardType={"number-pad"}
          value={value.value.toString()}
          onChangeText={(x) =>
            dispatch([
              "values",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "i32",
                  value: Decimal.clamp(
                    new Decimal(x).truncated(),
                    -2147483648,
                    2147483648
                  ),
                };
                return it;
              }),
            ])
          }
        />
      );
    } else {
      return (
        <Text
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
        >
          {value.value.toString()}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

export function U_32(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const value = props.path.path[1][1];
  if (value.type === "u32") {
    if (
      props.path.writeable &&
      (state.id.equals(new Decimal(-1)) || props.mode === "write")
    ) {
      return (
        <TextInput
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
          keyboardType={"number-pad"}
          value={value.value.toString()}
          onChangeText={(x) =>
            dispatch([
              "values",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "u32",
                  value: Decimal.clamp(
                    new Decimal(x).truncated(),
                    0,
                    2147483648
                  ),
                };
                return it;
              }),
            ])
          }
        />
      );
    } else {
      return (
        <Text
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
        >
          {value.value.toString()}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

export function I_64(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const value = props.path.path[1][1];
  if (value.type === "i64") {
    if (
      props.path.writeable &&
      (state.id.equals(new Decimal(-1)) || props.mode === "write")
    ) {
      return (
        <TextInput
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
          keyboardType={"number-pad"}
          value={value.value.toString()}
          onChangeText={(x) =>
            dispatch([
              "values",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "i64",
                  value: Decimal.clamp(
                    new Decimal(x).truncated(),
                    new Decimal("-9223372036854775807"),
                    new Decimal("9223372036854775807")
                  ),
                };
                return it;
              }),
            ])
          }
        />
      );
    } else {
      return (
        <Text
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
        >
          {value.value.toString()}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

export function U_64(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const value = props.path.path[1][1];
  if (value.type === "u64") {
    if (
      props.path.writeable &&
      (state.id.equals(new Decimal(-1)) || props.mode === "write")
    ) {
      return (
        <TextInput
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
          keyboardType={"number-pad"}
          value={value.value.toString()}
          onChangeText={(x) =>
            dispatch([
              "values",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "u64",
                  value: Decimal.clamp(
                    new Decimal(x).truncated(),
                    0,
                    new Decimal("9223372036854775807")
                  ),
                };
                return it;
              }),
            ])
          }
        />
      );
    } else {
      return (
        <Text
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
        >
          {value.value.toString()}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

export function I_Double(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const value = props.path.path[1][1];
  if (value.type === "idouble") {
    if (
      props.path.writeable &&
      (state.id.equals(new Decimal(-1)) || props.mode === "write")
    ) {
      return (
        <TextInput
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
          keyboardType={"number-pad"}
          value={value.value.toString()}
          onChangeText={(x) =>
            dispatch([
              "values",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "idouble",
                  value: new Decimal(x),
                };
                return it;
              }),
            ])
          }
        />
      );
    } else {
      return (
        <Text
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
        >
          {value.value.toString()}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

export function U_Double(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const value = props.path.path[1][1];
  if (value.type === "udouble") {
    if (
      props.path.writeable &&
      (state.id.equals(new Decimal(-1)) || props.mode === "write")
    ) {
      return (
        <TextInput
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
          keyboardType={"number-pad"}
          value={value.value.toString()}
          onChangeText={(x) =>
            dispatch([
              "values",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "udouble",
                  value: new Decimal(x).abs(),
                };
                return it;
              }),
            ])
          }
        />
      );
    } else {
      return (
        <Text
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
        >
          {value.value.toString()}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

export function I_Decimal(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const value = props.path.path[1][1];
  if (value.type === "idecimal") {
    if (
      props.path.writeable &&
      (state.id.equals(new Decimal(-1)) || props.mode === "write")
    ) {
      return (
        <TextInput
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
          keyboardType={"number-pad"}
          value={value.value.toString()}
          onChangeText={(x) =>
            dispatch([
              "values",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "idecimal",
                  value: new Decimal(x),
                };
                return it;
              }),
            ])
          }
        />
      );
    } else {
      return (
        <Text
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
        >
          {value.value.toString()}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

export function U_Decimal(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const value = props.path.path[1][1];
  if (value.type === "udecimal") {
    if (
      props.path.writeable &&
      (state.id.equals(new Decimal(-1)) || props.mode === "write")
    ) {
      return (
        <TextInput
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
          keyboardType={"number-pad"}
          value={value.value.toString()}
          onChangeText={(x) =>
            dispatch([
              "values",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "udecimal",
                  value: new Decimal(x).abs(),
                };
                return it;
              }),
            ])
          }
        />
      );
    } else {
      return (
        <Text
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
        >
          {value.value.toString()}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

// TODO. Add a expo-checkbox based implemention as well
export function Bool(
  props: Switch["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const value = props.path.path[1][1];
  if (value.type === "bool") {
    if (
      props.path.writeable &&
      (state.id.equals(new Decimal(-1)) || props.mode === "write")
    ) {
      return (
        <Switch
          style={[{}, style]}
          {...otherProps}
          value={value.value}
          onValueChange={(x) =>
            dispatch([
              "values",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "bool",
                  value: x,
                };
                return it;
              }),
            ])
          }
        />
      );
    } else {
      return <Switch style={[{}, style]} {...otherProps} value={value.value} />;
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

export function Date_Field(
  props: Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const value = props.path.path[1][1];
  if (value.type === "date") {
    if (
      props.path.writeable &&
      (state.id.equals(new Decimal(-1)) || props.mode === "write")
    ) {
      const [showPicker, setPicker] = useState(false);
      return (
        <>
          <Pressable onPress={() => setPicker(true)}>
            <Text
              style={[
                {
                  color: "white",
                },
                style,
              ]}
              {...otherProps}
            >
              {value.value.getDate() +
                "-" +
                (value.value.getMonth() + 1) +
                "-" +
                value.value.getFullYear()}
            </Text>
          </Pressable>
          <View>
            {showPicker && (
              <DateTimePicker
                mode={"date"}
                value={value.value}
                onChange={(_temp: any, date: Date | undefined) => {
                  setPicker(Platform.OS === "ios");
                  dispatch([
                    "values",
                    apply(props.path, (it) => {
                      it.path[1][1] = {
                        type: "date",
                        value: date || new Date(),
                      };
                      return it;
                    }),
                  ]);
                }}
              />
            )}
          </View>
        </>
      );
    } else {
      return (
        <Text
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
        >
          {value.value.getDate() +
            "-" +
            (value.value.getMonth() + 1) +
            "-" +
            value.value.getFullYear()}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

export function Time_Field(
  props: Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const value = props.path.path[1][1];
  if (value.type === "time") {
    if (
      props.path.writeable &&
      (state.id.equals(new Decimal(-1)) || props.mode === "write")
    ) {
      const [showPicker, setPicker] = useState(false);
      return (
        <>
          <Pressable onPress={() => setPicker(true)}>
            <Text
              style={[
                {
                  color: "white",
                },
                style,
              ]}
              {...otherProps}
            >
              {value.value.getHours() + ":" + value.value.getMinutes()}
            </Text>
          </Pressable>
          <View>
            {showPicker && (
              <DateTimePicker
                mode={"time"}
                value={value.value}
                onChange={(_temp: any, date: Date | undefined) => {
                  setPicker(Platform.OS === "ios");
                  dispatch([
                    "values",
                    apply(props.path, (it) => {
                      it.path[1][1] = {
                        type: "time",
                        value: date || new Date(),
                      };
                      return it;
                    }),
                  ]);
                }}
              />
            )}
          </View>
        </>
      );
    } else {
      return (
        <Text
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
        >
          {value.value.getHours() + ":" + value.value.getMinutes()}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

export function DateTime_Field(
  props: Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const value = props.path.path[1][1];
  if (value.type === "timestamp") {
    if (
      props.path.writeable &&
      (state.id.equals(new Decimal(-1)) || props.mode === "write")
    ) {
      const [showPicker, setPicker] = useState(false);
      const [mode, setMode] = useState("date");
      let [date, setDate] = useState(new Date(value.value.getTime()));
      return (
        <>
          <Pressable onPress={() => setPicker(true)}>
            <Text
              style={[
                {
                  color: "white",
                },
                style,
              ]}
              {...otherProps}
            >
              {value.value.getDate() +
                "-" +
                (value.value.getMonth() + 1) +
                "-" +
                value.value.getFullYear()}{" "}
              {value.value.getHours() + ":" + value.value.getMinutes()}
            </Text>
          </Pressable>
          <View>
            {showPicker && (
              <DateTimePicker
                mode={mode as any}
                value={value.value}
                onChange={(_temp: any, selectedValue: Date | undefined) => {
                  setPicker(Platform.OS === "ios");
                  if (selectedValue !== undefined) {
                    if (mode === "date") {
                      setDate(
                        apply(date, (it) => {
                          it.setFullYear(selectedValue.getFullYear());
                          it.setMonth(selectedValue.getMonth());
                          it.setDate(selectedValue.getDate());
                          return it;
                        })
                      );
                      setMode("time");
                      setPicker(Platform.OS !== "ios");
                    } else {
                      setDate(
                        apply(date, (it) => {
                          it.setHours(selectedValue.getHours());
                          it.setMinutes(selectedValue.getMinutes());
                          it.setSeconds(selectedValue.getSeconds());
                          it.setMilliseconds(selectedValue.getMilliseconds());
                          return it;
                        })
                      );
                      dispatch([
                        "values",
                        apply(props.path, (it) => {
                          it.path[1][1] = {
                            type: "timestamp",
                            value: new Date(date.getTime()),
                          };
                          return it;
                        }),
                      ]);
                      setMode("date");
                    }
                  }
                }}
              />
            )}
          </View>
        </>
      );
    } else {
      return (
        <Text
          style={[
            {
              color: "white",
            },
            style,
          ]}
          {...otherProps}
        >
          {value.value.getDate() +
            "-" +
            (value.value.getMonth() + 1) +
            "-" +
            value.value.getFullYear()}{" "}
          {value.value.getHours() + ":" + value.value.getMinutes()}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}
