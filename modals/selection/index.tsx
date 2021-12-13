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
                    const [showPicker1, setPicker1] = useState(false);
                    const [mode1, setMode1] = useState("date");
                    let [date1, setDate1] = useState(
                      new Date(value[1][0].getTime())
                    );
                    const [showPicker2, setPicker2] = useState(false);
                    const [mode2, setMode2] = useState("date");
                    let [date2, setDate2] = useState(
                      new Date(value[1][0].getTime())
                    );
                    return (
                      <>
                        <Pressable onPress={() => setPicker1(true)}>
                          <Text>
                            {moment(value[1][0]).format("Do MMM YYYY, h:mm A")}
                          </Text>
                        </Pressable>
                        <View>
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
                                        it.setMonth(selectedValue.getMonth());
                                        it.setDate(selectedValue.getDate());
                                        return it;
                                      })
                                    );
                                    setMode1("time");
                                    setPicker1(Platform.OS !== "ios");
                                  } else {
                                    setDate1(
                                      apply(date1, (it) => {
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
                                    setMode1("date");
                                  }
                                } else {
                                  setDate1(new Date(value[1][0].getTime()));
                                  setMode1("date");
                                }
                              }}
                            />
                          )}
                        </View>
                        <Pressable onPress={() => setPicker2(true)}>
                          <Text>
                            {moment(value[1][1]).format("Do MMM YYYY, h:mm A")}
                          </Text>
                        </Pressable>
                        <View>
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
                                        it.setMonth(selectedValue.getMonth());
                                        it.setDate(selectedValue.getDate());
                                        return it;
                                      })
                                    );
                                    setMode2("time");
                                    setPicker2(Platform.OS !== "ios");
                                  } else {
                                    setDate2(
                                      apply(date2, (it) => {
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
                                    setMode2("date");
                                  }
                                } else {
                                  setDate2(new Date(value[1][1].getTime()));
                                  setMode2("date");
                                }
                              }}
                            />
                          )}
                        </View>
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
                    const [showPicker1, setPicker1] = useState(false);
                    const [mode1, setMode1] = useState("date");
                    let [date1, setDate1] = useState(
                      new Date(value[1][0].getTime())
                    );
                    const [showPicker2, setPicker2] = useState(false);
                    const [mode2, setMode2] = useState("date");
                    let [date2, setDate2] = useState(
                      new Date(value[1][0].getTime())
                    );
                    return (
                      <>
                        <Pressable onPress={() => setPicker1(true)}>
                          <Text>
                            {moment(value[1][0]).format("Do MMM YYYY, h:mm A")}
                          </Text>
                        </Pressable>
                        <View>
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
                                        it.setMonth(selectedValue.getMonth());
                                        it.setDate(selectedValue.getDate());
                                        return it;
                                      })
                                    );
                                    setMode1("time");
                                    setPicker1(Platform.OS !== "ios");
                                  } else {
                                    setDate1(
                                      apply(date1, (it) => {
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
                                    setMode1("date");
                                  }
                                } else {
                                  setDate1(new Date(value[1][0].getTime()));
                                  setMode1("date");
                                }
                              }}
                            />
                          )}
                        </View>
                        <Pressable onPress={() => setPicker2(true)}>
                          <Text>
                            {moment(value[1][1]).format("Do MMM YYYY, h:mm A")}
                          </Text>
                        </Pressable>
                        <View>
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
                                        it.setMonth(selectedValue.getMonth());
                                        it.setDate(selectedValue.getDate());
                                        return it;
                                      })
                                    );
                                    setMode2("time");
                                    setPicker2(Platform.OS !== "ios");
                                  } else {
                                    setDate2(
                                      apply(date2, (it) => {
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
                                    setMode2("date");
                                  }
                                } else {
                                  setDate2(new Date(value[1][1].getTime()));
                                  setMode2("date");
                                }
                              }}
                            />
                          )}
                        </View>
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
    </>
  );
}

function render_filter_path(filter_path: FilterPath) {
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
                    break;
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
            case "date":
            case "time":
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
                    break;
                  }
                  case "between":
                  case "not_between": {
                    break;
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
                    break;
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
