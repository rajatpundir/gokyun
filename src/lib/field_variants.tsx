import React, { useEffect, useRef, useState } from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { useNavigation } from "@react-navigation/native";
import { Immutable } from "immer";
import moment from "moment";
import { Platform, Switch } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text, Input, TextArea, Pressable, Row } from "native-base";
import Checkbox from "expo-checkbox";
import { MaterialIcons } from "@expo/vector-icons";

import { PathPermission, get_permissions, Entrypoint } from "./permissions";
import { apply, arrow } from "./prelude";
import { OrFilter, FilterPath, AndFilter } from "./db";
import {
  Action,
  get_labeled_permissions,
  State,
  get_decimal_keyboard_type,
  get_validated_decimal,
} from "./commons";
import {
  compare_paths,
  concat_path_strings,
  Path,
  PathString,
  StrongEnum,
  strong_enum_to_string,
  Struct,
  Variable,
} from "./variable";
import { get_struct, StructName } from "../schema";
import { CommonProps, List } from "./list";
import { tw } from "./tailwind";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { SheetVariantProps } from "./list_variants";
import { cloneDeep } from "lodash";
import { useTheme } from "./theme";
import { terminal } from "./terminal";

type FieldVariant = {
  str: [
    (props: ComponentProps & StrFieldProps) => JSX.Element,
    Record<string, (props: ComponentProps & StrFieldProps) => JSX.Element>
  ];
  lstr: [
    (props: ComponentProps & LstrFieldProps) => JSX.Element,
    Record<string, (props: ComponentProps & LstrFieldProps) => JSX.Element>
  ];
  clob: [
    (props: ComponentProps & ClobFieldProps) => JSX.Element,
    Record<string, (props: ComponentProps & ClobFieldProps) => JSX.Element>
  ];
  i32: [
    (props: ComponentProps & I32FieldProps) => JSX.Element,
    Record<string, (props: ComponentProps & I32FieldProps) => JSX.Element>
  ];
  u32: [
    (props: ComponentProps & U32FieldProps) => JSX.Element,
    Record<string, (props: ComponentProps & U32FieldProps) => JSX.Element>
  ];
  i64: [
    (props: ComponentProps & I64FieldProps) => JSX.Element,
    Record<string, (props: ComponentProps & I64FieldProps) => JSX.Element>
  ];
  u64: [
    (props: ComponentProps & U64FieldProps) => JSX.Element,
    Record<string, (props: ComponentProps & U64FieldProps) => JSX.Element>
  ];
  idouble: [
    (props: ComponentProps & IDoubleFieldProps) => JSX.Element,
    Record<string, (props: ComponentProps & IDoubleFieldProps) => JSX.Element>
  ];
  udouble: [
    (props: ComponentProps & UDoubleFieldProps) => JSX.Element,
    Record<string, (props: ComponentProps & UDoubleFieldProps) => JSX.Element>
  ];
  idecimal: [
    (props: ComponentProps & IDecimalFieldProps) => JSX.Element,
    Record<string, (props: ComponentProps & IDecimalFieldProps) => JSX.Element>
  ];
  udecimal: [
    (props: ComponentProps & UDecimalFieldProps) => JSX.Element,
    Record<string, (props: ComponentProps & UDecimalFieldProps) => JSX.Element>
  ];
  bool: [
    (props: ComponentProps & BoolFieldProps) => JSX.Element,
    Record<string, (props: ComponentProps & BoolFieldProps) => JSX.Element>
  ];
  date: [
    (props: ComponentProps & DateFieldProps) => JSX.Element,
    Record<string, (props: ComponentProps & DateFieldProps) => JSX.Element>
  ];
  time: [
    (props: ComponentProps & TimeFieldProps) => JSX.Element,
    Record<string, (props: ComponentProps & TimeFieldProps) => JSX.Element>
  ];
  timestamp: [
    (props: ComponentProps & TimestampFieldProps) => JSX.Element,
    Record<string, (props: ComponentProps & TimestampFieldProps) => JSX.Element>
  ];
  other: [
    (props: ComponentProps & OtherFieldProps) => JSX.Element,
    Record<string, (props: ComponentProps & OtherFieldProps) => JSX.Element>
  ];
};

export const field_variants: FieldVariant = {
  str: [Str, {}],
  lstr: [Lstr, {}],
  clob: [Clob, {}],
  i32: [I_32, {}],
  u32: [U_32, {}],
  i64: [I_64, {}],
  u64: [U_64, {}],
  idouble: [I_Double, {}],
  udouble: [U_Double, {}],
  idecimal: [I_Decimal, {}],
  udecimal: [U_Decimal, {}],
  bool: [Bool_Switch, { switch: Bool_Switch, checkbox: Bool_Checkbox }],
  date: [Date_Field, {}],
  time: [Time_Field, {}],
  timestamp: [Timestamp_Field, {}],
  other: [Other_Field, {}],
};

