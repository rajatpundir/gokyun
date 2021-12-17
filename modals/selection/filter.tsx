import React, { useState } from "react";
import { Filter, FilterPath } from "../../main/utils/db";
import { View, Text, TextInput } from "../../main/themed";
import Decimal from "decimal.js";
import { Platform, Pressable } from "react-native";
import { apply, is_decimal } from "../../main/utils/prelude";
import moment from "moment";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Action } from "./index";
import { Entypo } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

function FilterPathComponent(props: {
  filter_path: FilterPath;
  index: number;
  dispatch: React.Dispatch<Action>;
}): JSX.Element {
  const [showPicker1, setPicker1] = useState(false);
  const [mode1, setMode1] = useState("date");
  let [date1, setDate1] = useState(
    apply(new Date(), (it) => {
      if (props.filter_path.value[1] !== undefined) {
        const field_struct_name = props.filter_path.value[0];
        switch (field_struct_name) {
          case "date": {
            const op = props.filter_path.value[1][0];
            switch (op) {
              case "==":
              case "!=":
              case ">=":
              case "<=":
              case ">":
              case "<": {
                const value = props.filter_path.value[1][1];
                if (value instanceof Date) {
                  return value;
                }
                break;
              }
              case "between":
              case "not_between": {
                const [value1, value2] = props.filter_path.value[1][1];
                if (value1 instanceof Date) {
                  return value1;
                }
                break;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
            break;
          }
          case "time": {
            const op = props.filter_path.value[1][0];
            switch (op) {
              case "==":
              case "!=":
              case ">=":
              case "<=":
              case ">":
              case "<": {
                const value = props.filter_path.value[1][1];
                if (value instanceof Date) {
                  return value;
                }
                break;
              }
              case "between":
              case "not_between": {
                const [value1, value2] = props.filter_path.value[1][1];
                if (value1 instanceof Date) {
                  return value1;
                }
                break;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
            break;
          }
          case "timestamp": {
            const op = props.filter_path.value[1][0];
            switch (op) {
              case "==":
              case "!=":
              case ">=":
              case "<=":
              case ">":
              case "<": {
                const value = props.filter_path.value[1][1];
                if (value instanceof Date) {
                  return value;
                }
                break;
              }
              case "between":
              case "not_between": {
                const [value1, value2] = props.filter_path.value[1][1];
                if (value1 instanceof Date) {
                  return value1;
                }
                break;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
            break;
          }
        }
      }
      return it;
    })
  );
  const [showPicker2, setPicker2] = useState(false);
  const [mode2, setMode2] = useState("date");
  let [date2, setDate2] = useState(
    apply(new Date(), (it) => {
      if (props.filter_path.value[1] !== undefined) {
        const field_struct_name = props.filter_path.value[0];
        switch (field_struct_name) {
          case "date": {
            const op = props.filter_path.value[1][0];
            switch (op) {
              case "==":
              case "!=":
              case ">=":
              case "<=":
              case ">":
              case "<": {
                return it;
              }
              case "between":
              case "not_between": {
                const [value1, value2] = props.filter_path.value[1][1];
                if (value2 instanceof Date) {
                  return value2;
                }
                break;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
            break;
          }
          case "time": {
            const op = props.filter_path.value[1][0];
            switch (op) {
              case "==":
              case "!=":
              case ">=":
              case "<=":
              case ">":
              case "<": {
                return it;
              }
              case "between":
              case "not_between": {
                const [value1, value2] = props.filter_path.value[1][1];
                if (value2 instanceof Date) {
                  return value2;
                }
                break;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
            break;
          }
          case "timestamp": {
            const op = props.filter_path.value[1][0];
            switch (op) {
              case "==":
              case "!=":
              case ">=":
              case "<=":
              case ">":
              case "<": {
                return it;
              }
              case "between":
              case "not_between": {
                const [value1, value2] = props.filter_path.value[1][1];
                if (value2 instanceof Date) {
                  return value2;
                }
                break;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
            break;
          }
        }
      }
      return it;
    })
  );
  return (
    <View
      style={{
        justifyContent: "flex-start",
      }}
    >
      <View>
        {props.filter_path.value[1] !== undefined ? (
          <>
            <Checkbox
              value={props.filter_path.active}
              onValueChange={(x) => {
                props.dispatch([
                  "filters",
                  props.index,
                  "replace",
                  apply(props.filter_path, (it) => {
                    it.active = x;
                    return it;
                  }),
                ]);
              }}
              color={props.filter_path.active ? "#ff0000" : undefined}
              style={{
                alignSelf: "center",
                marginRight: 6,
              }}
            />
            <Text>{props.filter_path.label}</Text>
          </>
        ) : (
          <></>
        )}
      </View>
      <View
        style={{
          flexDirection: "row-reverse",
          flexGrow: 999,
        }}
      >
        {apply(undefined, () => {
          if (props.filter_path.value[1] !== undefined) {
            const field_struct_name = props.filter_path.value[0];
            switch (field_struct_name) {
              case "str":
              case "lstr":
              case "clob": {
                if (props.filter_path.value[1] !== undefined) {
                  const op = props.filter_path.value[1][0];
                  switch (op) {
                    case "==":
                    case "!=":
                    case ">=":
                    case "<=":
                    case ">":
                    case "<":
                    case "like":
                    case "glob": {
                      const value = props.filter_path.value[1][1];
                      if (typeof value === "string") {
                        return (
                          <TextInput
                            value={value}
                            onChangeText={(x) =>
                              props.dispatch([
                                "filters",
                                props.index,
                                "replace",
                                apply(props.filter_path, (it) => {
                                  it.value = [field_struct_name, [op, x]];
                                  return it;
                                }),
                              ])
                            }
                          />
                        );
                      } else {
                        return (
                          <Pressable onPress={() => {}}>
                            <Text>{value[0]}</Text>
                          </Pressable>
                        );
                      }
                    }
                    case "between":
                    case "not_between": {
                      const [value1, value2] = props.filter_path.value[1][1];
                      return (
                        <>
                          {apply(undefined, () => {
                            const value = value1;
                            if (typeof value === "string") {
                              return (
                                <TextInput
                                  value={value}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.index,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, [x, value2]],
                                        ];
                                        return it;
                                      }),
                                    ])
                                  }
                                />
                              );
                            } else {
                              return (
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                          {apply(undefined, () => {
                            const value = value2;
                            if (typeof value === "string") {
                              return (
                                <TextInput
                                  value={value}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.index,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, [value1, x]],
                                        ];
                                        return it;
                                      }),
                                    ])
                                  }
                                />
                              );
                            } else {
                              return (
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                        </>
                      );
                    }
                    default: {
                      const _exhaustiveCheck: never = op;
                      return _exhaustiveCheck;
                    }
                  }
                }
                return <></>;
              }
              case "i32": {
                if (props.filter_path.value[1] !== undefined) {
                  const op = props.filter_path.value[1][0];
                  switch (op) {
                    case "==":
                    case "!=":
                    case ">=":
                    case "<=":
                    case ">":
                    case "<": {
                      const value = props.filter_path.value[1][1];
                      if (is_decimal(value)) {
                        return (
                          <TextInput
                            value={value.toString()}
                            keyboardType={"number-pad"}
                            onChangeText={(x) =>
                              props.dispatch([
                                "filters",
                                props.index,
                                "replace",
                                apply(props.filter_path, (it) => {
                                  it.value = [
                                    field_struct_name,
                                    [
                                      op,
                                      Decimal.clamp(
                                        new Decimal(x || "0").truncated(),
                                        -2147483648,
                                        2147483648
                                      ),
                                    ],
                                  ];
                                  return it;
                                }),
                              ])
                            }
                          />
                        );
                      } else {
                        return (
                          <Pressable onPress={() => {}}>
                            <Text>{value[0]}</Text>
                          </Pressable>
                        );
                      }
                    }
                    case "between":
                    case "not_between": {
                      const [value1, value2] = props.filter_path.value[1][1];
                      return (
                        <>
                          {apply(undefined, () => {
                            const value = value1;
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  value={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.index,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [
                                            op,
                                            [
                                              Decimal.clamp(
                                                new Decimal(
                                                  x || "0"
                                                ).truncated(),
                                                -2147483648,
                                                2147483648
                                              ),
                                              value2,
                                            ],
                                          ],
                                        ];
                                        return it;
                                      }),
                                    ])
                                  }
                                />
                              );
                            } else {
                              return (
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                          {apply(undefined, () => {
                            const value = value2;
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  value={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.index,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [
                                            op,
                                            [
                                              value1,
                                              Decimal.clamp(
                                                new Decimal(
                                                  x || "0"
                                                ).truncated(),
                                                -2147483648,
                                                2147483648
                                              ),
                                            ],
                                          ],
                                        ];
                                        return it;
                                      }),
                                    ])
                                  }
                                />
                              );
                            } else {
                              return (
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                        </>
                      );
                    }
                    default: {
                      const _exhaustiveCheck: never = op;
                      return _exhaustiveCheck;
                    }
                  }
                }
                return <></>;
              }
              case "u32": {
                if (props.filter_path.value[1] !== undefined) {
                  const op = props.filter_path.value[1][0];
                  switch (op) {
                    case "==":
                    case "!=":
                    case ">=":
                    case "<=":
                    case ">":
                    case "<": {
                      const value = props.filter_path.value[1][1];
                      if (is_decimal(value)) {
                        return (
                          <TextInput
                            value={value.toString()}
                            keyboardType={"number-pad"}
                            onChangeText={(x) =>
                              props.dispatch([
                                "filters",
                                props.index,
                                "replace",
                                apply(props.filter_path, (it) => {
                                  it.value = [
                                    field_struct_name,
                                    [
                                      op,
                                      Decimal.clamp(
                                        new Decimal(x || "0").truncated(),
                                        0,
                                        2147483648
                                      ),
                                    ],
                                  ];
                                  return it;
                                }),
                              ])
                            }
                          />
                        );
                      } else {
                        return (
                          <Pressable onPress={() => {}}>
                            <Text>{value[0]}</Text>
                          </Pressable>
                        );
                      }
                    }
                    case "between":
                    case "not_between": {
                      const [value1, value2] = props.filter_path.value[1][1];
                      return (
                        <>
                          {apply(undefined, () => {
                            const value = value1;
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  value={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.index,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [
                                            op,
                                            [
                                              Decimal.clamp(
                                                new Decimal(
                                                  x || "0"
                                                ).truncated(),
                                                0,
                                                2147483648
                                              ),
                                              value2,
                                            ],
                                          ],
                                        ];
                                        return it;
                                      }),
                                    ])
                                  }
                                />
                              );
                            } else {
                              return (
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                          {apply(undefined, () => {
                            const value = value2;
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  value={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.index,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [
                                            op,
                                            [
                                              value1,
                                              Decimal.clamp(
                                                new Decimal(
                                                  x || "0"
                                                ).truncated(),
                                                0,
                                                2147483648
                                              ),
                                            ],
                                          ],
                                        ];
                                        return it;
                                      }),
                                    ])
                                  }
                                />
                              );
                            } else {
                              return (
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                        </>
                      );
                    }
                    default: {
                      const _exhaustiveCheck: never = op;
                      return _exhaustiveCheck;
                    }
                  }
                }
                return <></>;
              }
              case "i64": {
                if (props.filter_path.value[1] !== undefined) {
                  const op = props.filter_path.value[1][0];
                  switch (op) {
                    case "==":
                    case "!=":
                    case ">=":
                    case "<=":
                    case ">":
                    case "<": {
                      const value = props.filter_path.value[1][1];
                      if (is_decimal(value)) {
                        return (
                          <TextInput
                            value={value.toString()}
                            keyboardType={"number-pad"}
                            onChangeText={(x) =>
                              props.dispatch([
                                "filters",
                                props.index,
                                "replace",
                                apply(props.filter_path, (it) => {
                                  it.value = [
                                    field_struct_name,
                                    [
                                      op,
                                      Decimal.clamp(
                                        new Decimal(x || "0").truncated(),
                                        new Decimal("-9223372036854775807"),
                                        new Decimal("9223372036854775807")
                                      ),
                                    ],
                                  ];
                                  return it;
                                }),
                              ])
                            }
                          />
                        );
                      } else {
                        return (
                          <Pressable onPress={() => {}}>
                            <Text>{value[0]}</Text>
                          </Pressable>
                        );
                      }
                    }
                    case "between":
                    case "not_between": {
                      const [value1, value2] = props.filter_path.value[1][1];
                      return (
                        <>
                          {apply(undefined, () => {
                            const value = value1;
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  value={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.index,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [
                                            op,
                                            [
                                              Decimal.clamp(
                                                new Decimal(
                                                  x || "0"
                                                ).truncated(),
                                                new Decimal(
                                                  "-9223372036854775807"
                                                ),
                                                new Decimal(
                                                  "9223372036854775807"
                                                )
                                              ),
                                              value2,
                                            ],
                                          ],
                                        ];
                                        return it;
                                      }),
                                    ])
                                  }
                                />
                              );
                            } else {
                              return (
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                          {apply(undefined, () => {
                            const value = value2;
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  value={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.index,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [
                                            op,
                                            [
                                              value1,
                                              Decimal.clamp(
                                                new Decimal(
                                                  x || "0"
                                                ).truncated(),
                                                new Decimal(
                                                  "-9223372036854775807"
                                                ),
                                                new Decimal(
                                                  "9223372036854775807"
                                                )
                                              ),
                                            ],
                                          ],
                                        ];
                                        return it;
                                      }),
                                    ])
                                  }
                                />
                              );
                            } else {
                              return (
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                        </>
                      );
                    }
                    default: {
                      const _exhaustiveCheck: never = op;
                      return _exhaustiveCheck;
                    }
                  }
                }
                return <></>;
              }
              case "u64": {
                if (props.filter_path.value[1] !== undefined) {
                  const op = props.filter_path.value[1][0];
                  switch (op) {
                    case "==":
                    case "!=":
                    case ">=":
                    case "<=":
                    case ">":
                    case "<": {
                      const value = props.filter_path.value[1][1];
                      if (is_decimal(value)) {
                        return (
                          <TextInput
                            value={value.toString()}
                            keyboardType={"number-pad"}
                            onChangeText={(x) =>
                              props.dispatch([
                                "filters",
                                props.index,
                                "replace",
                                apply(props.filter_path, (it) => {
                                  it.value = [
                                    field_struct_name,
                                    [
                                      op,
                                      Decimal.clamp(
                                        new Decimal(x || "0").truncated(),
                                        0,
                                        new Decimal("9223372036854775807")
                                      ),
                                    ],
                                  ];
                                  return it;
                                }),
                              ])
                            }
                          />
                        );
                      } else {
                        return (
                          <Pressable onPress={() => {}}>
                            <Text>{value[0]}</Text>
                          </Pressable>
                        );
                      }
                    }
                    case "between":
                    case "not_between": {
                      const [value1, value2] = props.filter_path.value[1][1];
                      return (
                        <>
                          {apply(undefined, () => {
                            const value = value1;
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  value={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.index,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [
                                            op,
                                            [
                                              Decimal.clamp(
                                                new Decimal(
                                                  x || "0"
                                                ).truncated(),
                                                0,
                                                new Decimal(
                                                  "9223372036854775807"
                                                )
                                              ),
                                              value2,
                                            ],
                                          ],
                                        ];
                                        return it;
                                      }),
                                    ])
                                  }
                                />
                              );
                            } else {
                              return (
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                          {apply(undefined, () => {
                            const value = value2;
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  value={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.index,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [
                                            op,
                                            [
                                              value1,
                                              Decimal.clamp(
                                                new Decimal(
                                                  x || "0"
                                                ).truncated(),
                                                0,
                                                new Decimal(
                                                  "9223372036854775807"
                                                )
                                              ),
                                            ],
                                          ],
                                        ];
                                        return it;
                                      }),
                                    ])
                                  }
                                />
                              );
                            } else {
                              return (
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                        </>
                      );
                    }
                    default: {
                      const _exhaustiveCheck: never = op;
                      return _exhaustiveCheck;
                    }
                  }
                }
                return <></>;
              }
              case "idouble":
              case "idecimal": {
                if (props.filter_path.value[1] !== undefined) {
                  const op = props.filter_path.value[1][0];
                  switch (op) {
                    case "==":
                    case "!=":
                    case ">=":
                    case "<=":
                    case ">":
                    case "<": {
                      const value = props.filter_path.value[1][1];
                      if (is_decimal(value)) {
                        return (
                          <TextInput
                            value={value.toString()}
                            keyboardType={"number-pad"}
                            onChangeText={(x) =>
                              props.dispatch([
                                "filters",
                                props.index,
                                "replace",
                                apply(props.filter_path, (it) => {
                                  it.value = [
                                    field_struct_name,
                                    [op, new Decimal(x || "0")],
                                  ];
                                  return it;
                                }),
                              ])
                            }
                          />
                        );
                      } else {
                        return (
                          <Pressable onPress={() => {}}>
                            <Text>{value[0]}</Text>
                          </Pressable>
                        );
                      }
                    }
                    case "between":
                    case "not_between": {
                      const [value1, value2] = props.filter_path.value[1][1];
                      return (
                        <>
                          {apply(undefined, () => {
                            const value = value1;
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  value={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.index,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, [new Decimal(x || "0"), value2]],
                                        ];
                                        return it;
                                      }),
                                    ])
                                  }
                                />
                              );
                            } else {
                              return (
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                          {apply(undefined, () => {
                            const value = value2;
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  value={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.index,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, [value1, new Decimal(x || "0")]],
                                        ];
                                        return it;
                                      }),
                                    ])
                                  }
                                />
                              );
                            } else {
                              return (
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                        </>
                      );
                    }
                    default: {
                      const _exhaustiveCheck: never = op;
                      return _exhaustiveCheck;
                    }
                  }
                }
                return <></>;
              }
              case "udouble":
              case "udecimal": {
                if (props.filter_path.value[1] !== undefined) {
                  const op = props.filter_path.value[1][0];
                  switch (op) {
                    case "==":
                    case "!=":
                    case ">=":
                    case "<=":
                    case ">":
                    case "<": {
                      const value = props.filter_path.value[1][1];
                      if (is_decimal(value)) {
                        return (
                          <TextInput
                            value={value.toString()}
                            keyboardType={"number-pad"}
                            onChangeText={(x) =>
                              props.dispatch([
                                "filters",
                                props.index,
                                "replace",
                                apply(props.filter_path, (it) => {
                                  it.value = [
                                    field_struct_name,
                                    [op, new Decimal(x || "0").abs()],
                                  ];
                                  return it;
                                }),
                              ])
                            }
                          />
                        );
                      } else {
                        return (
                          <Pressable onPress={() => {}}>
                            <Text>{value[0]}</Text>
                          </Pressable>
                        );
                      }
                    }
                    case "between":
                    case "not_between": {
                      const [value1, value2] = props.filter_path.value[1][1];
                      return (
                        <>
                          {apply(undefined, () => {
                            const value = value1;
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  value={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.index,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [
                                            op,
                                            [
                                              new Decimal(x || "0").abs(),
                                              value2,
                                            ],
                                          ],
                                        ];
                                        return it;
                                      }),
                                    ])
                                  }
                                />
                              );
                            } else {
                              return (
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                          {apply(undefined, () => {
                            const value = value2;
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  value={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.index,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [
                                            op,
                                            [
                                              value1,
                                              new Decimal(x || "0").abs(),
                                            ],
                                          ],
                                        ];
                                        return it;
                                      }),
                                    ])
                                  }
                                />
                              );
                            } else {
                              return (
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                        </>
                      );
                    }
                    default: {
                      const _exhaustiveCheck: never = op;
                      return _exhaustiveCheck;
                    }
                  }
                }
                return <></>;
              }
              case "bool": {
                if (props.filter_path.value[1] !== undefined) {
                  const op = props.filter_path.value[1][0];
                  switch (op) {
                    case "==":
                    case "!=": {
                      const value = props.filter_path.value[1][1];
                      if (typeof value === "boolean") {
                        return (
                          <Checkbox
                            value={value}
                            onValueChange={(x) =>
                              props.dispatch([
                                "filters",
                                props.index,
                                "replace",
                                apply(props.filter_path, (it) => {
                                  it.value = [field_struct_name, [op, x]];
                                  return it;
                                }),
                              ])
                            }
                            color={value ? "#ff0000" : undefined}
                          />
                        );
                      } else {
                        return (
                          <Pressable onPress={() => {}}>
                            <Text>{value[0]}</Text>
                          </Pressable>
                        );
                      }
                    }
                    default: {
                      const _exhaustiveCheck: never = op;
                      return _exhaustiveCheck;
                    }
                  }
                }
                return <></>;
              }
              case "date": {
                if (props.filter_path.value[1] !== undefined) {
                  const op = props.filter_path.value[1][0];
                  switch (op) {
                    case "==":
                    case "!=":
                    case ">=":
                    case "<=":
                    case ">":
                    case "<": {
                      const value = props.filter_path.value[1][1];
                      if (value instanceof Date) {
                        return (
                          <>
                            <Pressable onPress={() => setPicker1(true)}>
                              <Text>{moment(value).format("Do MMM YYYY")}</Text>
                            </Pressable>
                            <>
                              {showPicker1 && (
                                <DateTimePicker
                                  mode={"date"}
                                  value={value}
                                  onChange={(
                                    _temp: any,
                                    date: Date | undefined
                                  ) => {
                                    setPicker1(Platform.OS === "ios");
                                    props.dispatch([
                                      "filters",
                                      props.index,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, date || new Date()],
                                        ];
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
                          <Pressable onPress={() => {}}>
                            <Text>{value[0]}</Text>
                          </Pressable>
                        );
                      }
                    }
                    case "between":
                    case "not_between": {
                      const [value1, value2] = props.filter_path.value[1][1];
                      return (
                        <>
                          {apply(undefined, () => {
                            if (value1 instanceof Date) {
                              return (
                                <>
                                  <Pressable onPress={() => setPicker1(true)}>
                                    <Text>
                                      {moment(value1).format("Do MMM YYYY")}
                                    </Text>
                                  </Pressable>
                                  <>
                                    {showPicker1 && (
                                      <DateTimePicker
                                        mode={"date"}
                                        value={value1}
                                        onChange={(
                                          _temp: any,
                                          date: Date | undefined
                                        ) => {
                                          setPicker1(Platform.OS === "ios");
                                          props.dispatch([
                                            "filters",
                                            props.index,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [
                                                  op,
                                                  [date || new Date(), value2],
                                                ],
                                              ];
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
                                <Pressable onPress={() => {}}>
                                  <Text>{value1[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                          {apply(undefined, () => {
                            if (value2 instanceof Date) {
                              return (
                                <>
                                  <Pressable onPress={() => setPicker2(true)}>
                                    <Text>
                                      {moment(value2).format("Do MMM YYYY")}
                                    </Text>
                                  </Pressable>
                                  <>
                                    {showPicker2 && (
                                      <DateTimePicker
                                        mode={"date"}
                                        value={value2}
                                        onChange={(
                                          _temp: any,
                                          date: Date | undefined
                                        ) => {
                                          setPicker2(Platform.OS === "ios");
                                          props.dispatch([
                                            "filters",
                                            props.index,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [
                                                  op,
                                                  [value1, date || new Date()],
                                                ],
                                              ];
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
                                <Pressable onPress={() => {}}>
                                  <Text>{value2[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                        </>
                      );
                    }
                    default: {
                      const _exhaustiveCheck: never = op;
                      return _exhaustiveCheck;
                    }
                  }
                }
                return <></>;
              }
              case "time": {
                if (props.filter_path.value[1] !== undefined) {
                  const op = props.filter_path.value[1][0];
                  switch (op) {
                    case "==":
                    case "!=":
                    case ">=":
                    case "<=":
                    case ">":
                    case "<": {
                      const value = props.filter_path.value[1][1];
                      if (value instanceof Date) {
                        return (
                          <>
                            <Pressable onPress={() => setPicker1(true)}>
                              <Text>{moment(value).format("h:mm A")}</Text>
                            </Pressable>
                            <>
                              {showPicker1 && (
                                <DateTimePicker
                                  mode={"time"}
                                  value={value}
                                  onChange={(
                                    _temp: any,
                                    date: Date | undefined
                                  ) => {
                                    setPicker1(Platform.OS === "ios");
                                    props.dispatch([
                                      "filters",
                                      props.index,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, date || new Date()],
                                        ];
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
                          <Pressable onPress={() => {}}>
                            <Text>{value[0]}</Text>
                          </Pressable>
                        );
                      }
                    }
                    case "between":
                    case "not_between": {
                      const [value1, value2] = props.filter_path.value[1][1];
                      return (
                        <>
                          {apply(undefined, () => {
                            const value = value1;
                            if (value instanceof Date) {
                              return (
                                <>
                                  <Pressable onPress={() => setPicker1(true)}>
                                    <Text>
                                      {moment(value).format("h:mm A")}
                                    </Text>
                                  </Pressable>
                                  <>
                                    {showPicker1 && (
                                      <DateTimePicker
                                        mode={"time"}
                                        value={value}
                                        onChange={(
                                          _temp: any,
                                          date: Date | undefined
                                        ) => {
                                          setPicker1(Platform.OS === "ios");
                                          props.dispatch([
                                            "filters",
                                            props.index,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [
                                                  op,
                                                  [date || new Date(), value2],
                                                ],
                                              ];
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
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                          {apply(undefined, () => {
                            const value = value2;
                            if (value instanceof Date) {
                              return (
                                <>
                                  <Pressable onPress={() => setPicker2(true)}>
                                    <Text>
                                      {moment(value).format("h:mm A")}
                                    </Text>
                                  </Pressable>
                                  <>
                                    {showPicker2 && (
                                      <DateTimePicker
                                        mode={"time"}
                                        value={value}
                                        onChange={(
                                          _temp: any,
                                          date: Date | undefined
                                        ) => {
                                          setPicker2(Platform.OS === "ios");
                                          props.dispatch([
                                            "filters",
                                            props.index,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [
                                                  op,
                                                  [value1, date || new Date()],
                                                ],
                                              ];
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
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                        </>
                      );
                    }
                    default: {
                      const _exhaustiveCheck: never = op;
                      return _exhaustiveCheck;
                    }
                  }
                }
                return <></>;
              }
              case "timestamp": {
                if (props.filter_path.value[1] !== undefined) {
                  const op = props.filter_path.value[1][0];
                  switch (op) {
                    case "==":
                    case "!=":
                    case ">=":
                    case "<=":
                    case ">":
                    case "<": {
                      const value = props.filter_path.value[1][1];
                      if (value instanceof Date) {
                        return (
                          <>
                            <Pressable onPress={() => setPicker1(true)}>
                              <Text>
                                {moment(value).format("Do MMM YYYY, h:mm A")}
                              </Text>
                            </Pressable>
                            <>
                              {showPicker1 && (
                                <DateTimePicker
                                  mode={mode1 as "date" | "time"}
                                  value={value}
                                  onChange={(
                                    _temp: any,
                                    selectedValue: Date | undefined
                                  ) => {
                                    setPicker1(Platform.OS === "ios");
                                    if (selectedValue !== undefined) {
                                      if (mode1 === "date") {
                                        setDate1(
                                          apply(date1, (it) => {
                                            it.setFullYear(
                                              selectedValue.getFullYear()
                                            );
                                            it.setMonth(
                                              selectedValue.getMonth()
                                            );
                                            it.setDate(selectedValue.getDate());
                                            return it;
                                          })
                                        );
                                        setMode1("time");
                                        setPicker1(Platform.OS !== "ios");
                                      } else {
                                        setDate1(
                                          apply(date1, (it) => {
                                            it.setHours(
                                              selectedValue.getHours()
                                            );
                                            it.setMinutes(
                                              selectedValue.getMinutes()
                                            );
                                            it.setSeconds(
                                              selectedValue.getSeconds()
                                            );
                                            it.setMilliseconds(
                                              selectedValue.getMilliseconds()
                                            );
                                            return it;
                                          })
                                        );
                                        props.dispatch([
                                          "filters",
                                          props.index,
                                          "replace",
                                          apply(props.filter_path, (it) => {
                                            it.value = [
                                              field_struct_name,
                                              [op, new Date(date1.getTime())],
                                            ];
                                            return it;
                                          }),
                                        ]);
                                        setMode1("date");
                                      }
                                    } else {
                                      setDate1(new Date(value.getTime()));
                                      setMode1("date");
                                    }
                                  }}
                                />
                              )}
                            </>
                          </>
                        );
                      } else {
                        return (
                          <Pressable onPress={() => {}}>
                            <Text>{value[0]}</Text>
                          </Pressable>
                        );
                      }
                    }
                    case "between":
                    case "not_between": {
                      const [value1, value2] = props.filter_path.value[1][1];
                      return (
                        <>
                          {apply(undefined, () => {
                            const value = value1;
                            if (value instanceof Date) {
                              return (
                                <>
                                  <Pressable onPress={() => setPicker1(true)}>
                                    <Text>
                                      {moment(value).format(
                                        "Do MMM YYYY, h:mm A"
                                      )}
                                    </Text>
                                  </Pressable>
                                  <>
                                    {showPicker1 && (
                                      <DateTimePicker
                                        mode={mode1 as "date" | "time"}
                                        value={value}
                                        onChange={(
                                          _temp: any,
                                          selectedValue: Date | undefined
                                        ) => {
                                          setPicker1(Platform.OS === "ios");
                                          if (selectedValue !== undefined) {
                                            if (mode1 === "date") {
                                              setDate1(
                                                apply(date1, (it) => {
                                                  it.setFullYear(
                                                    selectedValue.getFullYear()
                                                  );
                                                  it.setMonth(
                                                    selectedValue.getMonth()
                                                  );
                                                  it.setDate(
                                                    selectedValue.getDate()
                                                  );
                                                  return it;
                                                })
                                              );
                                              setMode1("time");
                                              setPicker1(Platform.OS !== "ios");
                                            } else {
                                              setDate1(
                                                apply(date1, (it) => {
                                                  it.setHours(
                                                    selectedValue.getHours()
                                                  );
                                                  it.setMinutes(
                                                    selectedValue.getMinutes()
                                                  );
                                                  it.setSeconds(
                                                    selectedValue.getSeconds()
                                                  );
                                                  it.setMilliseconds(
                                                    selectedValue.getMilliseconds()
                                                  );
                                                  return it;
                                                })
                                              );
                                              props.dispatch([
                                                "filters",
                                                props.index,
                                                "replace",
                                                apply(
                                                  props.filter_path,
                                                  (it) => {
                                                    it.value = [
                                                      field_struct_name,
                                                      [
                                                        op,
                                                        [
                                                          new Date(
                                                            date1.getTime()
                                                          ),
                                                          value2,
                                                        ],
                                                      ],
                                                    ];
                                                    return it;
                                                  }
                                                ),
                                              ]);
                                              setMode1("date");
                                            }
                                          } else {
                                            setDate1(new Date(value.getTime()));
                                            setMode1("date");
                                          }
                                        }}
                                      />
                                    )}
                                  </>
                                </>
                              );
                            } else {
                              return (
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                          {apply(undefined, () => {
                            const value = value2;
                            if (value instanceof Date) {
                              return (
                                <>
                                  <Pressable onPress={() => setPicker2(true)}>
                                    <Text>
                                      {moment(value).format(
                                        "Do MMM YYYY, h:mm A"
                                      )}
                                    </Text>
                                  </Pressable>
                                  <>
                                    {showPicker2 && (
                                      <DateTimePicker
                                        mode={mode2 as "date" | "time"}
                                        value={value}
                                        onChange={(
                                          _temp: any,
                                          selectedValue: Date | undefined
                                        ) => {
                                          setPicker2(Platform.OS === "ios");
                                          if (selectedValue !== undefined) {
                                            if (mode2 === "date") {
                                              setDate2(
                                                apply(date2, (it) => {
                                                  it.setFullYear(
                                                    selectedValue.getFullYear()
                                                  );
                                                  it.setMonth(
                                                    selectedValue.getMonth()
                                                  );
                                                  it.setDate(
                                                    selectedValue.getDate()
                                                  );
                                                  return it;
                                                })
                                              );
                                              setMode2("time");
                                              setPicker2(Platform.OS !== "ios");
                                            } else {
                                              setDate2(
                                                apply(date2, (it) => {
                                                  it.setHours(
                                                    selectedValue.getHours()
                                                  );
                                                  it.setMinutes(
                                                    selectedValue.getMinutes()
                                                  );
                                                  it.setSeconds(
                                                    selectedValue.getSeconds()
                                                  );
                                                  it.setMilliseconds(
                                                    selectedValue.getMilliseconds()
                                                  );
                                                  return it;
                                                })
                                              );
                                              props.dispatch([
                                                "filters",
                                                props.index,
                                                "replace",
                                                apply(
                                                  props.filter_path,
                                                  (it) => {
                                                    it.value = [
                                                      field_struct_name,
                                                      [
                                                        op,
                                                        [
                                                          value1,
                                                          new Date(
                                                            date2.getTime()
                                                          ),
                                                        ],
                                                      ],
                                                    ];
                                                    return it;
                                                  }
                                                ),
                                              ]);
                                              setMode2("date");
                                            }
                                          } else {
                                            setDate2(new Date(value.getTime()));
                                            setMode2("date");
                                          }
                                        }}
                                      />
                                    )}
                                  </>
                                </>
                              );
                            } else {
                              return (
                                <Pressable onPress={() => {}}>
                                  <Text>{value[0]}</Text>
                                </Pressable>
                              );
                            }
                          })}
                        </>
                      );
                    }
                    default: {
                      const _exhaustiveCheck: never = op;
                      return _exhaustiveCheck;
                    }
                  }
                }
                return <></>;
              }
              case "other": {
                if (props.filter_path.value[1] !== undefined) {
                  const op = props.filter_path.value[1][0];
                  switch (op) {
                    case "==":
                    case "!=": {
                      const other_struct = props.filter_path.value[2];
                      const value = props.filter_path.value[1][1];
                      if (is_decimal(value)) {
                        return (
                          <TextInput
                            value={value.toString()}
                            keyboardType={"number-pad"}
                            onChangeText={(x) =>
                              props.dispatch([
                                "filters",
                                props.index,
                                "replace",
                                apply(props.filter_path, (it) => {
                                  it.value = [
                                    field_struct_name,
                                    [op, new Decimal(x || "0")],
                                    other_struct,
                                  ];
                                  return it;
                                }),
                              ])
                            }
                          />
                        );
                      } else {
                        return (
                          <Pressable onPress={() => {}}>
                            <Text>{value[0]}</Text>
                          </Pressable>
                        );
                      }
                    }
                    default: {
                      const _exhaustiveCheck: never = op;
                      return _exhaustiveCheck;
                    }
                  }
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
        })}
      </View>
      <View
        style={{
          flexDirection: "row-reverse",
          flexGrow: 1,
          alignSelf: "center",
        }}
      >
        {apply(undefined, () => {
          if (props.filter_path.value[1] !== undefined) {
            return (
              <Pressable
                onPress={() =>
                  props.dispatch([
                    "filters",
                    props.index,
                    "remove",
                    props.filter_path,
                  ])
                }
              >
                <Entypo name="cross" size={24} color="white" />
              </Pressable>
            );
          }
          return <></>;
        })}
      </View>
    </View>
  );
}

export function FilterComponent(props: {
  init_filter: Filter;
  filter: Filter;
  index: number;
  dispatch: React.Dispatch<Action>;
}): JSX.Element {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: "column",
        backgroundColor: "black",
        borderColor: "white",
        borderBottomWidth: 1,
      }}
    >
      <BottomSheetScrollView
        horizontal={true}
        style={{
          borderColor: "white",
          borderTopWidth: 1,
          borderBottomWidth: 1,
          marginBottom: 10,
        }}
      >
        {props.filter.id[1] === undefined ? (
          <Pressable
            onPress={() =>
              props.dispatch([
                "filters",
                props.index,
                "id",
                [false, ["==", new Decimal(0)]],
              ])
            }
            style={{
              borderColor: "white",
              borderLeftWidth: 1,
              borderRightWidth: 1,
              padding: 3,
            }}
          >
            <Text>Unique ID</Text>
          </Pressable>
        ) : (
          <></>
        )}
        {props.filter.created_at[1] === undefined ? (
          <Pressable
            onPress={() =>
              props.dispatch([
                "filters",
                props.index,
                "created_at",
                [false, ["between", [new Date(0), new Date(0)]]],
              ])
            }
            style={{
              borderColor: "white",
              borderLeftWidth: 1,
              borderRightWidth: 1,
              padding: 3,
            }}
          >
            <Text>Created</Text>
          </Pressable>
        ) : (
          <></>
        )}
        {props.filter.updated_at[1] === undefined ? (
          <Pressable
            onPress={() =>
              props.dispatch([
                "filters",
                props.index,
                "updated_at",
                [false, ["between", [new Date(0), new Date(0)]]],
              ])
            }
            style={{
              borderColor: "white",
              borderLeftWidth: 1,
              borderRightWidth: 1,
              padding: 3,
            }}
          >
            <Text>Updated</Text>
          </Pressable>
        ) : (
          <></>
        )}
        {props.init_filter.filter_paths
          .toArray()
          .filter(
            (filter_path) =>
              !props.filter.filter_paths.anyMatch(
                (x) => x.equals(filter_path) && x.value[1] !== undefined
              )
          )
          .map((filter_path, index) => {
            return (
              <Pressable
                key={index}
                style={{
                  borderColor: "white",
                  borderLeftWidth: 1,
                  borderRightWidth: 1,
                  padding: 3,
                }}
                onPress={() => {
                  const field_struct_type = filter_path.value[0];
                  switch (field_struct_type) {
                    case "str":
                    case "lstr":
                    case "clob": {
                      props.dispatch([
                        "filters",
                        props.index,
                        "replace",
                        new FilterPath(
                          filter_path.label,
                          filter_path.path,
                          [field_struct_type, ["==", ""]],
                          undefined
                        ),
                      ]);
                      break;
                    }
                    case "i32":
                    case "u32":
                    case "i64":
                    case "u64":
                    case "idouble":
                    case "udouble":
                    case "idecimal":
                    case "udecimal": {
                      props.dispatch([
                        "filters",
                        props.index,
                        "replace",
                        new FilterPath(
                          filter_path.label,
                          filter_path.path,
                          [field_struct_type, ["==", new Decimal(0)]],
                          undefined
                        ),
                      ]);
                      break;
                    }
                    case "bool": {
                      props.dispatch([
                        "filters",
                        props.index,
                        "replace",
                        new FilterPath(
                          filter_path.label,
                          filter_path.path,
                          [field_struct_type, ["==", true]],
                          undefined
                        ),
                      ]);
                      break;
                    }
                    case "date":
                    case "time":
                    case "timestamp": {
                      props.dispatch([
                        "filters",
                        props.index,
                        "replace",
                        new FilterPath(
                          filter_path.label,
                          filter_path.path,
                          [field_struct_type, ["==", new Date(0)]],
                          undefined
                        ),
                      ]);
                      break;
                    }
                    case "other": {
                      const other_struct = filter_path.value[2];
                      props.dispatch([
                        "filters",
                        props.index,
                        "replace",
                        new FilterPath(
                          filter_path.label,
                          filter_path.path,
                          [
                            field_struct_type,
                            ["==", new Decimal(-1)],
                            other_struct,
                          ],
                          undefined
                        ),
                      ]);
                      break;
                    }
                  }
                }}
              >
                <Text>{filter_path.label}</Text>
              </Pressable>
            );
          })}
      </BottomSheetScrollView>
      <View
        style={{
          flexDirection: "column",
        }}
      >
        {apply(undefined, () => {
          const [active, value] = props.filter.id;
          if (value !== undefined) {
            return (
              <View
                style={{
                  justifyContent: "flex-start",
                }}
              >
                <View>
                  <Checkbox
                    value={active}
                    onValueChange={(x) => {
                      props.dispatch([
                        "filters",
                        props.index,
                        "id",
                        [x, value],
                      ]);
                    }}
                    color={active ? "#ff0000" : undefined}
                    style={{
                      alignSelf: "center",
                      marginRight: 6,
                    }}
                  />
                  <Text>ID</Text>
                </View>
                <View
                  style={{
                    flexDirection: "row-reverse",
                    flexGrow: 999,
                  }}
                >
                  {apply(undefined, () => {
                    const op = value[0];
                    switch (op) {
                      case "==":
                      case "!=":
                      case ">=":
                      case "<=":
                      case ">":
                      case "<": {
                        return (
                          <TextInput
                            keyboardType={"number-pad"}
                            value={value[1].toString()}
                            onChangeText={(x) => {
                              props.dispatch([
                                "filters",
                                props.index,
                                "id",
                                [
                                  true,
                                  [op, new Decimal(x || "0").truncated().abs()],
                                ],
                              ]);
                            }}
                          />
                        );
                      }
                      case "between":
                      case "not_between": {
                        return (
                          <>
                            <TextInput
                              keyboardType={"number-pad"}
                              value={value[1][0].toString()}
                              onChangeText={(x) => {
                                props.dispatch([
                                  "filters",
                                  props.index,
                                  "id",
                                  [
                                    true,
                                    [
                                      op,
                                      [
                                        new Decimal(x || "0").truncated().abs(),
                                        value[1][1],
                                      ],
                                    ],
                                  ],
                                ]);
                              }}
                            />
                            <TextInput
                              keyboardType={"number-pad"}
                              value={value[1][1].toString()}
                              onChangeText={(x) => {
                                props.dispatch([
                                  "filters",
                                  props.index,
                                  "id",
                                  [
                                    true,
                                    [
                                      op,
                                      [
                                        value[1][0],
                                        new Decimal(x || "0").truncated().abs(),
                                      ],
                                    ],
                                  ],
                                ]);
                              }}
                            />
                          </>
                        );
                      }
                      default: {
                        const _exhaustiveCheck: never = op;
                        return _exhaustiveCheck;
                      }
                    }
                  })}
                </View>
                <View
                  style={{
                    flexDirection: "row-reverse",
                    flexGrow: 1,
                    alignSelf: "center",
                  }}
                >
                  <Pressable
                    onPress={() =>
                      props.dispatch([
                        "filters",
                        props.index,
                        "id",
                        [true, undefined],
                      ])
                    }
                  >
                    <Entypo name="cross" size={24} color="white" />
                  </Pressable>
                </View>
              </View>
            );
          }
          return null;
        })}
        {apply(undefined, () => {
          const [active, value] = props.filter.created_at;
          const [showPicker1, setPicker1] = useState(false);
          const [mode1, setMode1] = useState("date");
          let [date1, setDate1] = useState(
            apply(new Date(), (it) => {
              if (value !== undefined) {
                const op = value[0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    return new Date(value[1].getTime());
                  }
                  case "between":
                  case "not_between": {
                    return new Date(value[1][0].getTime());
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              }
              return it;
            })
          );
          const [showPicker2, setPicker2] = useState(false);
          const [mode2, setMode2] = useState("date");
          let [date2, setDate2] = useState(
            apply(new Date(), (it) => {
              if (value !== undefined) {
                const op = value[0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    return it;
                  }
                  case "between":
                  case "not_between": {
                    return new Date(value[1][1].getTime());
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              }
              return it;
            })
          );
          if (value !== undefined) {
            return (
              <View
                style={{
                  justifyContent: "flex-start",
                }}
              >
                <View>
                  <Checkbox
                    value={active}
                    onValueChange={(x) => {
                      props.dispatch([
                        "filters",
                        props.index,
                        "created_at",
                        [x, value],
                      ]);
                    }}
                    color={active ? "#ff0000" : undefined}
                  />
                  <Text>Created</Text>
                </View>
                <View
                  style={{
                    flexDirection: "row-reverse",
                    flexGrow: 999,
                  }}
                >
                  {apply(undefined, () => {
                    const op = value[0];
                    switch (op) {
                      case "==":
                      case "!=":
                      case ">=":
                      case "<=":
                      case ">":
                      case "<": {
                        return (
                          <>
                            <Pressable onPress={() => setPicker1(true)}>
                              <Text>
                                {moment(value[1]).format("Do MMM YYYY, h:mm A")}
                              </Text>
                            </Pressable>
                            <>
                              {showPicker1 && (
                                <DateTimePicker
                                  mode={mode1 as "date" | "time"}
                                  value={value[1]}
                                  onChange={(
                                    _temp: any,
                                    selectedValue: Date | undefined
                                  ) => {
                                    setPicker1(Platform.OS === "ios");
                                    if (selectedValue !== undefined) {
                                      if (mode1 === "date") {
                                        setDate1(
                                          apply(date1, (it) => {
                                            it.setFullYear(
                                              selectedValue.getFullYear()
                                            );
                                            it.setMonth(
                                              selectedValue.getMonth()
                                            );
                                            it.setDate(selectedValue.getDate());
                                            return it;
                                          })
                                        );
                                        setMode1("time");
                                        setPicker1(Platform.OS !== "ios");
                                      } else {
                                        setDate1(
                                          apply(date1, (it) => {
                                            it.setHours(
                                              selectedValue.getHours()
                                            );
                                            it.setMinutes(
                                              selectedValue.getMinutes()
                                            );
                                            it.setSeconds(
                                              selectedValue.getSeconds()
                                            );
                                            it.setMilliseconds(
                                              selectedValue.getMilliseconds()
                                            );
                                            return it;
                                          })
                                        );
                                        props.dispatch([
                                          "filters",
                                          props.index,
                                          "created_at",
                                          [true, [op, date1 || new Date()]],
                                        ]);
                                        setMode1("date");
                                      }
                                    } else {
                                      setDate1(new Date(value[1].getTime()));
                                      setMode1("date");
                                    }
                                  }}
                                />
                              )}
                            </>
                          </>
                        );
                      }
                      case "between":
                      case "not_between": {
                        return (
                          <>
                            <Pressable onPress={() => setPicker1(true)}>
                              <Text>
                                {moment(value[1][0]).format(
                                  "Do MMM YYYY, h:mm A"
                                )}
                              </Text>
                            </Pressable>
                            <>
                              {showPicker1 && (
                                <DateTimePicker
                                  mode={mode1 as "date" | "time"}
                                  value={value[1][0]}
                                  onChange={(
                                    _temp: any,
                                    selectedValue: Date | undefined
                                  ) => {
                                    setPicker1(Platform.OS === "ios");
                                    if (selectedValue !== undefined) {
                                      if (mode1 === "date") {
                                        setDate1(
                                          apply(date1, (it) => {
                                            it.setFullYear(
                                              selectedValue.getFullYear()
                                            );
                                            it.setMonth(
                                              selectedValue.getMonth()
                                            );
                                            it.setDate(selectedValue.getDate());
                                            return it;
                                          })
                                        );
                                        setMode1("time");
                                        setPicker1(Platform.OS !== "ios");
                                      } else {
                                        setDate1(
                                          apply(date1, (it) => {
                                            it.setHours(
                                              selectedValue.getHours()
                                            );
                                            it.setMinutes(
                                              selectedValue.getMinutes()
                                            );
                                            it.setSeconds(
                                              selectedValue.getSeconds()
                                            );
                                            it.setMilliseconds(
                                              selectedValue.getMilliseconds()
                                            );
                                            return it;
                                          })
                                        );
                                        props.dispatch([
                                          "filters",
                                          props.index,
                                          "created_at",
                                          [
                                            true,
                                            [
                                              op,
                                              [
                                                date1 || new Date(),
                                                value[1][1],
                                              ],
                                            ],
                                          ],
                                        ]);
                                        setMode1("date");
                                      }
                                    } else {
                                      setDate1(new Date(value[1][0].getTime()));
                                      setMode1("date");
                                    }
                                  }}
                                />
                              )}
                            </>
                            <Pressable onPress={() => setPicker2(true)}>
                              <Text>
                                {moment(value[1][1]).format(
                                  "Do MMM YYYY, h:mm A"
                                )}
                              </Text>
                            </Pressable>
                            <>
                              {showPicker2 && (
                                <DateTimePicker
                                  mode={mode2 as "date" | "time"}
                                  value={value[1][1]}
                                  onChange={(
                                    _temp: any,
                                    selectedValue: Date | undefined
                                  ) => {
                                    setPicker2(Platform.OS === "ios");
                                    if (selectedValue !== undefined) {
                                      if (mode2 === "date") {
                                        setDate2(
                                          apply(date2, (it) => {
                                            it.setFullYear(
                                              selectedValue.getFullYear()
                                            );
                                            it.setMonth(
                                              selectedValue.getMonth()
                                            );
                                            it.setDate(selectedValue.getDate());
                                            return it;
                                          })
                                        );
                                        setMode2("time");
                                        setPicker2(Platform.OS !== "ios");
                                      } else {
                                        setDate2(
                                          apply(date2, (it) => {
                                            it.setHours(
                                              selectedValue.getHours()
                                            );
                                            it.setMinutes(
                                              selectedValue.getMinutes()
                                            );
                                            it.setSeconds(
                                              selectedValue.getSeconds()
                                            );
                                            it.setMilliseconds(
                                              selectedValue.getMilliseconds()
                                            );
                                            return it;
                                          })
                                        );
                                        props.dispatch([
                                          "filters",
                                          props.index,
                                          "created_at",
                                          [
                                            true,
                                            [
                                              op,
                                              [
                                                value[1][0],
                                                date2 || new Date(),
                                              ],
                                            ],
                                          ],
                                        ]);
                                        setMode2("date");
                                      }
                                    } else {
                                      setDate2(new Date(value[1][1].getTime()));
                                      setMode2("date");
                                    }
                                  }}
                                />
                              )}
                            </>
                          </>
                        );
                      }
                      default: {
                        const _exhaustiveCheck: never = op;
                        return _exhaustiveCheck;
                      }
                    }
                  })}
                </View>
                <View
                  style={{
                    flexDirection: "row-reverse",
                    flexGrow: 1,
                    alignSelf: "center",
                  }}
                >
                  <Pressable
                    onPress={() =>
                      props.dispatch([
                        "filters",
                        props.index,
                        "created_at",
                        [true, undefined],
                      ])
                    }
                  >
                    <Entypo name="cross" size={24} color="white" />
                  </Pressable>
                </View>
              </View>
            );
          }
          return null;
        })}
        {apply(undefined, () => {
          const [active, value] = props.filter.updated_at;
          const [showPicker1, setPicker1] = useState(false);
          const [mode1, setMode1] = useState("date");
          let [date1, setDate1] = useState(
            apply(new Date(), (it) => {
              if (value !== undefined) {
                const op = value[0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    return new Date(value[1].getTime());
                  }
                  case "between":
                  case "not_between": {
                    return new Date(value[1][0].getTime());
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              }
              return it;
            })
          );
          const [showPicker2, setPicker2] = useState(false);
          const [mode2, setMode2] = useState("date");
          let [date2, setDate2] = useState(
            apply(new Date(), (it) => {
              if (value !== undefined) {
                const op = value[0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    return it;
                  }
                  case "between":
                  case "not_between": {
                    return new Date(value[1][1].getTime());
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              }
              return it;
            })
          );
          if (value !== undefined) {
            return (
              <View
                style={{
                  justifyContent: "flex-start",
                }}
              >
                <View>
                  <Checkbox
                    value={active}
                    onValueChange={(x) => {
                      props.dispatch([
                        "filters",
                        props.index,
                        "updated_at",
                        [x, value],
                      ]);
                    }}
                    color={active ? "#ff0000" : undefined}
                  />
                  <Text>Updated</Text>
                </View>
                <View
                  style={{
                    flexDirection: "row-reverse",
                    flexGrow: 999,
                  }}
                >
                  {apply(undefined, () => {
                    const op = value[0];
                    switch (op) {
                      case "==":
                      case "!=":
                      case ">=":
                      case "<=":
                      case ">":
                      case "<": {
                        return (
                          <>
                            <Pressable onPress={() => setPicker1(true)}>
                              <Text>
                                {moment(value[1]).format("Do MMM YYYY, h:mm A")}
                              </Text>
                            </Pressable>
                            <>
                              {showPicker1 && (
                                <DateTimePicker
                                  mode={mode1 as "date" | "time"}
                                  value={value[1]}
                                  onChange={(
                                    _temp: any,
                                    selectedValue: Date | undefined
                                  ) => {
                                    setPicker1(Platform.OS === "ios");
                                    if (selectedValue !== undefined) {
                                      if (mode1 === "date") {
                                        setDate1(
                                          apply(date1, (it) => {
                                            it.setFullYear(
                                              selectedValue.getFullYear()
                                            );
                                            it.setMonth(
                                              selectedValue.getMonth()
                                            );
                                            it.setDate(selectedValue.getDate());
                                            return it;
                                          })
                                        );
                                        setMode1("time");
                                        setPicker1(Platform.OS !== "ios");
                                      } else {
                                        setDate1(
                                          apply(date1, (it) => {
                                            it.setHours(
                                              selectedValue.getHours()
                                            );
                                            it.setMinutes(
                                              selectedValue.getMinutes()
                                            );
                                            it.setSeconds(
                                              selectedValue.getSeconds()
                                            );
                                            it.setMilliseconds(
                                              selectedValue.getMilliseconds()
                                            );
                                            return it;
                                          })
                                        );
                                        props.dispatch([
                                          "filters",
                                          props.index,
                                          "updated_at",
                                          [true, [op, date1 || new Date()]],
                                        ]);
                                        setMode1("date");
                                      }
                                    } else {
                                      setDate1(new Date(value[1].getTime()));
                                      setMode1("date");
                                    }
                                  }}
                                />
                              )}
                            </>
                          </>
                        );
                      }
                      case "between":
                      case "not_between": {
                        return (
                          <>
                            <Pressable onPress={() => setPicker1(true)}>
                              <Text>
                                {moment(value[1][0]).format(
                                  "Do MMM YYYY, h:mm A"
                                )}
                              </Text>
                            </Pressable>
                            <>
                              {showPicker1 && (
                                <DateTimePicker
                                  mode={mode1 as "date" | "time"}
                                  value={value[1][0]}
                                  onChange={(
                                    _temp: any,
                                    selectedValue: Date | undefined
                                  ) => {
                                    setPicker1(Platform.OS === "ios");
                                    if (selectedValue !== undefined) {
                                      if (mode1 === "date") {
                                        setDate1(
                                          apply(date1, (it) => {
                                            it.setFullYear(
                                              selectedValue.getFullYear()
                                            );
                                            it.setMonth(
                                              selectedValue.getMonth()
                                            );
                                            it.setDate(selectedValue.getDate());
                                            return it;
                                          })
                                        );
                                        setMode1("time");
                                        setPicker1(Platform.OS !== "ios");
                                      } else {
                                        setDate1(
                                          apply(date1, (it) => {
                                            it.setHours(
                                              selectedValue.getHours()
                                            );
                                            it.setMinutes(
                                              selectedValue.getMinutes()
                                            );
                                            it.setSeconds(
                                              selectedValue.getSeconds()
                                            );
                                            it.setMilliseconds(
                                              selectedValue.getMilliseconds()
                                            );
                                            return it;
                                          })
                                        );
                                        props.dispatch([
                                          "filters",
                                          props.index,
                                          "updated_at",
                                          [
                                            true,
                                            [
                                              op,
                                              [
                                                date1 || new Date(),
                                                value[1][1],
                                              ],
                                            ],
                                          ],
                                        ]);
                                        setMode1("date");
                                      }
                                    } else {
                                      setDate1(new Date(value[1][0].getTime()));
                                      setMode1("date");
                                    }
                                  }}
                                />
                              )}
                            </>
                            <Pressable onPress={() => setPicker2(true)}>
                              <Text>
                                {moment(value[1][1]).format(
                                  "Do MMM YYYY, h:mm A"
                                )}
                              </Text>
                            </Pressable>
                            <>
                              {showPicker2 && (
                                <DateTimePicker
                                  mode={mode2 as "date" | "time"}
                                  value={value[1][1]}
                                  onChange={(
                                    _temp: any,
                                    selectedValue: Date | undefined
                                  ) => {
                                    setPicker2(Platform.OS === "ios");
                                    if (selectedValue !== undefined) {
                                      if (mode2 === "date") {
                                        setDate2(
                                          apply(date2, (it) => {
                                            it.setFullYear(
                                              selectedValue.getFullYear()
                                            );
                                            it.setMonth(
                                              selectedValue.getMonth()
                                            );
                                            it.setDate(selectedValue.getDate());
                                            return it;
                                          })
                                        );
                                        setMode2("time");
                                        setPicker2(Platform.OS !== "ios");
                                      } else {
                                        setDate2(
                                          apply(date2, (it) => {
                                            it.setHours(
                                              selectedValue.getHours()
                                            );
                                            it.setMinutes(
                                              selectedValue.getMinutes()
                                            );
                                            it.setSeconds(
                                              selectedValue.getSeconds()
                                            );
                                            it.setMilliseconds(
                                              selectedValue.getMilliseconds()
                                            );
                                            return it;
                                          })
                                        );
                                        props.dispatch([
                                          "filters",
                                          props.index,
                                          "updated_at",
                                          [
                                            true,
                                            [
                                              op,
                                              [
                                                value[1][0],
                                                date2 || new Date(),
                                              ],
                                            ],
                                          ],
                                        ]);
                                        setMode2("date");
                                      }
                                    } else {
                                      setDate2(new Date(value[1][1].getTime()));
                                      setMode2("date");
                                    }
                                  }}
                                />
                              )}
                            </>
                          </>
                        );
                      }
                      default: {
                        const _exhaustiveCheck: never = op;
                        return _exhaustiveCheck;
                      }
                    }
                  })}
                </View>
                <View
                  style={{
                    flexDirection: "row-reverse",
                    flexGrow: 1,
                    alignSelf: "center",
                  }}
                >
                  <Pressable
                    onPress={() =>
                      props.dispatch([
                        "filters",
                        props.index,
                        "updated_at",
                        [true, undefined],
                      ])
                    }
                  >
                    <Entypo name="cross" size={24} color="white" />
                  </Pressable>
                </View>
              </View>
            );
          }
          return null;
        })}
        {props.filter.filter_paths.toArray().map((x, index) => {
          return (
            <FilterPathComponent
              key={index}
              filter_path={x}
              index={props.index}
              dispatch={props.dispatch}
            />
          );
        })}
      </View>
    </View>
  );
}
