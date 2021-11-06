import * as React from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  Platform,
  Pressable,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import Decimal from "decimal.js";
import { Vector } from "prelude-ts";

import { Action, State, unwrap } from "./prelude";
import { useState } from "react";

type ComponentProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  path: ReadonlyArray<string>;
};

export function Str(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const path = state.values.findAny((x) =>
    x.path.equals(Vector.ofIterable(props.path))
  );
  if (path.isSome()) {
    const value = path.get().value;
    if (unwrap(value)) {
      if (value.value.type === "str") {
        if (path.get().updatable && state.id !== undefined) {
          return (
            <TextInput
              style={[{}, style]}
              {...otherProps}
              value={value.value.value}
              onChangeText={(x) =>
                dispatch(["values", path.get(), { type: "str", value: x }])
              }
            />
          );
        } else {
          return (
            <Text style={[{}, style]} {...otherProps}>
              {value.value.value}
            </Text>
          );
        }
      }
    }
  }
  console.log("ERROR: Invalid path for ", state.struct.name, ": ", props.path);
  return null;
}

export function Lstr(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | undefined {
  const { state, dispatch, style, ...otherProps } = props;
  return (
    <Str state={props.state} dispatch={props.dispatch} path={props.path} />
  );
}

export function Clob(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | undefined {
  const { state, dispatch, style, ...otherProps } = props;
  return (
    <Str state={props.state} dispatch={props.dispatch} path={props.path} />
  );
}

export function I_32(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const path = state.values.findAny((x) =>
    x.path.equals(Vector.ofIterable(props.path))
  );
  if (path.isSome()) {
    const value = path.get().value;
    if (unwrap(value)) {
      if (value.value.type === "i32") {
        if (path.get().updatable && state.id !== undefined) {
          return (
            <TextInput
              style={[{}, style]}
              {...otherProps}
              keyboardType={"number-pad"}
              value={value.value.value.toString()}
              onChangeText={(x) =>
                dispatch([
                  "values",
                  path.get(),
                  {
                    type: "i32",
                    value: Decimal.clamp(
                      new Decimal(x).truncated(),
                      -2147483648,
                      2147483648
                    ),
                  },
                ])
              }
            />
          );
        } else {
          return (
            <Text style={[{}, style]} {...otherProps}>
              {value.value.value}
            </Text>
          );
        }
      }
    }
  }
  console.log("ERROR: Invalid path for ", state.struct.name, ": ", props.path);
  return null;
}

export function U_32(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const path = state.values.findAny((x) =>
    x.path.equals(Vector.ofIterable(props.path))
  );
  if (path.isSome()) {
    const value = path.get().value;
    if (unwrap(value)) {
      if (value.value.type === "u32") {
        if (path.get().updatable && state.id !== undefined) {
          return (
            <TextInput
              style={[{}, style]}
              {...otherProps}
              keyboardType={"number-pad"}
              value={value.value.value.toString()}
              onChangeText={(x) =>
                dispatch([
                  "values",
                  path.get(),
                  {
                    type: "u32",
                    value: Decimal.clamp(
                      new Decimal(x).truncated(),
                      0,
                      2147483648
                    ),
                  },
                ])
              }
            />
          );
        } else {
          return (
            <Text style={[{}, style]} {...otherProps}>
              {value.value.value}
            </Text>
          );
        }
      }
    }
  }
  console.log("ERROR: Invalid path for ", state.struct.name, ": ", props.path);
  return null;
}

export function I_64(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const path = state.values.findAny((x) =>
    x.path.equals(Vector.ofIterable(props.path))
  );
  if (path.isSome()) {
    const value = path.get().value;
    if (unwrap(value)) {
      if (value.value.type === "i64") {
        if (path.get().updatable && state.id !== undefined) {
          return (
            <TextInput
              style={[{}, style]}
              {...otherProps}
              keyboardType={"number-pad"}
              value={value.value.value.toString()}
              onChangeText={(x) =>
                dispatch([
                  "values",
                  path.get(),
                  {
                    type: "i64",
                    value: Decimal.clamp(
                      new Decimal(x).truncated(),
                      new Decimal("-9223372036854775807"),
                      new Decimal("9223372036854775807")
                    ),
                  },
                ])
              }
            />
          );
        } else {
          return (
            <Text style={[{}, style]} {...otherProps}>
              {value.value.value}
            </Text>
          );
        }
      }
    }
  }
  console.log("ERROR: Invalid path for ", state.struct.name, ": ", props.path);
  return null;
}

export function U_64(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const path = state.values.findAny((x) =>
    x.path.equals(Vector.ofIterable(props.path))
  );
  if (path.isSome()) {
    const value = path.get().value;
    if (unwrap(value)) {
      if (value.value.type === "u64") {
        if (path.get().updatable && state.id !== undefined) {
          return (
            <TextInput
              style={[{}, style]}
              {...otherProps}
              keyboardType={"number-pad"}
              value={value.value.value.toString()}
              onChangeText={(x) =>
                dispatch([
                  "values",
                  path.get(),
                  {
                    type: "u64",
                    value: Decimal.clamp(
                      new Decimal(x).truncated(),
                      0,
                      new Decimal("9223372036854775807")
                    ),
                  },
                ])
              }
            />
          );
        } else {
          return (
            <Text style={[{}, style]} {...otherProps}>
              {value.value.value}
            </Text>
          );
        }
      }
    }
  }
  console.log("ERROR: Invalid path for ", state.struct.name, ": ", props.path);
  return null;
}

export function I_Double(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const path = state.values.findAny((x) =>
    x.path.equals(Vector.ofIterable(props.path))
  );
  if (path.isSome()) {
    const value = path.get().value;
    if (unwrap(value)) {
      if (value.value.type === "idouble") {
        if (path.get().updatable && state.id !== undefined) {
          return (
            <TextInput
              style={[{}, style]}
              {...otherProps}
              keyboardType={"number-pad"}
              value={value.value.value.toString()}
              onChangeText={(x) =>
                dispatch([
                  "values",
                  path.get(),
                  {
                    type: "idouble",
                    value: parseFloat(x),
                  },
                ])
              }
            />
          );
        } else {
          return (
            <Text style={[{}, style]} {...otherProps}>
              {value.value.value}
            </Text>
          );
        }
      }
    }
  }
  console.log("ERROR: Invalid path for ", state.struct.name, ": ", props.path);
  return null;
}

export function U_Double(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const path = state.values.findAny((x) =>
    x.path.equals(Vector.ofIterable(props.path))
  );
  if (path.isSome()) {
    const value = path.get().value;
    if (unwrap(value)) {
      if (value.value.type === "udouble") {
        if (path.get().updatable && state.id !== undefined) {
          return (
            <TextInput
              style={[{}, style]}
              {...otherProps}
              keyboardType={"number-pad"}
              value={value.value.value.toString()}
              onChangeText={(x) =>
                dispatch([
                  "values",
                  path.get(),
                  {
                    type: "udouble",
                    value: Math.max(0, parseFloat(x)),
                  },
                ])
              }
            />
          );
        } else {
          return (
            <Text style={[{}, style]} {...otherProps}>
              {value.value.value}
            </Text>
          );
        }
      }
    }
  }
  console.log("ERROR: Invalid path for ", state.struct.name, ": ", props.path);
  return null;
}

export function I_Decimal(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const path = state.values.findAny((x) =>
    x.path.equals(Vector.ofIterable(props.path))
  );
  if (path.isSome()) {
    const value = path.get().value;
    if (unwrap(value)) {
      if (value.value.type === "idecimal") {
        if (path.get().updatable && state.id !== undefined) {
          return (
            <TextInput
              style={[{}, style]}
              {...otherProps}
              keyboardType={"number-pad"}
              value={value.value.value.toString()}
              onChangeText={(x) =>
                dispatch([
                  "values",
                  path.get(),
                  {
                    type: "idecimal",
                    value: new Decimal(x),
                  },
                ])
              }
            />
          );
        } else {
          return (
            <Text style={[{}, style]} {...otherProps}>
              {value.value.value}
            </Text>
          );
        }
      }
    }
  }
  console.log("ERROR: Invalid path for ", state.struct.name, ": ", props.path);
  return null;
}

export function U_Decimal(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const path = state.values.findAny((x) =>
    x.path.equals(Vector.ofIterable(props.path))
  );
  if (path.isSome()) {
    const value = path.get().value;
    if (unwrap(value)) {
      if (value.value.type === "udecimal") {
        if (path.get().updatable && state.id !== undefined) {
          return (
            <TextInput
              style={[{}, style]}
              {...otherProps}
              keyboardType={"number-pad"}
              value={value.value.value.toString()}
              onChangeText={(x) =>
                dispatch([
                  "values",
                  path.get(),
                  {
                    type: "udecimal",
                    value: Decimal.max(0, new Decimal(x)),
                  },
                ])
              }
            />
          );
        } else {
          return (
            <Text style={[{}, style]} {...otherProps}>
              {value.value.value}
            </Text>
          );
        }
      }
    }
  }
  console.log("ERROR: Invalid path for ", state.struct.name, ": ", props.path);
  return null;
}

// TODO. Add a expo-checkbox based implemention as well
export function Bool(
  props: Switch["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const path = state.values.findAny((x) =>
    x.path.equals(Vector.ofIterable(props.path))
  );
  if (path.isSome()) {
    const value = path.get().value;
    if (unwrap(value)) {
      if (value.value.type === "bool") {
        if (path.get().updatable && state.id !== undefined) {
          return (
            <Switch
              style={[{}, style]}
              {...otherProps}
              value={value.value.value}
              onValueChange={(x) =>
                dispatch([
                  "values",
                  path.get(),
                  {
                    type: "bool",
                    value: x,
                  },
                ])
              }
            />
          );
        } else {
          return (
            <Switch
              style={[{}, style]}
              {...otherProps}
              value={value.value.value}
            />
          );
        }
      }
    }
  }
  console.log("ERROR: Invalid path for ", state.struct.name, ": ", props.path);
  return null;
}

export function Date_Field(
  props: Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const path = state.values.findAny((x) =>
    x.path.equals(Vector.ofIterable(props.path))
  );
  if (path.isSome()) {
    const value = path.get().value;
    if (unwrap(value)) {
      if (value.value.type === "date") {
        if (path.get().updatable && state.id !== undefined) {
          const [showPicker, setPicker] = useState(false);
          return (
            <>
              <Pressable onPress={() => setPicker(true)}>
                <Text style={[{}, style]} {...otherProps}>
                  {value.value.value.getDate() +
                    "-" +
                    (value.value.value.getMonth() + 1) +
                    "-" +
                    value.value.value.getFullYear()}
                </Text>
              </Pressable>
              <View>
                {showPicker && (
                  <DateTimePicker
                    mode={"date"}
                    value={value.value.value}
                    onChange={(_temp: any, date: Date | undefined) => {
                      setPicker(Platform.OS === "ios");
                      dispatch([
                        "values",
                        path.get(),
                        {
                          type: "date",
                          value: date || new Date(),
                        },
                      ]);
                    }}
                  />
                )}
              </View>
            </>
          );
        } else {
          return (
            <Text style={[{}, style]} {...otherProps}>
              {value.value.value.getDate() +
                "-" +
                (value.value.value.getMonth() + 1) +
                "-" +
                value.value.value.getFullYear()}
            </Text>
          );
        }
      }
    }
  }
  console.log("ERROR: Invalid path for ", state.struct.name, ": ", props.path);
  return null;
}

export function Time_Field(
  props: Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const path = state.values.findAny((x) =>
    x.path.equals(Vector.ofIterable(props.path))
  );
  if (path.isSome()) {
    const value = path.get().value;
    if (unwrap(value)) {
      if (value.value.type === "time") {
        if (path.get().updatable && state.id !== undefined) {
          const [showPicker, setPicker] = useState(false);
          return (
            <>
              <Pressable onPress={() => setPicker(true)}>
                <Text style={[{}, style]} {...otherProps}>
                  {value.value.value.getHours() +
                    "-" +
                    value.value.value.getMinutes()}
                </Text>
              </Pressable>
              <View>
                {showPicker && (
                  <DateTimePicker
                    mode={"time"}
                    value={value.value.value}
                    onChange={(_temp: any, date: Date | undefined) => {
                      setPicker(Platform.OS === "ios");
                      dispatch([
                        "values",
                        path.get(),
                        {
                          type: "time",
                          value: date || new Date(),
                        },
                      ]);
                    }}
                  />
                )}
              </View>
            </>
          );
        } else {
          return (
            <Text style={[{}, style]} {...otherProps}>
              {value.value.value.getHours() +
                "-" +
                value.value.value.getMinutes()}
            </Text>
          );
        }
      }
    }
  }
  console.log("ERROR: Invalid path for ", state.struct.name, ": ", props.path);
  return null;
}

export function DateTime_Field(
  props: Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const path = state.values.findAny((x) =>
    x.path.equals(Vector.ofIterable(props.path))
  );
  if (path.isSome()) {
    const value = path.get().value;
    if (unwrap(value)) {
      if (value.value.type === "timestamp") {
        if (path.get().updatable && state.id !== undefined) {
          const [showPicker, setPicker] = useState(false);
          const [mode, setMode] = useState("date");
          const [tempDate, setTempDate] = useState(
            new Date(value.value.value.getTime())
          );
          const [tempTime, setTempTime] = useState(
            new Date(new Date(value.value.value.getTime()))
          );
          return (
            <>
              <Pressable onPress={() => setPicker(true)}>
                <Text style={[{}, style]} {...otherProps}>
                  {value.value.value.getDate() +
                    "-" +
                    (value.value.value.getMonth() + 1) +
                    "-" +
                    value.value.value.getFullYear()}{" "}
                  {value.value.value.getHours() +
                    "-" +
                    value.value.value.getMinutes()}
                </Text>
              </Pressable>
              <View>
                {showPicker && (
                  <DateTimePicker
                    mode={"time"}
                    value={value.value.value}
                    onChange={(_temp: any, selectedValue: Date | undefined) => {
                      setPicker(Platform.OS === "ios");
                      if (mode == "date") {
                        const currentDate =
                          selectedValue || (value.value.value as Date);
                        setTempDate(currentDate);
                        setMode("time");
                        setPicker(Platform.OS !== "ios");
                      } else {
                        const selectedTime =
                          selectedValue || (value.value.value as Date);
                        setTempTime(selectedTime);
                        setPicker(Platform.OS === "ios");
                        setMode("date");
                        dispatch([
                          "values",
                          path.get(),
                          {
                            type: "timestamp",
                            value: new Date(
                              tempDate.getFullYear(),
                              tempDate.getMonth(),
                              tempDate.getDate(),
                              tempTime.getHours(),
                              tempTime.getMinutes(),
                              tempTime.getSeconds()
                            ),
                          },
                        ]);
                      }
                    }}
                  />
                )}
              </View>
            </>
          );
        } else {
          return (
            <Text style={[{}, style]} {...otherProps}>
              {value.value.value.getDate() +
                "-" +
                (value.value.value.getMonth() + 1) +
                "-" +
                value.value.value.getFullYear()}{" "}
              {value.value.value.getHours() +
                "-" +
                value.value.value.getMinutes()}
            </Text>
          );
        }
      }
    }
  }
  console.log("ERROR: Invalid path for ", state.struct.name, ": ", props.path);
  return null;
}

// TODO. Implement Timeslice Picker here (once the DateTime Picker is tested)

// Box probably requires implementing a full fledged list and filter support
// A modal with top bar with filter button and a flatlist, maybe a bottom bar with some stats from query
// Filter opens in an action sheet component
// Possibility of Joins and Group Aggregates should be considered
export function Box(
  props: TextInput["props"] & Text["props"] & ComponentProps
): JSX.Element | null {
  const { state, dispatch, style, ...otherProps } = props;
  const path = state.values.findAny((x) =>
    x.path.equals(Vector.ofIterable(props.path))
  );
  if (path.isSome()) {
    const value = path.get().value;
    if (unwrap(value)) {
      if (value.value.type === "str") {
        if (path.get().updatable && state.id !== undefined) {
          return (
            <TextInput
              style={[{}, style]}
              {...otherProps}
              value={value.value.value}
              onChangeText={(x) =>
                dispatch(["values", path.get(), { type: "str", value: x }])
              }
            />
          );
        } else {
          return (
            <Text style={[{}, style]} {...otherProps}>
              {value.value.value}
            </Text>
          );
        }
      }
    }
  }
  console.log("ERROR: Invalid path for ", state.struct.name, ": ", props.path);
  return null;
}
