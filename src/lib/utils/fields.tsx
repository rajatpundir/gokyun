import React, { useState } from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { useNavigation } from "@react-navigation/native";
import { Immutable } from "immer";
import moment from "moment";
import { Pressable, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text, Input, TextArea, Switch } from "native-base";
import { MaterialIcons } from "@expo/vector-icons";

import { PathPermission, get_permissions } from "./permissions";
import { apply, unwrap, Result, arrow } from "./prelude";
import { Filter, FilterPath } from "./db";
import {
  Action,
  get_labeled_permissions,
  State,
  get_path,
  get_label,
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
import { get_struct } from "./schema";
import { ListAction } from "./list";
import { theme } from "./theme";
import { tw } from "./tailwind";

type ComponentProps = {
  mode: "read" | "write";
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
  path: Path;
  placeholder: string;
};

function Str(props: ComponentProps): JSX.Element {
  const value = props.path.path[1][1];
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
  const default_value = "";
  const style = tw.style([], {});
  if (value.type === "str") {
    return apply(props.path.writeable && props.mode === "write", (it) => {
      if (it) {
        return (
          <Input
            flex={1}
            size={"md"}
            maxLength={255}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: "str",
                      value: x,
                    };
                    return it;
                  }),
                ]);
                set_has_errors(false);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value);
                    props.dispatch([
                      "value",
                      apply(props.path, (it) => {
                        it.path[1][1] = {
                          type: "str",
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
            style={style}
          />
        );
      }
      return <Text style={style}>{local_val}</Text>;
    });
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

function Lstr(props: ComponentProps): JSX.Element {
  const value = props.path.path[1][1];
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
  const default_value = "";
  const style = tw.style([], {});
  if (value.type === "lstr") {
    return apply(props.path.writeable && props.mode === "write", (it) => {
      if (it) {
        return (
          <Input
            flex={1}
            size={"md"}
            maxLength={255}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: "lstr",
                      value: x,
                    };
                    return it;
                  }),
                ]);
                set_has_errors(false);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value ? (
                <Pressable
                  onPress={() => {
                    set_local_val(default_value);
                    props.dispatch([
                      "value",
                      apply(props.path, (it) => {
                        it.path[1][1] = {
                          type: "lstr",
                          value: default_value,
                        };
                        return it;
                      }),
                    ]);
                  }}
                  style={tw.style(["px-2"], {})}
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
            style={style}
          />
        );
      }
      return <Text style={style}>{local_val}</Text>;
    });
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

function Clob(props: ComponentProps): JSX.Element {
  const value = props.path.path[1][1];
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
  const default_value = "";
  const style = tw.style([], {});
  if (value.type === "clob") {
    return apply(props.path.writeable && props.mode === "write", (it) => {
      if (it) {
        return (
          <TextArea
            flex={1}
            size={"md"}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: "clob",
                      value: x,
                    };
                    return it;
                  }),
                ]);
                set_has_errors(false);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value ? (
                <Pressable
                  onPress={() => {
                    set_local_val(default_value);
                    props.dispatch([
                      "value",
                      apply(props.path, (it) => {
                        it.path[1][1] = {
                          type: "clob",
                          value: default_value,
                        };
                        return it;
                      }),
                    ]);
                  }}
                  style={tw.style(["px-2"], {})}
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
            style={style}
          />
        );
      }
      return <Text style={style}>{local_val}</Text>;
    });
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

