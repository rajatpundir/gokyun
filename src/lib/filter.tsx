import React, { useRef, useState } from "react";
import Decimal from "decimal.js";
import moment from "moment";
import DateTimePicker from "@react-native-community/datetimepicker";
import { OrFilter, FilterPath, AndFilter } from "./db";
import { Platform } from "react-native";
import { apply, arrow } from "./prelude";
import {
  AntDesign,
  Entypo,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { ListAction } from "./list";
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { compare_paths, get_flattened_path } from "./variable";
import { tw } from "./tailwind";
import { Column, Pressable, Row, Text, Input, Menu } from "native-base";
import Checkbox from "expo-checkbox";
import { get_decimal_keyboard_type, get_validated_decimal } from "./commons";
import { useBSTheme } from "./theme";

function op_to_string(op: string): string {
  switch (op) {
    case "==":
      return "equals";
    case "!=":
      return "not equals";
    case ">=":
      return "greater or equals";
    case "<=":
      return "less or equals";
    case ">":
      return "greater than";
    case "<":
      return "less than";
    case "between":
      return "between";
    case "not_between":
      return "not between";
    case "like":
      return "match";
    case "glob":
      return "match (case sensitive)";
  }
  return "";
}

export function SortComponent(props: {
  init_filter: OrFilter;
  dispatch: React.Dispatch<ListAction>;
}): JSX.Element {
  const bs_theme = useBSTheme();
  return (
    <BottomSheetScrollView contentContainerStyle={tw.style(["m-2"], {})}>
      {props.init_filter.filter_paths
        .toArray()
        .filter((x) => x.ordering !== undefined)
        .sort((a, b) => {
          if (a.ordering !== undefined && b.ordering !== undefined) {
            if (a.ordering[0] > b.ordering[0]) {
              return 1;
            } else if (a.ordering[0] < b.ordering[0]) {
              return -1;
            }
          }
          return 0;
        })
        .map((filter_path) => {
          const ordering = filter_path.ordering;
          if (ordering !== undefined) {
            return (
              <Row
                key={get_flattened_path(filter_path.path).join(".")}
                py={"0.5"}
              >
                <Column>
                  <Pressable
                    onPress={() => props.dispatch(["sort", "up", filter_path])}
                  >
                    <AntDesign name="up" size={24} color={bs_theme.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      props.dispatch(["sort", "down", filter_path])
                    }
                  >
                    <AntDesign name="down" size={24} color={bs_theme.primary} />
                  </Pressable>
                </Column>
                <Row
                  flex={1}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  px={"2"}
                >
                  <Pressable
                    onPress={() =>
                      props.dispatch(["sort", "toggle", filter_path])
                    }
                    flex={1}
                    flexDirection={"row"}
                    alignItems={"center"}
                  >
                    <Text py={"1"} color={bs_theme.text}>
                      {filter_path.label}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      props.dispatch(["sort", "toggle", filter_path])
                    }
                    borderColor={bs_theme.primary}
                    borderWidth={"1"}
                    borderRadius={"sm"}
                  >
                    {arrow(() => {
                      if (ordering[1]) {
                        return (
                          <AntDesign
                            name="arrowdown"
                            size={24}
                            color={bs_theme.primary}
                          />
                        );
                      } else {
                        return (
                          <AntDesign
                            name="arrowup"
                            size={24}
                            color={bs_theme.primary}
                          />
                        );
                      }
                    })}
                  </Pressable>
                </Row>
              </Row>
            );
          }
          return <></>;
        })}
    </BottomSheetScrollView>
  );
}

export function SortComponentFields(props: {
  init_filter: OrFilter;
  dispatch: React.Dispatch<ListAction>;
}): JSX.Element {
  const bs_theme = useBSTheme();
  return (
    <BottomSheetScrollView contentContainerStyle={tw.style(["m-2"], {})}>
      {props.init_filter.filter_paths
        .toArray()
        .sort((a, b) => (a.label > b.label ? 1 : a.label < b.label ? -1 : 0))
        .map((filter_path) => {
          const active = filter_path.ordering !== undefined;
          const toggle = (x: boolean) => {
            if (x) {
              const field_struct_name = filter_path.value[0];
              props.dispatch([
                "sort",
                "add",
                filter_path,
                apply(true, (it) => {
                  switch (field_struct_name) {
                    case "str":
                    case "lstr":
                    case "clob": {
                      return false;
                    }
                  }
                  return it;
                }),
              ]);
            } else {
              props.dispatch(["sort", "remove", filter_path]);
            }
          };
          return (
            <Pressable
              key={get_flattened_path(filter_path.path).join(".")}
              onPress={() => toggle(!active)}
              flex={1}
              flexDirection={"row"}
              py={"0.5"}
            >
              {active ? (
                <Ionicons
                  name="radio-button-on"
                  size={24}
                  color={bs_theme.primary}
                />
              ) : (
                <Ionicons
                  name="radio-button-off"
                  size={24}
                  color={bs_theme.primary}
                />
              )}
              <Text pl={1} color={bs_theme.text}>
                {filter_path.label}
              </Text>
            </Pressable>
          );
        })}
    </BottomSheetScrollView>
  );
}

export function AndFilterComponent(props: {
  init_filter: OrFilter;
  and_filter: AndFilter;
  dispatch: React.Dispatch<ListAction>;
}): JSX.Element {
  const bs_theme = useBSTheme();
  return (
    <Column px={"0.5"} borderTopWidth={"1"} borderTopColor={bs_theme.primary}>
      <Row
        justifyContent={"space-between"}
        alignItems={"center"}
        pl={"2"}
        pr={"3"}
        py={"2"}
      >
        <Row>
          <Text bold color={bs_theme.primary}>
            Set {props.and_filter.index + 1}
          </Text>
          <Pressable
            onPress={() =>
              props.dispatch(["and_filter", "remove", props.and_filter])
            }
          >
            <Entypo name="cross" size={24} color={bs_theme.text} />
          </Pressable>
        </Row>
        <Pressable
          onPress={() => props.dispatch(["or_filter", props.and_filter, "add"])}
          backgroundColor={bs_theme.primary}
          borderRadius={"xs"}
          px={"2"}
          py={"0.5"}
        >
          <Text bold color={"white"}>
            Filter++
          </Text>
        </Pressable>
      </Row>
      {props.and_filter.filters
        .toArray()
        .sort((a, b) => (a.index > b.index ? 1 : a.index < b.index ? -1 : 0))
        .map((or_filter) => (
          <OrFilterComponent
            key={or_filter.index.toString()}
            {...props}
            or_filter={or_filter}
          />
        ))}
    </Column>
  );
}