export type FieldOptions =
  | ["str", StrFieldProps]
  | ["lstr", LstrFieldProps]
  | ["clob", ClobFieldProps]
  | ["u32", U32FieldProps]
  | ["i32", I32FieldProps]
  | ["u64", U32FieldProps]
  | ["i64", I64FieldProps]
  | ["udouble", UDoubleFieldProps]
  | ["idouble", IDoubleFieldProps]
  | ["udecimal", UDecimalFieldProps]
  | ["idecimal", IDecimalFieldProps]
  | ["bool", BoolFieldProps]
  | ["date", DateFieldProps]
  | ["time", TimeFieldProps]
  | ["timestamp", TimestampFieldProps]
  | ["other", OtherFieldProps];

export type ComponentProps = {
  mode: "read" | "write";
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
  path: Path;
  placeholder: string;
  violates_checks: boolean;
};

type StrFieldProps = {};

function Str(props: ComponentProps & StrFieldProps): JSX.Element {
  const theme = useTheme();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
  useEffect(() => {
    set_local_val(strong_enum_to_string(value));
    set_has_errors(false);
  }, [value]);
  const default_value = "";
  const style = tw.style([], {});
  if (value.type === "str") {
    return arrow(() => {
      if (is_writeable) {
        return (
          <Input
            flex={1}
            size={"md"}
            maxLength={255}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors || props.violates_checks}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                set_has_errors(false);
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: value.type,
                      value: x,
                    };
                    return it;
                  }),
                ]);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value && local_val !== "" ? (
                <Pressable
                  px={1}
                  onPress={() => {
                    set_local_val(default_value);
                    set_has_errors(false);
                    props.dispatch([
                      "value",
                      apply(props.path, (it) => {
                        it.path[1][1] = {
                          type: value.type,
                          value: default_value,
                        };
                        return it;
                      }),
                    ]);
                  }}
                >
                  <MaterialIcons
                    name="clear"
                    size={24}
                    color={theme.placeholder}
                  />
                </Pressable>
              ) : (
                <></>
              )
            }
            color={theme.text}
            borderColor={theme.border}
            placeholderTextColor={theme.placeholder}
            style={style}
          />
        );
      }
      return (
        <Text color={theme.text} style={style}>
          {local_val}
        </Text>
      );
    });
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

type LstrFieldProps = {};

function Lstr(props: ComponentProps & LstrFieldProps): JSX.Element {
  const theme = useTheme();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
  useEffect(() => {
    set_local_val(strong_enum_to_string(value));
    set_has_errors(false);
  }, [value]);
  const default_value = "";
  const style = tw.style([], {});
  if (value.type === "lstr") {
    return arrow(() => {
      if (is_writeable) {
        return (
          <Input
            flex={1}
            size={"md"}
            maxLength={1023}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors || props.violates_checks}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                set_has_errors(false);
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: value.type,
                      value: x,
                    };
                    return it;
                  }),
                ]);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value && local_val !== "" ? (
                <Pressable
                  onPress={() => {
                    set_local_val(default_value);
                    set_has_errors(false);
                    props.dispatch([
                      "value",
                      apply(props.path, (it) => {
                        it.path[1][1] = {
                          type: value.type,
                          value: default_value,
                        };
                        return it;
                      }),
                    ]);
                  }}
                  px={1}
                >
                  <MaterialIcons
                    name="clear"
                    size={24}
                    color={theme.placeholder}
                  />
                </Pressable>
              ) : (
                <></>
              )
            }
            color={theme.text}
            borderColor={theme.border}
            placeholderTextColor={theme.placeholder}
            style={style}
          />
        );
      }
      return (
        <Text color={theme.text} style={style}>
          {local_val}
        </Text>
      );
    });
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

type ClobFieldProps = {};

function Clob(props: ComponentProps & ClobFieldProps): JSX.Element {
  const theme = useTheme();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
  useEffect(() => {
    set_local_val(strong_enum_to_string(value));
    set_has_errors(false);
  }, [value]);
  const default_value = "";
  const style = tw.style([], {});
  if (value.type === "clob") {
    return arrow(() => {
      if (is_writeable) {
        return (
          <TextArea
            flex={1}
            size={"md"}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors || props.violates_checks}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                set_has_errors(false);
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: value.type,
                      value: x,
                    };
                    return it;
                  }),
                ]);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value && local_val !== "" ? (
                <Pressable
                  onPress={() => {
                    set_local_val(default_value);
                    set_has_errors(false);
                    props.dispatch([
                      "value",
                      apply(props.path, (it) => {
                        it.path[1][1] = {
                          type: value.type,
                          value: default_value,
                        };
                        return it;
                      }),
                    ]);
                  }}
                  px={1}
                >
                  <MaterialIcons
                    name="clear"
                    size={24}
                    color={theme.placeholder}
                  />
                </Pressable>
              ) : (
                <></>
              )
            }
            color={theme.text}
            borderColor={theme.border}
            placeholderTextColor={theme.placeholder}
            style={style}
          />
        );
      }
      return (
        <Text color={theme.text} style={style}>
          {local_val}
        </Text>
      );
    });
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

