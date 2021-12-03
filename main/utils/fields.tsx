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
import moment from "moment";

import { Text as ThemedText } from "../../main/themed";
import { apply, unwrap, Option, Ok } from "./prelude";
import { Action, State } from "./commons";
import { useState } from "react";
import { Path, PathString } from "./variable";
import { HashSet } from "prelude-ts";
import { Immutable } from "immer";

type ComponentProps = {
  mode: "read" | "write";
  state: State;
  dispatch: React.Dispatch<Action>;
  path: Path;
};

function Str(
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
              "value",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "str",
                  value: x.substring(0, 256),
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

function Lstr(
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
              "value",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "lstr",
                  value: x.substring(0, 1024),
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

function Clob(
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
              "value",
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

function I_32(
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
              "value",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "i32",
                  value: Decimal.clamp(
                    new Decimal(x || "0").truncated(),
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

function U_32(
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
              "value",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "u32",
                  value: Decimal.clamp(
                    new Decimal(x || "0").truncated(),
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

function I_64(
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
              "value",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "i64",
                  value: Decimal.clamp(
                    new Decimal(x || "0").truncated(),
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

function U_64(
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
              "value",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "u64",
                  value: Decimal.clamp(
                    new Decimal(x || "0").truncated(),
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

function I_Double(
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
              "value",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "idouble",
                  value: new Decimal(x || "0"),
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

function U_Double(
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
              "value",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "udouble",
                  value: new Decimal(x || "0").abs(),
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

function I_Decimal(
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
              "value",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "idecimal",
                  value: new Decimal(x || "0"),
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

function U_Decimal(
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
              "value",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: "udecimal",
                  value: new Decimal(x || "0").abs(),
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
function Bool(props: Switch["props"] & ComponentProps): JSX.Element | null {
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
              "value",
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

function Date_Field(props: Text["props"] & ComponentProps): JSX.Element | null {
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
              {moment(value.value).format("Do MMM YYYY")}
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
                    "value",
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
          {moment(value.value).format("MMM Do YYYY")}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

function Time_Field(props: Text["props"] & ComponentProps): JSX.Element | null {
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
              {moment(value.value).format("h:mm A")}
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
                    "value",
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
          {moment(value.value).format("h:mm A")}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

function Timestamp_Field(
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
              {moment(value.value).format("Do MMM YYYY, h:mm A")}
            </Text>
          </Pressable>
          <View>
            {showPicker && (
              <DateTimePicker
                mode={mode as "date" | "time"}
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
                        "value",
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
                  } else {
                    setDate(new Date(value.value.getTime()));
                    setMode("date");
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
          {moment(value.value).format("Do MMM YYYY, h:mm A")}
        </Text>
      );
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
}

function get_path(
  paths: Immutable<HashSet<Path>>,
  path_string: PathString
): Option<Path> {
  for (let path of paths) {
    if (
      path.path[0].length === path_string[0].length &&
      path.path[1][0] === path_string[1]
    ) {
      let check = true;
      for (let [index, [field_name, _]] of path.path[0].entries()) {
        if (path_string[0][index] !== field_name) {
          check = false;
          break;
        }
      }
      if (check) {
        return new Ok(path);
      }
    }
  }
  return undefined;
}

export function Label(props: {
  state: State;
  path: PathString | string;
}): JSX.Element | null {
  const path_string: PathString = apply(undefined, () => {
    if (typeof props.path === "string") {
      return [[], props.path];
    } else {
      return props.path;
    }
  });
  return apply(get_path(props.state.values, path_string), (path) => {
    if (unwrap(path)) {
      return <ThemedText>{path.value.label}</ThemedText>;
    }
    return null;
  });
}

export function Field(props: {
  state: State;
  dispatch: React.Dispatch<Action>;
  path: PathString | string;
  mode?: "read" | "write";
  options?:
    | ["text", TextInput["props"] & Text["props"]]
    | ["date", Text["props"]]
    | ["bool", Switch["props"]];
}): JSX.Element | null {
  const path_string: PathString = apply(undefined, () => {
    if (typeof props.path === "string") {
      return [[], props.path];
    } else {
      return props.path;
    }
  });
  return apply(get_path(props.state.values, path_string), (path) => {
    if (unwrap(path)) {
      const field_struct_name = path.value.path[1][1].type;
      switch (field_struct_name) {
        case "str": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <Str
                mode={"read"}
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return <Str mode={"read"} {...props} path={path.value} />;
        }
        case "lstr": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <Lstr
                mode={"read"}
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return <Lstr mode={"read"} {...props} path={path.value} />;
        }
        case "clob": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <Clob
                mode={"read"}
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return <Clob mode={"read"} {...props} path={path.value} />;
        }
        case "u32": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <U_32
                mode={"read"}
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return <U_32 mode={"read"} {...props} path={path.value} />;
        }
        case "i32": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <I_32
                mode={"read"}
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return <I_32 mode={"read"} {...props} path={path.value} />;
        }
        case "u64": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <U_64
                mode={"read"}
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return <U_64 mode={"read"} {...props} path={path.value} />;
        }
        case "i64": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <I_64
                mode={"read"}
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return <I_64 mode={"read"} {...props} path={path.value} />;
        }
        case "udouble": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <U_Double
                mode={"read"}
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return <U_Double mode={"read"} {...props} path={path.value} />;
        }
        case "idouble": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <I_Double
                mode={"read"}
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return <I_Double mode={"read"} {...props} path={path.value} />;
        }
        case "udecimal": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <U_Decimal
                mode={"read"}
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return <U_Decimal mode={"read"} {...props} path={path.value} />;
        }
        case "idecimal": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <I_Decimal
                mode={"read"}
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return <I_Decimal mode={"read"} {...props} path={path.value} />;
        }
        case "bool": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "bool"
          ) {
            return (
              <Bool
                mode={"read"}
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return <Bool mode={"read"} {...props} path={path.value} />;
        }
        case "date": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "date"
          ) {
            return (
              <Date_Field
                mode={"read"}
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return <Date_Field mode={"read"} {...props} path={path.value} />;
        }
        case "time": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "date"
          ) {
            return (
              <Time_Field
                mode={"read"}
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return <Time_Field mode={"read"} {...props} path={path.value} />;
        }
        case "timestamp": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "date"
          ) {
            return (
              <Timestamp_Field
                mode={"read"}
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return <Timestamp_Field mode={"read"} {...props} path={path.value} />;
        }
        case "other": {
          return <></>;
        }
        default: {
          const _exhaustiveCheck: never = field_struct_name;
          return _exhaustiveCheck;
        }
      }
    }
    return null;
  });
}