export function OrFilterComponent(props: {
  init_filter: OrFilter;
  and_filter: AndFilter;
  or_filter: OrFilter;
  dispatch: React.Dispatch<ListAction>;
}): JSX.Element {
  const bs_theme = useBSTheme();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  return (
    <Column
      px={"3"}
      py={"2"}
      borderTopWidth={"1"}
      borderColor={bs_theme.border}
    >
      <Row justifyContent={"space-between"} alignItems={"center"}>
        <Row>
          <Text color={bs_theme.text}>Filter {props.or_filter.index + 1}</Text>
          <Pressable
            onPress={() =>
              props.dispatch([
                "or_filter",
                props.and_filter,
                "remove",
                props.or_filter,
              ])
            }
          >
            <Entypo name="cross" size={24} color={bs_theme.text} />
          </Pressable>
        </Row>
        <Pressable
          onPress={() => bottomSheetModalRef.current?.present()}
          backgroundColor={bs_theme.primary}
          borderRadius={"xs"}
          px={"2"}
          py={"0.5"}
        >
          <Text bold color={"white"}>
            Field++
          </Text>
        </Pressable>
      </Row>
      <Column>
        {arrow(() => {
          const [selectedOp, setSelectedOp] = useState(
            props.or_filter.id[1] ? props.or_filter.id[1][0] : "=="
          );
          const [active, value] = props.or_filter.id;
          const toggle = (x: boolean) => {
            props.dispatch([
              "or_filter",
              props.and_filter,
              "replace",
              apply(props.or_filter, (it) => {
                it.id[0] = x;
                return it;
              }),
            ]);
          };
          const default_value_1 = new Decimal(0);
          const [has_errors_1, set_has_errors_1] = useState(false);
          const [local_val_1, set_local_val_1] = useState(
            apply(
              arrow(() => {
                if (value !== undefined) {
                  const op = value[0];
                  switch (op) {
                    case "==":
                    case "!=":
                    case ">=":
                    case "<=":
                    case ">":
                    case "<": {
                      return value[1].toString();
                    }
                    case "between":
                    case "not_between": {
                      return value[1][0].toString();
                    }
                  }
                }
                return default_value_1.toString();
              }),
              (it) => {
                if (it === "0") {
                  return "";
                }
                return it;
              }
            )
          );
          const default_value_2 = new Decimal(0);
          const [has_errors_2, set_has_errors_2] = useState(false);
          const [local_val_2, set_local_val_2] = useState(
            apply(
              arrow(() => {
                if (value !== undefined) {
                  const op = value[0];
                  switch (op) {
                    case "==":
                    case "!=":
                    case ">=":
                    case "<=":
                    case ">":
                    case "<": {
                      return default_value_1.toString();
                    }
                    case "between":
                    case "not_between": {
                      return value[1][1].toString();
                    }
                  }
                }
                return default_value_1.toString();
              }),
              (it) => {
                if (it === "0") {
                  return "";
                }
                return it;
              }
            )
          );
          if (value !== undefined) {
            return (
              <Column my={"1"}>
                <Row
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  my={"1"}
                >
                  <Row>
                    <Checkbox
                      value={active}
                      onValueChange={() => toggle(!active)}
                      color={active ? bs_theme.primary : undefined}
                      style={tw.style(["mr-1"], {})}
                    />
                    <Pressable onPress={() => toggle(!active)}>
                      <Text color={bs_theme.text}>Unique ID</Text>
                    </Pressable>
                  </Row>
                  {arrow(() => {
                    const value = props.or_filter.id[1];
                    if (value !== undefined) {
                      const v1 = apply(value[0], () => {
                        switch (value[0]) {
                          case "==":
                          case "!=":
                          case ">=":
                          case "<=":
                          case ">":
                          case "<": {
                            return value[1];
                          }
                          case "between":
                          case "not_between": {
                            return value[1][0];
                          }
                          default: {
                            const _exhaustiveCheck: never = value[0];
                            return _exhaustiveCheck;
                          }
                        }
                      });
                      const v2 = apply(value[0], () => {
                        switch (value[0]) {
                          case "==":
                          case "!=":
                          case ">=":
                          case "<=":
                          case ">":
                          case "<": {
                            return value[1];
                          }
                          case "between":
                          case "not_between": {
                            return value[1][1];
                          }
                          default: {
                            const _exhaustiveCheck: never = value[0];
                            return _exhaustiveCheck;
                          }
                        }
                      });
                      const dispatch_op = (
                        op: Exclude<typeof props.or_filter.id[1], undefined>[0]
                      ) => {
                        switch (op) {
                          case "==":
                          case "!=":
                          case ">=":
                          case "<=":
                          case ">":
                          case "<": {
                            props.dispatch([
                              "or_filter",
                              props.and_filter,
                              "replace",
                              apply(props.or_filter, (it) => {
                                it.id[1] = [op, v1];
                                return it;
                              }),
                            ]);
                            set_local_val_1(
                              apply(v1.toString(), (it) => {
                                if (it === "0") {
                                  return "";
                                }
                                return it;
                              })
                            );
                            set_has_errors_1(false);
                            set_local_val_2(
                              apply(v1.toString(), (it) => {
                                if (it === "0") {
                                  return "";
                                }
                                return it;
                              })
                            );
                            set_has_errors_2(false);
                            break;
                          }
                          case "between":
                          case "not_between": {
                            props.dispatch([
                              "or_filter",
                              props.and_filter,
                              "replace",
                              apply(props.or_filter, (it) => {
                                it.id[1] = [op, [v1, v2]];
                                return it;
                              }),
                            ]);
                            set_local_val_1(
                              apply(v1.toString(), (it) => {
                                if (it === "0") {
                                  return "";
                                }
                                return it;
                              })
                            );
                            set_has_errors_1(false);
                            set_local_val_2(
                              apply(v2.toString(), (it) => {
                                if (it === "0") {
                                  return "";
                                }
                                return it;
                              })
                            );
                            set_has_errors_2(false);
                            break;
                          }
                        }
                        setSelectedOp(op);
                      };
                      return (
                        <Menu
                          mx={"3.5"}
                          shouldOverlapWithTrigger={true}
                          backgroundColor={bs_theme.background}
                          borderColor={bs_theme.border}
                          trigger={(menu_props) => (
                            <Pressable
                              {...menu_props}
                              flexDirection={"row"}
                              alignItems={"center"}
                              borderColor={bs_theme.border}
                              borderWidth={"1"}
                              borderRadius={"sm"}
                              pl={"1.5"}
                              pr={"0"}
                              py={"0.5"}
                            >
                              <Text color={bs_theme.text}>
                                {op_to_string(selectedOp)}
                              </Text>
                              <MaterialCommunityIcons
                                name="menu-down"
                                size={20}
                                color={bs_theme.text}
                              />
                            </Pressable>
                          )}
                        >
                          <Menu.Item onPress={() => dispatch_op("==")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("==")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op("!=")}>
                            <Text color={bs_theme.text}>
                              <Text color={bs_theme.text}>
                                {op_to_string("!=")}
                              </Text>
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op(">=")}>
                            <Text color={bs_theme.text}>
                              {op_to_string(">=")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op("<=")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("<=")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op(">")}>
                            <Text color={bs_theme.text}>
                              {op_to_string(">")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op("<")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("<")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op("between")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("between")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op("not_between")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("not_between")}
                            </Text>
                          </Menu.Item>
                        </Menu>
                      );
                    }
                    return <></>;
                  })}
                </Row>
                <Row flex={1} justifyContent={"space-between"} my={"1"}>
                  {arrow(() => {
                    const op = value[0];
                    switch (op) {
                      case "==":
                      case "!=":
                      case ">=":
                      case "<=":
                      case ">":
                      case "<": {
                        return (
                          <Input
                            flex={1}
                            ml={"2"}
                            size={"md"}
                            placeholder={"Unique ID"}
                            value={local_val_1}
                            isInvalid={has_errors_1}
                            keyboardType={get_decimal_keyboard_type("u64")}
                            onChangeText={(x) => {
                              try {
                                set_local_val_1(x);
                                const val = new Decimal(x || "0")
                                  .truncated()
                                  .abs();
                                set_has_errors_1(false);
                                props.dispatch([
                                  "or_filter",
                                  props.and_filter,
                                  "replace",
                                  apply(props.or_filter, (it) => {
                                    it.id[1] = [op, val];
                                    return it;
                                  }),
                                ]);
                              } catch (e) {
                                set_has_errors_1(true);
                              }
                            }}
                            InputRightElement={
                              local_val_1 !== default_value_1.toString() &&
                              local_val_1 !== "" ? (
                                <Pressable
                                  px={1}
                                  onPress={() => {
                                    set_local_val_1(
                                      apply(
                                        default_value_1.toString(),
                                        (it) => {
                                          if (it === "0") {
                                            return "";
                                          }
                                          return it;
                                        }
                                      )
                                    );
                                    set_has_errors_1(false);
                                    props.dispatch([
                                      "or_filter",
                                      props.and_filter,
                                      "replace",
                                      apply(props.or_filter, (it) => {
                                        it.id[1] = [op, default_value_1];
                                        return it;
                                      }),
                                    ]);
                                  }}
                                >
                                  <MaterialIcons
                                    name="clear"
                                    size={24}
                                    color={bs_theme.placeholder}
                                  />
                                </Pressable>
                              ) : (
                                <></>
                              )
                            }
                            color={bs_theme.text}
                            borderColor={bs_theme.border}
                            placeholderTextColor={bs_theme.placeholder}
                          />
                        );
                      }
                      case "between":
                      case "not_between": {
                        return (
                          <>
                            <Input
                              flex={1}
                              ml={"2"}
                              size={"md"}
                              placeholder={"Unique ID"}
                              value={local_val_1}
                              isInvalid={has_errors_1}
                              keyboardType={get_decimal_keyboard_type("u64")}
                              onChangeText={(x) => {
                                try {
                                  set_local_val_1(x);
                                  const val = new Decimal(x || "0")
                                    .truncated()
                                    .abs();
                                  set_has_errors_1(false);
                                  props.dispatch([
                                    "or_filter",
                                    props.and_filter,
                                    "replace",
                                    apply(props.or_filter, (it) => {
                                      it.id[1] = [op, [val, value[1][1]]];
                                      return it;
                                    }),
                                  ]);
                                } catch (e) {
                                  set_has_errors_1(true);
                                }
                              }}
                              InputRightElement={
                                local_val_1 !== default_value_1.toString() &&
                                local_val_1 !== "" ? (
                                  <Pressable
                                    px={1}
                                    onPress={() => {
                                      set_local_val_1(
                                        apply(
                                          default_value_1.toString(),
                                          (it) => {
                                            if (it === "0") {
                                              return "";
                                            }
                                            return it;
                                          }
                                        )
                                      );
                                      set_has_errors_1(false);
                                      props.dispatch([
                                        "or_filter",
                                        props.and_filter,
                                        "replace",
                                        apply(props.or_filter, (it) => {
                                          it.id[1] = [
                                            op,
                                            [default_value_1, value[1][1]],
                                          ];
                                          return it;
                                        }),
                                      ]);
                                    }}
                                  >
                                    <MaterialIcons
                                      name="clear"
                                      size={24}
                                      color={bs_theme.placeholder}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )
                              }
                              color={bs_theme.text}
                              borderColor={bs_theme.border}
                              placeholderTextColor={bs_theme.placeholder}
                            />
                            <Input
                              flex={1}
                              ml={"2"}
                              size={"md"}
                              placeholder={"Unique ID"}
                              value={local_val_2}
                              isInvalid={has_errors_2}
                              keyboardType={get_decimal_keyboard_type("u64")}
                              onChangeText={(x) => {
                                try {
                                  set_local_val_2(x);
                                  const val = new Decimal(x || "0")
                                    .truncated()
                                    .abs();
                                  set_has_errors_2(false);
                                  props.dispatch([
                                    "or_filter",
                                    props.and_filter,
                                    "replace",
                                    apply(props.or_filter, (it) => {
                                      it.id[1] = [op, [value[1][0], val]];
                                      return it;
                                    }),
                                  ]);
                                } catch (e) {
                                  set_has_errors_2(true);
                                }
                              }}
                              InputRightElement={
                                local_val_2 !== default_value_2.toString() &&
                                local_val_2 !== "" ? (
                                  <Pressable
                                    px={1}
                                    onPress={() => {
                                      set_local_val_2(
                                        apply(
                                          default_value_2.toString(),
                                          (it) => {
                                            if (it === "0") {
                                              return "";
                                            }
                                            return it;
                                          }
                                        )
                                      );
                                      set_has_errors_2(false);
                                      props.dispatch([
                                        "or_filter",
                                        props.and_filter,
                                        "replace",
                                        apply(props.or_filter, (it) => {
                                          it.id[1] = [
                                            op,
                                            [value[1][0], default_value_2],
                                          ];
                                          return it;
                                        }),
                                      ]);
                                    }}
                                  >
                                    <MaterialIcons
                                      name="clear"
                                      size={24}
                                      color={bs_theme.placeholder}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )
                              }
                              color={bs_theme.text}
                              borderColor={bs_theme.border}
                              placeholderTextColor={bs_theme.placeholder}
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
                </Row>
              </Column>
            );
          }
          return <></>;
        })}

        {arrow(() => {
          const [selectedOp, setSelectedOp] = useState(
            props.or_filter.created_at[1]
              ? props.or_filter.created_at[1][0]
              : "between"
          );
          const [active, value] = props.or_filter.created_at;
          const toggle = (x: boolean) => {
            props.dispatch([
              "or_filter",
              props.and_filter,
              "replace",
              apply(props.or_filter, (it) => {
                it.created_at[0] = x;
                return it;
              }),
            ]);
          };
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
              <Column my={"1"}>
                <Row
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  my={"1"}
                >
                  <Row>
                    <Checkbox
                      value={active}
                      onValueChange={() => toggle(!active)}
                      color={active ? bs_theme.primary : undefined}
                      style={tw.style(["mr-1"], {})}
                    />
                    <Pressable onPress={() => toggle(!active)}>
                      <Text color={bs_theme.text}>Created</Text>
                    </Pressable>
                  </Row>
                  {arrow(() => {
                    if (value !== undefined) {
                      const v1 = apply(value[0], () => {
                        switch (value[0]) {
                          case "==":
                          case "!=":
                          case ">=":
                          case "<=":
                          case ">":
                          case "<": {
                            return value[1];
                          }
                          case "between":
                          case "not_between": {
                            return value[1][0];
                          }
                          default: {
                            const _exhaustiveCheck: never = value[0];
                            return _exhaustiveCheck;
                          }
                        }
                      });
                      const v2 = apply(value[0], () => {
                        switch (value[0]) {
                          case "==":
                          case "!=":
                          case ">=":
                          case "<=":
                          case ">":
                          case "<": {
                            return value[1];
                          }
                          case "between":
                          case "not_between": {
                            return value[1][1];
                          }
                          default: {
                            const _exhaustiveCheck: never = value[0];
                            return _exhaustiveCheck;
                          }
                        }
                      });
                      const dispatch_op = (
                        op: Exclude<
                          typeof props.or_filter.created_at[1],
                          undefined
                        >[0]
                      ) => {
                        switch (op) {
                          case "==":
                          case "!=":
                          case ">=":
                          case "<=":
                          case ">":
                          case "<": {
                            props.dispatch([
                              "or_filter",
                              props.and_filter,
                              "replace",
                              apply(props.or_filter, (it) => {
                                it.created_at[1] = [op, v1];
                                return it;
                              }),
                            ]);
                            break;
                          }
                          case "between":
                          case "not_between": {
                            props.dispatch([
                              "or_filter",
                              props.and_filter,
                              "replace",
                              apply(props.or_filter, (it) => {
                                it.created_at[1] = [op, [v1, v2]];
                                return it;
                              }),
                            ]);
                            break;
                          }
                        }
                        setSelectedOp(op);
                      };
                      return (
                        <Menu
                          mx={"3.5"}
                          shouldOverlapWithTrigger={true}
                          backgroundColor={bs_theme.background}
                          borderColor={bs_theme.border}
                          trigger={(menu_props) => (
                            <Pressable
                              {...menu_props}
                              flexDirection={"row"}
                              alignItems={"center"}
                              borderColor={bs_theme.border}
                              borderWidth={"1"}
                              borderRadius={"sm"}
                              pl={"1.5"}
                              pr={"0"}
                              py={"0.5"}
                            >
                              <Text color={bs_theme.text}>
                                {op_to_string(selectedOp)}
                              </Text>
                              <MaterialCommunityIcons
                                name="menu-down"
                                size={20}
                                color={bs_theme.text}
                              />
                            </Pressable>
                          )}
                        >
                          <Menu.Item onPress={() => dispatch_op("==")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("==")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op("!=")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("!=")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op(">=")}>
                            <Text color={bs_theme.text}>
                              {op_to_string(">=")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op("<=")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("<=")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op(">")}>
                            <Text color={bs_theme.text}>
                              {op_to_string(">")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op("<")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("<")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op("between")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("between")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op("not_between")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("not_between")}
                            </Text>
                          </Menu.Item>
                        </Menu>
                      );
                    }
                    return <></>;
                  })}
                </Row>
                <Row flex={1} justifyContent={"space-between"} my={"1"}>
                  {arrow(() => {
                    const op = value[0];
                    switch (op) {
                      case "==":
                      case "!=":
                      case ">=":
                      case "<=":
                      case ">":
                      case "<": {
                        return (
                          <Pressable onPress={() => setPicker1(true)}>
                            <Text color={bs_theme.text}>
                              {moment(value[1]).format("Do MMM YYYY, h:mm A")}
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
                                          "or_filter",
                                          props.and_filter,
                                          "replace",
                                          apply(props.or_filter, (it) => {
                                            it.created_at[1] = [
                                              op,
                                              date1 || new Date(),
                                            ];
                                            return it;
                                          }),
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
                            </Text>
                          </Pressable>
                        );
                      }
                      case "between":
                      case "not_between": {
                        return (
                          <>
                            <Pressable
                              onPress={() => setPicker1(true)}
                              style={{ flexShrink: 1 }}
                            >
                              <Text color={bs_theme.text}>
                                {moment(value[1][0]).format(
                                  "Do MMM YYYY, h:mm A"
                                )}
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
                                            "or_filter",
                                            props.and_filter,
                                            "replace",
                                            apply(props.or_filter, (it) => {
                                              it.created_at[1] = [
                                                op,
                                                [
                                                  date1 || new Date(),
                                                  value[1][1],
                                                ],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          setMode1("date");
                                        }
                                      } else {
                                        setDate1(
                                          new Date(value[1][0].getTime())
                                        );
                                        setMode1("date");
                                      }
                                    }}
                                  />
                                )}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => setPicker2(true)}
                              style={{ flexShrink: 1 }}
                            >
                              <Text color={bs_theme.text}>
                                {moment(value[1][1]).format(
                                  "Do MMM YYYY, h:mm A"
                                )}
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
                                            "or_filter",
                                            props.and_filter,
                                            "replace",
                                            apply(props.or_filter, (it) => {
                                              it.created_at[1] = [
                                                op,
                                                [
                                                  value[1][0],
                                                  date2 || new Date(),
                                                ],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          setMode2("date");
                                        }
                                      } else {
                                        setDate2(
                                          new Date(value[1][1].getTime())
                                        );
                                        setMode2("date");
                                      }
                                    }}
                                  />
                                )}
                              </Text>
                            </Pressable>
                          </>
                        );
                      }
                      default: {
                        const _exhaustiveCheck: never = op;
                        return _exhaustiveCheck;
                      }
                    }
                  })}
                </Row>
              </Column>
            );
          }
          return <></>;
        })}

        {arrow(() => {
          const [selectedOp, setSelectedOp] = useState(
            props.or_filter.updated_at[1]
              ? props.or_filter.updated_at[1][0]
              : "between"
          );
          const [active, value] = props.or_filter.updated_at;
          const toggle = (x: boolean) => {
            props.dispatch([
              "or_filter",
              props.and_filter,
              "replace",
              apply(props.or_filter, (it) => {
                it.updated_at[0] = x;
                return it;
              }),
            ]);
          };
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
              <Column my={"1"}>
                <Row
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  my={"1"}
                >
                  <Row>
                    <Checkbox
                      value={active}
                      onValueChange={() => toggle(!active)}
                      color={active ? bs_theme.primary : undefined}
                      style={tw.style(["mr-1"], {})}
                    />
                    <Pressable onPress={() => toggle(!active)}>
                      <Text color={bs_theme.text}>Updated</Text>
                    </Pressable>
                  </Row>
                  {arrow(() => {
                    if (value !== undefined) {
                      const v1 = apply(value[0], () => {
                        switch (value[0]) {
                          case "==":
                          case "!=":
                          case ">=":
                          case "<=":
                          case ">":
                          case "<": {
                            return value[1];
                          }
                          case "between":
                          case "not_between": {
                            return value[1][0];
                          }
                          default: {
                            const _exhaustiveCheck: never = value[0];
                            return _exhaustiveCheck;
                          }
                        }
                      });
                      const v2 = apply(value[0], () => {
                        switch (value[0]) {
                          case "==":
                          case "!=":
                          case ">=":
                          case "<=":
                          case ">":
                          case "<": {
                            return value[1];
                          }
                          case "between":
                          case "not_between": {
                            return value[1][1];
                          }
                          default: {
                            const _exhaustiveCheck: never = value[0];
                            return _exhaustiveCheck;
                          }
                        }
                      });
                      const dispatch_op = (
                        op: Exclude<
                          typeof props.or_filter.updated_at[1],
                          undefined
                        >[0]
                      ) => {
                        switch (op) {
                          case "==":
                          case "!=":
                          case ">=":
                          case "<=":
                          case ">":
                          case "<": {
                            props.dispatch([
                              "or_filter",
                              props.and_filter,
                              "replace",
                              apply(props.or_filter, (it) => {
                                it.updated_at[1] = [op, v1];
                                return it;
                              }),
                            ]);
                            break;
                          }
                          case "between":
                          case "not_between": {
                            props.dispatch([
                              "or_filter",
                              props.and_filter,
                              "replace",
                              apply(props.or_filter, (it) => {
                                it.updated_at[1] = [op, [v1, v2]];
                                return it;
                              }),
                            ]);
                            break;
                          }
                        }
                        setSelectedOp(op);
                      };
                      return (
                        <Menu
                          mx={"3.5"}
                          shouldOverlapWithTrigger={true}
                          backgroundColor={bs_theme.background}
                          borderColor={bs_theme.border}
                          trigger={(menu_props) => (
                            <Pressable
                              {...menu_props}
                              flexDirection={"row"}
                              alignItems={"center"}
                              borderColor={bs_theme.border}
                              borderWidth={"1"}
                              borderRadius={"sm"}
                              pl={"1.5"}
                              pr={"0"}
                              py={"0.5"}
                            >
                              <Text color={bs_theme.text}>
                                {op_to_string(selectedOp)}
                              </Text>
                              <MaterialCommunityIcons
                                name="menu-down"
                                size={20}
                                color={bs_theme.text}
                              />
                            </Pressable>
                          )}
                        >
                          <Menu.Item onPress={() => dispatch_op("==")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("==")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op("!=")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("!=")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op(">=")}>
                            <Text color={bs_theme.text}>
                              {op_to_string(">=")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op("<=")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("<=")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op(">")}>
                            <Text color={bs_theme.text}>
                              {op_to_string(">")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op("<")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("<")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op("between")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("between")}
                            </Text>
                          </Menu.Item>
                          <Menu.Item onPress={() => dispatch_op("not_between")}>
                            <Text color={bs_theme.text}>
                              {op_to_string("not_between")}
                            </Text>
                          </Menu.Item>
                        </Menu>
                      );
                    }
                    return <></>;
                  })}
                </Row>
                <Row flex={1} justifyContent={"space-between"} my={"1"}>
                  {arrow(() => {
                    const op = value[0];
                    switch (op) {
                      case "==":
                      case "!=":
                      case ">=":
                      case "<=":
                      case ">":
                      case "<": {
                        return (
                          <Pressable onPress={() => setPicker1(true)}>
                            <Text color={bs_theme.text}>
                              {moment(value[1]).format("Do MMM YYYY, h:mm A")}
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
                                          "or_filter",
                                          props.and_filter,
                                          "replace",
                                          apply(props.or_filter, (it) => {
                                            it.updated_at[1] = [
                                              op,
                                              date1 || new Date(),
                                            ];
                                            return it;
                                          }),
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
                            </Text>
                          </Pressable>
                        );
                      }
                      case "between":
                      case "not_between": {
                        return (
                          <>
                            <Pressable
                              onPress={() => setPicker1(true)}
                              style={{ flexShrink: 1 }}
                            >
                              <Text color={bs_theme.text}>
                                {moment(value[1][0]).format(
                                  "Do MMM YYYY, h:mm A"
                                )}
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
                                            "or_filter",
                                            props.and_filter,
                                            "replace",
                                            apply(props.or_filter, (it) => {
                                              it.updated_at[1] = [
                                                op,
                                                [
                                                  date1 || new Date(),
                                                  value[1][1],
                                                ],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          setMode1("date");
                                        }
                                      } else {
                                        setDate1(
                                          new Date(value[1][0].getTime())
                                        );
                                        setMode1("date");
                                      }
                                    }}
                                  />
                                )}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => setPicker2(true)}
                              style={{ flexShrink: 1 }}
                            >
                              <Text color={bs_theme.text}>
                                {moment(value[1][1]).format(
                                  "Do MMM YYYY, h:mm A"
                                )}
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
                                            "or_filter",
                                            props.and_filter,
                                            "replace",
                                            apply(props.or_filter, (it) => {
                                              it.updated_at[1] = [
                                                op,
                                                [
                                                  value[1][0],
                                                  date2 || new Date(),
                                                ],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          setMode2("date");
                                        }
                                      } else {
                                        setDate2(
                                          new Date(value[1][1].getTime())
                                        );
                                        setMode2("date");
                                      }
                                    }}
                                  />
                                )}
                              </Text>
                            </Pressable>
                          </>
                        );
                      }
                      default: {
                        const _exhaustiveCheck: never = op;
                        return _exhaustiveCheck;
                      }
                    }
                  })}
                </Row>
              </Column>
            );
          }
          return <></>;
        })}

        {props.or_filter.filter_paths
          .toArray()
          .sort((a, b) => (a.label > b.label ? 1 : a.label < b.label ? -1 : 0))
          .map((x) => {
            return (
              <FilterPathComponent
                key={get_flattened_path(x.path).join(".")}
                {...props}
                filter_path={x}
              />
            );
          })}
      </Column>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={["50%", "82%"]}
        index={0}
        backgroundStyle={tw.style(["border"], {
          backgroundColor: bs_theme.background,
          borderColor: bs_theme.primary,
        })}
      >
        <Row
          justifyContent={"space-between"}
          alignItems={"center"}
          borderBottomColor={bs_theme.primary}
          borderBottomWidth={"1"}
          px={"3"}
          pb={"2"}
        >
          <Text bold color={bs_theme.text}>
            Fields
          </Text>
          <Pressable
            onPress={() => bottomSheetModalRef.current?.forceClose()}
            borderColor={bs_theme.primary}
            borderWidth={"1"}
            borderRadius={"xs"}
            px={"2"}
            py={"0.5"}
          >
            <Text color={bs_theme.text}>Close</Text>
          </Pressable>
        </Row>
        <BottomSheetScrollView contentContainerStyle={tw.style(["m-2"], {})}>
          {arrow(() => {
            const active = props.or_filter.id[1] !== undefined;
            const toggle = (x: boolean) => {
              props.dispatch([
                "or_filter",
                props.and_filter,
                "replace",
                apply(props.or_filter, (it) => {
                  it.id = [false, x ? ["==", new Decimal(0)] : undefined];
                  return it;
                }),
              ]);
            };
            return (
              <Pressable
                onPress={() => toggle(!active)}
                flex={1}
                flexDirection={"row"}
                py={"0.5"}
              >
                {active ? (
                  <Ionicons
                    name="radio-button-on"
                    size={24}
                    color={bs_theme.primary}
                  />
                ) : (
                  <Ionicons
                    name="radio-button-off"
                    size={24}
                    color={bs_theme.primary}
                  />
                )}
                <Text pl={1} color={bs_theme.text}>
                  Unique ID
                </Text>
              </Pressable>
            );
          })}
          {arrow(() => {
            const active = props.or_filter.created_at[1] !== undefined;
            const toggle = (x: boolean) => {
              props.dispatch([
                "or_filter",
                props.and_filter,
                "replace",
                apply(props.or_filter, (it) => {
                  it.created_at = [
                    false,
                    x ? ["between", [new Date(), new Date()]] : undefined,
                  ];
                  return it;
                }),
              ]);
            };
            return (
              <Pressable
                onPress={() => toggle(!active)}
                flex={1}
                flexDirection={"row"}
                py={"0.5"}
              >
                {active ? (
                  <Ionicons
                    name="radio-button-on"
                    size={24}
                    color={bs_theme.primary}
                  />
                ) : (
                  <Ionicons
                    name="radio-button-off"
                    size={24}
                    color={bs_theme.primary}
                  />
                )}
                <Text pl={1} color={bs_theme.text}>
                  Created
                </Text>
              </Pressable>
            );
          })}
          {arrow(() => {
            const active = props.or_filter.updated_at[1] !== undefined;
            const toggle = (x: boolean) => {
              props.dispatch([
                "or_filter",
                props.and_filter,
                "replace",
                apply(props.or_filter, (it) => {
                  it.updated_at = [
                    false,
                    x ? ["between", [new Date(), new Date()]] : undefined,
                  ];
                  return it;
                }),
              ]);
            };
            return (
              <Pressable
                onPress={() => toggle(!active)}
                flex={1}
                flexDirection={"row"}
                py={"0.5"}
              >
                {active ? (
                  <Ionicons
                    name="radio-button-on"
                    size={24}
                    color={bs_theme.primary}
                  />
                ) : (
                  <Ionicons
                    name="radio-button-off"
                    size={24}
                    color={bs_theme.primary}
                  />
                )}
                <Text pl={1} color={bs_theme.text}>
                  Updated
                </Text>
              </Pressable>
            );
          })}
          {props.init_filter.filter_paths
            .toArray()
            .sort((a, b) =>
              a.label > b.label ? 1 : a.label < b.label ? -1 : 0
            )
            .map((filter_path) => {
              const field_struct_type = filter_path.value[0];
              const active = props.or_filter.filter_paths.anyMatch(
                (x) => x.equals(filter_path) && x.value[1] !== undefined
              );
              const toggle = (x: boolean) => {
                switch (field_struct_type) {
                  case "str":
                  case "lstr":
                  case "clob": {
                    props.dispatch([
                      "filter_path",
                      props.and_filter,
                      props.or_filter,
                      "replace",
                      new FilterPath(
                        filter_path.label,
                        filter_path.path,
                        [field_struct_type, x ? ["like", ""] : undefined],
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
                      "filter_path",
                      props.and_filter,
                      props.or_filter,
                      "replace",
                      new FilterPath(
                        filter_path.label,
                        filter_path.path,
                        [
                          field_struct_type,
                          x ? ["==", new Decimal(0)] : undefined,
                        ],
                        undefined
                      ),
                    ]);
                    break;
                  }
                  case "bool": {
                    props.dispatch([
                      "filter_path",
                      props.and_filter,
                      props.or_filter,
                      "replace",
                      new FilterPath(
                        filter_path.label,
                        filter_path.path,
                        [field_struct_type, x ? ["==", true] : undefined],
                        undefined
                      ),
                    ]);
                    break;
                  }
                  case "date":
                  case "time":
                  case "timestamp": {
                    props.dispatch([
                      "filter_path",
                      props.and_filter,
                      props.or_filter,
                      "replace",
                      new FilterPath(
                        filter_path.label,
                        filter_path.path,
                        [
                          field_struct_type,
                          x ? ["between", [new Date(), new Date()]] : undefined,
                        ],
                        undefined
                      ),
                    ]);
                    break;
                  }
                  case "other": {
                    const other_struct = filter_path.value[2];
                    props.dispatch([
                      "filter_path",
                      props.and_filter,
                      props.or_filter,
                      "replace",
                      new FilterPath(
                        filter_path.label,
                        filter_path.path,
                        [
                          field_struct_type,
                          x ? ["==", new Decimal(-1)] : undefined,
                          other_struct,
                        ],
                        undefined
                      ),
                    ]);
                    break;
                  }
                }
              };
              return (
                <Pressable
                  key={get_flattened_path(filter_path.path).join(".")}
                  onPress={() => toggle(!active)}
                  flex={1}
                  flexDirection={"row"}
                  py={"0.5"}
                >
                  {active ? (
                    <Ionicons
                      name="radio-button-on"
                      size={24}
                      color={bs_theme.primary}
                    />
                  ) : (
                    <Ionicons
                      name="radio-button-off"
                      size={24}
                      color={bs_theme.primary}
                    />
                  )}
                  <Text pl={1} color={bs_theme.text}>
                    {filter_path.label}
                  </Text>
                </Pressable>
              );
            })}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </Column>
  );
}

