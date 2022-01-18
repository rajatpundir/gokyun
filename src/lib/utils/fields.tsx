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
import { apply, unwrap, Result, arrow, fold } from "./prelude";
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
import { CommonProps, ModalSpecificProps } from "./list";
import { theme } from "./theme";
import { tw } from "./tailwind";

type ComponentProps = {
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
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
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
                      type: "str",
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
              local_val !== default_value ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value);
                    set_has_errors(false);
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

type LstrFieldProps = {};

function Lstr(props: ComponentProps & LstrFieldProps): JSX.Element {
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
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
                      type: "lstr",
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
              local_val !== default_value ? (
                <Pressable
                  onPress={() => {
                    set_local_val(default_value);
                    set_has_errors(false);
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

type ClobFieldProps = {};

function Clob(props: ComponentProps & ClobFieldProps): JSX.Element {
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [local_val, set_local_val] = useState(strong_enum_to_string(value));
  const [has_errors, set_has_errors] = useState(false);
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
                      type: "clob",
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
              local_val !== default_value ? (
                <Pressable
                  onPress={() => {
                    set_local_val(default_value);
                    set_has_errors(false);
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

type I32FieldProps = {};

function I_32(props: ComponentProps & I32FieldProps): JSX.Element {
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
  const default_value = new Decimal(0);
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
            keyboardType={"numbers-and-punctuation"}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                const val = Decimal.clamp(
                  new Decimal(x || "0").truncated(),
                  -2147483648,
                  2147483648
                );
                set_has_errors(false);
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
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value.toString() && local_val !== "" ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value.toString());
                    set_has_errors(false);
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

type U32FieldProps = {};

function U_32(props: ComponentProps & U32FieldProps): JSX.Element {
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
  const default_value = new Decimal(0);
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
            keyboardType={"number-pad"}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                const val = Decimal.clamp(
                  new Decimal(x || "0").truncated(),
                  0,
                  2147483648
                );
                set_has_errors(false);
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
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value.toString() && local_val !== "" ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value.toString());
                    set_has_errors(false);
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

type I64FieldProps = {};

function I_64(props: ComponentProps & I64FieldProps): JSX.Element {
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
  const default_value = new Decimal(0);
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
            keyboardType={"numbers-and-punctuation"}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                const val = Decimal.clamp(
                  new Decimal(x || "0").truncated(),
                  new Decimal("-9223372036854775807"),
                  new Decimal("9223372036854775807")
                );
                set_has_errors(false);
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
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value.toString() && local_val !== "" ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value.toString());
                    set_has_errors(false);
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

type U64FieldProps = {};

function U_64(props: ComponentProps & U64FieldProps): JSX.Element {
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
  const default_value = new Decimal(0);
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
            keyboardType={"number-pad"}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                const val = Decimal.clamp(
                  new Decimal(x || "0").truncated(),
                  0,
                  new Decimal("9223372036854775807")
                );
                set_has_errors(false);
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
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value.toString() && local_val !== "" ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value.toString());
                    set_has_errors(false);
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

type IDoubleFieldProps = {};

function I_Double(props: ComponentProps & IDoubleFieldProps): JSX.Element {
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
  const default_value = new Decimal(0);
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
            keyboardType={"numbers-and-punctuation"}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                const val = new Decimal(x || "0");
                set_has_errors(false);
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
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value.toString() && local_val !== "" ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value.toString());
                    set_has_errors(false);
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

type UDoubleFieldProps = {};

function U_Double(props: ComponentProps & UDoubleFieldProps): JSX.Element {
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
  const default_value = new Decimal(0);
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
            keyboardType={"numbers-and-punctuation"}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                const val = new Decimal(x || "0").abs();
                set_has_errors(false);
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
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value.toString() && local_val !== "" ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value.toString());
                    set_has_errors(false);
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

type IDecimalFieldProps = {};

function I_Decimal(props: ComponentProps & IDecimalFieldProps): JSX.Element {
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
  const default_value = new Decimal(0);
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
            keyboardType={"numbers-and-punctuation"}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                const val = new Decimal(x || "0");
                set_has_errors(false);
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
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value.toString() && local_val !== "" ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value.toString());
                    set_has_errors(false);
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

type UDecimalFieldProps = {};

function U_Decimal(props: ComponentProps & UDecimalFieldProps): JSX.Element {
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
  const default_value = new Decimal(0);
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
            keyboardType={"numbers-and-punctuation"}
            onChangeText={(x) => {
              try {
                set_local_val(x);
                const val = new Decimal(x || "0").abs();
                set_has_errors(false);
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
              } catch (e) {
                set_has_errors(true);
              }
            }}
            InputRightElement={
              local_val !== default_value.toString() && local_val !== "" ? (
                <Pressable
                  style={tw.style(["px-2"], {})}
                  onPress={() => {
                    set_local_val(default_value.toString());
                    set_has_errors(false);
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

type BoolFieldProps = {};

function Bool(props: ComponentProps & BoolFieldProps): JSX.Element {
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
    }
    return <Text style={style}>{value.value ? "Yes" : "No"}</Text>;
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

type DateFieldProps = {};

function Date_Field(props: ComponentProps & DateFieldProps): JSX.Element {
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [showPicker, setPicker] = useState(false);
  const style = tw.style([], {});
  if (value.type === "date") {
    if (is_writeable) {
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
    }
    return (
      <Text style={style}>{moment(value.value).format("MMM Do YYYY")}</Text>
    );
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

type TimeFieldProps = {};

function Time_Field(props: ComponentProps & TimeFieldProps): JSX.Element {
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const [showPicker, setPicker] = useState(false);
  const style = tw.style([], {});
  if (value.type === "time") {
    if (is_writeable) {
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
    }
    return <Text style={style}>{moment(value.value).format("h:mm A")}</Text>;
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

type TimestampFieldProps = {};

function Timestamp_Field(
  props: ComponentProps & TimestampFieldProps
): JSX.Element {
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
    }
    return (
      <Text style={style}>
        {moment(value.value).format("Do MMM YYYY, h:mm A")}
      </Text>
    );
  }
  console.log("[ERROR] Invalid path: ", props.path);
  return <></>;
}

type OtherFieldProps = CommonProps &
  ModalSpecificProps & {
    labels: Immutable<Array<[string, PathString]>>;
    element: JSX.Element;
  };

function Other_Field(props: ComponentProps & OtherFieldProps): JSX.Element {
  const value = props.path.path[1][1];
  const is_writeable = props.path.writeable && props.mode === "write";
  const navigation = useNavigation();
  if (value.type === "other") {
    if (is_writeable) {
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
                horizontal: props.horizontal,
              });
            }
          }}
        >
          {props.element}
        </Pressable>
      );
    }
    return props.element;
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
    return <Text color={theme.placeholder}>{label}</Text>;
  }
  return <></>;
}

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

export function Field(props: {
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
  path: PathString | string;
  mode?: "read";
  placeholder?: string;
  checks?: ReadonlyArray<string>;
  options?: FieldOptions;
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
  const comply_with_checks = fold(
    true,
    (props.checks ? props.checks : []).map((x) => {
      if (x in props.state.checks) {
        const result = props.state.checks[x] as Result<boolean>;
        if (unwrap(result)) {
          return result.value;
        }
      }
      return true;
    }),
    (acc, val) => acc && val
  );
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
                violates_checks={!comply_with_checks}
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
              violates_checks={!comply_with_checks}
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
                violates_checks={!comply_with_checks}
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
              violates_checks={!comply_with_checks}
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
                violates_checks={!comply_with_checks}
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
              violates_checks={!comply_with_checks}
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
                violates_checks={!comply_with_checks}
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
              violates_checks={!comply_with_checks}
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
                violates_checks={!comply_with_checks}
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
              violates_checks={!comply_with_checks}
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
                violates_checks={!comply_with_checks}
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
              violates_checks={!comply_with_checks}
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
                violates_checks={!comply_with_checks}
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
              violates_checks={!comply_with_checks}
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
                violates_checks={!comply_with_checks}
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
              violates_checks={!comply_with_checks}
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
                violates_checks={!comply_with_checks}
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
              violates_checks={!comply_with_checks}
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
                violates_checks={!comply_with_checks}
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
              violates_checks={!comply_with_checks}
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
                violates_checks={!comply_with_checks}
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
              violates_checks={!comply_with_checks}
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
                violates_checks={!comply_with_checks}
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
              violates_checks={!comply_with_checks}
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
                violates_checks={!comply_with_checks}
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
              violates_checks={!comply_with_checks}
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
                violates_checks={!comply_with_checks}
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
              violates_checks={!comply_with_checks}
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
                violates_checks={!comply_with_checks}
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
              violates_checks={!comply_with_checks}
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
                violates_checks={!comply_with_checks}
                {...props.options[1]}
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
