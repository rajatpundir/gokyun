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
import { apply, unwrap, Result } from "./prelude";
import { Action, get_labeled_permissions, State, get_path } from "./commons";
import { useState } from "react";
import {
  compare_paths,
  concat_path_strings,
  Path,
  PathString,
  StrongEnum,
  Struct,
  Variable,
} from "./variable";
import { get_struct } from "./schema";
import { HashSet } from "prelude-ts";
import { FilterPath } from "./db";
import { PathPermission, get_permissions } from "./permissions";
import { useNavigation } from "@react-navigation/native";
import { Immutable } from "immer";

type ComponentProps = {
  mode: "read" | "write";
  struct: Struct;
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
    if (props.path.writeable && props.mode === "write") {
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
    if (props.path.writeable && props.mode === "write") {
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
    if (props.path.writeable && props.mode === "write") {
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
    if (props.path.writeable && props.mode === "write") {
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
    if (props.path.writeable && props.mode === "write") {
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
    if (props.path.writeable && props.mode === "write") {
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
    if (props.path.writeable && props.mode === "write") {
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
    if (props.path.writeable && props.mode === "write") {
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
    if (props.path.writeable && props.mode === "write") {
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
    if (props.path.writeable && props.mode === "write") {
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
    if (props.path.writeable && props.mode === "write") {
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
    if (props.path.writeable && props.mode === "write") {
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
  const [showPicker, setPicker] = useState(false);
  if (value.type === "date") {
    if (props.path.writeable && props.mode === "write") {
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
  const [showPicker, setPicker] = useState(false);
  if (value.type === "time") {
    if (props.path.writeable && props.mode === "write") {
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
  const [showPicker, setPicker] = useState(false);
  const [mode, setMode] = useState("date");
  let [date, setDate] = useState(
    apply(new Date(), (it) => {
      if (value.type === "timestamp") {
        return new Date(value.value.getTime());
      }
      return it;
    })
  );
  if (value.type === "timestamp") {
    if (props.path.writeable && props.mode === "write") {
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

function Other_Field(
  props: ComponentProps & {
    title: string;
    labels: Immutable<Array<[string, PathString]>>;
    element: JSX.Element;
    render_list_element: (props: {
      selected: number;
      variable: Variable;
      disptach_values: (variable: Variable) => void;
    }) => JSX.Element;
  }
): JSX.Element | null {
  const { state, dispatch } = props;
  const value = props.path.path[1][1];
  const navigation = useNavigation();
  if (value.type === "other") {
    if (props.path.writeable && props.mode === "write") {
      return (
        <Pressable
          onPress={() => {
            const struct = get_struct(value.other);
            if (unwrap(struct)) {
              navigation.navigate("SelectionModal", {
                title: props.title,
                selected: value.value.toNumber(),
                struct: struct.value,
                active: true,
                level: undefined,
                filters: [
                  {
                    id: [false, undefined],
                    created_at: [false, undefined],
                    updated_at: [false, undefined],
                    filter_paths: get_other_filter_paths(
                      props.struct,
                      props.state,
                      props.path,
                      props.labels
                    ),
                  },
                  [],
                ],
                limit_offset: undefined,
                render_list_element: props.render_list_element,
                disptach_values: (variable: Variable) => {
                  dispatch([
                    "values",
                    get_upscaled_paths(
                      props.path,
                      variable,
                      props.state.labels
                    ),
                  ]);
                  navigation.goBack();
                },
              });
            }
          }}
        >
          {props.element}
        </Pressable>
      );
    } else {
      return props.element;
    }
  }
  console.log("ERROR: Invalid path: ", props.path);
  return null;
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
  return apply(get_path(props.state, path_string), (path) => {
    if (unwrap(path)) {
      return <ThemedText>{path.value.label}</ThemedText>;
    }
    return null;
  });
}

export function Field(props: {
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
  path: PathString | string;
  mode?: "read";
  options?:
    | ["text", TextInput["props"] & Text["props"]]
    | ["date", Text["props"]]
    | ["bool", Switch["props"]]
    | [
        "other",
        {
          title: string;
          labels: Immutable<Array<[string, PathString]>>;
          element: JSX.Element;
          render_list_element: (props: {
            selected: number;
            variable: Variable;
            disptach_values: (variable: Variable) => void;
          }) => JSX.Element;
        }
      ];
}): JSX.Element | null {
  const path_string: PathString = apply(undefined, () => {
    if (typeof props.path === "string") {
      return [[], props.path];
    } else {
      return props.path;
    }
  });
  return apply(get_path(props.state, path_string), (path) => {
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
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return (
            <Str
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
            />
          );
        }
        case "lstr": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <Lstr
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return (
            <Lstr
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
            />
          );
        }
        case "clob": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <Clob
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return (
            <Clob
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
            />
          );
        }
        case "u32": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <U_32
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return (
            <U_32
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
            />
          );
        }
        case "i32": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <I_32
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return (
            <I_32
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
            />
          );
        }
        case "u64": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <U_64
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return (
            <U_64
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
            />
          );
        }
        case "i64": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <I_64
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return (
            <I_64
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
            />
          );
        }
        case "udouble": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <U_Double
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return (
            <U_Double
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
            />
          );
        }
        case "idouble": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <I_Double
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return (
            <I_Double
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
            />
          );
        }
        case "udecimal": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <U_Decimal
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return (
            <U_Decimal
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
            />
          );
        }
        case "idecimal": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "text"
          ) {
            return (
              <I_Decimal
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return (
            <I_Decimal
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
            />
          );
        }
        case "bool": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "bool"
          ) {
            return (
              <Bool
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return (
            <Bool
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
            />
          );
        }
        case "date": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "date"
          ) {
            return (
              <Date_Field
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return (
            <Date_Field
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
            />
          );
        }
        case "time": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "date"
          ) {
            return (
              <Time_Field
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return (
            <Time_Field
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
            />
          );
        }
        case "timestamp": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "date"
          ) {
            return (
              <Timestamp_Field
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                {...props.options[1]}
              />
            );
          }
          return (
            <Timestamp_Field
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
            />
          );
        }
        case "other": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "other"
          ) {
            return (
              <Other_Field
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                title={props.options[1].title}
                labels={props.options[1].labels}
                element={props.options[1].element}
                render_list_element={props.options[1].render_list_element}
              />
            );
          }
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

export function Check(
  props: Text["props"] & {
    state: State;
    name: string;
    message: string;
  }
): JSX.Element | null {
  const { state, style, ...otherProps } = props;
  if (props.name in state.checks) {
    const result = state.checks[props.name] as Result<boolean>;
    if (unwrap(result)) {
      if (!result.value) {
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
            {props.message}
          </Text>
        );
      }
    }
  }
  return null;
}

function get_upscaled_labels(
  state: State,
  path: Path,
  labels: Immutable<Array<[string, PathString]>>
): Immutable<Array<[string, PathString]>> {
  const path_string: PathString = [
    path.path[0].map((x) => x[0]),
    path.path[1][0],
  ];
  let new_labels: Array<[string, PathString]> = [];
  for (let parent_label of state.labels) {
    let new_label = parent_label[0];
    for (let child_label of labels) {
      if (
        compare_paths(
          parent_label[1],
          concat_path_strings(path_string, child_label[1] as PathString)
        )
      ) {
        new_label = child_label[0];
        break;
      }
    }
    new_labels.push([new_label, parent_label[1] as PathString]);
  }
  for (let child_label of labels) {
    let check = true;
    let new_label_path = concat_path_strings(
      path_string,
      child_label[1] as PathString
    );
    for (let parent_label of state.labels) {
      if (compare_paths(parent_label[1], new_label_path)) {
        check = false;
        break;
      }
    }
    if (check) {
      new_labels.push([child_label[0], new_label_path]);
    }
  }
  return new_labels;
}

function get_other_filter_paths(
  struct: Struct,
  state: State,
  path: Path,
  labels: Immutable<Array<[string, PathString]>>
): HashSet<FilterPath> {
  const labeled_permissions: HashSet<PathPermission> = get_labeled_permissions(
    get_permissions(
      struct,
      state.user_paths as PathString[],
      state.borrows as string[]
    ),
    get_upscaled_labels(state, path, labels)
  );
  const path_prefix: ReadonlyArray<string> = [
    ...path.path[0].map((x) => x[0]),
    path.path[1][0],
  ];
  let filter_paths: HashSet<FilterPath> = HashSet.of();
  if (path.path[1][1].type === "other") {
    const other_struct = get_struct(path.path[1][1].other);
    if (unwrap(other_struct)) {
      let filtered_permissions: HashSet<PathPermission> = HashSet.of();
      for (let permission of labeled_permissions) {
        const permission_path_prefix: ReadonlyArray<string> =
          permission.path[0].map((x) => x[0]);
        let check = true;
        for (let [index, field_name] of path_prefix.entries()) {
          if (permission_path_prefix[index] !== field_name) {
            check = false;
            break;
          }
        }
        if (check) {
          filtered_permissions = filtered_permissions.add(permission);
        }
      }

      for (let permission of filtered_permissions) {
        const path_string: PathString = [
          permission.path[0].slice(path_prefix.length).map((x) => x[0]),
          permission.path[1][0],
        ];
        const field: StrongEnum = permission.path[1][1];
        switch (field.type) {
          case "str":
          case "lstr":
          case "clob":
          case "i32":
          case "u32":
          case "i64":
          case "u64":
          case "idouble":
          case "udouble":
          case "idecimal":
          case "udecimal":
          case "bool":
          case "date":
          case "time":
          case "timestamp": {
            filter_paths = filter_paths.add(
              apply(
                new FilterPath(
                  permission.label,
                  path_string,
                  [field.type, undefined],
                  undefined
                ),
                (it) => {
                  it.active = true;
                  return it;
                }
              )
            );
            break;
          }
          case "other": {
            const other_struct = get_struct(field.other);
            if (unwrap(other_struct)) {
              filter_paths = filter_paths.add(
                apply(
                  new FilterPath(
                    permission.label,
                    path_string,
                    [field.type, undefined, other_struct.value],
                    undefined
                  ),
                  (it) => {
                    it.active = true;
                    return it;
                  }
                )
              );
            }
            break;
          }
          default: {
            const _exhaustiveCheck: never = field;
            return _exhaustiveCheck;
          }
        }
      }
      return filter_paths;
    }
  }
  return filter_paths;
}

function get_upscaled_paths(
  base_path: Path,
  variable: Variable,
  labels: Immutable<Array<[string, PathString]>>
): HashSet<Path> {
  const base_value: StrongEnum = base_path.path[1][1];
  let upscaled_paths: HashSet<Path> = HashSet.of();
  if (base_value.type === "other") {
    base_value.other;
    if (variable.struct.name === base_value.other) {
      for (let path of variable.paths) {
        upscaled_paths = upscaled_paths.add(
          apply(path, (it) => {
            it.path = [
              [
                ...base_path.path[0],
                [
                  base_path.path[1][0],
                  {
                    struct: variable.struct,
                    id: variable.id,
                    active: variable.active,
                    created_at: variable.created_at,
                    updated_at: variable.updated_at,
                  },
                ],
                ...it.path[0],
              ],
              it.path[1],
            ];
            for (let label of labels) {
              if (
                compare_paths(label[1], [
                  it.path[0].map((x) => x[0]),
                  it.path[1][0],
                ])
              ) {
                it.label = label[0];
                break;
              }
            }
            return it;
          })
        );
      }
      upscaled_paths = upscaled_paths.add(
        apply(base_path, (it) => {
          it.path = [
            it.path[0],
            [
              it.path[1][0],
              {
                type: "other",
                other: base_value.other,
                value: variable.id,
              },
            ],
          ];
          for (let label of labels) {
            if (
              compare_paths(label[1], [
                it.path[0].map((x) => x[0]),
                it.path[1][0],
              ])
            ) {
              it.label = label[0];
              break;
            }
          }
          it.modified = true;
          return it;
        })
      );
    }
  }
  return upscaled_paths;
}