type I32FieldProps = {};

function I_32(props: ComponentProps & I32FieldProps): JSX.Element {
  const theme = useTheme();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [local_val, set_local_val] = useState(
    apply(strong_enum_to_string(value), (it) => {
      if (is_writeable && it === "0") {
        return "";
      }
      return it;
    })
  );
  const [has_errors, set_has_errors] = useState(false);
  useEffect(() => {
    set_local_val(
      apply(strong_enum_to_string(value), (it) => {
        if (is_writeable && it === "0") {
          return "";
        }
        return it;
      })
    );
    set_has_errors(false);
  }, [value]);
  const default_value = new Decimal(0).toString();
  const style = tw.style([], {});
  if (value.type === "i32") {
    return arrow(() => {
      if (is_writeable) {
        return (
          <Input
            flex={1}
            size={"md"}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors || props.violates_checks}
            keyboardType={get_decimal_keyboard_type(value.type)}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                const val = get_validated_decimal(value.type, x);
                set_has_errors(false);
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: value.type,
                      value: val,
                    };
                    return it;
                  }),
                ]);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value && local_val !== "" ? (
                <Pressable
                  px={1}
                  onPress={() => {
                    try {
                      const val = get_validated_decimal(
                        value.type,
                        default_value
                      );
                      set_local_val(
                        apply(default_value, (it) => {
                          if (it === "0") {
                            return "";
                          }
                          return it;
                        })
                      );
                      set_has_errors(false);
                      props.dispatch([
                        "value",
                        apply(props.path, (it) => {
                          it.path[1][1] = {
                            type: value.type,
                            value: val,
                          };
                          return it;
                        }),
                      ]);
                    } catch (e) {}
                  }}
                >
                  <MaterialIcons
                    name="clear"
                    size={24}
                    color={theme.placeholder}
                  />
                </Pressable>
              ) : (
                <></>
              )
            }
            color={theme.text}
            borderColor={theme.border}
            placeholderTextColor={theme.placeholder}
            style={style}
          />
        );
      }
      return (
        <Text color={theme.text} style={style}>
          {local_val}
        </Text>
      );
    });
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

type U32FieldProps = {};

function U_32(props: ComponentProps & U32FieldProps): JSX.Element {
  const theme = useTheme();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [local_val, set_local_val] = useState(
    apply(strong_enum_to_string(value), (it) => {
      if (is_writeable && it === "0") {
        return "";
      }
      return it;
    })
  );
  const [has_errors, set_has_errors] = useState(false);
  useEffect(() => {
    set_local_val(
      apply(strong_enum_to_string(value), (it) => {
        if (is_writeable && it === "0") {
          return "";
        }
        return it;
      })
    );
    set_has_errors(false);
  }, [value]);
  const default_value = new Decimal(0).toString();
  const style = tw.style([], {});
  if (value.type === "u32") {
    return arrow(() => {
      if (is_writeable) {
        return (
          <Input
            flex={1}
            size={"md"}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors || props.violates_checks}
            keyboardType={get_decimal_keyboard_type(value.type)}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                const val = get_validated_decimal(value.type, x);
                set_has_errors(false);
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: value.type,
                      value: val,
                    };
                    return it;
                  }),
                ]);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value && local_val !== "" ? (
                <Pressable
                  px={1}
                  onPress={() => {
                    try {
                      const val = get_validated_decimal(
                        value.type,
                        default_value
                      );
                      set_local_val(
                        apply(default_value, (it) => {
                          if (it === "0") {
                            return "";
                          }
                          return it;
                        })
                      );
                      set_has_errors(false);
                      props.dispatch([
                        "value",
                        apply(props.path, (it) => {
                          it.path[1][1] = {
                            type: value.type,
                            value: val,
                          };
                          return it;
                        }),
                      ]);
                    } catch (e) {}
                  }}
                >
                  <MaterialIcons
                    name="clear"
                    size={24}
                    color={theme.placeholder}
                  />
                </Pressable>
              ) : (
                <></>
              )
            }
            color={theme.text}
            borderColor={theme.border}
            placeholderTextColor={theme.placeholder}
            style={style}
          />
        );
      }
      return (
        <Text color={theme.text} style={style}>
          {local_val}
        </Text>
      );
    });
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

