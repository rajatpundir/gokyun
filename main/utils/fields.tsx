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
import { HashSet, Vector } from "prelude-ts";

import { Action, State, unwrap } from "./prelude";
import { useState } from "react";
import { Path, PathFilter, Struct } from "./variable";
import { get_structs } from "./schema";
import { useNavigation } from "@react-navigation/native";
import { Immutable } from "immer";

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
        if (state.id !== undefined && path.get().updatable) {
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
        if (state.id !== undefined && path.get().updatable) {
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
              {value.value.value.toString()}
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
        if (state.id !== undefined && path.get().updatable) {
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
              {value.value.value.toString()}
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
        if (state.id !== undefined && path.get().updatable) {
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
              {value.value.value.toString()}
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
        if (state.id !== undefined && path.get().updatable) {
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
              {value.value.value.toString()}
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
        if (state.id !== undefined && path.get().updatable) {
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
              {value.value.value.toString()}
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
        if (state.id !== undefined && path.get().updatable) {
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
              {value.value.value.toString()}
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
        if (state.id !== undefined && path.get().updatable) {
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
              {value.value.value.toString()}
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
        if (state.id !== undefined && path.get().updatable) {
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
              {value.value.value.toString()}
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
        if (state.id !== undefined && path.get().updatable) {
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
        if (state.id !== undefined && path.get().updatable) {
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
        if (state.id !== undefined && path.get().updatable) {
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
        if (state.id !== undefined && path.get().updatable) {
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

export function Box(
  props: TextInput["props"] &
    Text["props"] &
    ComponentProps & {
      display_path: ReadonlyArray<string>;
      // permissions for other struct
      permissions: [HashSet<Vector<string>>, HashSet<Vector<string>>];
      render_item: (
        struct: Immutable<Struct>,
        id: Immutable<Decimal>,
        paths: Immutable<HashSet<Path>>,
        selected: Immutable<Decimal>,
        set_selected: (selected: Decimal) => void
      ) => JSX.Element;
      filters: Array<[boolean, HashSet<PathFilter>]>;
      limit: Decimal;
      offset: Decimal;
    }
): JSX.Element | null {
  const navigation = useNavigation();
  const { state, dispatch, style, ...otherProps } = props;
  const path = state.values.findAny((x) =>
    x.path.equals(Vector.ofIterable(props.path))
  );
  if (path.isSome()) {
    const value = path.get().value;
    if (unwrap(value)) {
      if (value.value.type === "other") {
        const other_struct_name = value.value.other;
        const display_path = state.values.findAny((x) =>
          x.path.equals(Vector.ofIterable(props.display_path))
        );
        if (display_path.isSome()) {
          const display_value = display_path.get().value;
          if (unwrap(display_value)) {
            if (display_value.value.type === "str") {
              const other_struct = get_structs()
                .filter((x) => x.name === other_struct_name)
                .single();
              if (other_struct.isSome()) {
                const [selected, set_selected] = useState(
                  new Decimal(value.value.value)
                );
                if (state.id !== undefined && path.get().updatable) {
                  const v = value.value.value;
                  return (
                    <>
                      <Pressable
                        onPress={() => {
                          navigation.navigate("VariablesModal", {
                            struct: other_struct.get(),
                            permissions: props.permissions,
                            requested_paths: HashSet.of(),
                            selected: selected,
                            set_selected: set_selected,
                            render_item: props.render_item,
                            filters: props.filters,
                            limit: props.limit,
                            offset: props.offset,
                          });
                        }}
                      >
                        <Text style={[{}, style]} {...otherProps}>
                          {display_value.value.value}
                        </Text>
                      </Pressable>
                    </>
                  );
                } else {
                  return (
                    <Text style={[{}, style]} {...otherProps}>
                      {display_value.value.value}
                    </Text>
                  );
                }
              }
            }
          }
        }
      }
    }
  }
  console.log("ERROR: Invalid path for ", state.struct.name, ": ", props.path);
  return null;
}
