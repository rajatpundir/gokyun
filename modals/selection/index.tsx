import React, { useState } from "react";
import { Draft } from "immer";
import { useEffect } from "react";
import { FlatList } from "react-native-gesture-handler";
import { useImmerReducer } from "use-immer";
import { NavigatorProps as RootNavigatorProps } from "../../App";
import { Filter, FilterPath, get_variables } from "../../main/utils/db";
import { Struct, Variable } from "../../main/utils/variable";
import { View, Text, TextInput } from "../../main/themed";
import Decimal from "decimal.js";
import { Platform, Pressable, Switch } from "react-native";
import { apply, is_decimal, unwrap } from "../../main/utils/prelude";
import moment from "moment";
import DateTimePicker from "@react-native-community/datetimepicker";

type State = {
  struct: Struct;
  active: boolean;
  level: Decimal | undefined;
  filters: ReadonlyArray<Filter>;
  limit_offset: [Decimal, Decimal] | undefined;
  variables: Array<Variable>;
};

type Action = ["variables", Array<Variable>];

export function reducer(state: Draft<State>, action: Action) {
  switch (action[0]) {
    case "variables": {
      state.variables = action[1] as any;
      break;
    }
    default: {
      const _exhaustiveCheck: never = action[0];
      return _exhaustiveCheck;
    }
  }
}

// First, display what is there on top of component
// Render filter component on top instead of using bottom sheet from the start
// Whats passed from above for filtering is absolute
// Modification to filters should only be able to search in a subset
// Apart from original filters, store modified filters separately for SQLLite and for backend

export default function Component(props: RootNavigatorProps<"SelectionModal">) {
  const [state, dispatch] = useImmerReducer<State, Action>(reducer, {
    struct: props.route.params.struct,
    active: props.route.params.active,
    level: props.route.params.level,
    filters: props.route.params.filters,
    limit_offset: props.route.params.limit_offset,
    variables: [],
  });
  useEffect(() => {
    props.navigation.setOptions({ headerTitle: props.route.params.title });
    const get_vars = async () => {
      const variables = await get_variables(
        state.struct,
        state.active,
        state.level,
        state.filters,
        state.limit_offset
      );
      if (unwrap(variables)) {
        dispatch(["variables", variables.value]);
      }
    };
    get_vars();
  }, [
    state.struct,
    state.active,
    state.level,
    state.filters,
    state.limit_offset,
  ]);
  return (
    <View style={{ flex: 1 }}>
      <View>
        <View>
          <Text>Active</Text>
          <Switch value={state.active} />
        </View>
        <View>
          <Text>Level</Text>
          <Text>{state.level ? state.level.toString() : "0"}</Text>
        </View>
        {/* // Render Filters and their filter paths */}
      </View>
      <FlatList
        data={state.variables}
        renderItem={(list_item) => (
          <props.route.params.render_list_element
            selected={props.route.params.selected}
            variable={list_item.item}
            disptach_values={props.route.params.disptach_values}
          />
        )}
        keyExtractor={(list_item: Variable) => list_item.id.valueOf()}
      />
    </View>
  );
}