type I64FieldProps = {};

function I_64(props: ComponentProps & I64FieldProps): JSX.Element {
  const theme = useTheme();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [local_val, set_local_val] = useState(
    apply(strong_enum_to_string(value), (it) => {
      if (is_writeable && it === "0") {
        return "";
      }
      return it;
    })
  );
  const [has_errors, set_has_errors] = useState(false);
  useEffect(() => {
    set_local_val(
      apply(strong_enum_to_string(value), (it) => {
        if (is_writeable && it === "0") {
          return "";
        }
        return it;
      })
    );
    set_has_errors(false);
  }, [value]);
  const default_value = new Decimal(0).toString();
  const style = tw.style([], {});
  if (value.type === "i64") {
    return arrow(() => {
      if (is_writeable) {
        return (
          <Input
            flex={1}
            size={"md"}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors || props.violates_checks}
            keyboardType={get_decimal_keyboard_type(value.type)}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                const val = get_validated_decimal(value.type, x);
                set_has_errors(false);
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: value.type,
                      value: val,
                    };
                    return it;
                  }),
                ]);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value && local_val !== "" ? (
                <Pressable
                  px={1}
                  onPress={() => {
                    try {
                      const val = get_validated_decimal(
                        value.type,
                        default_value
                      );
                      set_local_val(
                        apply(default_value, (it) => {
                          if (it === "0") {
                            return "";
                          }
                          return it;
                        })
                      );
                      set_has_errors(false);
                      props.dispatch([
                        "value",
                        apply(props.path, (it) => {
                          it.path[1][1] = {
                            type: value.type,
                            value: val,
                          };
                          return it;
                        }),
                      ]);
                    } catch (e) {}
                  }}
                >
                  <MaterialIcons
                    name="clear"
                    size={24}
                    color={theme.placeholder}
                  />
                </Pressable>
              ) : (
                <></>
              )
            }
            color={theme.text}
            borderColor={theme.border}
            placeholderTextColor={theme.placeholder}
            style={style}
          />
        );
      }
      return (
        <Text color={theme.text} style={style}>
          {local_val}
        </Text>
      );
    });
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

type U64FieldProps = {};

function U_64(props: ComponentProps & U64FieldProps): JSX.Element {
  const theme = useTheme();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [local_val, set_local_val] = useState(
    apply(strong_enum_to_string(value), (it) => {
      if (is_writeable && it === "0") {
        return "";
      }
      return it;
    })
  );
  const [has_errors, set_has_errors] = useState(false);
  useEffect(() => {
    set_local_val(
      apply(strong_enum_to_string(value), (it) => {
        if (is_writeable && it === "0") {
          return "";
        }
        return it;
      })
    );
    set_has_errors(false);
  }, [value]);
  const default_value = new Decimal(0).toString();
  const style = tw.style([], {});
  if (value.type === "u64") {
    return arrow(() => {
      if (is_writeable) {
        return (
          <Input
            flex={1}
            size={"md"}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors || props.violates_checks}
            keyboardType={get_decimal_keyboard_type(value.type)}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                const val = get_validated_decimal(value.type, x);
                set_has_errors(false);
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: value.type,
                      value: val,
                    };
                    return it;
                  }),
                ]);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value && local_val !== "" ? (
                <Pressable
                  px={1}
                  onPress={() => {
                    try {
                      const val = get_validated_decimal(
                        value.type,
                        default_value
                      );
                      set_local_val(
                        apply(default_value, (it) => {
                          if (it === "0") {
                            return "";
                          }
                          return it;
                        })
                      );
                      set_has_errors(false);
                      props.dispatch([
                        "value",
                        apply(props.path, (it) => {
                          it.path[1][1] = {
                            type: value.type,
                            value: val,
                          };
                          return it;
                        }),
                      ]);
                    } catch (e) {}
                  }}
                >
                  <MaterialIcons
                    name="clear"
                    size={24}
                    color={theme.placeholder}
                  />
                </Pressable>
              ) : (
                <></>
              )
            }
            color={theme.text}
            borderColor={theme.border}
            placeholderTextColor={theme.placeholder}
            style={style}
          />
        );
      }
      return (
        <Text color={theme.text} style={style}>
          {local_val}
        </Text>
      );
    });
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

type IDoubleFieldProps = {};