function I_32(props: ComponentProps): JSX.Element {
  const value = props.path.path[1][1];
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
  const default_value = new Decimal(0);
  const style = tw.style([], {});
  if (value.type === "i32") {
    return apply(props.path.writeable && props.mode === "write", (it) => {
      if (it) {
        return (
          <Input
            flex={1}
            size={"md"}
            maxLength={255}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors}
            onChangeText={(x) => {
              try {
                const val = Decimal.clamp(
                  new Decimal(x || "0").truncated(),
                  -2147483648,
                  2147483648
                );
                if (x === "") {
                  set_local_val("");
                } else {
                  set_local_val(val.toString());
                }
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: "i32",
                      value: val,
                    };
                    return it;
                  }),
                ]);
                set_has_errors(false);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value.toString() ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value.toString());
                    props.dispatch([
                      "value",
                      apply(props.path, (it) => {
                        it.path[1][1] = {
                          type: "i32",
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
            style={style}
          />
        );
      }
      return <Text style={style}>{local_val}</Text>;
    });
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

function U_32(props: ComponentProps): JSX.Element {
  const value = props.path.path[1][1];
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
  const default_value = new Decimal(0);
  const style = tw.style([], {});
  if (value.type === "u32") {
    return apply(props.path.writeable && props.mode === "write", (it) => {
      if (it) {
        return (
          <Input
            flex={1}
            size={"md"}
            maxLength={255}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors}
            onChangeText={(x) => {
              try {
                const val = Decimal.clamp(
                  new Decimal(x || "0").truncated(),
                  0,
                  2147483648
                );
                if (x === "") {
                  set_local_val("");
                } else {
                  set_local_val(val.toString());
                }
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: "u32",
                      value: val,
                    };
                    return it;
                  }),
                ]);
                set_has_errors(false);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value.toString() ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value.toString());
                    props.dispatch([
                      "value",
                      apply(props.path, (it) => {
                        it.path[1][1] = {
                          type: "u32",
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
            style={style}
          />
        );
      }
      return <Text style={style}>{local_val}</Text>;
    });
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

function I_64(props: ComponentProps): JSX.Element {
  const value = props.path.path[1][1];
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
  const default_value = new Decimal(0);
  const style = tw.style([], {});
  if (value.type === "i64") {
    return apply(props.path.writeable && props.mode === "write", (it) => {
      if (it) {
        return (
          <Input
            flex={1}
            size={"md"}
            maxLength={255}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors}
            onChangeText={(x) => {
              try {
                const val = Decimal.clamp(
                  new Decimal(x || "0").truncated(),
                  new Decimal("-9223372036854775807"),
                  new Decimal("9223372036854775807")
                );
                if (x === "") {
                  set_local_val("");
                } else {
                  set_local_val(val.toString());
                }
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: "i64",
                      value: val,
                    };
                    return it;
                  }),
                ]);
                set_has_errors(false);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value.toString() ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value.toString());
                    props.dispatch([
                      "value",
                      apply(props.path, (it) => {
                        it.path[1][1] = {
                          type: "i64",
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
            style={style}
          />
        );
      }
      return <Text style={style}>{local_val}</Text>;
    });
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

function U_64(props: ComponentProps): JSX.Element {
  const value = props.path.path[1][1];
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
  const default_value = new Decimal(0);
  const style = tw.style([], {});
  if (value.type === "u64") {
    return apply(props.path.writeable && props.mode === "write", (it) => {
      if (it) {
        return (
          <Input
            flex={1}
            size={"md"}
            maxLength={255}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors}
            onChangeText={(x) => {
              try {
                const val = Decimal.clamp(
                  new Decimal(x || "0").truncated(),
                  0,
                  new Decimal("9223372036854775807")
                );
                if (x === "") {
                  set_local_val("");
                } else {
                  set_local_val(val.toString());
                }
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: "u64",
                      value: val,
                    };
                    return it;
                  }),
                ]);
                set_has_errors(false);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value.toString() ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value.toString());
                    props.dispatch([
                      "value",
                      apply(props.path, (it) => {
                        it.path[1][1] = {
                          type: "u64",
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
            style={style}
          />
        );
      }
      return <Text style={style}>{local_val}</Text>;
    });
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

function I_Double(props: ComponentProps): JSX.Element {
  const value = props.path.path[1][1];
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
  const default_value = new Decimal(0);
  const style = tw.style([], {});
  if (value.type === "idouble") {
    return apply(props.path.writeable && props.mode === "write", (it) => {
      if (it) {
        return (
          <Input
            flex={1}
            size={"md"}
            maxLength={255}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors}
            onChangeText={(x) => {
              try {
                const val = new Decimal(x || "0");
                if (x === "") {
                  set_local_val("");
                } else {
                  set_local_val(val.toString());
                }
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: "idouble",
                      value: val,
                    };
                    return it;
                  }),
                ]);
                set_has_errors(false);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value.toString() ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value.toString());
                    props.dispatch([
                      "value",
                      apply(props.path, (it) => {
                        it.path[1][1] = {
                          type: "idouble",
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
            style={style}
          />
        );
      }
      return <Text style={style}>{local_val}</Text>;
    });
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

function U_Double(props: ComponentProps): JSX.Element {
  const value = props.path.path[1][1];
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
  const default_value = new Decimal(0);
  const style = tw.style([], {});
  if (value.type === "udouble") {
    return apply(props.path.writeable && props.mode === "write", (it) => {
      if (it) {
        return (
          <Input
            flex={1}
            size={"md"}
            maxLength={255}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors}
            onChangeText={(x) => {
              try {
                const val = new Decimal(x || "0").abs();
                if (x === "") {
                  set_local_val("");
                } else {
                  set_local_val(val.toString());
                }
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: "udouble",
                      value: val,
                    };
                    return it;
                  }),
                ]);
                set_has_errors(false);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value.toString() ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value.toString());
                    props.dispatch([
                      "value",
                      apply(props.path, (it) => {
                        it.path[1][1] = {
                          type: "udouble",
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
            style={style}
          />
        );
      }
      return <Text style={style}>{local_val}</Text>;
    });
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

function I_Decimal(props: ComponentProps): JSX.Element {
  const value = props.path.path[1][1];
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
  const default_value = new Decimal(0);
  const style = tw.style([], {});
  if (value.type === "idecimal") {
    return apply(props.path.writeable && props.mode === "write", (it) => {
      if (it) {
        return (
          <Input
            flex={1}
            size={"md"}
            maxLength={255}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors}
            onChangeText={(x) => {
              try {
                const val = new Decimal(x || "0");
                if (x === "") {
                  set_local_val("");
                } else {
                  set_local_val(val.toString());
                }
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: "idecimal",
                      value: val,
                    };
                    return it;
                  }),
                ]);
                set_has_errors(false);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value.toString() ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value.toString());
                    props.dispatch([
                      "value",
                      apply(props.path, (it) => {
                        it.path[1][1] = {
                          type: "idecimal",
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
            style={style}
          />
        );
      }
      return <Text style={style}>{local_val}</Text>;
    });
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

function U_Decimal(props: ComponentProps): JSX.Element {
  const value = props.path.path[1][1];
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
  const default_value = new Decimal(0);
  const style = tw.style([], {});
  if (value.type === "udecimal") {
    return apply(props.path.writeable && props.mode === "write", (it) => {
      if (it) {
        return (
          <Input
            flex={1}
            size={"md"}
            maxLength={255}
            placeholder={props.placeholder}
            value={local_val}
            isInvalid={has_errors}
            onChangeText={(x) => {
              try {
                const val = new Decimal(x || "0").abs();
                if (x === "") {
                  set_local_val("");
                } else {
                  set_local_val(val.toString());
                }
                props.dispatch([
                  "value",
                  apply(props.path, (it) => {
                    it.path[1][1] = {
                      type: "udecimal",
                      value: val,
                    };
                    return it;
                  }),
                ]);
                set_has_errors(false);
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value.toString() ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value.toString());
                    props.dispatch([
                      "value",
                      apply(props.path, (it) => {
                        it.path[1][1] = {
                          type: "udecimal",
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
            style={style}
          />
        );
      }
      return <Text style={style}>{local_val}</Text>;
    });
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

function Bool(props: ComponentProps): JSX.Element {
  const value = props.path.path[1][1];
  const style = tw.style([], {});
  if (value.type === "bool") {
    if (props.path.writeable && props.mode === "write") {
      return (
        <Switch
          value={value.value}
          onValueChange={(x) =>
            props.dispatch([
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
          color={value.value ? theme.primary : undefined}
        />
      );
    } else {
      return <Text style={style}>{value.value ? "Yes" : "No"}</Text>;
    }
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

function Date_Field(props: ComponentProps): JSX.Element {
  const value = props.path.path[1][1];
  const [showPicker, setPicker] = useState(false);
  const style = tw.style([], {});
  if (value.type === "date") {
    if (props.path.writeable && props.mode === "write") {
      return (
        <>
          <Pressable onPress={() => setPicker(true)}>
            <Text style={style}>
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
                        type: "date",
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
    } else {
      return (
        <Text style={style}>{moment(value.value).format("MMM Do YYYY")}</Text>
      );
    }
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

function Time_Field(props: ComponentProps): JSX.Element {
  const value = props.path.path[1][1];
  const [showPicker, setPicker] = useState(false);
  const style = tw.style([], {});
  if (value.type === "time") {
    if (props.path.writeable && props.mode === "write") {
      return (
        <>
          <Pressable onPress={() => setPicker(true)}>
            <Text style={style}>{moment(value.value).format("h:mm A")}</Text>
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
                        type: "time",
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
    } else {
      return <Text style={style}>{moment(value.value).format("h:mm A")}</Text>;
    }
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

function Timestamp_Field(props: ComponentProps): JSX.Element {
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
  const style = tw.style([], {});
  if (value.type === "timestamp") {
    if (props.path.writeable && props.mode === "write") {
      return (
        <>
          <Pressable onPress={() => setPicker(true)}>
            <Text style={style}>
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
          </>
        </>
      );
    } else {
      return (
        <Text style={style}>
          {moment(value.value).format("Do MMM YYYY, h:mm A")}
        </Text>
      );
    }
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

function Other_Field(
  props: ComponentProps & {
    title: string;
    user_paths: Array<PathString>;
    borrows: Array<string>;
    labels: Immutable<Array<[string, PathString]>>;
    element: JSX.Element;
    render_list_element: [
      (props: {
        struct: Struct;
        user_paths: Array<PathString>;
        borrows: Array<string>;
        variable: Variable;
        selected: boolean;
        update_parent_values: () => void;
      }) => JSX.Element,
      Record<
        string,
        (props: {
          struct: Struct;
          user_paths: Array<PathString>;
          borrows: Array<string>;
          variable: Variable;
          selected: boolean;
          update_parent_values: () => void;
        }) => JSX.Element
      >
    ];
    limit: Decimal;
    render_custom_fields: (props: {
      init_filter: Filter;
      filters: HashSet<Filter>;
      dispatch: React.Dispatch<ListAction>;
      show_views: [(props: { element: JSX.Element }) => JSX.Element, boolean];
      show_sorting: (props: { element: JSX.Element }) => JSX.Element;
      show_filters: (props: { element: JSX.Element }) => JSX.Element;
    }) => JSX.Element;
    horizontal?: boolean;
  }
): JSX.Element {
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
                selected: value.value,
                struct: struct.value,
                user_paths: props.user_paths,
                borrows: props.borrows,
                active: true,
                level: undefined,
                filters: [
                  new Filter(
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
                  HashSet.of(),
                ],
                limit: props.limit,
                render_list_element: props.render_list_element,
                update_parent_values: (variable: Variable) => {
                  props.dispatch([
                    "values",
                    get_upscaled_paths(
                      props.path,
                      variable,
                      props.state.labels
                    ),
                  ]);
                  navigation.goBack();
                },
                render_custom_fields: props.render_custom_fields,
                horizontal: !!props.horizontal,
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
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

export function Label(props: {
  state: State;
  path: PathString | string;
}): JSX.Element {
  const label = get_label(props.state, props.path);
  if (label !== "") {
    return (
      <Text
        style={{
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    );
  }
  return <></>;
}

export function Field(props: {
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
  path: PathString | string;
  mode?: "read";
  placeholder?: string;
  options?:
    | ["str", {}]
    | ["lstr", {}]
    | ["clob", {}]
    | ["u32", {}]
    | ["i32", {}]
    | ["u64", {}]
    | ["i64", {}]
    | ["udouble", {}]
    | ["idouble", {}]
    | ["udecimal", {}]
    | ["idecimal", {}]
    | ["bool", {}]
    | ["date", {}]
    | ["time", {}]
    | ["timestamp", {}]
    | [
        "other",
        {
          title: string;
          user_paths: Array<PathString>;
          borrows: Array<string>;
          labels: Immutable<Array<[string, PathString]>>;
          element: JSX.Element;
          render_list_element: [
            (props: {
              struct: Struct;
              user_paths: Array<PathString>;
              borrows: Array<string>;
              variable: Variable;
              selected: boolean;
              update_parent_values: () => void;
            }) => JSX.Element,
            Record<
              string,
              (props: {
                struct: Struct;
                user_paths: Array<PathString>;
                borrows: Array<string>;
                variable: Variable;
                selected: boolean;
                update_parent_values: () => void;
              }) => JSX.Element
            >
          ];
          limit: Decimal;
          render_custom_fields: (props: {
            init_filter: Filter;
            filters: HashSet<Filter>;
            dispatch: React.Dispatch<ListAction>;
            show_views: [
              (props: { element: JSX.Element }) => JSX.Element,
              boolean
            ];
            show_sorting: (props: { element: JSX.Element }) => JSX.Element;
            show_filters: (props: { element: JSX.Element }) => JSX.Element;
          }) => JSX.Element;
          horizontal?: boolean;
        }
      ];
}): JSX.Element {
  const path_string: PathString = arrow(() => {
    if (typeof props.path === "string") {
      return [[], props.path];
    } else {
      return props.path;
    }
  });
  const placeholder = props.placeholder
    ? props.placeholder
    : get_label(props.state, path_string);
  return apply(get_path(props.state, path_string), (path) => {
    if (unwrap(path)) {
      const field_struct_name = path.value.path[1][1].type;
      switch (field_struct_name) {
        case "str": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "str"
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
                placeholder={placeholder}
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
              placeholder={placeholder}
            />
          );
        }
        case "lstr": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "lstr"
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
                placeholder={placeholder}
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
              placeholder={placeholder}
            />
          );
        }
        case "clob": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "clob"
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
                placeholder={placeholder}
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
              placeholder={placeholder}
              path={path.value}
            />
          );
        }
        case "u32": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "u32"
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
                placeholder={placeholder}
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
              placeholder={placeholder}
            />
          );
        }
        case "i32": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "i32"
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
                placeholder={placeholder}
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
              placeholder={placeholder}
            />
          );
        }
        case "u64": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "u64"
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
                placeholder={placeholder}
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
              placeholder={placeholder}
              path={path.value}
            />
          );
        }
        case "i64": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "i64"
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
                placeholder={placeholder}
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
              placeholder={placeholder}
            />
          );
        }
        case "udouble": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "udouble"
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
                placeholder={placeholder}
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
              placeholder={placeholder}
            />
          );
        }
        case "idouble": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "idouble"
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
                placeholder={placeholder}
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
              placeholder={placeholder}
            />
          );
        }
        case "udecimal": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "udecimal"
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
                placeholder={placeholder}
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
              placeholder={placeholder}
            />
          );
        }
        case "idecimal": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "idecimal"
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
                placeholder={placeholder}
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
              placeholder={placeholder}
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
                placeholder={placeholder}
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
              placeholder={placeholder}
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
                placeholder={placeholder}
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
              placeholder={placeholder}
            />
          );
        }
        case "time": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "time"
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
                placeholder={placeholder}
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
              placeholder={placeholder}
            />
          );
        }
        case "timestamp": {
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "timestamp"
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
                placeholder={placeholder}
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
              placeholder={placeholder}
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
                placeholder={placeholder}
                title={props.options[1].title}
                user_paths={props.options[1].user_paths}
                borrows={props.options[1].borrows}
                labels={props.options[1].labels}
                element={props.options[1].element}
                render_list_element={props.options[1].render_list_element}
                limit={props.options[1].limit}
                render_custom_fields={props.options[1].render_custom_fields}
                horizontal={props.options[1].horizontal}
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
    return <></>;
  });
}

export function Check(props: {
  state: State;
  name: string;
  message: string;
}): JSX.Element {
  const { state } = props;
  if (props.name in state.checks) {
    const result = state.checks[props.name] as Result<boolean>;
    if (unwrap(result)) {
      if (!result.value) {
        return (
          <Text fontSize={"xs"} color={"lightBlue.600"}>
            * {props.message}
          </Text>
        );
      }
    }
  }
  return <></>;
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