function render_filter(filter: Filter): JSX.Element {
  return (
    <>
      {apply(undefined, () => {
        const [active, value] = filter.id;
        if (value !== undefined) {
          return (
            <>
              <Switch value={active} onValueChange={(x) => {}} />
              <Text>ID</Text>
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
                        onChangeText={(x) => {}}
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
                          onChangeText={(x) => {}}
                        />
                        <TextInput
                          keyboardType={"number-pad"}
                          value={value[1][1].toString()}
                          onChangeText={(x) => {}}
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
            </>
          );
        }
        return null;
      })}
      {apply(undefined, () => {
        const [active, value] = filter.created_at;
        if (value !== undefined) {
          return (
            <>
              <Switch value={active} onValueChange={(x) => {}} />
              <Text>Created At</Text>
              {apply(undefined, () => {
                const op = value[0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    const [showPicker, setPicker] = useState(false);
                    const [mode, setMode] = useState("date");
                    let [date, setDate] = useState(
                      new Date(value[1].getTime())
                    );
                    return (
                      <>
                        <Pressable onPress={() => setPicker(true)}>
                          <Text>
                            {moment(value[1]).format("Do MMM YYYY, h:mm A")}
                          </Text>
                        </Pressable>
                        <View>
                          {showPicker && (
                            <DateTimePicker
                              mode={mode as "date" | "time"}
                              value={value[1]}
                              onChange={(
                                _temp: any,
                                selectedValue: Date | undefined
                              ) => {
                                setPicker(Platform.OS === "ios");
                                if (selectedValue !== undefined) {
                                  if (mode === "date") {
                                    setDate(
                                      apply(date, (it) => {
                                        it.setFullYear(
                                          selectedValue.getFullYear()
                                        );
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
                                    // dispatch updated value
                                    setMode("date");
                                  }
                                } else {
                                  setDate(new Date(value[1].getTime()));
                                  setMode("date");
                                }
                              }}
                            />
                          )}
                        </View>
                      </>
                    );
                  }
                  case "between":
                  case "not_between": {
                    return (
                      <>
                        {apply(undefined, () => {
                          const [showPicker, setPicker] = useState(false);
                          const [mode, setMode] = useState("date");
                          let [date, setDate] = useState(
                            new Date(value[1][0].getTime())
                          );
                          return (
                            <>
                              <Pressable onPress={() => setPicker(true)}>
                                <Text>
                                  {moment(value[1][0]).format(
                                    "Do MMM YYYY, h:mm A"
                                  )}
                                </Text>
                              </Pressable>
                              <View>
                                {showPicker && (
                                  <DateTimePicker
                                    mode={mode as "date" | "time"}
                                    value={value[1][0]}
                                    onChange={(
                                      _temp: any,
                                      selectedValue: Date | undefined
                                    ) => {
                                      setPicker(Platform.OS === "ios");
                                      if (selectedValue !== undefined) {
                                        if (mode === "date") {
                                          setDate(
                                            apply(date, (it) => {
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
                                          setMode("time");
                                          setPicker(Platform.OS !== "ios");
                                        } else {
                                          setDate(
                                            apply(date, (it) => {
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
                                          // dispatch updated value
                                          setMode("date");
                                        }
                                      } else {
                                        setDate(
                                          new Date(value[1][0].getTime())
                                        );
                                        setMode("date");
                                      }
                                    }}
                                  />
                                )}
                              </View>
                            </>
                          );
                        })}
                        {apply(undefined, () => {
                          const [showPicker, setPicker] = useState(false);
                          const [mode, setMode] = useState("date");
                          let [date, setDate] = useState(
                            new Date(value[1][1].getTime())
                          );
                          return (
                            <>
                              <Pressable onPress={() => setPicker(true)}>
                                <Text>
                                  {moment(value[1][1]).format(
                                    "Do MMM YYYY, h:mm A"
                                  )}
                                </Text>
                              </Pressable>
                              <View>
                                {showPicker && (
                                  <DateTimePicker
                                    mode={mode as "date" | "time"}
                                    value={value[1][1]}
                                    onChange={(
                                      _temp: any,
                                      selectedValue: Date | undefined
                                    ) => {
                                      setPicker(Platform.OS === "ios");
                                      if (selectedValue !== undefined) {
                                        if (mode === "date") {
                                          setDate(
                                            apply(date, (it) => {
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
                                          setMode("time");
                                          setPicker(Platform.OS !== "ios");
                                        } else {
                                          setDate(
                                            apply(date, (it) => {
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
                                          // dispatch updated value
                                          setMode("date");
                                        }
                                      } else {
                                        setDate(
                                          new Date(value[1][1].getTime())
                                        );
                                        setMode("date");
                                      }
                                    }}
                                  />
                                )}
                              </View>
                            </>
                          );
                        })}
                      </>
                    );
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              })}
            </>
          );
        }
        return null;
      })}
      {apply(undefined, () => {
        const [active, value] = filter.updated_at;
        if (value !== undefined) {
          return (
            <>
              <Switch value={active} onValueChange={(x) => {}} />
              <Text>Updated At</Text>
              {apply(undefined, () => {
                const op = value[0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    const [showPicker, setPicker] = useState(false);
                    const [mode, setMode] = useState("date");
                    let [date, setDate] = useState(
                      new Date(value[1].getTime())
                    );
                    return (
                      <>
                        <Pressable onPress={() => setPicker(true)}>
                          <Text>
                            {moment(value[1]).format("Do MMM YYYY, h:mm A")}
                          </Text>
                        </Pressable>
                        <View>
                          {showPicker && (
                            <DateTimePicker
                              mode={mode as "date" | "time"}
                              value={value[1]}
                              onChange={(
                                _temp: any,
                                selectedValue: Date | undefined
                              ) => {
                                setPicker(Platform.OS === "ios");
                                if (selectedValue !== undefined) {
                                  if (mode === "date") {
                                    setDate(
                                      apply(date, (it) => {
                                        it.setFullYear(
                                          selectedValue.getFullYear()
                                        );
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
                                    // dispatch updated value
                                    setMode("date");
                                  }
                                } else {
                                  setDate(new Date(value[1].getTime()));
                                  setMode("date");
                                }
                              }}
                            />
                          )}
                        </View>
                      </>
                    );
                  }
                  case "between":
                  case "not_between": {
                    return (
                      <>
                        {apply(undefined, () => {
                          const [showPicker, setPicker] = useState(false);
                          const [mode, setMode] = useState("date");
                          let [date, setDate] = useState(
                            new Date(value[1][0].getTime())
                          );
                          return (
                            <>
                              <Pressable onPress={() => setPicker(true)}>
                                <Text>
                                  {moment(value[1][0]).format(
                                    "Do MMM YYYY, h:mm A"
                                  )}
                                </Text>
                              </Pressable>
                              <View>
                                {showPicker && (
                                  <DateTimePicker
                                    mode={mode as "date" | "time"}
                                    value={value[1][0]}
                                    onChange={(
                                      _temp: any,
                                      selectedValue: Date | undefined
                                    ) => {
                                      setPicker(Platform.OS === "ios");
                                      if (selectedValue !== undefined) {
                                        if (mode === "date") {
                                          setDate(
                                            apply(date, (it) => {
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
                                          setMode("time");
                                          setPicker(Platform.OS !== "ios");
                                        } else {
                                          setDate(
                                            apply(date, (it) => {
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
                                          // dispatch updated value
                                          setMode("date");
                                        }
                                      } else {
                                        setDate(
                                          new Date(value[1][0].getTime())
                                        );
                                        setMode("date");
                                      }
                                    }}
                                  />
                                )}
                              </View>
                            </>
                          );
                        })}
                        {apply(undefined, () => {
                          const [showPicker, setPicker] = useState(false);
                          const [mode, setMode] = useState("date");
                          let [date, setDate] = useState(
                            new Date(value[1][1].getTime())
                          );
                          return (
                            <>
                              <Pressable onPress={() => setPicker(true)}>
                                <Text>
                                  {moment(value[1][1]).format(
                                    "Do MMM YYYY, h:mm A"
                                  )}
                                </Text>
                              </Pressable>
                              <View>
                                {showPicker && (
                                  <DateTimePicker
                                    mode={mode as "date" | "time"}
                                    value={value[1][1]}
                                    onChange={(
                                      _temp: any,
                                      selectedValue: Date | undefined
                                    ) => {
                                      setPicker(Platform.OS === "ios");
                                      if (selectedValue !== undefined) {
                                        if (mode === "date") {
                                          setDate(
                                            apply(date, (it) => {
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
                                          setMode("time");
                                          setPicker(Platform.OS !== "ios");
                                        } else {
                                          setDate(
                                            apply(date, (it) => {
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
                                          // dispatch updated value
                                          setMode("date");
                                        }
                                      } else {
                                        setDate(
                                          new Date(value[1][1].getTime())
                                        );
                                        setMode("date");
                                      }
                                    }}
                                  />
                                )}
                              </View>
                            </>
                          );
                        })}
                      </>
                    );
                  }
                  default: {
                    const _exhaustiveCheck: never = op;
                    return _exhaustiveCheck;
                  }
                }
              })}
            </>
          );
        }
        return null;
      })}
      {filter.filter_paths.toArray().map((x, index) => {
        return <View key={index}>{render_filter_path(x)}</View>;
      })}
    </>
  );
}

function render_filter_path(filter_path: FilterPath): JSX.Element {
  return (
    <>
      <Switch value={filter_path.active} onValueChange={(x) => {}} />
      <Text>{filter_path.label}</Text>
      {apply(undefined, () => {
        if (filter_path.active) {
          const field_struct_name = filter_path.value[0];
          switch (field_struct_name) {
            case "str":
            case "lstr":
            case "clob": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<":
                  case "like":
                  case "glob": {
                    const value = filter_path.value[1][1];
                    if (typeof value === "string") {
                      return (
                        <TextInput value={value} onChangeText={(x) => {}} />
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
                    const [value1, value2] = filter_path.value[1][1];
                    return (
                      <>
                        {apply(undefined, () => {
                          const value = value1;
                          if (typeof value === "string") {
                            return (
                              <TextInput
                                value={value}
                                onChangeText={(x) => {}}
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
                                onChangeText={(x) => {}}
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
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
            }
            case "i32": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    const value = filter_path.value[1][1];
                    if (is_decimal(value)) {
                      return (
                        <TextInput
                          value={value.toString()}
                          keyboardType={"number-pad"}
                          onChangeText={(x) => {}}
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
                    const [value1, value2] = filter_path.value[1][1];
                    return (
                      <>
                        {apply(undefined, () => {
                          const value = value1;
                          if (is_decimal(value)) {
                            return (
                              <TextInput
                                value={value.toString()}
                                keyboardType={"number-pad"}
                                onChangeText={(x) => {}}
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
                                onChangeText={(x) => {}}
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
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
            }
            case "u32": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    const value = filter_path.value[1][1];
                    if (is_decimal(value)) {
                      return (
                        <TextInput
                          value={value.toString()}
                          keyboardType={"number-pad"}
                          onChangeText={(x) => {}}
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
                    const [value1, value2] = filter_path.value[1][1];
                    return (
                      <>
                        {apply(undefined, () => {
                          const value = value1;
                          if (is_decimal(value)) {
                            return (
                              <TextInput
                                value={value.toString()}
                                keyboardType={"number-pad"}
                                onChangeText={(x) => {}}
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
                                onChangeText={(x) => {}}
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
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
            }
            case "i64": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    const value = filter_path.value[1][1];
                    if (is_decimal(value)) {
                      return (
                        <TextInput
                          value={value.toString()}
                          keyboardType={"number-pad"}
                          onChangeText={(x) => {}}
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
                    const [value1, value2] = filter_path.value[1][1];
                    return (
                      <>
                        {apply(undefined, () => {
                          const value = value1;
                          if (is_decimal(value)) {
                            return (
                              <TextInput
                                value={value.toString()}
                                keyboardType={"number-pad"}
                                onChangeText={(x) => {}}
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
                                onChangeText={(x) => {}}
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
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
            }
            case "u64": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    const value = filter_path.value[1][1];
                    if (is_decimal(value)) {
                      return (
                        <TextInput
                          value={value.toString()}
                          keyboardType={"number-pad"}
                          onChangeText={(x) => {}}
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
                    const [value1, value2] = filter_path.value[1][1];
                    return (
                      <>
                        {apply(undefined, () => {
                          const value = value1;
                          if (is_decimal(value)) {
                            return (
                              <TextInput
                                value={value.toString()}
                                keyboardType={"number-pad"}
                                onChangeText={(x) => {}}
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
                                onChangeText={(x) => {}}
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
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
            }
            case "idouble":
            case "idecimal": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    const value = filter_path.value[1][1];
                    if (is_decimal(value)) {
                      return (
                        <TextInput
                          value={value.toString()}
                          keyboardType={"number-pad"}
                          onChangeText={(x) => {}}
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
                    const [value1, value2] = filter_path.value[1][1];
                    return (
                      <>
                        {apply(undefined, () => {
                          const value = value1;
                          if (is_decimal(value)) {
                            return (
                              <TextInput
                                value={value.toString()}
                                keyboardType={"number-pad"}
                                onChangeText={(x) => {}}
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
                                onChangeText={(x) => {}}
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
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
            }
            case "udouble":
            case "udecimal": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    const value = filter_path.value[1][1];
                    if (is_decimal(value)) {
                      return (
                        <TextInput
                          value={value.toString()}
                          keyboardType={"number-pad"}
                          onChangeText={(x) => {}}
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
                    const [value1, value2] = filter_path.value[1][1];
                    return (
                      <>
                        {apply(undefined, () => {
                          const value = value1;
                          if (is_decimal(value)) {
                            return (
                              <TextInput
                                value={value.toString()}
                                keyboardType={"number-pad"}
                                onChangeText={(x) => {}}
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
                                onChangeText={(x) => {}}
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
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
            }
            case "bool": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=": {
                    const value = filter_path.value[1][1];
                    if (typeof value === "boolean") {
                      return <Switch value={value} onValueChange={(x) => {}} />;
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
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
            }
            case "date": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    const value = filter_path.value[1][1];
                    if (value instanceof Date) {
                      const [showPicker, setPicker] = useState(false);
                      return (
                        <>
                          <Pressable onPress={() => setPicker(true)}>
                            <Text>{moment(value).format("Do MMM YYYY")}</Text>
                          </Pressable>
                          <View>
                            {showPicker && (
                              <DateTimePicker
                                mode={"date"}
                                value={value}
                                onChange={(
                                  _temp: any,
                                  date: Date | undefined
                                ) => {
                                  setPicker(Platform.OS === "ios");
                                  // dispatch updated value
                                }}
                              />
                            )}
                          </View>
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
                    const [value1, value2] = filter_path.value[1][1];
                    return (
                      <>
                        {apply(undefined, () => {
                          if (value1 instanceof Date) {
                            const [showPicker, setPicker] = useState(false);
                            return (
                              <>
                                <Pressable onPress={() => setPicker(true)}>
                                  <Text>
                                    {moment(value1).format("Do MMM YYYY")}
                                  </Text>
                                </Pressable>
                                <View>
                                  {showPicker && (
                                    <DateTimePicker
                                      mode={"date"}
                                      value={value1}
                                      onChange={(
                                        _temp: any,
                                        date: Date | undefined
                                      ) => {
                                        setPicker(Platform.OS === "ios");
                                        // dispatch updated value
                                      }}
                                    />
                                  )}
                                </View>
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
                            const [showPicker, setPicker] = useState(false);
                            return (
                              <>
                                <Pressable onPress={() => setPicker(true)}>
                                  <Text>
                                    {moment(value2).format("Do MMM YYYY")}
                                  </Text>
                                </Pressable>
                                <View>
                                  {showPicker && (
                                    <DateTimePicker
                                      mode={"date"}
                                      value={value2}
                                      onChange={(
                                        _temp: any,
                                        date: Date | undefined
                                      ) => {
                                        setPicker(Platform.OS === "ios");
                                        // dispatch updated value
                                      }}
                                    />
                                  )}
                                </View>
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
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
            }
            case "time": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    const value = filter_path.value[1][1];
                    if (value instanceof Date) {
                      const [showPicker, setPicker] = useState(false);
                      return (
                        <>
                          <Pressable onPress={() => setPicker(true)}>
                            <Text>{moment(value).format("h:mm A")}</Text>
                          </Pressable>
                          <View>
                            {showPicker && (
                              <DateTimePicker
                                mode={"time"}
                                value={value}
                                onChange={(
                                  _temp: any,
                                  date: Date | undefined
                                ) => {
                                  setPicker(Platform.OS === "ios");
                                  // dispatch updated value
                                }}
                              />
                            )}
                          </View>
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
                    const [value1, value2] = filter_path.value[1][1];
                    return (
                      <>
                        {apply(undefined, () => {
                          const value = value1;
                          if (value instanceof Date) {
                            const [showPicker, setPicker] = useState(false);
                            return (
                              <>
                                <Pressable onPress={() => setPicker(true)}>
                                  <Text>{moment(value).format("h:mm A")}</Text>
                                </Pressable>
                                <View>
                                  {showPicker && (
                                    <DateTimePicker
                                      mode={"time"}
                                      value={value}
                                      onChange={(
                                        _temp: any,
                                        date: Date | undefined
                                      ) => {
                                        setPicker(Platform.OS === "ios");
                                        // dispatch updated value
                                      }}
                                    />
                                  )}
                                </View>
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
                            const [showPicker, setPicker] = useState(false);
                            return (
                              <>
                                <Pressable onPress={() => setPicker(true)}>
                                  <Text>{moment(value).format("h:mm A")}</Text>
                                </Pressable>
                                <View>
                                  {showPicker && (
                                    <DateTimePicker
                                      mode={"time"}
                                      value={value}
                                      onChange={(
                                        _temp: any,
                                        date: Date | undefined
                                      ) => {
                                        setPicker(Platform.OS === "ios");
                                        // dispatch updated value
                                      }}
                                    />
                                  )}
                                </View>
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
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
            }
            case "timestamp": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=":
                  case ">=":
                  case "<=":
                  case ">":
                  case "<": {
                    const value = filter_path.value[1][1];
                    if (value instanceof Date) {
                      const [showPicker, setPicker] = useState(false);
                      const [mode, setMode] = useState("date");
                      let [date, setDate] = useState(new Date(value.getTime()));
                      return (
                        <>
                          <Pressable onPress={() => setPicker(true)}>
                            <Text>
                              {moment(value).format("Do MMM YYYY, h:mm A")}
                            </Text>
                          </Pressable>
                          <View>
                            {showPicker && (
                              <DateTimePicker
                                mode={mode as "date" | "time"}
                                value={value}
                                onChange={(
                                  _temp: any,
                                  selectedValue: Date | undefined
                                ) => {
                                  setPicker(Platform.OS === "ios");
                                  if (selectedValue !== undefined) {
                                    if (mode === "date") {
                                      setDate(
                                        apply(date, (it) => {
                                          it.setFullYear(
                                            selectedValue.getFullYear()
                                          );
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
                                      // dispatch updated value
                                      setMode("date");
                                    }
                                  } else {
                                    setDate(new Date(value.getTime()));
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
                        <Pressable onPress={() => {}}>
                          <Text>{value[0]}</Text>
                        </Pressable>
                      );
                    }
                  }
                  case "between":
                  case "not_between": {
                    const [value1, value2] = filter_path.value[1][1];
                    return (
                      <>
                        {apply(undefined, () => {
                          const value = value1;
                          if (value instanceof Date) {
                            const [showPicker, setPicker] = useState(false);
                            const [mode, setMode] = useState("date");
                            let [date, setDate] = useState(
                              new Date(value.getTime())
                            );
                            return (
                              <>
                                <Pressable onPress={() => setPicker(true)}>
                                  <Text>
                                    {moment(value).format(
                                      "Do MMM YYYY, h:mm A"
                                    )}
                                  </Text>
                                </Pressable>
                                <View>
                                  {showPicker && (
                                    <DateTimePicker
                                      mode={mode as "date" | "time"}
                                      value={value}
                                      onChange={(
                                        _temp: any,
                                        selectedValue: Date | undefined
                                      ) => {
                                        setPicker(Platform.OS === "ios");
                                        if (selectedValue !== undefined) {
                                          if (mode === "date") {
                                            setDate(
                                              apply(date, (it) => {
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
                                            setMode("time");
                                            setPicker(Platform.OS !== "ios");
                                          } else {
                                            setDate(
                                              apply(date, (it) => {
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
                                            // dispatch updated value
                                            setMode("date");
                                          }
                                        } else {
                                          setDate(new Date(value.getTime()));
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
                              <Pressable onPress={() => {}}>
                                <Text>{value[0]}</Text>
                              </Pressable>
                            );
                          }
                        })}
                        {apply(undefined, () => {
                          const value = value2;
                          if (value instanceof Date) {
                            const [showPicker, setPicker] = useState(false);
                            const [mode, setMode] = useState("date");
                            let [date, setDate] = useState(
                              new Date(value.getTime())
                            );
                            return (
                              <>
                                <Pressable onPress={() => setPicker(true)}>
                                  <Text>
                                    {moment(value).format(
                                      "Do MMM YYYY, h:mm A"
                                    )}
                                  </Text>
                                </Pressable>
                                <View>
                                  {showPicker && (
                                    <DateTimePicker
                                      mode={mode as "date" | "time"}
                                      value={value}
                                      onChange={(
                                        _temp: any,
                                        selectedValue: Date | undefined
                                      ) => {
                                        setPicker(Platform.OS === "ios");
                                        if (selectedValue !== undefined) {
                                          if (mode === "date") {
                                            setDate(
                                              apply(date, (it) => {
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
                                            setMode("time");
                                            setPicker(Platform.OS !== "ios");
                                          } else {
                                            setDate(
                                              apply(date, (it) => {
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
                                            // dispatch updated value
                                            setMode("date");
                                          }
                                        } else {
                                          setDate(new Date(value.getTime()));
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
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
              break;
            }
            case "other": {
              if (filter_path.value[1] !== undefined) {
                const op = filter_path.value[1][0];
                switch (op) {
                  case "==":
                  case "!=": {
                    const value = filter_path.value[1][1];
                    if (is_decimal(value)) {
                      return (
                        <TextInput
                          value={value.toString()}
                          keyboardType={"number-pad"}
                          onChangeText={(x) => {}}
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
              } else {
                // use a hook to help in selecting op and value
                return <Text>Select Op</Text>;
              }
            }
            default: {
              const _exhaustiveCheck: never = field_struct_name;
              return _exhaustiveCheck;
            }
          }
        }
        return null;
      })}
    </>
  );
}