function I_Double(props: ComponentProps & IDoubleFieldProps): JSX.Element {
  const theme = useTheme();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [local_val, set_local_val] = useState(
    apply(strong_enum_to_string(value), (it) => {
      if (is_writeable && it === "0") {
        return "";
      }
      return it;
    })
  );
  const [has_errors, set_has_errors] = useState(false);
  useEffect(() => {
    set_local_val(
      apply(strong_enum_to_string(value), (it) => {
        if (is_writeable && it === "0") {
          return "";
        }
        return it;
      })
    );
    set_has_errors(false);
  }, [value]);
  const default_value = new Decimal(0).toString();
  const style = tw.style([], {});
  if (value.type === "idouble") {
    return arrow(() => {
      if (is_writeable) {
        return (
          <Input
            flex={1}
            size={"md"}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors || props.violates_checks}
            keyboardType={get_decimal_keyboard_type(value.type)}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                const val = get_validated_decimal(value.type, x);
                set_has_errors(false);
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: value.type,
                      value: val,
                    };
                    return it;
                  }),
                ]);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value && local_val !== "" ? (
                <Pressable
                  px={1}
                  onPress={() => {
                    try {
                      const val = get_validated_decimal(
                        value.type,
                        default_value
                      );
                      set_local_val(
                        apply(default_value, (it) => {
                          if (it === "0") {
                            return "";
                          }
                          return it;
                        })
                      );
                      set_has_errors(false);
                      props.dispatch([
                        "value",
                        apply(props.path, (it) => {
                          it.path[1][1] = {
                            type: value.type,
                            value: val,
                          };
                          return it;
                        }),
                      ]);
                    } catch (e) {}
                  }}
                >
                  <MaterialIcons
                    name="clear"
                    size={24}
                    color={theme.placeholder}
                  />
                </Pressable>
              ) : (
                <></>
              )
            }
            color={theme.text}
            borderColor={theme.border}
            placeholderTextColor={theme.placeholder}
            style={style}
          />
        );
      }
      return (
        <Text color={theme.text} style={style}>
          {local_val}
        </Text>
      );
    });
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

type UDoubleFieldProps = {};

function U_Double(props: ComponentProps & UDoubleFieldProps): JSX.Element {
  const theme = useTheme();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [local_val, set_local_val] = useState(
    apply(strong_enum_to_string(value), (it) => {
      if (is_writeable && it === "0") {
        return "";
      }
      return it;
    })
  );
  const [has_errors, set_has_errors] = useState(false);
  useEffect(() => {
    set_local_val(
      apply(strong_enum_to_string(value), (it) => {
        if (is_writeable && it === "0") {
          return "";
        }
        return it;
      })
    );
    set_has_errors(false);
  }, [value]);
  const default_value = new Decimal(0).toString();
  const style = tw.style([], {});
  if (value.type === "udouble") {
    return arrow(() => {
      if (is_writeable) {
        return (
          <Input
            flex={1}
            size={"md"}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors || props.violates_checks}
            keyboardType={get_decimal_keyboard_type(value.type)}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                const val = get_validated_decimal(value.type, x);
                set_has_errors(false);
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: value.type,
                      value: val,
                    };
                    return it;
                  }),
                ]);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value && local_val !== "" ? (
                <Pressable
                  px={1}
                  onPress={() => {
                    try {
                      const val = get_validated_decimal(
                        value.type,
                        default_value
                      );
                      set_local_val(
                        apply(default_value, (it) => {
                          if (it === "0") {
                            return "";
                          }
                          return it;
                        })
                      );
                      set_has_errors(false);
                      props.dispatch([
                        "value",
                        apply(props.path, (it) => {
                          it.path[1][1] = {
                            type: value.type,
                            value: val,
                          };
                          return it;
                        }),
                      ]);
                    } catch (e) {}
                  }}
                >
                  <MaterialIcons
                    name="clear"
                    size={24}
                    color={theme.placeholder}
                  />
                </Pressable>
              ) : (
                <></>
              )
            }
            color={theme.text}
            borderColor={theme.border}
            placeholderTextColor={theme.placeholder}
            style={style}
          />
        );
      }
      return (
        <Text color={theme.text} style={style}>
          {local_val}
        </Text>
      );
    });
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

type IDecimalFieldProps = {};