function FilterPathComponent(props: {
  init_filter: OrFilter;
  and_filter: AndFilter;
  or_filter: OrFilter;
  filter_path: FilterPath;
  dispatch: React.Dispatch<ListAction>;
}): JSX.Element {
  const bs_theme = useBSTheme();
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
  const bottomSheetModalRef1 = useRef<BottomSheetModal>(null);
  const bottomSheetModalRef2 = useRef<BottomSheetModal>(null);
  const [selectedOp, setSelectedOp] = useState(
    apply("==", (it) => {
      if (props.filter_path.value[1]) {
        return props.filter_path.value[1][0];
      }
      switch (props.filter_path.value[0]) {
        case "str":
        case "lstr":
        case "clob": {
          return "like";
        }
        case "date":
        case "time":
        case "timestamp": {
          return "between";
        }
      }
      return it;
    })
  );

  const default_value_1 = arrow(() => {
    const field_struct_name = props.filter_path.value[0];
    switch (field_struct_name) {
      case "str":
      case "lstr":
      case "clob": {
        return "";
      }
      case "i32":
      case "u32":
      case "i64":
      case "u64":
      case "idouble":
      case "udouble":
      case "idecimal":
      case "udecimal": {
        return new Decimal(0).toString();
      }
      case "other": {
        return new Decimal(-1).toString();
      }
    }
    return "";
  });
  const [has_errors_1, set_has_errors_1] = useState(false);
  const [local_val_1, set_local_val_1] = useState(
    arrow(() => {
      if (props.filter_path.value[1] !== undefined) {
        switch (props.filter_path.value[0]) {
          case "str":
          case "lstr":
          case "clob": {
            const val = props.filter_path.value[1];
            const op = val[0];
            switch (op) {
              case "==":
              case "!=":
              case ">=":
              case "<=":
              case ">":
              case "<":
              case "like":
              case "glob": {
                const value = val[1];
                if (Array.isArray(value)) {
                  return value[0];
                } else {
                  return value;
                }
              }
              case "between":
              case "not_between": {
                const value = val[1][0];
                if (Array.isArray(value)) {
                  return value[0];
                } else {
                  return value;
                }
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
          case "i32":
          case "u32":
          case "i64":
          case "u64":
          case "idouble":
          case "udouble":
          case "idecimal":
          case "udecimal": {
            const val = props.filter_path.value[1];
            const op = val[0];
            switch (op) {
              case "==":
              case "!=":
              case ">=":
              case "<=":
              case ">":
              case "<": {
                const value = val[1];
                if (Array.isArray(value)) {
                  return value[0];
                } else {
                  return apply(value.toString(), (it) => {
                    if (it === "0") {
                      return "";
                    }
                    return it;
                  });
                }
              }
              case "between":
              case "not_between": {
                const value = val[1][0];
                if (Array.isArray(value)) {
                  return value[0];
                } else {
                  return apply(value.toString(), (it) => {
                    if (it === "0") {
                      return "";
                    }
                    return it;
                  });
                }
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
          case "other": {
            const val = props.filter_path.value[1];
            const op = val[0];
            switch (op) {
              case "==":
              case "!=": {
                const value = val[1];
                if (Array.isArray(value)) {
                  return value[0];
                } else {
                  return apply(value.toString(), (it) => {
                    if (it === "-1") {
                      return "";
                    }
                    return it;
                  });
                }
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
        }
      }
      return default_value_1;
    })
  );

  const default_value_2 = arrow(() => {
    const field_struct_name = props.filter_path.value[0];
    switch (field_struct_name) {
      case "str":
      case "lstr":
      case "clob": {
        return "";
      }
      case "i32":
      case "u32":
      case "i64":
      case "u64":
      case "idouble":
      case "udouble":
      case "idecimal":
      case "udecimal": {
        return new Decimal(0).toString();
      }
      case "other": {
        return new Decimal(-1).toString();
      }
    }
    return "";
  });
  const [has_errors_2, set_has_errors_2] = useState(false);
  const [local_val_2, set_local_val_2] = useState(
    arrow(() => {
      if (props.filter_path.value[1] !== undefined) {
        switch (props.filter_path.value[0]) {
          case "str":
          case "lstr":
          case "clob": {
            const val = props.filter_path.value[1];
            const op = val[0];
            switch (op) {
              case "==":
              case "!=":
              case ">=":
              case "<=":
              case ">":
              case "<":
              case "like":
              case "glob": {
                return "";
              }
              case "between":
              case "not_between": {
                const value = val[1][1];
                if (Array.isArray(value)) {
                  return value[0];
                } else {
                  return value;
                }
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
          case "i32":
          case "u32":
          case "i64":
          case "u64":
          case "idouble":
          case "udouble":
          case "idecimal":
          case "udecimal": {
            const val = props.filter_path.value[1];
            const op = val[0];
            switch (op) {
              case "==":
              case "!=":
              case ">=":
              case "<=":
              case ">":
              case "<": {
                return "";
              }
              case "between":
              case "not_between": {
                const value = val[1][1];
                if (Array.isArray(value)) {
                  return value[0];
                } else {
                  return apply(value.toString(), (it) => {
                    if (it === "0") {
                      return "";
                    }
                    return it;
                  });
                }
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
          case "other": {
            return "";
          }
        }
      }
      return default_value_2;
    })
  );

  if (props.filter_path.value[1] !== undefined) {
    const toggle = (x: boolean) => {
      props.dispatch([
        "filter_path",
        props.and_filter,
        props.or_filter,
        "replace",
        apply(props.filter_path, (it) => {
          it.active = x;
          return it;
        }),
      ]);
    };

    const field_struct_name = props.filter_path.value[0];
    return (
      <Column my={"1"}>
        <Row justifyContent={"space-between"} alignItems={"center"} my={"1"}>
          <Row>
            <Checkbox
              value={props.filter_path.active}
              onValueChange={() => toggle(!props.filter_path.active)}
              color={props.filter_path.active ? bs_theme.primary : undefined}
              style={tw.style(["mr-1"], {})}
            />
            <Pressable onPress={() => toggle(!props.filter_path.active)}>
              <Text color={bs_theme.text}>{props.filter_path.label}</Text>
            </Pressable>
          </Row>
          {arrow(() => {
            switch (field_struct_name) {
              case "str":
              case "lstr":
              case "clob": {
                if (props.filter_path.value[1] !== undefined) {
                  const value = props.filter_path.value[1];
                  const [v1, v2] = arrow(() => {
                    const op = value[0];
                    switch (op) {
                      case "==":
                      case "!=":
                      case ">=":
                      case "<=":
                      case ">":
                      case "<":
                      case "like":
                      case "glob": {
                        return [value[1], value[1]];
                      }
                      case "between":
                      case "not_between": {
                        return value[1];
                      }
                      default: {
                        const _exhaustiveCheck: never = op;
                        return _exhaustiveCheck;
                      }
                    }
                  });
                  const dispatch_op = (
                    op: Exclude<
                      (FilterPath["value"] & ["str", unknown])[1],
                      undefined
                    >[0]
                  ) => {
                    switch (op) {
                      case "==":
                      case "!=":
                      case ">=":
                      case "<=":
                      case ">":
                      case "<":
                      case "like":
                      case "glob": {
                        props.dispatch([
                          "filter_path",
                          props.and_filter,
                          props.or_filter,
                          "replace",
                          apply(props.filter_path, (it) => {
                            it.value = [field_struct_name, [op, v1]];
                            return it;
                          }),
                        ]);
                        set_local_val_1(
                          apply(v1, (it) => {
                            if (Array.isArray(it)) {
                              return it[0];
                            } else {
                              return it;
                            }
                          })
                        );
                        set_has_errors_1(false);
                        set_local_val_2(
                          apply(v1, (it) => {
                            if (Array.isArray(it)) {
                              return it[0];
                            } else {
                              return it;
                            }
                          })
                        );
                        set_has_errors_2(false);
                        break;
                      }
                      case "between":
                      case "not_between": {
                        props.dispatch([
                          "filter_path",
                          props.and_filter,
                          props.or_filter,
                          "replace",
                          apply(props.filter_path, (it) => {
                            it.value = [field_struct_name, [op, [v1, v2]]];
                            return it;
                          }),
                        ]);
                        set_local_val_1(
                          apply(v1, (it) => {
                            if (Array.isArray(it)) {
                              return it[0];
                            } else {
                              return it;
                            }
                          })
                        );
                        set_has_errors_1(false);
                        set_local_val_2(
                          apply(v2, (it) => {
                            if (Array.isArray(it)) {
                              return it[0];
                            } else {
                              return it;
                            }
                          })
                        );
                        set_has_errors_2(false);
                        break;
                      }
                    }
                    setSelectedOp(op);
                  };
                  return (
                    <Menu
                      mx={"3.5"}
                      shouldOverlapWithTrigger={true}
                      backgroundColor={bs_theme.background}
                      borderColor={bs_theme.border}
                      trigger={(menu_props) => (
                        <Pressable
                          {...menu_props}
                          flexDirection={"row"}
                          alignItems={"center"}
                          borderColor={bs_theme.border}
                          borderWidth={"1"}
                          borderRadius={"sm"}
                          pl={"1.5"}
                          pr={"0"}
                          py={"0.5"}
                        >
                          <Text color={bs_theme.text}>
                            {op_to_string(selectedOp)}
                          </Text>
                          <MaterialCommunityIcons
                            name="menu-down"
                            size={20}
                            color={bs_theme.text}
                          />
                        </Pressable>
                      )}
                    >
                      <Menu.Item onPress={() => dispatch_op("like")}>
                        <Text color={bs_theme.text}>
                          {op_to_string("like")}
                        </Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("glob")}>
                        <Text color={bs_theme.text}>
                          {op_to_string("glob")}
                        </Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("==")}>
                        <Text color={bs_theme.text}>{op_to_string("==")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("!=")}>
                        <Text color={bs_theme.text}>{op_to_string("!=")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op(">=")}>
                        <Text color={bs_theme.text}>{op_to_string(">=")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("<=")}>
                        <Text color={bs_theme.text}>{op_to_string("<=")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op(">")}>
                        <Text color={bs_theme.text}>{op_to_string(">")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("<")}>
                        <Text color={bs_theme.text}>{op_to_string("<")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("between")}>
                        <Text color={bs_theme.text}>
                          {op_to_string("between")}
                        </Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("not_between")}>
                        <Text color={bs_theme.text}>
                          {op_to_string("not_between")}
                        </Text>
                      </Menu.Item>
                    </Menu>
                  );
                }
                return <></>;
              }
              case "i32":
              case "u32":
              case "i64":
              case "u64":
              case "idouble":
              case "udouble":
              case "idecimal":
              case "udecimal": {
                if (props.filter_path.value[1] !== undefined) {
                  const value = props.filter_path.value[1];
                  const [v1, v2] = arrow(() => {
                    const op = value[0];
                    switch (op) {
                      case "==":
                      case "!=":
                      case ">=":
                      case "<=":
                      case ">":
                      case "<": {
                        return [value[1], value[1]];
                      }
                      case "between":
                      case "not_between": {
                        return value[1];
                      }
                      default: {
                        const _exhaustiveCheck: never = op;
                        return _exhaustiveCheck;
                      }
                    }
                  });
                  const dispatch_op = (
                    op: Exclude<
                      (FilterPath["value"] & ["i32", unknown])[1],
                      undefined
                    >[0]
                  ) => {
                    switch (op) {
                      case "==":
                      case "!=":
                      case ">=":
                      case "<=":
                      case ">":
                      case "<": {
                        props.dispatch([
                          "filter_path",
                          props.and_filter,
                          props.or_filter,
                          "replace",
                          apply(props.filter_path, (it) => {
                            it.value = [field_struct_name, [op, v1]];
                            return it;
                          }),
                        ]);
                        set_local_val_1(
                          apply(v1, (it) => {
                            if (Array.isArray(it)) {
                              return it[0];
                            } else {
                              return apply(it.toString(), (x) => {
                                if (x === "0") {
                                  return "";
                                }
                                return x;
                              });
                            }
                          })
                        );
                        set_has_errors_1(false);
                        set_local_val_2(
                          apply(v1, (it) => {
                            if (Array.isArray(it)) {
                              return it[0];
                            } else {
                              return apply(it.toString(), (x) => {
                                if (x === "0") {
                                  return "";
                                }
                                return x;
                              });
                            }
                          })
                        );
                        set_has_errors_2(false);
                        break;
                      }
                      case "between":
                      case "not_between": {
                        props.dispatch([
                          "filter_path",
                          props.and_filter,
                          props.or_filter,
                          "replace",
                          apply(props.filter_path, (it) => {
                            it.value = [field_struct_name, [op, [v1, v2]]];
                            return it;
                          }),
                        ]);
                        set_local_val_1(
                          apply(v1, (it) => {
                            if (Array.isArray(it)) {
                              return it[0];
                            } else {
                              return apply(it.toString(), (x) => {
                                if (x === "0") {
                                  return "";
                                }
                                return x;
                              });
                            }
                          })
                        );
                        set_has_errors_1(false);
                        set_local_val_2(
                          apply(v2, (it) => {
                            if (Array.isArray(it)) {
                              return it[0];
                            } else {
                              return apply(it.toString(), (x) => {
                                if (x === "0") {
                                  return "";
                                }
                                return x;
                              });
                            }
                          })
                        );
                        set_has_errors_2(false);
                        break;
                      }
                    }
                    setSelectedOp(op);
                  };
                  return (
                    <Menu
                      mx={"3.5"}
                      shouldOverlapWithTrigger={true}
                      backgroundColor={bs_theme.background}
                      borderColor={bs_theme.border}
                      trigger={(menu_props) => (
                        <Pressable
                          {...menu_props}
                          flexDirection={"row"}
                          alignItems={"center"}
                          borderColor={bs_theme.border}
                          borderWidth={"1"}
                          borderRadius={"sm"}
                          pl={"1.5"}
                          pr={"0"}
                          py={"0.5"}
                        >
                          <Text color={bs_theme.text}>
                            {op_to_string(selectedOp)}
                          </Text>
                          <MaterialCommunityIcons
                            name="menu-down"
                            size={20}
                            color={bs_theme.text}
                          />
                        </Pressable>
                      )}
                    >
                      <Menu.Item onPress={() => dispatch_op("==")}>
                        <Text color={bs_theme.text}>{op_to_string("==")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("!=")}>
                        <Text color={bs_theme.text}>{op_to_string("!=")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op(">=")}>
                        <Text color={bs_theme.text}>{op_to_string(">=")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("<=")}>
                        <Text color={bs_theme.text}>{op_to_string("<=")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op(">")}>
                        <Text color={bs_theme.text}>{op_to_string(">")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("<")}>
                        <Text color={bs_theme.text}>{op_to_string("<")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("between")}>
                        <Text color={bs_theme.text}>
                          {op_to_string("between")}
                        </Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("not_between")}>
                        <Text color={bs_theme.text}>
                          {op_to_string("not_between")}
                        </Text>
                      </Menu.Item>
                    </Menu>
                  );
                }
                return <></>;
              }
              case "bool": {
                if (props.filter_path.value[1] !== undefined) {
                  const value = props.filter_path.value[1];
                  const dispatch_op = (
                    op: Exclude<
                      (FilterPath["value"] & ["bool", unknown])[1],
                      undefined
                    >[0]
                  ) => {
                    switch (op) {
                      case "==":
                      case "!=": {
                        props.dispatch([
                          "filter_path",
                          props.and_filter,
                          props.or_filter,
                          "replace",
                          apply(props.filter_path, (it) => {
                            it.value = [field_struct_name, [op, value[1]]];
                            return it;
                          }),
                        ]);
                        break;
                      }
                    }
                    setSelectedOp(op);
                  };
                  return (
                    <Menu
                      mx={"3.5"}
                      shouldOverlapWithTrigger={true}
                      backgroundColor={bs_theme.background}
                      borderColor={bs_theme.border}
                      trigger={(menu_props) => (
                        <Pressable
                          {...menu_props}
                          flexDirection={"row"}
                          alignItems={"center"}
                          borderColor={bs_theme.border}
                          borderWidth={"1"}
                          borderRadius={"sm"}
                          pl={"1.5"}
                          pr={"0"}
                          py={"0.5"}
                        >
                          <Text color={bs_theme.text}>
                            {op_to_string(selectedOp)}
                          </Text>
                          <MaterialCommunityIcons
                            name="menu-down"
                            size={20}
                            color={bs_theme.text}
                          />
                        </Pressable>
                      )}
                    >
                      <Menu.Item onPress={() => dispatch_op("==")}>
                        <Text color={bs_theme.text}>{op_to_string("==")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("!=")}>
                        <Text color={bs_theme.text}>{op_to_string("!=")}</Text>
                      </Menu.Item>
                    </Menu>
                  );
                }
                return <></>;
              }
              case "date":
              case "time":
              case "timestamp": {
                if (props.filter_path.value[1] !== undefined) {
                  const value = props.filter_path.value[1];
                  const [v1, v2] = arrow(() => {
                    const op = value[0];
                    switch (op) {
                      case "==":
                      case "!=":
                      case ">=":
                      case "<=":
                      case ">":
                      case "<": {
                        return [value[1], value[1]];
                      }
                      case "between":
                      case "not_between": {
                        return value[1];
                      }
                      default: {
                        const _exhaustiveCheck: never = op;
                        return _exhaustiveCheck;
                      }
                    }
                  });
                  const dispatch_op = (
                    op: Exclude<
                      (FilterPath["value"] & ["date", unknown])[1],
                      undefined
                    >[0]
                  ) => {
                    switch (op) {
                      case "==":
                      case "!=":
                      case ">=":
                      case "<=":
                      case ">":
                      case "<": {
                        props.dispatch([
                          "filter_path",
                          props.and_filter,
                          props.or_filter,
                          "replace",
                          apply(props.filter_path, (it) => {
                            it.value = [field_struct_name, [op, v1]];
                            return it;
                          }),
                        ]);
                        break;
                      }
                      case "between":
                      case "not_between": {
                        props.dispatch([
                          "filter_path",
                          props.and_filter,
                          props.or_filter,
                          "replace",
                          apply(props.filter_path, (it) => {
                            it.value = [field_struct_name, [op, [v1, v2]]];
                            return it;
                          }),
                        ]);
                        break;
                      }
                    }
                    setSelectedOp(op);
                  };
                  return (
                    <Menu
                      mx={"3.5"}
                      shouldOverlapWithTrigger={true}
                      backgroundColor={bs_theme.background}
                      borderColor={bs_theme.border}
                      trigger={(menu_props) => (
                        <Pressable
                          {...menu_props}
                          flexDirection={"row"}
                          alignItems={"center"}
                          borderColor={bs_theme.border}
                          borderWidth={"1"}
                          borderRadius={"sm"}
                          pl={"1.5"}
                          pr={"0"}
                          py={"0.5"}
                        >
                          <Text color={bs_theme.text}>
                            {op_to_string(selectedOp)}
                          </Text>
                          <MaterialCommunityIcons
                            name="menu-down"
                            size={20}
                            color={bs_theme.text}
                          />
                        </Pressable>
                      )}
                    >
                      <Menu.Item onPress={() => dispatch_op("==")}>
                        <Text color={bs_theme.text}>{op_to_string("==")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("!=")}>
                        <Text color={bs_theme.text}>{op_to_string("!=")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op(">=")}>
                        <Text color={bs_theme.text}>{op_to_string(">=")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("<=")}>
                        <Text color={bs_theme.text}>{op_to_string("<=")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op(">")}>
                        <Text color={bs_theme.text}>{op_to_string(">")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("<")}>
                        <Text color={bs_theme.text}>{op_to_string("<")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("between")}>
                        <Text color={bs_theme.text}>
                          {op_to_string("between")}
                        </Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("not_between")}>
                        <Text color={bs_theme.text}>
                          {op_to_string("not_between")}
                        </Text>
                      </Menu.Item>
                    </Menu>
                  );
                }
                return <></>;
              }
              case "other": {
                if (props.filter_path.value[1] !== undefined) {
                  const value = props.filter_path.value[1];
                  const other_struct = props.filter_path.value[2];
                  const dispatch_op = (
                    op: Exclude<
                      (FilterPath["value"] & ["other", unknown, unknown])[1],
                      undefined
                    >[0]
                  ) => {
                    switch (op) {
                      case "==":
                      case "!=": {
                        props.dispatch([
                          "filter_path",
                          props.and_filter,
                          props.or_filter,
                          "replace",
                          apply(props.filter_path, (it) => {
                            it.value = [
                              field_struct_name,
                              [op, value[1]],
                              other_struct,
                            ];
                            return it;
                          }),
                        ]);
                        break;
                      }
                    }
                    setSelectedOp(op);
                  };
                  return (
                    <Menu
                      mx={"3.5"}
                      shouldOverlapWithTrigger={true}
                      backgroundColor={bs_theme.background}
                      borderColor={bs_theme.border}
                      trigger={(menu_props) => (
                        <Pressable
                          {...menu_props}
                          flexDirection={"row"}
                          alignItems={"center"}
                          borderColor={bs_theme.border}
                          borderWidth={"1"}
                          borderRadius={"sm"}
                          pl={"1.5"}
                          pr={"0"}
                          py={"0.5"}
                        >
                          <Text color={bs_theme.text}>
                            {op_to_string(selectedOp)}
                          </Text>
                          <MaterialCommunityIcons
                            name="menu-down"
                            size={20}
                            color={bs_theme.text}
                          />
                        </Pressable>
                      )}
                    >
                      <Menu.Item onPress={() => dispatch_op("==")}>
                        <Text color={bs_theme.text}>{op_to_string("==")}</Text>
                      </Menu.Item>
                      <Menu.Item onPress={() => dispatch_op("!=")}>
                        <Text color={bs_theme.text}>{op_to_string("!=")}</Text>
                      </Menu.Item>
                    </Menu>
                  );
                }
                return <></>;
              }
              default: {
                const _exhaustiveCheck: never = field_struct_name;
                return _exhaustiveCheck;
              }
            }
          })}
        </Row>

        <Row flex={1} justifyContent={"space-between"} my={"1"}>
          {arrow(() => {
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
                      return (
                        <Row flex={1} justifyContent={"flex-start"}>
                          {arrow(() => {
                            if (Array.isArray(value)) {
                              return (
                                <Pressable
                                  ml={"2"}
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text color={bs_theme.text}>{value[0]}</Text>
                                </Pressable>
                              );
                            } else {
                              return (
                                <Input
                                  flex={1}
                                  ml={"2"}
                                  size={"md"}
                                  placeholder={props.filter_path.label}
                                  value={local_val_1}
                                  isInvalid={has_errors_1}
                                  onChangeText={(x) => {
                                    try {
                                      set_local_val_1(x);
                                      set_has_errors_1(false);
                                      props.dispatch([
                                        "filter_path",
                                        props.and_filter,
                                        props.or_filter,
                                        "replace",
                                        apply(props.filter_path, (it) => {
                                          it.value = [
                                            field_struct_name,
                                            [op, x],
                                          ];
                                          return it;
                                        }),
                                      ]);
                                    } catch (e) {
                                      set_has_errors_1(true);
                                    }
                                  }}
                                  InputRightElement={
                                    local_val_1 !==
                                      default_value_1.toString() &&
                                    local_val_1 !== "" ? (
                                      <Pressable
                                        px={1}
                                        onPress={() => {
                                          set_local_val_1(default_value_1);
                                          set_has_errors_1(false);
                                          props.dispatch([
                                            "filter_path",
                                            props.and_filter,
                                            props.or_filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, default_value_1],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                        }}
                                      >
                                        <MaterialIcons
                                          name="clear"
                                          size={24}
                                          color={bs_theme.placeholder}
                                        />
                                      </Pressable>
                                    ) : (
                                      <></>
                                    )
                                  }
                                  color={bs_theme.text}
                                  borderColor={bs_theme.border}
                                  placeholderTextColor={bs_theme.placeholder}
                                />
                              );
                            }
                          })}
                          {props.init_filter.filter_paths.anyMatch(
                            (filter_path) => {
                              switch (filter_path.value[0]) {
                                case "str":
                                case "lstr":
                                case "clob": {
                                  if (!filter_path.equals(props.filter_path)) {
                                    return true;
                                  }
                                }
                              }
                              return false;
                            }
                          ) ? (
                            <Pressable
                              flexDirection={"row"}
                              alignItems={"center"}
                              pl={"1"}
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={bs_theme.text}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={0}
                            backgroundStyle={tw.style(["border"], {
                              backgroundColor: bs_theme.background,
                              borderColor: bs_theme.primary,
                            })}
                          >
                            <Row
                              justifyContent={"space-between"}
                              alignItems={"center"}
                              borderBottomColor={bs_theme.primary}
                              borderBottomWidth={"1"}
                              px={"3"}
                              pb={"2"}
                            >
                              <Text bold color={bs_theme.text}>
                                Fields
                              </Text>
                              <Row space={"1"}>
                                <Pressable
                                  onPress={() => {
                                    set_local_val_1(default_value_1);
                                    set_has_errors_1(false);
                                    props.dispatch([
                                      "filter_path",
                                      props.and_filter,
                                      props.or_filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, ""],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.forceClose();
                                  }}
                                  backgroundColor={bs_theme.primary}
                                  borderRadius={"xs"}
                                  px={"2"}
                                  py={"0.5"}
                                >
                                  <Text color={"white"}>Clear</Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.forceClose()
                                  }
                                  borderColor={bs_theme.primary}
                                  borderWidth={"1"}
                                  borderRadius={"xs"}
                                  px={"2"}
                                  py={"0.5"}
                                >
                                  <Text color={bs_theme.text}>Close</Text>
                                </Pressable>
                              </Row>
                            </Row>
                            <BottomSheetFlatList
                              contentContainerStyle={tw.style(["m-2"], {})}
                              data={props.init_filter.filter_paths
                                .toArray()
                                .filter((filter_path) => {
                                  switch (filter_path.value[0]) {
                                    case "str":
                                    case "lstr":
                                    case "clob": {
                                      if (
                                        !filter_path.equals(props.filter_path)
                                      ) {
                                        return true;
                                      }
                                    }
                                  }
                                  return false;
                                })}
                              keyExtractor={(x) =>
                                get_flattened_path(x.path).join(".")
                              }
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    flex={1}
                                    flexDirection={"row"}
                                    py={"0.5"}
                                    onPress={() => {
                                      props.dispatch([
                                        "filter_path",
                                        props.and_filter,
                                        props.or_filter,
                                        "replace",
                                        apply(props.filter_path, (it) => {
                                          it.value = [
                                            field_struct_name,
                                            [
                                              op,
                                              [
                                                list_item.item.label,
                                                list_item.item.path,
                                              ],
                                            ],
                                          ];
                                          return it;
                                        }),
                                      ]);
                                      bottomSheetModalRef1.current?.forceClose();
                                    }}
                                  >
                                    {arrow(() => {
                                      if (Array.isArray(value)) {
                                        return apply(
                                          compare_paths(
                                            value[1],
                                            list_item.item.path
                                          ),
                                          (active) => {
                                            return active ? (
                                              <Ionicons
                                                name="radio-button-on"
                                                size={24}
                                                color={bs_theme.primary}
                                              />
                                            ) : (
                                              <Ionicons
                                                name="radio-button-off"
                                                size={24}
                                                color={bs_theme.primary}
                                              />
                                            );
                                          }
                                        );
                                      } else {
                                        return (
                                          <Ionicons
                                            name="radio-button-off"
                                            size={24}
                                            color={bs_theme.primary}
                                          />
                                        );
                                      }
                                    })}
                                    <Text pl={1} color={bs_theme.text}>
                                      {list_item.item.label}
                                    </Text>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </Row>
                      );
                    }
                    case "between":
                    case "not_between": {
                      const [value1, value2] = props.filter_path.value[1][1];
                      return (
                        <>
                          {arrow(() => {
                            const value = value1;
                            return (
                              <Row flex={1} justifyContent={"flex-start"}>
                                {arrow(() => {
                                  if (Array.isArray(value)) {
                                    return (
                                      <Pressable
                                        ml={"2"}
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.present()
                                        }
                                      >
                                        <Text color={bs_theme.text}>
                                          {value[0]}
                                        </Text>
                                      </Pressable>
                                    );
                                  } else {
                                    return (
                                      <Input
                                        flex={1}
                                        ml={"2"}
                                        size={"md"}
                                        placeholder={props.filter_path.label}
                                        value={local_val_1}
                                        isInvalid={has_errors_1}
                                        onChangeText={(x) => {
                                          try {
                                            set_local_val_1(x);
                                            set_has_errors_1(false);
                                            props.dispatch([
                                              "filter_path",
                                              props.and_filter,
                                              props.or_filter,
                                              "replace",
                                              apply(props.filter_path, (it) => {
                                                it.value = [
                                                  field_struct_name,
                                                  [op, [x, value2]],
                                                ];
                                                return it;
                                              }),
                                            ]);
                                          } catch (e) {
                                            set_has_errors_1(true);
                                          }
                                        }}
                                        InputRightElement={
                                          local_val_1 !==
                                            default_value_1.toString() &&
                                          local_val_1 !== "" ? (
                                            <Pressable
                                              px={1}
                                              onPress={() => {
                                                set_local_val_1(
                                                  default_value_1
                                                );
                                                set_has_errors_1(false);
                                                props.dispatch([
                                                  "filter_path",
                                                  props.and_filter,
                                                  props.or_filter,
                                                  "replace",
                                                  apply(
                                                    props.filter_path,
                                                    (it) => {
                                                      it.value = [
                                                        field_struct_name,
                                                        [
                                                          op,
                                                          [
                                                            default_value_1,
                                                            value2,
                                                          ],
                                                        ],
                                                      ];
                                                      return it;
                                                    }
                                                  ),
                                                ]);
                                              }}
                                            >
                                              <MaterialIcons
                                                name="clear"
                                                size={24}
                                                color={bs_theme.placeholder}
                                              />
                                            </Pressable>
                                          ) : (
                                            <></>
                                          )
                                        }
                                        color={bs_theme.text}
                                        borderColor={bs_theme.border}
                                        placeholderTextColor={
                                          bs_theme.placeholder
                                        }
                                      />
                                    );
                                  }
                                })}
                                {props.init_filter.filter_paths.anyMatch(
                                  (filter_path) => {
                                    switch (filter_path.value[0]) {
                                      case "str":
                                      case "lstr":
                                      case "clob": {
                                        if (
                                          !filter_path.equals(props.filter_path)
                                        ) {
                                          return true;
                                        }
                                      }
                                    }
                                    return false;
                                  }
                                ) ? (
                                  <Pressable
                                    flexDirection={"row"}
                                    alignItems={"center"}
                                    pl={"1"}
                                    onPress={() =>
                                      bottomSheetModalRef1.current?.present()
                                    }
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={bs_theme.text}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef1}
                                  snapPoints={["50%", "82%"]}
                                  index={0}
                                  backgroundStyle={tw.style(["border"], {
                                    backgroundColor: bs_theme.background,
                                    borderColor: bs_theme.primary,
                                  })}
                                >
                                  <Row
                                    justifyContent={"space-between"}
                                    alignItems={"center"}
                                    borderBottomColor={bs_theme.primary}
                                    borderBottomWidth={"1"}
                                    px={"3"}
                                    pb={"2"}
                                  >
                                    <Text bold color={bs_theme.text}>
                                      Fields
                                    </Text>
                                    <Row space={"1"}>
                                      <Pressable
                                        onPress={() => {
                                          set_local_val_1(default_value_1);
                                          set_has_errors_1(false);
                                          props.dispatch([
                                            "filter_path",
                                            props.and_filter,
                                            props.or_filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, ["", value2]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef1.current?.forceClose();
                                        }}
                                        backgroundColor={bs_theme.primary}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={"white"}>Clear</Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.forceClose()
                                        }
                                        borderColor={bs_theme.primary}
                                        borderWidth={"1"}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={bs_theme.text}>Close</Text>
                                      </Pressable>
                                    </Row>
                                  </Row>
                                  <BottomSheetFlatList
                                    contentContainerStyle={tw.style(
                                      ["m-2"],
                                      {}
                                    )}
                                    data={props.init_filter.filter_paths
                                      .toArray()
                                      .filter((filter_path) => {
                                        switch (filter_path.value[0]) {
                                          case "str":
                                          case "lstr":
                                          case "clob": {
                                            if (
                                              !filter_path.equals(
                                                props.filter_path
                                              )
                                            ) {
                                              return true;
                                            }
                                          }
                                        }
                                        return false;
                                      })}
                                    keyExtractor={(x) =>
                                      get_flattened_path(x.path).join(".")
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          flex={1}
                                          flexDirection={"row"}
                                          py={"0.5"}
                                          onPress={() => {
                                            props.dispatch([
                                              "filter_path",
                                              props.and_filter,
                                              props.or_filter,
                                              "replace",
                                              apply(props.filter_path, (it) => {
                                                it.value = [
                                                  field_struct_name,
                                                  [
                                                    op,
                                                    [
                                                      [
                                                        list_item.item.label,
                                                        list_item.item.path,
                                                      ],
                                                      value2,
                                                    ],
                                                  ],
                                                ];
                                                return it;
                                              }),
                                            ]);
                                            bottomSheetModalRef1.current?.forceClose();
                                          }}
                                        >
                                          {arrow(() => {
                                            if (Array.isArray(value)) {
                                              return apply(
                                                compare_paths(
                                                  value[1],
                                                  list_item.item.path
                                                ),
                                                (active) => {
                                                  return active ? (
                                                    <Ionicons
                                                      name="radio-button-on"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  ) : (
                                                    <Ionicons
                                                      name="radio-button-off"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  );
                                                }
                                              );
                                            } else {
                                              return (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color={bs_theme.primary}
                                                />
                                              );
                                            }
                                          })}
                                          <Text pl={1} color={bs_theme.text}>
                                            {list_item.item.label}
                                          </Text>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </Row>
                            );
                          })}
                          {arrow(() => {
                            const value = value2;
                            return (
                              <Row flex={1} justifyContent={"flex-start"}>
                                {arrow(() => {
                                  if (typeof value === "string") {
                                    return (
                                      <Input
                                        flex={1}
                                        ml={"2"}
                                        size={"md"}
                                        placeholder={props.filter_path.label}
                                        value={local_val_2}
                                        isInvalid={has_errors_2}
                                        onChangeText={(x) => {
                                          try {
                                            set_local_val_2(x);
                                            set_has_errors_2(false);
                                            props.dispatch([
                                              "filter_path",
                                              props.and_filter,
                                              props.or_filter,
                                              "replace",
                                              apply(props.filter_path, (it) => {
                                                it.value = [
                                                  field_struct_name,
                                                  [op, [value1, x]],
                                                ];
                                                return it;
                                              }),
                                            ]);
                                          } catch (e) {
                                            set_has_errors_2(true);
                                          }
                                        }}
                                        InputRightElement={
                                          local_val_2 !==
                                            default_value_2.toString() &&
                                          local_val_2 !== "" ? (
                                            <Pressable
                                              px={1}
                                              onPress={() => {
                                                set_local_val_2(
                                                  default_value_2
                                                );
                                                set_has_errors_2(false);
                                                props.dispatch([
                                                  "filter_path",
                                                  props.and_filter,
                                                  props.or_filter,
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
                                                            default_value_2,
                                                          ],
                                                        ],
                                                      ];
                                                      return it;
                                                    }
                                                  ),
                                                ]);
                                              }}
                                            >
                                              <MaterialIcons
                                                name="clear"
                                                size={24}
                                                color={bs_theme.placeholder}
                                              />
                                            </Pressable>
                                          ) : (
                                            <></>
                                          )
                                        }
                                        color={bs_theme.text}
                                        borderColor={bs_theme.border}
                                        placeholderTextColor={
                                          bs_theme.placeholder
                                        }
                                      />
                                    );
                                  } else {
                                    return (
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.present()
                                        }
                                      >
                                        <Text color={bs_theme.text}>
                                          {value[0]}
                                        </Text>
                                      </Pressable>
                                    );
                                  }
                                })}
                                {props.init_filter.filter_paths.anyMatch(
                                  (filter_path) => {
                                    switch (filter_path.value[0]) {
                                      case "str":
                                      case "lstr":
                                      case "clob": {
                                        if (
                                          !filter_path.equals(props.filter_path)
                                        ) {
                                          return true;
                                        }
                                      }
                                    }
                                    return false;
                                  }
                                ) ? (
                                  <Pressable
                                    flexDirection={"row"}
                                    alignItems={"center"}
                                    pl={"1"}
                                    onPress={() =>
                                      bottomSheetModalRef2.current?.present()
                                    }
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={bs_theme.text}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef2}
                                  snapPoints={["50%", "82%"]}
                                  index={0}
                                  backgroundStyle={tw.style(["border"], {
                                    backgroundColor: bs_theme.background,
                                    borderColor: bs_theme.primary,
                                  })}
                                >
                                  <Row
                                    justifyContent={"space-between"}
                                    alignItems={"center"}
                                    borderBottomColor={bs_theme.primary}
                                    borderBottomWidth={"1"}
                                    px={"3"}
                                    pb={"2"}
                                  >
                                    <Text bold color={bs_theme.text}>
                                      Fields
                                    </Text>
                                    <Row space={"1"}>
                                      <Pressable
                                        onPress={() => {
                                          set_local_val_2(default_value_2);
                                          set_has_errors_2(false);
                                          props.dispatch([
                                            "filter_path",
                                            props.and_filter,
                                            props.or_filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [value1, ""]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef2.current?.forceClose();
                                        }}
                                        backgroundColor={bs_theme.primary}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={"white"}>Clear</Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.forceClose()
                                        }
                                        borderColor={bs_theme.primary}
                                        borderWidth={"1"}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={bs_theme.text}>Close</Text>
                                      </Pressable>
                                    </Row>
                                  </Row>
                                  <BottomSheetFlatList
                                    contentContainerStyle={tw.style(
                                      ["m-2"],
                                      {}
                                    )}
                                    data={props.init_filter.filter_paths
                                      .toArray()
                                      .filter((filter_path) => {
                                        switch (filter_path.value[0]) {
                                          case "str":
                                          case "lstr":
                                          case "clob": {
                                            if (
                                              !filter_path.equals(
                                                props.filter_path
                                              )
                                            ) {
                                              return true;
                                            }
                                          }
                                        }
                                        return false;
                                      })}
                                    keyExtractor={(x) =>
                                      get_flattened_path(x.path).join(".")
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          flex={1}
                                          flexDirection={"row"}
                                          py={"0.5"}
                                          onPress={() => {
                                            props.dispatch([
                                              "filter_path",
                                              props.and_filter,
                                              props.or_filter,
                                              "replace",
                                              apply(props.filter_path, (it) => {
                                                it.value = [
                                                  field_struct_name,
                                                  [
                                                    op,
                                                    [
                                                      value1,
                                                      [
                                                        list_item.item.label,
                                                        list_item.item.path,
                                                      ],
                                                    ],
                                                  ],
                                                ];
                                                return it;
                                              }),
                                            ]);
                                            bottomSheetModalRef2.current?.forceClose();
                                          }}
                                        >
                                          {arrow(() => {
                                            if (Array.isArray(value)) {
                                              return apply(
                                                compare_paths(
                                                  value[1],
                                                  list_item.item.path
                                                ),
                                                (active) => {
                                                  return active ? (
                                                    <Ionicons
                                                      name="radio-button-on"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  ) : (
                                                    <Ionicons
                                                      name="radio-button-off"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  );
                                                }
                                              );
                                            } else {
                                              return (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color={bs_theme.primary}
                                                />
                                              );
                                            }
                                          })}
                                          <Text pl={1} color={bs_theme.text}>
                                            {list_item.item.label}
                                          </Text>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </Row>
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
                }
                return <></>;
              }

              case "i32":
              case "u32":
              case "i64":
              case "u64":
              case "idouble":
              case "udouble":
              case "idecimal":
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
                      return (
                        <Row flex={1} justifyContent={"flex-start"}>
                          {arrow(() => {
                            if (Array.isArray(value)) {
                              return (
                                <Pressable
                                  ml={"2"}
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text color={bs_theme.text}>{value[0]}</Text>
                                </Pressable>
                              );
                            } else {
                              return (
                                <Input
                                  flex={1}
                                  ml={"2"}
                                  size={"md"}
                                  placeholder={props.filter_path.label}
                                  value={local_val_1}
                                  isInvalid={has_errors_1}
                                  keyboardType={get_decimal_keyboard_type(
                                    field_struct_name
                                  )}
                                  onChangeText={(x) => {
                                    try {
                                      set_local_val_1(x);
                                      const val = get_validated_decimal(
                                        field_struct_name,
                                        x
                                      );
                                      set_has_errors_1(false);
                                      props.dispatch([
                                        "filter_path",
                                        props.and_filter,
                                        props.or_filter,
                                        "replace",
                                        apply(props.filter_path, (it) => {
                                          it.value = [
                                            field_struct_name,
                                            [op, val],
                                          ];
                                          return it;
                                        }),
                                      ]);
                                    } catch (e) {
                                      set_has_errors_1(true);
                                    }
                                  }}
                                  InputRightElement={
                                    local_val_1 !== default_value_1 &&
                                    local_val_1 !== "" ? (
                                      <Pressable
                                        px={1}
                                        onPress={() => {
                                          try {
                                            const val = get_validated_decimal(
                                              field_struct_name,
                                              default_value_1
                                            );
                                            set_local_val_1(
                                              apply(default_value_1, (it) => {
                                                if (it === "0") {
                                                  return "";
                                                }
                                                return it;
                                              })
                                            );
                                            set_has_errors_1(false);
                                            props.dispatch([
                                              "filter_path",
                                              props.and_filter,
                                              props.or_filter,
                                              "replace",
                                              apply(props.filter_path, (it) => {
                                                it.value = [
                                                  field_struct_name,
                                                  [op, val],
                                                ];
                                                return it;
                                              }),
                                            ]);
                                          } catch (e) {}
                                        }}
                                      >
                                        <MaterialIcons
                                          name="clear"
                                          size={24}
                                          color={bs_theme.placeholder}
                                        />
                                      </Pressable>
                                    ) : (
                                      <></>
                                    )
                                  }
                                  color={bs_theme.text}
                                  borderColor={bs_theme.border}
                                  placeholderTextColor={bs_theme.placeholder}
                                />
                              );
                            }
                          })}
                          {props.init_filter.filter_paths.anyMatch(
                            (filter_path) => {
                              switch (filter_path.value[0]) {
                                case "i32":
                                case "u32":
                                case "i64":
                                case "u64":
                                case "idouble":
                                case "udouble":
                                case "idecimal":
                                case "udecimal": {
                                  if (!filter_path.equals(props.filter_path)) {
                                    return true;
                                  }
                                }
                              }
                              return false;
                            }
                          ) ? (
                            <Pressable
                              flexDirection={"row"}
                              alignItems={"center"}
                              pl={"1"}
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={bs_theme.text}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={0}
                            backgroundStyle={tw.style(["border"], {
                              backgroundColor: bs_theme.background,
                              borderColor: bs_theme.primary,
                            })}
                          >
                            <Row
                              justifyContent={"space-between"}
                              alignItems={"center"}
                              borderBottomColor={bs_theme.primary}
                              borderBottomWidth={"1"}
                              px={"3"}
                              pb={"2"}
                            >
                              <Text bold color={bs_theme.text}>
                                Fields
                              </Text>
                              <Row space={"1"}>
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filter_path",
                                      props.and_filter,
                                      props.or_filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, new Decimal(0)],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.forceClose();
                                  }}
                                  backgroundColor={bs_theme.primary}
                                  borderRadius={"xs"}
                                  px={"2"}
                                  py={"0.5"}
                                >
                                  <Text color={"white"}>Clear</Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.forceClose()
                                  }
                                  borderColor={bs_theme.primary}
                                  borderWidth={"1"}
                                  borderRadius={"xs"}
                                  px={"2"}
                                  py={"0.5"}
                                >
                                  <Text color={bs_theme.text}>Close</Text>
                                </Pressable>
                              </Row>
                            </Row>
                            <BottomSheetFlatList
                              contentContainerStyle={tw.style(["m-2"], {})}
                              data={props.init_filter.filter_paths
                                .toArray()
                                .filter((filter_path) => {
                                  switch (filter_path.value[0]) {
                                    case "i32":
                                    case "u32":
                                    case "i64":
                                    case "u64":
                                    case "idouble":
                                    case "udouble":
                                    case "idecimal":
                                    case "udecimal": {
                                      if (
                                        !filter_path.equals(props.filter_path)
                                      ) {
                                        return true;
                                      }
                                    }
                                  }
                                  return false;
                                })}
                              keyExtractor={(x) =>
                                get_flattened_path(x.path).join(".")
                              }
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    flex={1}
                                    flexDirection={"row"}
                                    py={"0.5"}
                                    onPress={() => {
                                      props.dispatch([
                                        "filter_path",
                                        props.and_filter,
                                        props.or_filter,
                                        "replace",
                                        apply(props.filter_path, (it) => {
                                          it.value = [
                                            field_struct_name,
                                            [
                                              op,
                                              [
                                                list_item.item.label,
                                                list_item.item.path,
                                              ],
                                            ],
                                          ];
                                          return it;
                                        }),
                                      ]);
                                      bottomSheetModalRef1.current?.forceClose();
                                    }}
                                  >
                                    {arrow(() => {
                                      if (Array.isArray(value)) {
                                        return apply(
                                          compare_paths(
                                            value[1],
                                            list_item.item.path
                                          ),
                                          (active) => {
                                            return active ? (
                                              <Ionicons
                                                name="radio-button-on"
                                                size={24}
                                                color={bs_theme.primary}
                                              />
                                            ) : (
                                              <Ionicons
                                                name="radio-button-off"
                                                size={24}
                                                color={bs_theme.primary}
                                              />
                                            );
                                          }
                                        );
                                      } else {
                                        return (
                                          <Ionicons
                                            name="radio-button-off"
                                            size={24}
                                            color={bs_theme.primary}
                                          />
                                        );
                                      }
                                    })}
                                    <Text pl={1} color={bs_theme.text}>
                                      {list_item.item.label}
                                    </Text>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </Row>
                      );
                    }
                    case "between":
                    case "not_between": {
                      const [value1, value2] = props.filter_path.value[1][1];
                      return (
                        <>
                          {arrow(() => {
                            const value = value1;
                            return (
                              <Row flex={1} justifyContent={"flex-start"}>
                                {arrow(() => {
                                  if (Array.isArray(value)) {
                                    return (
                                      <Pressable
                                        ml={"2"}
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.present()
                                        }
                                      >
                                        <Text color={bs_theme.text}>
                                          {value[0]}
                                        </Text>
                                      </Pressable>
                                    );
                                  } else {
                                    return (
                                      <Input
                                        flex={1}
                                        ml={"2"}
                                        size={"md"}
                                        placeholder={props.filter_path.label}
                                        value={local_val_1}
                                        isInvalid={has_errors_1}
                                        keyboardType={get_decimal_keyboard_type(
                                          field_struct_name
                                        )}
                                        onChangeText={(x) => {
                                          try {
                                            set_local_val_1(x);
                                            const val = get_validated_decimal(
                                              field_struct_name,
                                              x
                                            );
                                            set_has_errors_1(false);
                                            props.dispatch([
                                              "filter_path",
                                              props.and_filter,
                                              props.or_filter,
                                              "replace",
                                              apply(props.filter_path, (it) => {
                                                it.value = [
                                                  field_struct_name,
                                                  [op, [val, value2]],
                                                ];
                                                return it;
                                              }),
                                            ]);
                                          } catch (e) {
                                            set_has_errors_1(true);
                                          }
                                        }}
                                        InputRightElement={
                                          local_val_1 !== default_value_1 &&
                                          local_val_1 !== "" ? (
                                            <Pressable
                                              px={1}
                                              onPress={() => {
                                                try {
                                                  const val =
                                                    get_validated_decimal(
                                                      field_struct_name,
                                                      default_value_1
                                                    );
                                                  set_local_val_1(
                                                    apply(
                                                      default_value_1,
                                                      (it) => {
                                                        if (it === "0") {
                                                          return "";
                                                        }
                                                        return it;
                                                      }
                                                    )
                                                  );
                                                  set_has_errors_1(false);
                                                  props.dispatch([
                                                    "filter_path",
                                                    props.and_filter,
                                                    props.or_filter,
                                                    "replace",
                                                    apply(
                                                      props.filter_path,
                                                      (it) => {
                                                        it.value = [
                                                          field_struct_name,
                                                          [op, [val, value2]],
                                                        ];
                                                        return it;
                                                      }
                                                    ),
                                                  ]);
                                                } catch (e) {}
                                              }}
                                            >
                                              <MaterialIcons
                                                name="clear"
                                                size={24}
                                                color={bs_theme.placeholder}
                                              />
                                            </Pressable>
                                          ) : (
                                            <></>
                                          )
                                        }
                                        color={bs_theme.text}
                                        borderColor={bs_theme.border}
                                        placeholderTextColor={
                                          bs_theme.placeholder
                                        }
                                      />
                                    );
                                  }
                                })}
                                {props.init_filter.filter_paths.anyMatch(
                                  (filter_path) => {
                                    switch (filter_path.value[0]) {
                                      case "i32":
                                      case "u32":
                                      case "i64":
                                      case "u64":
                                      case "idouble":
                                      case "udouble":
                                      case "idecimal":
                                      case "udecimal": {
                                        if (
                                          !filter_path.equals(props.filter_path)
                                        ) {
                                          return true;
                                        }
                                      }
                                    }
                                    return false;
                                  }
                                ) ? (
                                  <Pressable
                                    flexDirection={"row"}
                                    alignItems={"center"}
                                    pl={"1"}
                                    onPress={() =>
                                      bottomSheetModalRef1.current?.present()
                                    }
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={bs_theme.text}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef1}
                                  snapPoints={["50%", "82%"]}
                                  index={0}
                                  backgroundStyle={tw.style(["border"], {
                                    backgroundColor: bs_theme.background,
                                    borderColor: bs_theme.primary,
                                  })}
                                >
                                  <Row
                                    justifyContent={"space-between"}
                                    alignItems={"center"}
                                    borderBottomColor={bs_theme.primary}
                                    borderBottomWidth={"1"}
                                    px={"3"}
                                    pb={"2"}
                                  >
                                    <Text bold color={bs_theme.text}>
                                      Fields
                                    </Text>
                                    <Row space={"1"}>
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filter_path",
                                            props.and_filter,
                                            props.or_filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [new Decimal(0), value2]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef1.current?.forceClose();
                                        }}
                                        backgroundColor={bs_theme.primary}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={"white"}>Clear</Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.forceClose()
                                        }
                                        borderColor={bs_theme.primary}
                                        borderWidth={"1"}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={bs_theme.text}>Close</Text>
                                      </Pressable>
                                    </Row>
                                  </Row>
                                  <BottomSheetFlatList
                                    contentContainerStyle={tw.style(
                                      ["m-2"],
                                      {}
                                    )}
                                    data={props.init_filter.filter_paths
                                      .toArray()
                                      .filter((filter_path) => {
                                        switch (filter_path.value[0]) {
                                          case "i32":
                                          case "u32":
                                          case "i64":
                                          case "u64":
                                          case "idouble":
                                          case "udouble":
                                          case "idecimal":
                                          case "udecimal": {
                                            if (
                                              !filter_path.equals(
                                                props.filter_path
                                              )
                                            ) {
                                              return true;
                                            }
                                          }
                                        }
                                        return false;
                                      })}
                                    keyExtractor={(x) =>
                                      get_flattened_path(x.path).join(".")
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          flex={1}
                                          flexDirection={"row"}
                                          py={"0.5"}
                                          onPress={() => {
                                            props.dispatch([
                                              "filter_path",
                                              props.and_filter,
                                              props.or_filter,
                                              "replace",
                                              apply(props.filter_path, (it) => {
                                                it.value = [
                                                  field_struct_name,
                                                  [
                                                    op,
                                                    [
                                                      [
                                                        list_item.item.label,
                                                        list_item.item.path,
                                                      ],
                                                      value2,
                                                    ],
                                                  ],
                                                ];
                                                return it;
                                              }),
                                            ]);
                                            bottomSheetModalRef1.current?.forceClose();
                                          }}
                                        >
                                          {arrow(() => {
                                            if (Array.isArray(value)) {
                                              return apply(
                                                compare_paths(
                                                  value[1],
                                                  list_item.item.path
                                                ),
                                                (active) => {
                                                  return active ? (
                                                    <Ionicons
                                                      name="radio-button-on"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  ) : (
                                                    <Ionicons
                                                      name="radio-button-off"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  );
                                                }
                                              );
                                            } else {
                                              return (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color={bs_theme.primary}
                                                />
                                              );
                                            }
                                          })}
                                          <Text pl={1} color={bs_theme.text}>
                                            {list_item.item.label}
                                          </Text>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </Row>
                            );
                          })}
                          {arrow(() => {
                            const value = value2;
                            return (
                              <Row flex={1} justifyContent={"flex-start"}>
                                {arrow(() => {
                                  if (Array.isArray(value)) {
                                    return (
                                      <Pressable
                                        ml={"2"}
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.present()
                                        }
                                      >
                                        <Text color={bs_theme.text}>
                                          {value[0]}
                                        </Text>
                                      </Pressable>
                                    );
                                  } else {
                                    return (
                                      <Input
                                        flex={1}
                                        ml={"2"}
                                        size={"md"}
                                        placeholder={props.filter_path.label}
                                        value={local_val_2}
                                        isInvalid={has_errors_2}
                                        keyboardType={get_decimal_keyboard_type(
                                          field_struct_name
                                        )}
                                        onChangeText={(x) => {
                                          try {
                                            set_local_val_2(x);
                                            const val = get_validated_decimal(
                                              field_struct_name,
                                              x
                                            );
                                            set_has_errors_2(false);
                                            props.dispatch([
                                              "filter_path",
                                              props.and_filter,
                                              props.or_filter,
                                              "replace",
                                              apply(props.filter_path, (it) => {
                                                it.value = [
                                                  field_struct_name,
                                                  [op, [value1, val]],
                                                ];
                                                return it;
                                              }),
                                            ]);
                                          } catch (e) {
                                            set_has_errors_2(true);
                                          }
                                        }}
                                        InputRightElement={
                                          local_val_2 !== default_value_2 &&
                                          local_val_2 !== "" ? (
                                            <Pressable
                                              px={1}
                                              onPress={() => {
                                                try {
                                                  const val =
                                                    get_validated_decimal(
                                                      field_struct_name,
                                                      default_value_2
                                                    );
                                                  set_local_val_2(
                                                    apply(
                                                      default_value_2,
                                                      (it) => {
                                                        if (it === "0") {
                                                          return "";
                                                        }
                                                        return it;
                                                      }
                                                    )
                                                  );
                                                  set_has_errors_2(false);
                                                  props.dispatch([
                                                    "filter_path",
                                                    props.and_filter,
                                                    props.or_filter,
                                                    "replace",
                                                    apply(
                                                      props.filter_path,
                                                      (it) => {
                                                        it.value = [
                                                          field_struct_name,
                                                          [op, [value1, val]],
                                                        ];
                                                        return it;
                                                      }
                                                    ),
                                                  ]);
                                                } catch (e) {}
                                              }}
                                            >
                                              <MaterialIcons
                                                name="clear"
                                                size={24}
                                                color={bs_theme.placeholder}
                                              />
                                            </Pressable>
                                          ) : (
                                            <></>
                                          )
                                        }
                                        color={bs_theme.text}
                                        borderColor={bs_theme.border}
                                        placeholderTextColor={
                                          bs_theme.placeholder
                                        }
                                      />
                                    );
                                  }
                                })}
                                {props.init_filter.filter_paths.anyMatch(
                                  (filter_path) => {
                                    switch (filter_path.value[0]) {
                                      case "i32":
                                      case "u32":
                                      case "i64":
                                      case "u64":
                                      case "idouble":
                                      case "udouble":
                                      case "idecimal":
                                      case "udecimal": {
                                        if (
                                          !filter_path.equals(props.filter_path)
                                        ) {
                                          return true;
                                        }
                                      }
                                    }
                                    return false;
                                  }
                                ) ? (
                                  <Pressable
                                    flexDirection={"row"}
                                    alignItems={"center"}
                                    pl={"1"}
                                    onPress={() =>
                                      bottomSheetModalRef2.current?.present()
                                    }
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={bs_theme.text}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef2}
                                  snapPoints={["50%", "82%"]}
                                  index={0}
                                  backgroundStyle={tw.style(["border"], {
                                    backgroundColor: bs_theme.background,
                                    borderColor: bs_theme.primary,
                                  })}
                                >
                                  <Row
                                    justifyContent={"space-between"}
                                    alignItems={"center"}
                                    borderBottomColor={bs_theme.primary}
                                    borderBottomWidth={"1"}
                                    px={"3"}
                                    pb={"2"}
                                  >
                                    <Text bold color={bs_theme.text}>
                                      Fields
                                    </Text>
                                    <Row space={"1"}>
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filter_path",
                                            props.and_filter,
                                            props.or_filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [value1, new Decimal(0)]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef2.current?.forceClose();
                                        }}
                                        backgroundColor={bs_theme.primary}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={"white"}>Clear</Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.forceClose()
                                        }
                                        borderColor={bs_theme.primary}
                                        borderWidth={"1"}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={bs_theme.text}>Close</Text>
                                      </Pressable>
                                    </Row>
                                  </Row>
                                  <BottomSheetFlatList
                                    contentContainerStyle={tw.style(
                                      ["m-2"],
                                      {}
                                    )}
                                    data={props.init_filter.filter_paths
                                      .toArray()
                                      .filter((filter_path) => {
                                        switch (filter_path.value[0]) {
                                          case "i32":
                                          case "u32":
                                          case "i64":
                                          case "u64":
                                          case "idouble":
                                          case "udouble":
                                          case "idecimal":
                                          case "udecimal": {
                                            if (
                                              !filter_path.equals(
                                                props.filter_path
                                              )
                                            ) {
                                              return true;
                                            }
                                          }
                                        }
                                        return false;
                                      })}
                                    keyExtractor={(x) =>
                                      get_flattened_path(x.path).join(".")
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          flex={1}
                                          flexDirection={"row"}
                                          py={"0.5"}
                                          onPress={() => {
                                            props.dispatch([
                                              "filter_path",
                                              props.and_filter,
                                              props.or_filter,
                                              "replace",
                                              apply(props.filter_path, (it) => {
                                                it.value = [
                                                  field_struct_name,
                                                  [
                                                    op,
                                                    [
                                                      value1,
                                                      [
                                                        list_item.item.label,
                                                        list_item.item.path,
                                                      ],
                                                    ],
                                                  ],
                                                ];
                                                return it;
                                              }),
                                            ]);
                                            bottomSheetModalRef2.current?.forceClose();
                                          }}
                                        >
                                          {arrow(() => {
                                            if (Array.isArray(value)) {
                                              return apply(
                                                compare_paths(
                                                  value[1],
                                                  list_item.item.path
                                                ),
                                                (active) => {
                                                  return active ? (
                                                    <Ionicons
                                                      name="radio-button-on"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  ) : (
                                                    <Ionicons
                                                      name="radio-button-off"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  );
                                                }
                                              );
                                            } else {
                                              return (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color={bs_theme.primary}
                                                />
                                              );
                                            }
                                          })}
                                          <Text pl={1} color={bs_theme.text}>
                                            {list_item.item.label}
                                          </Text>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </Row>
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
                      return (
                        <Row flex={1} justifyContent={"flex-start"}>
                          {arrow(() => {
                            if (Array.isArray(value)) {
                              return (
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text color={bs_theme.text}>{value[0]}</Text>
                                </Pressable>
                              );
                            } else {
                              return (
                                <Checkbox
                                  value={value}
                                  onValueChange={(x: boolean) =>
                                    props.dispatch([
                                      "filter_path",
                                      props.and_filter,
                                      props.or_filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [field_struct_name, [op, x]];
                                        return it;
                                      }),
                                    ])
                                  }
                                  color={value ? bs_theme.primary : undefined}
                                  style={tw.style(["ml-2"], {})}
                                />
                              );
                            }
                          })}
                          {props.init_filter.filter_paths.anyMatch(
                            (filter_path) => {
                              switch (filter_path.value[0]) {
                                case "bool": {
                                  if (!filter_path.equals(props.filter_path)) {
                                    return true;
                                  }
                                }
                              }
                              return false;
                            }
                          ) ? (
                            <Pressable
                              flexDirection={"row"}
                              alignItems={"center"}
                              pl={"1"}
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={bs_theme.text}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={0}
                            backgroundStyle={tw.style(["border"], {
                              backgroundColor: bs_theme.background,
                              borderColor: bs_theme.primary,
                            })}
                          >
                            <Row
                              justifyContent={"space-between"}
                              alignItems={"center"}
                              borderBottomColor={bs_theme.primary}
                              borderBottomWidth={"1"}
                              px={"3"}
                              pb={"2"}
                            >
                              <Text bold color={bs_theme.text}>
                                Fields
                              </Text>
                              <Row space={"1"}>
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filter_path",
                                      props.and_filter,
                                      props.or_filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, true],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.forceClose();
                                  }}
                                  backgroundColor={bs_theme.primary}
                                  borderRadius={"xs"}
                                  px={"2"}
                                  py={"0.5"}
                                >
                                  <Text color={"white"}>Clear</Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.forceClose()
                                  }
                                  borderColor={bs_theme.primary}
                                  borderWidth={"1"}
                                  borderRadius={"xs"}
                                  px={"2"}
                                  py={"0.5"}
                                >
                                  <Text color={bs_theme.text}>Close</Text>
                                </Pressable>
                              </Row>
                            </Row>
                            <BottomSheetFlatList
                              contentContainerStyle={tw.style(["m-2"], {})}
                              data={props.init_filter.filter_paths
                                .toArray()
                                .filter((filter_path) => {
                                  switch (filter_path.value[0]) {
                                    case "bool": {
                                      if (
                                        !filter_path.equals(props.filter_path)
                                      ) {
                                        return true;
                                      }
                                    }
                                  }
                                  return false;
                                })}
                              keyExtractor={(x) =>
                                get_flattened_path(x.path).join(".")
                              }
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    flex={1}
                                    flexDirection={"row"}
                                    py={"0.5"}
                                    onPress={() => {
                                      props.dispatch([
                                        "filter_path",
                                        props.and_filter,
                                        props.or_filter,
                                        "replace",
                                        apply(props.filter_path, (it) => {
                                          it.value = [
                                            field_struct_name,
                                            [
                                              op,
                                              [
                                                list_item.item.label,
                                                list_item.item.path,
                                              ],
                                            ],
                                          ];
                                          return it;
                                        }),
                                      ]);
                                      bottomSheetModalRef1.current?.forceClose();
                                    }}
                                  >
                                    {arrow(() => {
                                      if (Array.isArray(value)) {
                                        return apply(
                                          compare_paths(
                                            value[1],
                                            list_item.item.path
                                          ),
                                          (active) => {
                                            return active ? (
                                              <Ionicons
                                                name="radio-button-on"
                                                size={24}
                                                color={bs_theme.primary}
                                              />
                                            ) : (
                                              <Ionicons
                                                name="radio-button-off"
                                                size={24}
                                                color={bs_theme.primary}
                                              />
                                            );
                                          }
                                        );
                                      } else {
                                        return (
                                          <Ionicons
                                            name="radio-button-off"
                                            size={24}
                                            color={bs_theme.primary}
                                          />
                                        );
                                      }
                                    })}
                                    <Text pl={1} color={bs_theme.text}>
                                      {list_item.item.label}
                                    </Text>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </Row>
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
                      return (
                        <Row flex={1} justifyContent={"flex-start"}>
                          {arrow(() => {
                            if (Array.isArray(value)) {
                              return (
                                <Pressable
                                  ml={"2"}
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text color={bs_theme.text}>{value[0]}</Text>
                                </Pressable>
                              );
                            } else {
                              return (
                                <>
                                  <Pressable onPress={() => setPicker1(true)}>
                                    <Text color={bs_theme.text}>
                                      {moment(value).format("Do MMM YYYY")}
                                    </Text>
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
                                            "filter_path",
                                            props.and_filter,
                                            props.or_filter,
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
                            }
                          })}
                          {props.init_filter.filter_paths.anyMatch(
                            (filter_path) => {
                              switch (filter_path.value[0]) {
                                case "date": {
                                  if (!filter_path.equals(props.filter_path)) {
                                    return true;
                                  }
                                }
                              }
                              return false;
                            }
                          ) ? (
                            <Pressable
                              flexDirection={"row"}
                              alignItems={"center"}
                              pl={"1"}
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={bs_theme.text}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={0}
                            backgroundStyle={tw.style(["border"], {
                              backgroundColor: bs_theme.background,
                              borderColor: bs_theme.primary,
                            })}
                          >
                            <Row
                              justifyContent={"space-between"}
                              alignItems={"center"}
                              borderBottomColor={bs_theme.primary}
                              borderBottomWidth={"1"}
                              px={"3"}
                              pb={"2"}
                            >
                              <Text bold color={bs_theme.text}>
                                Fields
                              </Text>
                              <Row space={"1"}>
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filter_path",
                                      props.and_filter,
                                      props.or_filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, new Date()],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.forceClose();
                                  }}
                                  backgroundColor={bs_theme.primary}
                                  borderRadius={"xs"}
                                  px={"2"}
                                  py={"0.5"}
                                >
                                  <Text color={"white"}>Clear</Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.forceClose()
                                  }
                                  borderColor={bs_theme.primary}
                                  borderWidth={"1"}
                                  borderRadius={"xs"}
                                  px={"2"}
                                  py={"0.5"}
                                >
                                  <Text color={bs_theme.text}>Close</Text>
                                </Pressable>
                              </Row>
                            </Row>
                            <BottomSheetFlatList
                              contentContainerStyle={tw.style(["m-2"], {})}
                              data={props.init_filter.filter_paths
                                .toArray()
                                .filter((filter_path) => {
                                  switch (filter_path.value[0]) {
                                    case "date": {
                                      if (
                                        !filter_path.equals(props.filter_path)
                                      ) {
                                        return true;
                                      }
                                    }
                                  }
                                  return false;
                                })}
                              keyExtractor={(x) =>
                                get_flattened_path(x.path).join(".")
                              }
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    flex={1}
                                    flexDirection={"row"}
                                    py={"0.5"}
                                    onPress={() => {
                                      props.dispatch([
                                        "filter_path",
                                        props.and_filter,
                                        props.or_filter,
                                        "replace",
                                        apply(props.filter_path, (it) => {
                                          it.value = [
                                            field_struct_name,
                                            [
                                              op,
                                              [
                                                list_item.item.label,
                                                list_item.item.path,
                                              ],
                                            ],
                                          ];
                                          return it;
                                        }),
                                      ]);
                                      bottomSheetModalRef1.current?.forceClose();
                                    }}
                                  >
                                    {arrow(() => {
                                      if (Array.isArray(value)) {
                                        return apply(
                                          compare_paths(
                                            value[1],
                                            list_item.item.path
                                          ),
                                          (active) => {
                                            return active ? (
                                              <Ionicons
                                                name="radio-button-on"
                                                size={24}
                                                color={bs_theme.primary}
                                              />
                                            ) : (
                                              <Ionicons
                                                name="radio-button-off"
                                                size={24}
                                                color={bs_theme.primary}
                                              />
                                            );
                                          }
                                        );
                                      } else {
                                        return (
                                          <Ionicons
                                            name="radio-button-off"
                                            size={24}
                                            color={bs_theme.primary}
                                          />
                                        );
                                      }
                                    })}
                                    <Text pl={1} color={bs_theme.text}>
                                      {list_item.item.label}
                                    </Text>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </Row>
                      );
                    }
                    case "between":
                    case "not_between": {
                      const [value1, value2] = props.filter_path.value[1][1];
                      return (
                        <>
                          {arrow(() => {
                            return (
                              <Row flex={1} justifyContent={"flex-start"}>
                                {arrow(() => {
                                  if (Array.isArray(value1)) {
                                    return (
                                      <Pressable
                                        ml={"2"}
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.present()
                                        }
                                      >
                                        <Text color={bs_theme.text}>
                                          {value1[0]}
                                        </Text>
                                      </Pressable>
                                    );
                                  } else {
                                    return (
                                      <>
                                        <Pressable
                                          onPress={() => setPicker1(true)}
                                        >
                                          <Text color={bs_theme.text}>
                                            {moment(value1).format(
                                              "Do MMM YYYY"
                                            )}
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
                                                setPicker1(
                                                  Platform.OS === "ios"
                                                );
                                                props.dispatch([
                                                  "filter_path",
                                                  props.and_filter,
                                                  props.or_filter,
                                                  "replace",
                                                  apply(
                                                    props.filter_path,
                                                    (it) => {
                                                      it.value = [
                                                        field_struct_name,
                                                        [
                                                          op,
                                                          [
                                                            date || new Date(),
                                                            value2,
                                                          ],
                                                        ],
                                                      ];
                                                      return it;
                                                    }
                                                  ),
                                                ]);
                                              }}
                                            />
                                          )}
                                        </>
                                      </>
                                    );
                                  }
                                })}
                                {props.init_filter.filter_paths.anyMatch(
                                  (filter_path) => {
                                    switch (filter_path.value[0]) {
                                      case "date": {
                                        if (
                                          !filter_path.equals(props.filter_path)
                                        ) {
                                          return true;
                                        }
                                      }
                                    }
                                    return false;
                                  }
                                ) ? (
                                  <Pressable
                                    flexDirection={"row"}
                                    alignItems={"center"}
                                    pl={"1"}
                                    onPress={() =>
                                      bottomSheetModalRef1.current?.present()
                                    }
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={bs_theme.text}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef1}
                                  snapPoints={["50%", "82%"]}
                                  index={0}
                                  backgroundStyle={tw.style(["border"], {
                                    backgroundColor: bs_theme.background,
                                    borderColor: bs_theme.primary,
                                  })}
                                >
                                  <Row
                                    justifyContent={"space-between"}
                                    alignItems={"center"}
                                    borderBottomColor={bs_theme.primary}
                                    borderBottomWidth={"1"}
                                    px={"3"}
                                    pb={"2"}
                                  >
                                    <Text bold color={bs_theme.text}>
                                      Fields
                                    </Text>
                                    <Row space={"1"}>
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filter_path",
                                            props.and_filter,
                                            props.or_filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [new Date(), value2]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef1.current?.forceClose();
                                        }}
                                        backgroundColor={bs_theme.primary}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={"white"}>Clear</Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.forceClose()
                                        }
                                        borderColor={bs_theme.primary}
                                        borderWidth={"1"}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={bs_theme.text}>Close</Text>
                                      </Pressable>
                                    </Row>
                                  </Row>
                                  <BottomSheetFlatList
                                    contentContainerStyle={tw.style(
                                      ["m-2"],
                                      {}
                                    )}
                                    data={props.init_filter.filter_paths
                                      .toArray()
                                      .filter((filter_path) => {
                                        switch (filter_path.value[0]) {
                                          case "date": {
                                            if (
                                              !filter_path.equals(
                                                props.filter_path
                                              )
                                            ) {
                                              return true;
                                            }
                                          }
                                        }
                                        return false;
                                      })}
                                    keyExtractor={(x) =>
                                      get_flattened_path(x.path).join(".")
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          flex={1}
                                          flexDirection={"row"}
                                          py={"0.5"}
                                          onPress={() => {
                                            props.dispatch([
                                              "filter_path",
                                              props.and_filter,
                                              props.or_filter,
                                              "replace",
                                              apply(props.filter_path, (it) => {
                                                it.value = [
                                                  field_struct_name,
                                                  [
                                                    op,
                                                    [
                                                      [
                                                        list_item.item.label,
                                                        list_item.item.path,
                                                      ],
                                                      value2,
                                                    ],
                                                  ],
                                                ];
                                                return it;
                                              }),
                                            ]);
                                            bottomSheetModalRef1.current?.forceClose();
                                          }}
                                        >
                                          {arrow(() => {
                                            if (Array.isArray(value1)) {
                                              return apply(
                                                compare_paths(
                                                  value1[1],
                                                  list_item.item.path
                                                ),
                                                (active) => {
                                                  return active ? (
                                                    <Ionicons
                                                      name="radio-button-on"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  ) : (
                                                    <Ionicons
                                                      name="radio-button-off"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  );
                                                }
                                              );
                                            } else {
                                              return (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color={bs_theme.primary}
                                                />
                                              );
                                            }
                                          })}
                                          <Text pl={1} color={bs_theme.text}>
                                            {list_item.item.label}
                                          </Text>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </Row>
                            );
                          })}
                          {arrow(() => {
                            return (
                              <Row flex={1} justifyContent={"flex-start"}>
                                {arrow(() => {
                                  if (Array.isArray(value2)) {
                                    return (
                                      <Pressable
                                        ml={"2"}
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.present()
                                        }
                                      >
                                        <Text color={bs_theme.text}>
                                          {value2[0]}
                                        </Text>
                                      </Pressable>
                                    );
                                  } else {
                                    return (
                                      <>
                                        <Pressable
                                          onPress={() => setPicker2(true)}
                                        >
                                          <Text color={bs_theme.text}>
                                            {moment(value2).format(
                                              "Do MMM YYYY"
                                            )}
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
                                                setPicker2(
                                                  Platform.OS === "ios"
                                                );
                                                props.dispatch([
                                                  "filter_path",
                                                  props.and_filter,
                                                  props.or_filter,
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
                                                            date || new Date(),
                                                          ],
                                                        ],
                                                      ];
                                                      return it;
                                                    }
                                                  ),
                                                ]);
                                              }}
                                            />
                                          )}
                                        </>
                                      </>
                                    );
                                  }
                                })}
                                {props.init_filter.filter_paths.anyMatch(
                                  (filter_path) => {
                                    switch (filter_path.value[0]) {
                                      case "date": {
                                        if (
                                          !filter_path.equals(props.filter_path)
                                        ) {
                                          return true;
                                        }
                                      }
                                    }
                                    return false;
                                  }
                                ) ? (
                                  <Pressable
                                    flexDirection={"row"}
                                    alignItems={"center"}
                                    pl={"1"}
                                    onPress={() =>
                                      bottomSheetModalRef2.current?.present()
                                    }
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={bs_theme.text}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef2}
                                  snapPoints={["50%", "82%"]}
                                  index={0}
                                  backgroundStyle={tw.style(["border"], {
                                    backgroundColor: bs_theme.background,
                                    borderColor: bs_theme.primary,
                                  })}
                                >
                                  <Row
                                    justifyContent={"space-between"}
                                    alignItems={"center"}
                                    borderBottomColor={bs_theme.primary}
                                    borderBottomWidth={"1"}
                                    px={"3"}
                                    pb={"2"}
                                  >
                                    <Text bold color={bs_theme.text}>
                                      Fields
                                    </Text>
                                    <Row space={"1"}>
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filter_path",
                                            props.and_filter,
                                            props.or_filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [value1, new Date()]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef2.current?.forceClose();
                                        }}
                                        backgroundColor={bs_theme.primary}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={"white"}>Clear</Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.forceClose()
                                        }
                                        borderColor={bs_theme.primary}
                                        borderWidth={"1"}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={bs_theme.text}>Close</Text>
                                      </Pressable>
                                    </Row>
                                  </Row>
                                  <BottomSheetFlatList
                                    contentContainerStyle={tw.style(
                                      ["m-2"],
                                      {}
                                    )}
                                    data={props.init_filter.filter_paths
                                      .toArray()
                                      .filter((filter_path) => {
                                        switch (filter_path.value[0]) {
                                          case "date": {
                                            if (
                                              !filter_path.equals(
                                                props.filter_path
                                              )
                                            ) {
                                              return true;
                                            }
                                          }
                                        }
                                        return false;
                                      })}
                                    keyExtractor={(x) =>
                                      get_flattened_path(x.path).join(".")
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          flex={1}
                                          flexDirection={"row"}
                                          py={"0.5"}
                                          onPress={() => {
                                            props.dispatch([
                                              "filter_path",
                                              props.and_filter,
                                              props.or_filter,
                                              "replace",
                                              apply(props.filter_path, (it) => {
                                                it.value = [
                                                  field_struct_name,
                                                  [
                                                    op,
                                                    [
                                                      value1,
                                                      [
                                                        list_item.item.label,
                                                        list_item.item.path,
                                                      ],
                                                    ],
                                                  ],
                                                ];
                                                return it;
                                              }),
                                            ]);
                                            bottomSheetModalRef2.current?.forceClose();
                                          }}
                                        >
                                          {arrow(() => {
                                            if (Array.isArray(value2)) {
                                              return apply(
                                                compare_paths(
                                                  value2[1],
                                                  list_item.item.path
                                                ),
                                                (active) => {
                                                  return active ? (
                                                    <Ionicons
                                                      name="radio-button-on"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  ) : (
                                                    <Ionicons
                                                      name="radio-button-off"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  );
                                                }
                                              );
                                            } else {
                                              return (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color={bs_theme.primary}
                                                />
                                              );
                                            }
                                          })}
                                          <Text pl={1} color={bs_theme.text}>
                                            {list_item.item.label}
                                          </Text>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </Row>
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
                      return (
                        <Row flex={1} justifyContent={"flex-start"}>
                          {arrow(() => {
                            if (Array.isArray(value)) {
                              return (
                                <Pressable
                                  ml={"2"}
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text color={bs_theme.text}>{value[0]}</Text>
                                </Pressable>
                              );
                            } else {
                              return (
                                <>
                                  <Pressable onPress={() => setPicker1(true)}>
                                    <Text color={bs_theme.text}>
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
                                            "filter_path",
                                            props.and_filter,
                                            props.or_filter,
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
                            }
                          })}
                          {props.init_filter.filter_paths.anyMatch(
                            (filter_path) => {
                              switch (filter_path.value[0]) {
                                case "time": {
                                  if (!filter_path.equals(props.filter_path)) {
                                    return true;
                                  }
                                }
                              }
                              return false;
                            }
                          ) ? (
                            <Pressable
                              flexDirection={"row"}
                              alignItems={"center"}
                              pl={"1"}
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={bs_theme.text}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={0}
                            backgroundStyle={tw.style(["border"], {
                              backgroundColor: bs_theme.background,
                              borderColor: bs_theme.primary,
                            })}
                          >
                            <Row
                              justifyContent={"space-between"}
                              alignItems={"center"}
                              borderBottomColor={bs_theme.primary}
                              borderBottomWidth={"1"}
                              px={"3"}
                              pb={"2"}
                            >
                              <Text bold color={bs_theme.text}>
                                Fields
                              </Text>
                              <Row space={"1"}>
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filter_path",
                                      props.and_filter,
                                      props.or_filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, new Date()],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.forceClose();
                                  }}
                                  backgroundColor={bs_theme.primary}
                                  borderRadius={"xs"}
                                  px={"2"}
                                  py={"0.5"}
                                >
                                  <Text color={"white"}>Clear</Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.forceClose()
                                  }
                                  borderColor={bs_theme.primary}
                                  borderWidth={"1"}
                                  borderRadius={"xs"}
                                  px={"2"}
                                  py={"0.5"}
                                >
                                  <Text color={bs_theme.text}>Close</Text>
                                </Pressable>
                              </Row>
                            </Row>
                            <BottomSheetFlatList
                              contentContainerStyle={tw.style(["m-2"], {})}
                              data={props.init_filter.filter_paths
                                .toArray()
                                .filter((filter_path) => {
                                  switch (filter_path.value[0]) {
                                    case "time": {
                                      if (
                                        !filter_path.equals(props.filter_path)
                                      ) {
                                        return true;
                                      }
                                    }
                                  }
                                  return false;
                                })}
                              keyExtractor={(x) =>
                                get_flattened_path(x.path).join(".")
                              }
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    flex={1}
                                    flexDirection={"row"}
                                    py={"0.5"}
                                    onPress={() => {
                                      props.dispatch([
                                        "filter_path",
                                        props.and_filter,
                                        props.or_filter,
                                        "replace",
                                        apply(props.filter_path, (it) => {
                                          it.value = [
                                            field_struct_name,
                                            [
                                              op,
                                              [
                                                list_item.item.label,
                                                list_item.item.path,
                                              ],
                                            ],
                                          ];
                                          return it;
                                        }),
                                      ]);
                                      bottomSheetModalRef1.current?.forceClose();
                                    }}
                                  >
                                    {arrow(() => {
                                      if (Array.isArray(value)) {
                                        return apply(
                                          compare_paths(
                                            value[1],
                                            list_item.item.path
                                          ),
                                          (active) => {
                                            return active ? (
                                              <Ionicons
                                                name="radio-button-on"
                                                size={24}
                                                color={bs_theme.primary}
                                              />
                                            ) : (
                                              <Ionicons
                                                name="radio-button-off"
                                                size={24}
                                                color={bs_theme.primary}
                                              />
                                            );
                                          }
                                        );
                                      } else {
                                        return (
                                          <Ionicons
                                            name="radio-button-off"
                                            size={24}
                                            color={bs_theme.primary}
                                          />
                                        );
                                      }
                                    })}
                                    <Text pl={1} color={bs_theme.text}>
                                      {list_item.item.label}
                                    </Text>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </Row>
                      );
                    }
                    case "between":
                    case "not_between": {
                      const [value1, value2] = props.filter_path.value[1][1];
                      return (
                        <>
                          {arrow(() => {
                            const value = value1;
                            return (
                              <Row flex={1} justifyContent={"flex-start"}>
                                {arrow(() => {
                                  if (Array.isArray(value)) {
                                    return (
                                      <Pressable
                                        ml={"2"}
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.present()
                                        }
                                      >
                                        <Text color={bs_theme.text}>
                                          {value[0]}
                                        </Text>
                                      </Pressable>
                                    );
                                  } else {
                                    return (
                                      <>
                                        <Pressable
                                          onPress={() => setPicker1(true)}
                                        >
                                          <Text color={bs_theme.text}>
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
                                                setPicker1(
                                                  Platform.OS === "ios"
                                                );
                                                props.dispatch([
                                                  "filter_path",
                                                  props.and_filter,
                                                  props.or_filter,
                                                  "replace",
                                                  apply(
                                                    props.filter_path,
                                                    (it) => {
                                                      it.value = [
                                                        field_struct_name,
                                                        [
                                                          op,
                                                          [
                                                            date || new Date(),
                                                            value2,
                                                          ],
                                                        ],
                                                      ];
                                                      return it;
                                                    }
                                                  ),
                                                ]);
                                              }}
                                            />
                                          )}
                                        </>
                                      </>
                                    );
                                  }
                                })}
                                {props.init_filter.filter_paths.anyMatch(
                                  (filter_path) => {
                                    switch (filter_path.value[0]) {
                                      case "time": {
                                        if (
                                          !filter_path.equals(props.filter_path)
                                        ) {
                                          return true;
                                        }
                                      }
                                    }
                                    return false;
                                  }
                                ) ? (
                                  <Pressable
                                    flexDirection={"row"}
                                    alignItems={"center"}
                                    pl={"1"}
                                    onPress={() =>
                                      bottomSheetModalRef1.current?.present()
                                    }
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={bs_theme.text}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef1}
                                  snapPoints={["50%", "82%"]}
                                  index={0}
                                  backgroundStyle={tw.style(["border"], {
                                    backgroundColor: bs_theme.background,
                                    borderColor: bs_theme.primary,
                                  })}
                                >
                                  <Row
                                    justifyContent={"space-between"}
                                    alignItems={"center"}
                                    borderBottomColor={bs_theme.primary}
                                    borderBottomWidth={"1"}
                                    px={"3"}
                                    pb={"2"}
                                  >
                                    <Text bold color={bs_theme.text}>
                                      Fields
                                    </Text>
                                    <Row space={"1"}>
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filter_path",
                                            props.and_filter,
                                            props.or_filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [new Date(), value2]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef1.current?.forceClose();
                                        }}
                                        backgroundColor={bs_theme.primary}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={"white"}>Clear</Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.forceClose()
                                        }
                                        borderColor={bs_theme.primary}
                                        borderWidth={"1"}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={bs_theme.text}>Close</Text>
                                      </Pressable>
                                    </Row>
                                  </Row>
                                  <BottomSheetFlatList
                                    contentContainerStyle={tw.style(
                                      ["m-2"],
                                      {}
                                    )}
                                    data={props.init_filter.filter_paths
                                      .toArray()
                                      .filter((filter_path) => {
                                        switch (filter_path.value[0]) {
                                          case "time": {
                                            if (
                                              !filter_path.equals(
                                                props.filter_path
                                              )
                                            ) {
                                              return true;
                                            }
                                          }
                                        }
                                        return false;
                                      })}
                                    keyExtractor={(x) =>
                                      get_flattened_path(x.path).join(".")
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          flex={1}
                                          flexDirection={"row"}
                                          py={"0.5"}
                                          onPress={() => {
                                            props.dispatch([
                                              "filter_path",
                                              props.and_filter,
                                              props.or_filter,
                                              "replace",
                                              apply(props.filter_path, (it) => {
                                                it.value = [
                                                  field_struct_name,
                                                  [
                                                    op,
                                                    [
                                                      [
                                                        list_item.item.label,
                                                        list_item.item.path,
                                                      ],
                                                      value2,
                                                    ],
                                                  ],
                                                ];
                                                return it;
                                              }),
                                            ]);
                                            bottomSheetModalRef1.current?.forceClose();
                                          }}
                                        >
                                          {arrow(() => {
                                            if (Array.isArray(value)) {
                                              return apply(
                                                compare_paths(
                                                  value[1],
                                                  list_item.item.path
                                                ),
                                                (active) => {
                                                  return active ? (
                                                    <Ionicons
                                                      name="radio-button-on"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  ) : (
                                                    <Ionicons
                                                      name="radio-button-off"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  );
                                                }
                                              );
                                            } else {
                                              return (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color={bs_theme.primary}
                                                />
                                              );
                                            }
                                          })}
                                          <Text pl={1} color={bs_theme.text}>
                                            {list_item.item.label}
                                          </Text>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </Row>
                            );
                          })}
                          {arrow(() => {
                            const value = value2;
                            return (
                              <Row flex={1} justifyContent={"flex-start"}>
                                {arrow(() => {
                                  if (Array.isArray(value)) {
                                    return (
                                      <Pressable
                                        ml={"2"}
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.present()
                                        }
                                      >
                                        <Text color={bs_theme.text}>
                                          {value[0]}
                                        </Text>
                                      </Pressable>
                                    );
                                  } else {
                                    return (
                                      <>
                                        <Pressable
                                          onPress={() => setPicker2(true)}
                                        >
                                          <Text color={bs_theme.text}>
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
                                                setPicker2(
                                                  Platform.OS === "ios"
                                                );
                                                props.dispatch([
                                                  "filter_path",
                                                  props.and_filter,
                                                  props.or_filter,
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
                                                            date || new Date(),
                                                          ],
                                                        ],
                                                      ];
                                                      return it;
                                                    }
                                                  ),
                                                ]);
                                              }}
                                            />
                                          )}
                                        </>
                                      </>
                                    );
                                  }
                                })}
                                {props.init_filter.filter_paths.anyMatch(
                                  (filter_path) => {
                                    switch (filter_path.value[0]) {
                                      case "time": {
                                        if (
                                          !filter_path.equals(props.filter_path)
                                        ) {
                                          return true;
                                        }
                                      }
                                    }
                                    return false;
                                  }
                                ) ? (
                                  <Pressable
                                    flexDirection={"row"}
                                    alignItems={"center"}
                                    pl={"1"}
                                    onPress={() =>
                                      bottomSheetModalRef2.current?.present()
                                    }
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={bs_theme.text}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef2}
                                  snapPoints={["50%", "82%"]}
                                  index={0}
                                  backgroundStyle={tw.style(["border"], {
                                    backgroundColor: bs_theme.background,
                                    borderColor: bs_theme.primary,
                                  })}
                                >
                                  <Row
                                    justifyContent={"space-between"}
                                    alignItems={"center"}
                                    borderBottomColor={bs_theme.primary}
                                    borderBottomWidth={"1"}
                                    px={"3"}
                                    pb={"2"}
                                  >
                                    <Text bold color={bs_theme.text}>
                                      Fields
                                    </Text>
                                    <Row space={"1"}>
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filter_path",
                                            props.and_filter,
                                            props.or_filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [value1, new Date()]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef2.current?.forceClose();
                                        }}
                                        backgroundColor={bs_theme.primary}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={"white"}>Clear</Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.forceClose()
                                        }
                                        borderColor={bs_theme.primary}
                                        borderWidth={"1"}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={bs_theme.text}>Close</Text>
                                      </Pressable>
                                    </Row>
                                  </Row>
                                  <BottomSheetFlatList
                                    contentContainerStyle={tw.style(
                                      ["m-2"],
                                      {}
                                    )}
                                    data={props.init_filter.filter_paths
                                      .toArray()
                                      .filter((filter_path) => {
                                        switch (filter_path.value[0]) {
                                          case "time": {
                                            if (
                                              !filter_path.equals(
                                                props.filter_path
                                              )
                                            ) {
                                              return true;
                                            }
                                          }
                                        }
                                        return false;
                                      })}
                                    keyExtractor={(x) =>
                                      get_flattened_path(x.path).join(".")
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          flex={1}
                                          flexDirection={"row"}
                                          py={"0.5"}
                                          onPress={() => {
                                            props.dispatch([
                                              "filter_path",
                                              props.and_filter,
                                              props.or_filter,
                                              "replace",
                                              apply(props.filter_path, (it) => {
                                                it.value = [
                                                  field_struct_name,
                                                  [
                                                    op,
                                                    [
                                                      value1,
                                                      [
                                                        list_item.item.label,
                                                        list_item.item.path,
                                                      ],
                                                    ],
                                                  ],
                                                ];
                                                return it;
                                              }),
                                            ]);
                                            bottomSheetModalRef2.current?.forceClose();
                                          }}
                                        >
                                          {arrow(() => {
                                            if (Array.isArray(value)) {
                                              return apply(
                                                compare_paths(
                                                  value[1],
                                                  list_item.item.path
                                                ),
                                                (active) => {
                                                  return active ? (
                                                    <Ionicons
                                                      name="radio-button-on"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  ) : (
                                                    <Ionicons
                                                      name="radio-button-off"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  );
                                                }
                                              );
                                            } else {
                                              return (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color={bs_theme.primary}
                                                />
                                              );
                                            }
                                          })}
                                          <Text pl={1} color={bs_theme.text}>
                                            {list_item.item.label}
                                          </Text>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </Row>
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
                      return (
                        <Row flex={1} justifyContent={"flex-start"}>
                          {arrow(() => {
                            if (Array.isArray(value)) {
                              return (
                                <Pressable
                                  ml={"2"}
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text color={bs_theme.text}>{value[0]}</Text>
                                </Pressable>
                              );
                            } else {
                              return (
                                <>
                                  <Pressable onPress={() => setPicker1(true)}>
                                    <Text color={bs_theme.text}>
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
                                                "filter_path",
                                                props.and_filter,
                                                props.or_filter,
                                                "replace",
                                                apply(
                                                  props.filter_path,
                                                  (it) => {
                                                    it.value = [
                                                      field_struct_name,
                                                      [
                                                        op,
                                                        new Date(
                                                          date1.getTime()
                                                        ),
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
                            }
                          })}
                          {props.init_filter.filter_paths.anyMatch(
                            (filter_path) => {
                              switch (filter_path.value[0]) {
                                case "timestamp": {
                                  if (!filter_path.equals(props.filter_path)) {
                                    return true;
                                  }
                                }
                              }
                              return false;
                            }
                          ) ? (
                            <Pressable
                              flexDirection={"row"}
                              alignItems={"center"}
                              pl={"1"}
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={bs_theme.text}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={0}
                            backgroundStyle={tw.style(["border"], {
                              backgroundColor: bs_theme.background,
                              borderColor: bs_theme.primary,
                            })}
                          >
                            <Row
                              justifyContent={"space-between"}
                              alignItems={"center"}
                              borderBottomColor={bs_theme.primary}
                              borderBottomWidth={"1"}
                              px={"3"}
                              pb={"2"}
                            >
                              <Text bold color={bs_theme.text}>
                                Fields
                              </Text>
                              <Row space={"1"}>
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filter_path",
                                      props.and_filter,
                                      props.or_filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, new Date()],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.forceClose();
                                  }}
                                  backgroundColor={bs_theme.primary}
                                  borderRadius={"xs"}
                                  px={"2"}
                                  py={"0.5"}
                                >
                                  <Text color={"white"}>Clear</Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.forceClose()
                                  }
                                  borderColor={bs_theme.primary}
                                  borderWidth={"1"}
                                  borderRadius={"xs"}
                                  px={"2"}
                                  py={"0.5"}
                                >
                                  <Text color={bs_theme.text}>Close</Text>
                                </Pressable>
                              </Row>
                            </Row>
                            <BottomSheetFlatList
                              contentContainerStyle={tw.style(["m-2"], {})}
                              data={props.init_filter.filter_paths
                                .toArray()
                                .filter((filter_path) => {
                                  switch (filter_path.value[0]) {
                                    case "timestamp": {
                                      if (
                                        !filter_path.equals(props.filter_path)
                                      ) {
                                        return true;
                                      }
                                    }
                                  }
                                  return false;
                                })}
                              keyExtractor={(x) =>
                                get_flattened_path(x.path).join(".")
                              }
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    flex={1}
                                    flexDirection={"row"}
                                    py={"0.5"}
                                    onPress={() => {
                                      props.dispatch([
                                        "filter_path",
                                        props.and_filter,
                                        props.or_filter,
                                        "replace",
                                        apply(props.filter_path, (it) => {
                                          it.value = [
                                            field_struct_name,
                                            [
                                              op,
                                              [
                                                list_item.item.label,
                                                list_item.item.path,
                                              ],
                                            ],
                                          ];
                                          return it;
                                        }),
                                      ]);
                                      bottomSheetModalRef1.current?.forceClose();
                                    }}
                                  >
                                    {arrow(() => {
                                      if (Array.isArray(value)) {
                                        return apply(
                                          compare_paths(
                                            value[1],
                                            list_item.item.path
                                          ),
                                          (active) => {
                                            return active ? (
                                              <Ionicons
                                                name="radio-button-on"
                                                size={24}
                                                color={bs_theme.primary}
                                              />
                                            ) : (
                                              <Ionicons
                                                name="radio-button-off"
                                                size={24}
                                                color={bs_theme.primary}
                                              />
                                            );
                                          }
                                        );
                                      } else {
                                        return (
                                          <Ionicons
                                            name="radio-button-off"
                                            size={24}
                                            color={bs_theme.primary}
                                          />
                                        );
                                      }
                                    })}
                                    <Text pl={1} color={bs_theme.text}>
                                      {list_item.item.label}
                                    </Text>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </Row>
                      );
                    }
                    case "between":
                    case "not_between": {
                      const [value1, value2] = props.filter_path.value[1][1];
                      return (
                        <>
                          {arrow(() => {
                            const value = value1;
                            return (
                              <Row flex={1} justifyContent={"flex-start"}>
                                {arrow(() => {
                                  if (Array.isArray(value)) {
                                    return (
                                      <Pressable
                                        ml={"2"}
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.present()
                                        }
                                      >
                                        <Text color={bs_theme.text}>
                                          {value[0]}
                                        </Text>
                                      </Pressable>
                                    );
                                  } else {
                                    return (
                                      <>
                                        <Pressable
                                          onPress={() => setPicker1(true)}
                                        >
                                          <Text color={bs_theme.text}>
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
                                                setPicker1(
                                                  Platform.OS === "ios"
                                                );
                                                if (
                                                  selectedValue !== undefined
                                                ) {
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
                                                    setPicker1(
                                                      Platform.OS !== "ios"
                                                    );
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
                                                      "filter_path",
                                                      props.and_filter,
                                                      props.or_filter,
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
                                                  setDate1(
                                                    new Date(value.getTime())
                                                  );
                                                  setMode1("date");
                                                }
                                              }}
                                            />
                                          )}
                                        </>
                                      </>
                                    );
                                  }
                                })}
                                {props.init_filter.filter_paths.anyMatch(
                                  (filter_path) => {
                                    switch (filter_path.value[0]) {
                                      case "timestamp": {
                                        if (
                                          !filter_path.equals(props.filter_path)
                                        ) {
                                          return true;
                                        }
                                      }
                                    }
                                    return false;
                                  }
                                ) ? (
                                  <Pressable
                                    flexDirection={"row"}
                                    alignItems={"center"}
                                    pl={"1"}
                                    onPress={() =>
                                      bottomSheetModalRef1.current?.present()
                                    }
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={bs_theme.text}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef1}
                                  snapPoints={["50%", "82%"]}
                                  index={0}
                                  backgroundStyle={tw.style(["border"], {
                                    backgroundColor: bs_theme.background,
                                    borderColor: bs_theme.primary,
                                  })}
                                >
                                  <Row
                                    justifyContent={"space-between"}
                                    alignItems={"center"}
                                    borderBottomColor={bs_theme.primary}
                                    borderBottomWidth={"1"}
                                    px={"3"}
                                    pb={"2"}
                                  >
                                    <Text bold color={bs_theme.text}>
                                      Fields
                                    </Text>
                                    <Row space={"1"}>
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filter_path",
                                            props.and_filter,
                                            props.or_filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [new Date(), value2]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef1.current?.forceClose();
                                        }}
                                        backgroundColor={bs_theme.primary}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={"white"}>Clear</Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.forceClose()
                                        }
                                        borderColor={bs_theme.primary}
                                        borderWidth={"1"}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={bs_theme.text}>Close</Text>
                                      </Pressable>
                                    </Row>
                                  </Row>
                                  <BottomSheetFlatList
                                    contentContainerStyle={tw.style(
                                      ["m-2"],
                                      {}
                                    )}
                                    data={props.init_filter.filter_paths
                                      .toArray()
                                      .filter((filter_path) => {
                                        switch (filter_path.value[0]) {
                                          case "timestamp": {
                                            if (
                                              !filter_path.equals(
                                                props.filter_path
                                              )
                                            ) {
                                              return true;
                                            }
                                          }
                                        }
                                        return false;
                                      })}
                                    keyExtractor={(x) =>
                                      get_flattened_path(x.path).join(".")
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          flex={1}
                                          flexDirection={"row"}
                                          py={"0.5"}
                                          onPress={() => {
                                            props.dispatch([
                                              "filter_path",
                                              props.and_filter,
                                              props.or_filter,
                                              "replace",
                                              apply(props.filter_path, (it) => {
                                                it.value = [
                                                  field_struct_name,
                                                  [
                                                    op,
                                                    [
                                                      [
                                                        list_item.item.label,
                                                        list_item.item.path,
                                                      ],
                                                      value2,
                                                    ],
                                                  ],
                                                ];
                                                return it;
                                              }),
                                            ]);
                                            bottomSheetModalRef1.current?.forceClose();
                                          }}
                                        >
                                          {arrow(() => {
                                            if (Array.isArray(value)) {
                                              return apply(
                                                compare_paths(
                                                  value[1],
                                                  list_item.item.path
                                                ),
                                                (active) => {
                                                  return active ? (
                                                    <Ionicons
                                                      name="radio-button-on"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  ) : (
                                                    <Ionicons
                                                      name="radio-button-off"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  );
                                                }
                                              );
                                            } else {
                                              return (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color={bs_theme.primary}
                                                />
                                              );
                                            }
                                          })}
                                          <Text pl={1} color={bs_theme.text}>
                                            {list_item.item.label}
                                          </Text>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </Row>
                            );
                          })}
                          {arrow(() => {
                            const value = value2;
                            return (
                              <Row flex={1} justifyContent={"flex-start"}>
                                {arrow(() => {
                                  if (Array.isArray(value)) {
                                    return (
                                      <Pressable
                                        ml={"2"}
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.present()
                                        }
                                      >
                                        <Text color={bs_theme.text}>
                                          {value[0]}
                                        </Text>
                                      </Pressable>
                                    );
                                  } else {
                                    return (
                                      <>
                                        <Pressable
                                          onPress={() => setPicker2(true)}
                                        >
                                          <Text color={bs_theme.text}>
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
                                                setPicker2(
                                                  Platform.OS === "ios"
                                                );
                                                if (
                                                  selectedValue !== undefined
                                                ) {
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
                                                    setPicker2(
                                                      Platform.OS !== "ios"
                                                    );
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
                                                      "filter_path",
                                                      props.and_filter,
                                                      props.or_filter,
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
                                                  setDate2(
                                                    new Date(value.getTime())
                                                  );
                                                  setMode2("date");
                                                }
                                              }}
                                            />
                                          )}
                                        </>
                                      </>
                                    );
                                  }
                                })}
                                {props.init_filter.filter_paths.anyMatch(
                                  (filter_path) => {
                                    switch (filter_path.value[0]) {
                                      case "timestamp": {
                                        if (
                                          !filter_path.equals(props.filter_path)
                                        ) {
                                          return true;
                                        }
                                      }
                                    }
                                    return false;
                                  }
                                ) ? (
                                  <Pressable
                                    flexDirection={"row"}
                                    alignItems={"center"}
                                    pl={"1"}
                                    onPress={() =>
                                      bottomSheetModalRef2.current?.present()
                                    }
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={bs_theme.text}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef2}
                                  snapPoints={["50%", "82%"]}
                                  index={0}
                                  backgroundStyle={tw.style(["border"], {
                                    backgroundColor: bs_theme.background,
                                    borderColor: bs_theme.primary,
                                  })}
                                >
                                  <Row
                                    justifyContent={"space-between"}
                                    alignItems={"center"}
                                    borderBottomColor={bs_theme.primary}
                                    borderBottomWidth={"1"}
                                    px={"3"}
                                    pb={"2"}
                                  >
                                    <Text bold color={bs_theme.text}>
                                      Fields
                                    </Text>
                                    <Row space={"1"}>
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filter_path",
                                            props.and_filter,
                                            props.or_filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [value1, new Date()]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef2.current?.forceClose();
                                        }}
                                        backgroundColor={bs_theme.primary}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={"white"}>Clear</Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.forceClose()
                                        }
                                        borderColor={bs_theme.primary}
                                        borderWidth={"1"}
                                        borderRadius={"xs"}
                                        px={"2"}
                                        py={"0.5"}
                                      >
                                        <Text color={bs_theme.text}>Close</Text>
                                      </Pressable>
                                    </Row>
                                  </Row>
                                  <BottomSheetFlatList
                                    contentContainerStyle={tw.style(
                                      ["m-2"],
                                      {}
                                    )}
                                    data={props.init_filter.filter_paths
                                      .toArray()
                                      .filter((filter_path) => {
                                        switch (filter_path.value[0]) {
                                          case "timestamp": {
                                            if (
                                              !filter_path.equals(
                                                props.filter_path
                                              )
                                            ) {
                                              return true;
                                            }
                                          }
                                        }
                                        return false;
                                      })}
                                    keyExtractor={(x) =>
                                      get_flattened_path(x.path).join(".")
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          flex={1}
                                          flexDirection={"row"}
                                          py={"0.5"}
                                          onPress={() => {
                                            props.dispatch([
                                              "filter_path",
                                              props.and_filter,
                                              props.or_filter,
                                              "replace",
                                              apply(props.filter_path, (it) => {
                                                it.value = [
                                                  field_struct_name,
                                                  [
                                                    op,
                                                    [
                                                      value1,
                                                      [
                                                        list_item.item.label,
                                                        list_item.item.path,
                                                      ],
                                                    ],
                                                  ],
                                                ];
                                                return it;
                                              }),
                                            ]);
                                            bottomSheetModalRef2.current?.forceClose();
                                          }}
                                        >
                                          {arrow(() => {
                                            if (Array.isArray(value)) {
                                              return apply(
                                                compare_paths(
                                                  value[1],
                                                  list_item.item.path
                                                ),
                                                (active) => {
                                                  return active ? (
                                                    <Ionicons
                                                      name="radio-button-on"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  ) : (
                                                    <Ionicons
                                                      name="radio-button-off"
                                                      size={24}
                                                      color={bs_theme.primary}
                                                    />
                                                  );
                                                }
                                              );
                                            } else {
                                              return (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color={bs_theme.primary}
                                                />
                                              );
                                            }
                                          })}
                                          <Text pl={1} color={bs_theme.text}>
                                            {list_item.item.label}
                                          </Text>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </Row>
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
                      return (
                        <Row flex={1} justifyContent={"flex-start"}>
                          {arrow(() => {
                            if (Array.isArray(value)) {
                              return (
                                <Pressable
                                  ml={"2"}
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text color={bs_theme.text}>{value[0]}</Text>
                                </Pressable>
                              );
                            } else {
                              return (
                                <Input
                                  flex={1}
                                  ml={"2"}
                                  size={"md"}
                                  placeholder={props.filter_path.label}
                                  value={local_val_1}
                                  isInvalid={has_errors_1}
                                  keyboardType={get_decimal_keyboard_type(
                                    "u64"
                                  )}
                                  onChangeText={(x) => {
                                    try {
                                      set_local_val_1(x);
                                      const val = get_validated_decimal(
                                        "u64",
                                        x
                                      );
                                      set_has_errors_1(false);
                                      props.dispatch([
                                        "filter_path",
                                        props.and_filter,
                                        props.or_filter,
                                        "replace",
                                        apply(props.filter_path, (it) => {
                                          it.value = [
                                            field_struct_name,
                                            [op, val],
                                            other_struct,
                                          ];
                                          return it;
                                        }),
                                      ]);
                                    } catch (e) {
                                      set_has_errors_1(true);
                                    }
                                  }}
                                  InputRightElement={
                                    local_val_1 !== default_value_1 &&
                                    local_val_1 !== "" ? (
                                      <Pressable
                                        px={1}
                                        onPress={() => {
                                          try {
                                            const val = get_validated_decimal(
                                              "u64",
                                              default_value_1
                                            );
                                            set_local_val_1(default_value_1);
                                            set_has_errors_1(false);
                                            props.dispatch([
                                              "filter_path",
                                              props.and_filter,
                                              props.or_filter,
                                              "replace",
                                              apply(props.filter_path, (it) => {
                                                it.value = [
                                                  field_struct_name,
                                                  [op, val],
                                                  other_struct,
                                                ];
                                                return it;
                                              }),
                                            ]);
                                          } catch (e) {}
                                        }}
                                      >
                                        <MaterialIcons
                                          name="clear"
                                          size={24}
                                          color={bs_theme.placeholder}
                                        />
                                      </Pressable>
                                    ) : (
                                      <></>
                                    )
                                  }
                                  color={bs_theme.text}
                                  borderColor={bs_theme.border}
                                  placeholderTextColor={bs_theme.placeholder}
                                />
                              );
                            }
                          })}
                          {props.init_filter.filter_paths.anyMatch(
                            (filter_path) => {
                              switch (filter_path.value[0]) {
                                case "other": {
                                  if (
                                    !filter_path.equals(props.filter_path) &&
                                    filter_path.value[2].equals(other_struct)
                                  ) {
                                    return true;
                                  }
                                }
                              }
                              return false;
                            }
                          ) ? (
                            <Pressable
                              flexDirection={"row"}
                              alignItems={"center"}
                              pl={"1"}
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={bs_theme.text}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={0}
                            backgroundStyle={tw.style(["border"], {
                              backgroundColor: bs_theme.background,
                              borderColor: bs_theme.primary,
                            })}
                          >
                            <Row
                              justifyContent={"space-between"}
                              alignItems={"center"}
                              borderBottomColor={bs_theme.primary}
                              borderBottomWidth={"1"}
                              px={"3"}
                              pb={"2"}
                            >
                              <Text bold color={bs_theme.text}>
                                Fields
                              </Text>
                              <Row space={"1"}>
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filter_path",
                                      props.and_filter,
                                      props.or_filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, new Decimal(0)],
                                          other_struct,
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.forceClose();
                                  }}
                                  backgroundColor={bs_theme.primary}
                                  borderRadius={"xs"}
                                  px={"2"}
                                  py={"0.5"}
                                >
                                  <Text color={"white"}>Clear</Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.forceClose()
                                  }
                                  borderColor={bs_theme.primary}
                                  borderWidth={"1"}
                                  borderRadius={"xs"}
                                  px={"2"}
                                  py={"0.5"}
                                >
                                  <Text color={bs_theme.text}>Close</Text>
                                </Pressable>
                              </Row>
                            </Row>
                            <BottomSheetFlatList
                              contentContainerStyle={tw.style(["m-2"], {})}
                              data={props.init_filter.filter_paths
                                .toArray()
                                .filter((filter_path) => {
                                  switch (filter_path.value[0]) {
                                    case "other": {
                                      if (
                                        !filter_path.equals(
                                          props.filter_path
                                        ) &&
                                        filter_path.value[2].equals(
                                          other_struct
                                        )
                                      ) {
                                        return true;
                                      }
                                    }
                                  }
                                  return false;
                                })}
                              keyExtractor={(x) =>
                                get_flattened_path(x.path).join(".")
                              }
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    flex={1}
                                    flexDirection={"row"}
                                    py={"0.5"}
                                    onPress={() => {
                                      props.dispatch([
                                        "filter_path",
                                        props.and_filter,
                                        props.or_filter,
                                        "replace",
                                        apply(props.filter_path, (it) => {
                                          it.value = [
                                            field_struct_name,
                                            [
                                              op,
                                              [
                                                list_item.item.label,
                                                list_item.item.path,
                                              ],
                                            ],
                                            other_struct,
                                          ];
                                          return it;
                                        }),
                                      ]);
                                      bottomSheetModalRef1.current?.forceClose();
                                    }}
                                  >
                                    {arrow(() => {
                                      if (Array.isArray(value)) {
                                        return apply(
                                          compare_paths(
                                            value[1],
                                            list_item.item.path
                                          ),
                                          (active) => {
                                            return active ? (
                                              <Ionicons
                                                name="radio-button-on"
                                                size={24}
                                                color={bs_theme.primary}
                                              />
                                            ) : (
                                              <Ionicons
                                                name="radio-button-off"
                                                size={24}
                                                color={bs_theme.primary}
                                              />
                                            );
                                          }
                                        );
                                      } else {
                                        return (
                                          <Ionicons
                                            name="radio-button-off"
                                            size={24}
                                            color={bs_theme.primary}
                                          />
                                        );
                                      }
                                    })}
                                    <Text pl={1} color={bs_theme.text}>
                                      {list_item.item.label}
                                    </Text>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </Row>
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
              default: {
                const _exhaustiveCheck: never = field_struct_name;
                return _exhaustiveCheck;
              }
            }
          })}
        </Row>
      </Column>
    );
  }
  return <></>;
}