function I_Decimal(props: ComponentProps & IDecimalFieldProps): JSX.Element {
  const theme = useTheme();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [local_val, set_local_val] = useState(
    apply(strong_enum_to_string(value), (it) => {
      if (is_writeable && it === "0") {
        return "";
      }
      return it;
    })
  );
  const [has_errors, set_has_errors] = useState(false);
  useEffect(() => {
    set_local_val(
      apply(strong_enum_to_string(value), (it) => {
        if (is_writeable && it === "0") {
          return "";
        }
        return it;
      })
    );
    set_has_errors(false);
  }, [value]);
  const default_value = new Decimal(0).toString();
  const style = tw.style([], {});
  if (value.type === "idecimal") {
    return arrow(() => {
      if (is_writeable) {
        return (
          <Input
            flex={1}
            size={"md"}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors || props.violates_checks}
            keyboardType={get_decimal_keyboard_type(value.type)}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                const val = get_validated_decimal(value.type, x);
                set_has_errors(false);
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: value.type,
                      value: val,
                    };
                    return it;
                  }),
                ]);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value && local_val !== "" ? (
                <Pressable
                  px={1}
                  onPress={() => {
                    try {
                      const val = get_validated_decimal(
                        value.type,
                        default_value
                      );
                      set_local_val(
                        apply(default_value, (it) => {
                          if (it === "0") {
                            return "";
                          }
                          return it;
                        })
                      );
                      set_has_errors(false);
                      props.dispatch([
                        "value",
                        apply(props.path, (it) => {
                          it.path[1][1] = {
                            type: value.type,
                            value: val,
                          };
                          return it;
                        }),
                      ]);
                    } catch (e) {}
                  }}
                >
                  <MaterialIcons
                    name="clear"
                    size={24}
                    color={theme.placeholder}
                  />
                </Pressable>
              ) : (
                <></>
              )
            }
            color={theme.text}
            borderColor={theme.border}
            placeholderTextColor={theme.placeholder}
            style={style}
          />
        );
      }
      return (
        <Text color={theme.text} style={style}>
          {local_val}
        </Text>
      );
    });
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

type UDecimalFieldProps = {};

function U_Decimal(props: ComponentProps & UDecimalFieldProps): JSX.Element {
  const theme = useTheme();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [local_val, set_local_val] = useState(
    apply(strong_enum_to_string(value), (it) => {
      if (is_writeable && it === "0") {
        return "";
      }
      return it;
    })
  );
  const [has_errors, set_has_errors] = useState(false);
  useEffect(() => {
    set_local_val(
      apply(strong_enum_to_string(value), (it) => {
        if (is_writeable && it === "0") {
          return "";
        }
        return it;
      })
    );
    set_has_errors(false);
  }, [value]);
  const default_value = new Decimal(0).toString();
  const style = tw.style([], {});
  if (value.type === "udecimal") {
    return arrow(() => {
      if (is_writeable) {
        return (
          <Input
            flex={1}
            size={"md"}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors || props.violates_checks}
            keyboardType={get_decimal_keyboard_type(value.type)}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                const val = get_validated_decimal(value.type, x);
                set_has_errors(false);
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: value.type,
                      value: val,
                    };
                    return it;
                  }),
                ]);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value && local_val !== "" ? (
                <Pressable
                  px={1}
                  onPress={() => {
                    try {
                      const val = get_validated_decimal(
                        value.type,
                        default_value
                      );
                      set_local_val(
                        apply(default_value, (it) => {
                          if (it === "0") {
                            return "";
                          }
                          return it;
                        })
                      );
                      set_has_errors(false);
                      props.dispatch([
                        "value",
                        apply(props.path, (it) => {
                          it.path[1][1] = {
                            type: value.type,
                            value: val,
                          };
                          return it;
                        }),
                      ]);
                    } catch (e) {}
                  }}
                >
                  <MaterialIcons
                    name="clear"
                    size={24}
                    color={theme.placeholder}
                  />
                </Pressable>
              ) : (
                <></>
              )
            }
            color={theme.text}
            borderColor={theme.border}
            placeholderTextColor={theme.placeholder}
            style={style}
          />
        );
      }
      return (
        <Text color={theme.text} style={style}>
          {local_val}
        </Text>
      );
    });
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

type BoolFieldProps = {};

function Bool_Switch(props: ComponentProps & BoolFieldProps): JSX.Element {
  const theme = useTheme();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const style = tw.style([], {});
  if (value.type === "bool") {
    if (is_writeable) {
      return (
        <Switch
          value={value.value}
          onValueChange={(x) =>
            props.dispatch([
              "value",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: value.type,
                  value: x,
                };
                return it;
              }),
            ])
          }
          trackColor={{ true: theme.accent, false: theme.accent }}
          thumbColor={theme.primary}
        />
      );
    }
    return (
      <Text color={theme.text} style={style}>
        {value.value ? "Yes" : "No"}
      </Text>
    );
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

function Bool_Checkbox(props: ComponentProps & BoolFieldProps): JSX.Element {
  const theme = useTheme();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const style = tw.style([], {});
  if (value.type === "bool") {
    if (is_writeable) {
      return (
        <Checkbox
          value={value.value}
          onValueChange={(x) =>
            props.dispatch([
              "value",
              apply(props.path, (it) => {
                it.path[1][1] = {
                  type: value.type,
                  value: x,
                };
                return it;
              }),
            ])
          }
          color={value.value ? theme.primary : undefined}
        />
      );
    }
    return (
      <Text color={theme.text} style={style}>
        {value.value ? "Yes" : "No"}
      </Text>
    );
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

type DateFieldProps = {};

function Date_Field(props: ComponentProps & DateFieldProps): JSX.Element {
  const theme = useTheme();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [showPicker, setPicker] = useState(false);
  const style = tw.style([], {});
  if (value.type === "date") {
    if (is_writeable) {
      return (
        <>
          <Pressable onPress={() => setPicker(true)}>
            <Text color={theme.text} style={style}>
              {moment(value.value).format("Do MMM YYYY")}
            </Text>
          </Pressable>
          <>
            {showPicker && (
              <DateTimePicker
                mode={"date"}
                value={value.value}
                onChange={(_temp: any, date: Date | undefined) => {
                  setPicker(Platform.OS === "ios");
                  props.dispatch([
                    "value",
                    apply(props.path, (it) => {
                      it.path[1][1] = {
                        type: value.type,
                        value: date || new Date(),
                      };
                      return it;
                    }),
                  ]);
                }}
              />
            )}
          </>
        </>
      );
    }
    return (
      <Text color={theme.text} style={style}>
        {moment(value.value).format("MMM Do YYYY")}
      </Text>
    );
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

type TimeFieldProps = {};

function Time_Field(props: ComponentProps & TimeFieldProps): JSX.Element {
  const theme = useTheme();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [showPicker, setPicker] = useState(false);
  const style = tw.style([], {});
  if (value.type === "time") {
    if (is_writeable) {
      return (
        <>
          <Pressable onPress={() => setPicker(true)}>
            <Text color={theme.text} style={style}>
              {moment(value.value).format("h:mm A")}
            </Text>
          </Pressable>
          <>
            {showPicker && (
              <DateTimePicker
                mode={"time"}
                value={value.value}
                onChange={(_temp: any, date: Date | undefined) => {
                  setPicker(Platform.OS === "ios");
                  props.dispatch([
                    "value",
                    apply(props.path, (it) => {
                      it.path[1][1] = {
                        type: value.type,
                        value: date || new Date(),
                      };
                      return it;
                    }),
                  ]);
                }}
              />
            )}
          </>
        </>
      );
    }
    return (
      <Text color={theme.text} style={style}>
        {moment(value.value).format("h:mm A")}
      </Text>
    );
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

type TimestampFieldProps = {};

function Timestamp_Field(
  props: ComponentProps & TimestampFieldProps
): JSX.Element {
  const theme = useTheme();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
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
  const style = tw.style([], {});
  if (value.type === "timestamp") {
    if (is_writeable) {
      return (
        <>
          <Pressable onPress={() => setPicker(true)}>
            <Text color={theme.text} style={style}>
              {moment(value.value).format("Do MMM YYYY, h:mm A")}
            </Text>
          </Pressable>
          <>
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
                      props.dispatch([
                        "value",
                        apply(props.path, (it) => {
                          it.path[1][1] = {
                            type: value.type,
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
          </>
        </>
      );
    }
    return (
      <Text color={theme.text} style={style}>
        {moment(value.value).format("Do MMM YYYY, h:mm A")}
      </Text>
    );
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

type OtherFieldProps = CommonProps & {
  labels: Immutable<Array<[string, PathString]>>;
  searchable?: boolean;
};

function Other_Field(props: ComponentProps & OtherFieldProps): JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation();
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const sheet_ref = useRef<BottomSheetModal>(null);
  if (value.type === "other") {
    const struct = get_struct(value.other as StructName);
    const list_props = {
      ...props,
      selected: value.value,
      struct: struct,
      level: undefined,
      init_filter: new OrFilter(
        0,
        [false, undefined],
        [false, undefined],
        [false, undefined],
        get_other_filter_paths(
          props.struct,
          props.state,
          props.path,
          props.labels
        )
      ),
      filters: HashSet.of<AndFilter>(),
      on_select: (variable: Variable) =>
        props.dispatch([
          "values",
          get_upscaled_paths(props.path, variable, props.state.labels),
        ]),
      searchable: props.searchable,
    };
    switch (props.options[0]) {
      case "list": {
        const title: string = apply(props.options[1].title, (it) => {
          if (it !== undefined) {
            return it;
          }
          return "Select value";
        });
        if (is_writeable) {
          return (
            <Pressable
              onPress={() => {
                navigation.navigate("SelectionModal", {
                  ...list_props,
                  title: title,
                });
              }}
            >
              {apply(props.options[1].element, (it) => {
                if (it !== undefined) {
                  return it;
                }
                return <></>;
              })}
            </Pressable>
          );
        } else {
          return apply(props.options[1].element, (it) => {
            if (it !== undefined) {
              return it;
            }
            return <></>;
          });
        }
      }
      case "menu": {
        if (is_writeable) {
          return <List {...list_props} />;
        } else {
          return (
            <Row alignItems={"center"} pl={"1.5"} pr={"0"} py={"0.5"}>
              {props.options[1].element}
            </Row>
          );
        }
      }
      case "sheet": {
        if (is_writeable) {
          const title: string = apply(props.options[1].title, (it) => {
            if (it !== undefined) {
              return it;
            }
            return "Select value";
          });
          const bsm_ref = props.options[1].bsm_ref
            ? props.options[1].bsm_ref
            : sheet_ref;
          const options = [
            props.options[0],
            {
              ...props.options[1],
              title: title,
              bsm_ref: bsm_ref,
            },
          ] as ["sheet", SheetVariantProps];
          return (
            <>
              <Pressable
                onPress={() => {
                  bsm_ref.current?.present();
                }}
              >
                {props.options[1].element}
              </Pressable>
              <List {...list_props} options={options} />
            </>
          );
        } else {
          return props.options[1].element;
        }
      }
      case "row": {
        return <List {...list_props} />;
      }
      case "column": {
        return <List {...list_props} />;
      }
      default: {
        const _exhaustiveCheck: never = props.options[0];
        return _exhaustiveCheck;
      }
    }
  }
  terminal(["error", ["field_variants", `Invalid path: ${props.path}`]]);
  return <></>;
}

function get_other_filter_paths(
  struct: Struct,
  state: State,
  path: Path,
  labels: Immutable<Array<[string, PathString]>>
): HashSet<FilterPath> {
  const labeled_permissions: HashSet<PathPermission> = get_labeled_permissions(
    get_permissions(struct, state.entrypoints as ReadonlyArray<Entrypoint>),
    get_upscaled_labels(state, path, labels)
  );
  const path_prefix: ReadonlyArray<string> = [
    ...path.path[0].map((x) => x[0]),
    path.path[1][0],
  ];
  let filter_paths: HashSet<FilterPath> = HashSet.of();
  if (path.path[1][1].type === "other") {
    const other_struct = get_struct(path.path[1][1].other as StructName);
    let filtered_permissions: HashSet<PathPermission> = HashSet.of();
    for (const permission of labeled_permissions) {
      const permission_path_prefix: ReadonlyArray<string> =
        permission.path[0].map((x) => x[0]);
      let check = true;
      for (const [index, field_name] of path_prefix.entries()) {
        if (permission_path_prefix[index] !== field_name) {
          check = false;
          break;
        }
      }
      if (check) {
        filtered_permissions = filtered_permissions.add(permission);
      }
    }
    for (const permission of filtered_permissions) {
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
          const other_struct = get_struct(field.other as StructName);
          filter_paths = filter_paths.add(
            apply(
              new FilterPath(
                permission.label,
                path_string,
                [field.type, undefined, other_struct],
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
        default: {
          const _exhaustiveCheck: never = field;
          return _exhaustiveCheck;
        }
      }
    }
    return filter_paths;
  }
  return filter_paths;
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
  for (const parent_label of state.labels) {
    let new_label = parent_label[0];
    for (const child_label of labels) {
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
  for (const child_label of labels) {
    let check = true;
    let new_label_path = concat_path_strings(
      path_string,
      child_label[1] as PathString
    );
    for (const parent_label of state.labels) {
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

function get_upscaled_paths(
  base_path: Path,
  variable: Variable,
  labels: Immutable<Array<[string, PathString]>>
): HashSet<Path> {
  const base_value: StrongEnum = base_path.path[1][1];
  let upscaled_paths: HashSet<Path> = HashSet.of();
  if (base_value.type === "other") {
    const cloned_variable = cloneDeep(variable);
    if (cloned_variable.struct.name === base_value.other) {
      for (const path of cloned_variable.paths) {
        upscaled_paths = upscaled_paths.add(
          apply(path, (it) => {
            it.path = [
              [
                ...base_path.path[0],
                [
                  base_path.path[1][0],
                  {
                    struct: cloned_variable.struct,
                    id: cloned_variable.id,
                    created_at: cloned_variable.created_at,
                    updated_at: cloned_variable.updated_at,
                  },
                ],
                ...it.path[0],
              ],
              it.path[1],
            ];
            for (const label of labels) {
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
                value: cloned_variable.id,
              },
            ],
          ];
          for (const label of labels) {
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
