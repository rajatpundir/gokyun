import React, { useRef, useState } from "react";
import { Filter, FilterPath } from "../../main/utils/db";
import {
  View as DefaultView,
  ViewProps,
  Text,
  TextInput,
} from "../../main/themed";
import Decimal from "decimal.js";
import { Platform, Pressable } from "react-native";
import { apply, arrow, is_decimal } from "../../main/utils/prelude";
import moment from "moment";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AntDesign, Entypo, FontAwesome, Ionicons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { ListAction } from "./list";
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Picker } from "@react-native-picker/picker";
import { compare_paths } from "../../main/utils/variable";
import { colors } from "../../main/themed/colors";

// For fields.tsx, test TextInput for long values of text
// Also cross button should reset value to default for that key in case of text and decimal fields

// TODO. To resolve deciaml exception, do below.
// Store value in internal state and show it, try to dispatch on change
// Copy changes for text and numeric fields over from fields.tsx

function View(props: ViewProps) {
  const { style, ...otherProps } = props;
  return (
    <DefaultView
      style={[
        {
          backgroundColor: colors.custom.black[900],
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 3,
          marginBottom: 1,
          paddingVertical: 0,
          borderColor: colors.tailwind.gray[500],
          // borderWidth: 1,
        },
        style,
      ]}
      {...otherProps}
    />
  );
}

export function SortComponent(props: {
  init_filter: Filter;
  dispatch: React.Dispatch<ListAction>;
}) {
  return (
    <BottomSheetScrollView
      contentContainerStyle={{
        flexDirection: "column",
        justifyContent: "flex-start",
        margin: 5,
      }}
    >
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
        .map((filter_path, index) => {
          const ordering = filter_path.ordering;
          if (ordering !== undefined) {
            return (
              <View
                key={index}
                style={{
                  justifyContent: "flex-start",
                  marginHorizontal: 5,
                  marginVertical: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: "column",
                  }}
                >
                  <Pressable
                    onPress={() => props.dispatch(["sort", "up", filter_path])}
                    style={{ marginBottom: -4 }}
                  >
                    <FontAwesome
                      name="sort-up"
                      size={24}
                      color={colors.tailwind.slate[400]}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      props.dispatch(["sort", "down", filter_path])
                    }
                    style={{ marginTop: -4 }}
                  >
                    <FontAwesome
                      name="sort-down"
                      size={24}
                      color={colors.tailwind.slate[400]}
                    />
                  </Pressable>
                </View>
                <View style={{ flexGrow: 1 }}>
                  <Pressable
                    onPress={() =>
                      props.dispatch(["sort", "toggle", filter_path])
                    }
                    style={{ paddingLeft: 10 }}
                  >
                    <Text>{filter_path.label}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      props.dispatch(["sort", "toggle", filter_path])
                    }
                    style={{
                      alignSelf: "center",
                      borderWidth: 1,
                      borderRadius: 5,
                      borderColor: colors.tailwind.slate[400],
                    }}
                  >
                    {arrow(() => {
                      if (ordering[1]) {
                        return (
                          <AntDesign
                            name="arrowdown"
                            size={24}
                            color={colors.tailwind.slate[400]}
                          />
                        );
                      } else {
                        return (
                          <AntDesign
                            name="arrowup"
                            size={24}
                            color={colors.tailwind.slate[400]}
                          />
                        );
                      }
                    })}
                  </Pressable>
                </View>
              </View>
            );
          }
          return <></>;
        })}
    </BottomSheetScrollView>
  );
}

export function SortComponentFields(props: {
  init_filter: Filter;
  dispatch: React.Dispatch<ListAction>;
}) {
  return (
    <BottomSheetScrollView
      contentContainerStyle={{
        flexDirection: "column",
        justifyContent: "flex-start",
        margin: 5,
      }}
    >
      {props.init_filter.filter_paths
        .toArray()
        .sort((a, b) => (a.label > b.label ? 1 : a.label < b.label ? -1 : 0))
        .map((filter_path, index) => {
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
              key={index}
              onPress={() => toggle(!active)}
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "flex-start",
                marginHorizontal: 5,
                marginVertical: 5,
              }}
            >
              {active ? (
                <Ionicons name="radio-button-on" size={24} color="red" />
              ) : (
                <Ionicons name="radio-button-off" size={24} color="red" />
              )}
              <Text style={{ paddingLeft: 10 }}>{filter_path.label}</Text>
            </Pressable>
          );
        })}
    </BottomSheetScrollView>
  );
}

export function FilterComponent(props: {
  init_filter: Filter;
  filter: Filter;
  dispatch: React.Dispatch<ListAction>;
}): JSX.Element {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  return (
    <View
      style={{
        flexDirection: "column",
        paddingHorizontal: 0,
      }}
    >
      <View>
        <View
          style={{
            justifyContent: "flex-start",
            paddingHorizontal: 5,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "200",
            }}
          >
            Filter {props.filter.index + 1}
          </Text>
          <Pressable
            onPress={() => props.dispatch(["filter", "remove", props.filter])}
            style={{
              padding: 3,
            }}
          >
            <Entypo name="cross" size={24} color={colors.tailwind.slate[400]} />
          </Pressable>
        </View>
        <Pressable
          onPress={() => bottomSheetModalRef.current?.present()}
          style={{
            padding: 3,
          }}
        >
          <Text
            style={{
              backgroundColor: colors.custom.blue[900],
              alignSelf: "flex-end",
              paddingHorizontal: 6,
              paddingVertical: 2,
              fontWeight: "bold",
              marginRight: 4,
              color: "white",
              borderRadius: 2,
            }}
          >
            Field++
          </Text>
        </Pressable>

        <BottomSheetModal
          ref={bottomSheetModalRef}
          snapPoints={["50%", "82%"]}
          index={1}
          backgroundStyle={{
            backgroundColor: colors.custom.black[900],
            borderColor: colors.tailwind.gray[500],
            borderWidth: 1,
          }}
        >
          <View
            style={{
              paddingBottom: 10,
              marginHorizontal: 1,
              paddingHorizontal: 8,
              borderBottomWidth: 1,
              backgroundColor: colors.custom.black[900],
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Fields
            </Text>
            <Pressable
              onPress={() => bottomSheetModalRef.current?.close()}
              style={{ paddingRight: 8 }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  textAlign: "center",
                  paddingHorizontal: 5,
                  paddingVertical: 2,
                  borderRadius: 2,
                  backgroundColor: colors.custom.red[900],
                }}
              >
                Close
              </Text>
            </Pressable>
          </View>
          <BottomSheetScrollView
            contentContainerStyle={{
              flexDirection: "column",
              justifyContent: "flex-start",
              margin: 5,
            }}
          >
            {arrow(() => {
              const active = props.filter.id[1] !== undefined;
              const toggle = (x: boolean) => {
                props.dispatch([
                  "filter",
                  "replace",
                  apply(props.filter, (it) => {
                    it.id = [false, x ? ["==", new Decimal(0)] : undefined];
                    return it;
                  }),
                ]);
              };
              return (
                <Pressable
                  onPress={() => toggle(!active)}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    marginHorizontal: 5,
                    marginVertical: 5,
                  }}
                >
                  {active ? (
                    <Ionicons name="radio-button-on" size={24} color="red" />
                  ) : (
                    <Ionicons name="radio-button-off" size={24} color="red" />
                  )}
                  <Text style={{ paddingLeft: 10 }}>Unique ID</Text>
                </Pressable>
              );
            })}
            {arrow(() => {
              const active = props.filter.created_at[1] !== undefined;
              const toggle = (x: boolean) => {
                props.dispatch([
                  "filter",
                  "replace",
                  apply(props.filter, (it) => {
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
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    marginHorizontal: 5,
                    marginVertical: 5,
                  }}
                >
                  {active ? (
                    <Ionicons name="radio-button-on" size={24} color="red" />
                  ) : (
                    <Ionicons name="radio-button-off" size={24} color="red" />
                  )}
                  <Text style={{ paddingLeft: 10 }}>Created</Text>
                </Pressable>
              );
            })}
            {arrow(() => {
              const active = props.filter.updated_at[1] !== undefined;
              const toggle = (x: boolean) => {
                props.dispatch([
                  "filter",
                  "replace",
                  apply(props.filter, (it) => {
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
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    marginHorizontal: 5,
                    marginVertical: 5,
                  }}
                >
                  {active ? (
                    <Ionicons name="radio-button-on" size={24} color="red" />
                  ) : (
                    <Ionicons name="radio-button-off" size={24} color="red" />
                  )}
                  <Text style={{ paddingLeft: 10 }}>Updated</Text>
                </Pressable>
              );
            })}
            {props.init_filter.filter_paths
              .toArray()
              .sort((a, b) =>
                a.label > b.label ? 1 : a.label < b.label ? -1 : 0
              )
              .map((filter_path, index) => {
                const field_struct_type = filter_path.value[0];
                const active = props.filter.filter_paths.anyMatch(
                  (x) => x.equals(filter_path) && x.value[1] !== undefined
                );
                const toggle = (x: boolean) => {
                  switch (field_struct_type) {
                    case "str":
                    case "lstr":
                    case "clob": {
                      props.dispatch([
                        "filters",
                        props.filter,
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
                        "filters",
                        props.filter,
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
                        "filters",
                        props.filter,
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
                        "filters",
                        props.filter,
                        "replace",
                        new FilterPath(
                          filter_path.label,
                          filter_path.path,
                          [
                            field_struct_type,
                            x
                              ? ["between", [new Date(), new Date()]]
                              : undefined,
                          ],
                          undefined
                        ),
                      ]);
                      break;
                    }
                    case "other": {
                      const other_struct = filter_path.value[2];
                      props.dispatch([
                        "filters",
                        props.filter,
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
                    key={index}
                    onPress={() => toggle(!active)}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      justifyContent: "flex-start",
                      marginHorizontal: 5,
                      marginVertical: 5,
                    }}
                  >
                    {active ? (
                      <Ionicons name="radio-button-on" size={24} color="red" />
                    ) : (
                      <Ionicons name="radio-button-off" size={24} color="red" />
                    )}
                    <Text style={{ paddingLeft: 10 }}>{filter_path.label}</Text>
                  </Pressable>
                );
              })}
          </BottomSheetScrollView>
        </BottomSheetModal>
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: "column",
          borderBottomWidth: 1,
          paddingHorizontal: 4,
          paddingBottom: 10,
        }}
      >
        <View
          style={{
            flexDirection: "column",
            paddingHorizontal: 0,
          }}
        >
          <View
            style={{
              flexDirection: "column",
            }}
          >
            {arrow(() => {
              const [selectedOp, setSelectedOp] = useState(
                props.filter.id[1] ? props.filter.id[1][0] : "=="
              );
              const [active, value] = props.filter.id;
              const toggle = (x: boolean) => {
                props.dispatch([
                  "filter",
                  "replace",
                  apply(props.filter, (it) => {
                    it.id[0] = x;
                    return it;
                  }),
                ]);
              };
              if (value !== undefined) {
                return (
                  <View
                    style={{
                      justifyContent: "space-between",
                    }}
                  >
                    <View>
                      <Checkbox
                        value={active}
                        onValueChange={() => toggle(!active)}
                        color={active ? colors.custom.red[900] : undefined}
                        style={{
                          alignSelf: "center",
                          marginRight: 6,
                        }}
                      />
                      <Pressable
                        onPress={() => toggle(!active)}
                        style={{ alignSelf: "center" }}
                      >
                        <Text
                          style={{
                            color: colors.tailwind.slate[400],
                          }}
                        >
                          Unique ID
                        </Text>
                      </Pressable>
                    </View>
                    <View
                      style={{
                        flexDirection: "row-reverse",
                        flexGrow: 1,
                        alignSelf: "center",
                      }}
                    >
                      {arrow(() => {
                        const value = props.filter.id[1];
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
                          return (
                            <View
                              style={{
                                borderWidth: 1,
                                borderRadius: 5,
                                paddingHorizontal: 0,
                                paddingVertical: 0,
                                marginHorizontal: 0,
                                marginVertical: 0,
                              }}
                            >
                              <Picker
                                selectedValue={selectedOp}
                                onValueChange={(op, _) => {
                                  switch (op) {
                                    case "==":
                                    case "!=":
                                    case ">=":
                                    case "<=":
                                    case ">":
                                    case "<": {
                                      props.dispatch([
                                        "filter",
                                        "replace",
                                        apply(props.filter, (it) => {
                                          it.id[1] = [op, v1];
                                          return it;
                                        }),
                                      ]);
                                      break;
                                    }
                                    case "between":
                                    case "not_between": {
                                      props.dispatch([
                                        "filter",
                                        "replace",
                                        apply(props.filter, (it) => {
                                          it.id[1] = [op, [v1, v2]];
                                          return it;
                                        }),
                                      ]);
                                      break;
                                    }
                                  }
                                  setSelectedOp(op);
                                }}
                                dropdownIconColor={colors.tailwind.slate[400]}
                                style={{
                                  width: 185,
                                  color: colors.tailwind.slate[400],
                                }}
                              >
                                <Picker.Item label="equals" value="==" />
                                <Picker.Item label="not equals" value="!=" />
                                <Picker.Item
                                  label="greater or equals"
                                  value=">="
                                />
                                <Picker.Item
                                  label="less or equals"
                                  value="<="
                                />
                                <Picker.Item label="greater than" value=">" />
                                <Picker.Item label="less than" value="<" />
                                <Picker.Item label="between" value="between" />
                                <Picker.Item
                                  label="not between"
                                  value="not_between"
                                />
                              </Picker>
                            </View>
                          );
                        }
                        return <></>;
                      })}
                    </View>
                  </View>
                );
              }
              return null;
            })}
            {arrow(() => {
              const value = props.filter.id[1];
              if (value !== undefined) {
                return (
                  <View
                    style={{
                      justifyContent: "flex-start",
                      paddingLeft: 33,
                    }}
                  >
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
                            <TextInput
                              keyboardType={"number-pad"}
                              defaultValue={value[1].toString()}
                              onChangeText={(x) =>
                                props.dispatch([
                                  "filter",
                                  "replace",
                                  apply(props.filter, (it) => {
                                    it.id[1] = [
                                      op,
                                      new Decimal(x || "0").truncated().abs(),
                                    ];
                                    return it;
                                  }),
                                ])
                              }
                            />
                          );
                        }
                        case "between":
                        case "not_between": {
                          return (
                            <>
                              <TextInput
                                keyboardType={"number-pad"}
                                defaultValue={value[1][0].toString()}
                                onChangeText={(x) =>
                                  props.dispatch([
                                    "filter",
                                    "replace",
                                    apply(props.filter, (it) => {
                                      it.id[1] = [
                                        op,
                                        [
                                          new Decimal(x || "0")
                                            .truncated()
                                            .abs(),
                                          value[1][1],
                                        ],
                                      ];
                                      return it;
                                    }),
                                  ])
                                }
                              />
                              <TextInput
                                keyboardType={"number-pad"}
                                defaultValue={value[1][1].toString()}
                                onChangeText={(x) =>
                                  props.dispatch([
                                    "filter",
                                    "replace",
                                    apply(props.filter, (it) => {
                                      it.id[1] = [
                                        op,
                                        [
                                          value[1][0],
                                          new Decimal(x || "0")
                                            .truncated()
                                            .abs(),
                                        ],
                                      ];
                                      return it;
                                    }),
                                  ])
                                }
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
                );
              }
              return null;
            })}
          </View>

          <View
            style={{
              flexDirection: "column",
            }}
          >
            {arrow(() => {
              const [selectedOp, setSelectedOp] = useState(
                props.filter.created_at[1]
                  ? props.filter.created_at[1][0]
                  : "between"
              );
              const [active, value] = props.filter.created_at;
              const toggle = (x: boolean) => {
                props.dispatch([
                  "filter",
                  "replace",
                  apply(props.filter, (it) => {
                    it.created_at[0] = x;
                    return it;
                  }),
                ]);
              };
              if (value !== undefined) {
                return (
                  <View
                    style={{
                      justifyContent: "space-between",
                    }}
                  >
                    <View>
                      <Checkbox
                        value={active}
                        onValueChange={() => toggle(!active)}
                        color={active ? colors.custom.red[900] : undefined}
                        style={{
                          alignSelf: "center",
                          marginRight: 6,
                        }}
                      />
                      <Pressable
                        onPress={() => toggle(!active)}
                        style={{ alignSelf: "center" }}
                      >
                        <Text
                          style={{
                            color: colors.tailwind.slate[400],
                          }}
                        >
                          Created
                        </Text>
                      </Pressable>
                    </View>
                    <View
                      style={{
                        flexDirection: "row-reverse",
                        flexGrow: 1,
                        alignSelf: "center",
                      }}
                    >
                      {arrow(() => {
                        const value = props.filter.created_at[1];
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
                          return (
                            <View
                              style={{
                                borderWidth: 1,
                                borderRadius: 5,
                                paddingHorizontal: 0,
                                paddingVertical: 0,
                                marginHorizontal: 0,
                                marginVertical: 0,
                              }}
                            >
                              <Picker
                                selectedValue={selectedOp}
                                onValueChange={(op, _) => {
                                  switch (op) {
                                    case "==":
                                    case "!=":
                                    case ">=":
                                    case "<=":
                                    case ">":
                                    case "<": {
                                      props.dispatch([
                                        "filter",
                                        "replace",
                                        apply(props.filter, (it) => {
                                          it.created_at[1] = [op, v1];
                                          return it;
                                        }),
                                      ]);
                                      break;
                                    }
                                    case "between":
                                    case "not_between": {
                                      props.dispatch([
                                        "filter",
                                        "replace",
                                        apply(props.filter, (it) => {
                                          it.created_at[1] = [op, [v1, v2]];
                                          return it;
                                        }),
                                      ]);
                                      break;
                                    }
                                  }
                                  setSelectedOp(op);
                                }}
                                dropdownIconColor={colors.tailwind.slate[400]}
                                style={{
                                  width: 185,
                                  color: colors.tailwind.slate[400],
                                }}
                              >
                                <Picker.Item label="equals" value="==" />
                                <Picker.Item label="not equals" value="!=" />
                                <Picker.Item
                                  label="greater or equals"
                                  value=">="
                                />
                                <Picker.Item
                                  label="less or equals"
                                  value="<="
                                />
                                <Picker.Item label="greater than" value=">" />
                                <Picker.Item label="less than" value="<" />
                                <Picker.Item label="between" value="between" />
                                <Picker.Item
                                  label="not between"
                                  value="not_between"
                                />
                              </Picker>
                            </View>
                          );
                        }
                        return <></>;
                      })}
                    </View>
                  </View>
                );
              }
              return null;
            })}
            {arrow(() => {
              const value = props.filter.created_at[1];
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
                      justifyContent: "space-between",
                      flexShrink: 1,
                      paddingVertical: 10,
                    }}
                  >
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
                            <>
                              <Pressable onPress={() => setPicker1(true)}>
                                <Text>
                                  {moment(value[1]).format(
                                    "Do MMM YYYY, h:mm A"
                                  )}
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
                                            "filter",
                                            "replace",
                                            apply(props.filter, (it) => {
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
                              </>
                            </>
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
                                            "filter",
                                            "replace",
                                            apply(props.filter, (it) => {
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
                              </>
                              <Pressable
                                onPress={() => setPicker2(true)}
                                style={{ flexShrink: 1 }}
                              >
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
                                            "filter",
                                            "replace",
                                            apply(props.filter, (it) => {
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
                );
              }
              return null;
            })}
          </View>

          <View
            style={{
              flexDirection: "column",
            }}
          >
            {arrow(() => {
              const [selectedOp, setSelectedOp] = useState(
                props.filter.updated_at[1]
                  ? props.filter.updated_at[1][0]
                  : "between"
              );
              const [active, value] = props.filter.updated_at;
              const toggle = (x: boolean) => {
                props.dispatch([
                  "filter",
                  "replace",
                  apply(props.filter, (it) => {
                    it.updated_at[0] = x;
                    return it;
                  }),
                ]);
              };
              if (value !== undefined) {
                return (
                  <View
                    style={{
                      justifyContent: "space-between",
                    }}
                  >
                    <View>
                      <Checkbox
                        value={active}
                        onValueChange={() => toggle(!active)}
                        color={active ? colors.custom.red[900] : undefined}
                        style={{
                          alignSelf: "center",
                          marginRight: 6,
                        }}
                      />
                      <Pressable
                        onPress={() => toggle(!active)}
                        style={{ alignSelf: "center" }}
                      >
                        <Text
                          style={{
                            color: colors.tailwind.slate[400],
                          }}
                        >
                          Updated
                        </Text>
                      </Pressable>
                    </View>
                    <View
                      style={{
                        flexDirection: "row-reverse",
                        flexGrow: 1,
                        alignSelf: "center",
                      }}
                    >
                      {arrow(() => {
                        const value = props.filter.updated_at[1];
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
                          return (
                            <View
                              style={{
                                borderWidth: 1,
                                borderRadius: 5,
                                paddingHorizontal: 0,
                                paddingVertical: 0,
                                marginHorizontal: 0,
                                marginVertical: 0,
                              }}
                            >
                              <Picker
                                selectedValue={selectedOp}
                                onValueChange={(op, _) => {
                                  switch (op) {
                                    case "==":
                                    case "!=":
                                    case ">=":
                                    case "<=":
                                    case ">":
                                    case "<": {
                                      props.dispatch([
                                        "filter",
                                        "replace",
                                        apply(props.filter, (it) => {
                                          it.updated_at[1] = [op, v1];
                                          return it;
                                        }),
                                      ]);
                                      break;
                                    }
                                    case "between":
                                    case "not_between": {
                                      props.dispatch([
                                        "filter",
                                        "replace",
                                        apply(props.filter, (it) => {
                                          it.updated_at[1] = [op, [v1, v2]];
                                          return it;
                                        }),
                                      ]);
                                      break;
                                    }
                                  }
                                  setSelectedOp(op);
                                }}
                                dropdownIconColor={colors.tailwind.slate[400]}
                                style={{
                                  width: 185,
                                  color: colors.tailwind.slate[400],
                                }}
                              >
                                <Picker.Item label="equals" value="==" />
                                <Picker.Item label="not equals" value="!=" />
                                <Picker.Item
                                  label="greater or equals"
                                  value=">="
                                />
                                <Picker.Item
                                  label="less or equals"
                                  value="<="
                                />
                                <Picker.Item label="greater than" value=">" />
                                <Picker.Item label="less than" value="<" />
                                <Picker.Item label="between" value="between" />
                                <Picker.Item
                                  label="not between"
                                  value="not_between"
                                />
                              </Picker>
                            </View>
                          );
                        }
                        return <></>;
                      })}
                    </View>
                  </View>
                );
              }
              return null;
            })}
            {arrow(() => {
              const value = props.filter.updated_at[1];
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
                      justifyContent: "space-between",
                      flexShrink: 1,
                      paddingVertical: 10,
                    }}
                  >
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
                            <>
                              <Pressable onPress={() => setPicker1(true)}>
                                <Text>
                                  {moment(value[1]).format(
                                    "Do MMM YYYY, h:mm A"
                                  )}
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
                                            "filter",
                                            "replace",
                                            apply(props.filter, (it) => {
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
                              </>
                            </>
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
                                            "filter",
                                            "replace",
                                            apply(props.filter, (it) => {
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
                              </>
                              <Pressable
                                onPress={() => setPicker2(true)}
                                style={{ flexShrink: 1 }}
                              >
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
                                            "filter",
                                            "replace",
                                            apply(props.filter, (it) => {
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
                );
              }
              return null;
            })}
          </View>
          {props.filter.filter_paths
            .toArray()
            .sort((a, b) =>
              a.label > b.label ? 1 : a.label < b.label ? -1 : 0
            )
            .map((x, index) => {
              return (
                <FilterPathComponent
                  key={index}
                  init_filter={props.init_filter}
                  filter_path={x}
                  filter={props.filter}
                  dispatch={props.dispatch}
                />
              );
            })}
        </View>
      </View>
    </View>
  );
}

function FilterPathComponent(props: {
  init_filter: Filter;
  filter_path: FilterPath;
  filter: Filter;
  dispatch: React.Dispatch<ListAction>;
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
  const bottomSheetModalRef1 = useRef<BottomSheetModal>(null);
  const bottomSheetModalRef2 = useRef<BottomSheetModal>(null);
  return (
    <View style={{ flexDirection: "column", paddingHorizontal: 0 }}>
      {arrow(() => {
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
        if (props.filter_path.value[1] !== undefined) {
          const toggle = (x: boolean) => {
            props.dispatch([
              "filters",
              props.filter,
              "replace",
              apply(props.filter_path, (it) => {
                it.active = x;
                return it;
              }),
            ]);
          };
          return (
            <View
              style={{
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexShrink: 1 }}>
                <Checkbox
                  value={props.filter_path.active}
                  onValueChange={() => toggle(!props.filter_path.active)}
                  color={
                    props.filter_path.active
                      ? colors.custom.red[900]
                      : undefined
                  }
                  style={{
                    alignSelf: "center",
                    marginRight: 6,
                  }}
                />
                <Pressable
                  onPress={() => toggle(!props.filter_path.active)}
                  style={{ alignSelf: "center" }}
                >
                  <Text
                    style={{
                      color: colors.tailwind.slate[400],
                    }}
                  >
                    {props.filter_path.label}
                  </Text>
                </Pressable>
              </View>
              <View
                style={{
                  flexDirection: "row-reverse",
                  flexGrow: 1,
                  alignSelf: "center",
                }}
              >
                {arrow(() => {
                  const field_struct_name = props.filter_path.value[0];
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
                        return (
                          <View
                            style={{
                              borderWidth: 1,
                              borderRadius: 5,
                              paddingHorizontal: 0,
                              paddingVertical: 0,
                              marginHorizontal: 0,
                              marginVertical: 0,
                            }}
                          >
                            <Picker
                              selectedValue={selectedOp}
                              onValueChange={(op, _) => {
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
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, v1],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    break;
                                  }
                                  case "between":
                                  case "not_between": {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, [v1, v2]],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    break;
                                  }
                                }
                                setSelectedOp(op);
                              }}
                              dropdownIconColor={colors.tailwind.slate[400]}
                              style={{
                                width: 185,
                                color: colors.tailwind.slate[400],
                              }}
                            >
                              <Picker.Item label="match" value="like" />
                              <Picker.Item
                                label="match(case sensitive)"
                                value="glob"
                              />
                              <Picker.Item label="equals" value="==" />
                              <Picker.Item label="not equals" value="!=" />
                              <Picker.Item
                                label="greater or equals"
                                value=">="
                              />
                              <Picker.Item label="less or equals" value="<=" />
                              <Picker.Item label="greater than" value=">" />
                              <Picker.Item label="less than" value="<" />
                              <Picker.Item label="between" value="between" />
                              <Picker.Item
                                label="not between"
                                value="not_between"
                              />
                            </Picker>
                          </View>
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
                        return (
                          <View
                            style={{
                              borderWidth: 1,
                              borderRadius: 5,
                              paddingHorizontal: 0,
                              paddingVertical: 0,
                              marginHorizontal: 0,
                              marginVertical: 0,
                            }}
                          >
                            <Picker
                              selectedValue={selectedOp}
                              onValueChange={(op, _) => {
                                switch (op) {
                                  case "==":
                                  case "!=":
                                  case ">=":
                                  case "<=":
                                  case ">":
                                  case "<": {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, v1],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    break;
                                  }
                                  case "between":
                                  case "not_between": {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, [v1, v2]],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    break;
                                  }
                                }
                                setSelectedOp(op);
                              }}
                              dropdownIconColor={colors.tailwind.slate[400]}
                              style={{
                                width: 185,
                                color: colors.tailwind.slate[400],
                              }}
                            >
                              <Picker.Item label="equals" value="==" />
                              <Picker.Item label="not equals" value="!=" />
                              <Picker.Item
                                label="greater or equals"
                                value=">="
                              />
                              <Picker.Item label="less or equals" value="<=" />
                              <Picker.Item label="greater than" value=">" />
                              <Picker.Item label="less than" value="<" />
                              <Picker.Item label="between" value="between" />
                              <Picker.Item
                                label="not between"
                                value="not_between"
                              />
                            </Picker>
                          </View>
                        );
                      }
                      return <></>;
                    }
                    case "bool": {
                      if (props.filter_path.value[1] !== undefined) {
                        const value = props.filter_path.value[1];
                        return (
                          <View
                            style={{
                              borderWidth: 1,
                              borderRadius: 5,
                              paddingHorizontal: 0,
                              paddingVertical: 0,
                              marginHorizontal: 0,
                              marginVertical: 0,
                            }}
                          >
                            <Picker
                              selectedValue={selectedOp}
                              onValueChange={(op, _) => {
                                switch (op) {
                                  case "==":
                                  case "!=": {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, value[1]],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    break;
                                  }
                                }
                                setSelectedOp(op);
                              }}
                              dropdownIconColor={colors.tailwind.slate[400]}
                              style={{
                                width: 185,
                                color: colors.tailwind.slate[400],
                              }}
                            >
                              <Picker.Item label="equals" value="==" />
                              <Picker.Item label="not equals" value="!=" />
                            </Picker>
                          </View>
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
                        return (
                          <View
                            style={{
                              borderWidth: 1,
                              borderRadius: 5,
                              paddingHorizontal: 0,
                              paddingVertical: 0,
                              marginHorizontal: 0,
                              marginVertical: 0,
                            }}
                          >
                            <Picker
                              selectedValue={selectedOp}
                              onValueChange={(op, _) => {
                                switch (op) {
                                  case "==":
                                  case "!=":
                                  case ">=":
                                  case "<=":
                                  case ">":
                                  case "<": {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, v1],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    break;
                                  }
                                  case "between":
                                  case "not_between": {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, [v1, v2]],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    break;
                                  }
                                }
                                setSelectedOp(op);
                              }}
                              dropdownIconColor={colors.tailwind.slate[400]}
                              style={{
                                width: 185,
                                color: colors.tailwind.slate[400],
                              }}
                            >
                              <Picker.Item label="equals" value="==" />
                              <Picker.Item label="not equals" value="!=" />
                              <Picker.Item
                                label="greater or equals"
                                value=">="
                              />
                              <Picker.Item label="less or equals" value="<=" />
                              <Picker.Item label="greater than" value=">" />
                              <Picker.Item label="less than" value="<" />
                              <Picker.Item label="between" value="between" />
                              <Picker.Item
                                label="not between"
                                value="not_between"
                              />
                            </Picker>
                          </View>
                        );
                      }
                      return <></>;
                    }
                    case "other": {
                      if (props.filter_path.value[1] !== undefined) {
                        const value = props.filter_path.value[1];
                        const other_struct = props.filter_path.value[2];
                        return (
                          <View
                            style={{
                              borderWidth: 1,
                              borderRadius: 5,
                              paddingHorizontal: 0,
                              paddingVertical: 0,
                              marginHorizontal: 0,
                              marginVertical: 0,
                            }}
                          >
                            <Picker
                              selectedValue={selectedOp}
                              onValueChange={(op, _) => {
                                switch (op) {
                                  case "==":
                                  case "!=": {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
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
                              }}
                              dropdownIconColor={colors.tailwind.slate[400]}
                              style={{
                                width: 185,
                                color: colors.tailwind.slate[400],
                              }}
                            >
                              <Picker.Item label="equals" value="==" />
                              <Picker.Item label="not equals" value="!=" />
                            </Picker>
                          </View>
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
              </View>
            </View>
          );
        }
        return null;
      })}
      <View
        style={{
          justifyContent: "space-between",
          paddingLeft: 32,
        }}
      >
        {arrow(() => {
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
                      return (
                        <View
                          style={{
                            padding: 0,
                            margin: 0,
                          }}
                        >
                          {arrow(() => {
                            if (typeof value === "string") {
                              return (
                                <TextInput
                                  defaultValue={value}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.filter,
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
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text>{value[0]}</Text>
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
                                  if (!filter_path.equals(props.filter_path)) {
                                    return true;
                                  }
                                }
                              }
                              return false;
                            }
                          ) ? (
                            <Pressable
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                              style={{
                                alignSelf: "center",
                              }}
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={colors.tailwind.slate[400]}
                                style={{ paddingHorizontal: 4 }}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={1}
                            backgroundStyle={{
                              backgroundColor: colors.custom.black[900],
                              borderColor: colors.tailwind.gray[500],
                              borderWidth: 1,
                            }}
                          >
                            <View
                              style={{
                                paddingBottom: 10,
                                marginHorizontal: 1,
                                paddingHorizontal: 8,
                                borderBottomWidth: 1,
                                backgroundColor: colors.custom.black[900],
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "bold",
                                  textAlign: "center",
                                }}
                              >
                                Fields
                              </Text>
                              <View
                                style={{
                                  justifyContent: "flex-end",
                                  paddingHorizontal: 0,
                                }}
                              >
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, ""],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.close();
                                  }}
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "bold",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      backgroundColor: colors.custom.red[900],
                                      borderRadius: 2,
                                    }}
                                  >
                                    Clear
                                  </Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.close()
                                  }
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "700",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      borderRadius: 2,
                                      backgroundColor: colors.custom.red[900],
                                    }}
                                  >
                                    Close
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                            <BottomSheetFlatList
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
                              keyExtractor={(_, index) => index.toString()}
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    onPress={() => {
                                      props.dispatch([
                                        "filters",
                                        props.filter,
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
                                      bottomSheetModalRef1.current?.close();
                                    }}
                                  >
                                    <View
                                      style={{
                                        justifyContent: "flex-start",
                                        margin: 10,
                                      }}
                                    >
                                      {arrow(() => {
                                        if (typeof value === "string") {
                                          return (
                                            <Ionicons
                                              name="radio-button-off"
                                              size={24}
                                              color="red"
                                            />
                                          );
                                        } else {
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
                                                  color="red"
                                                />
                                              ) : (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color="red"
                                                />
                                              );
                                            }
                                          );
                                        }
                                      })}
                                      <Text style={{ paddingLeft: 10 }}>
                                        {list_item.item.label}
                                      </Text>
                                    </View>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </View>
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
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (typeof value === "string") {
                                    return (
                                      <TextInput
                                        defaultValue={value}
                                        onChangeText={(x) =>
                                          props.dispatch([
                                            "filters",
                                            props.filter,
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
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
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
                                    onPress={() =>
                                      bottomSheetModalRef1.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef1}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, ["", value2]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef1.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef1.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (typeof value === "string") {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
                            );
                          })}
                          {arrow(() => {
                            const value = value2;
                            return (
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (typeof value === "string") {
                                    return (
                                      <TextInput
                                        defaultValue={value}
                                        onChangeText={(x) =>
                                          props.dispatch([
                                            "filters",
                                            props.filter,
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
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
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
                                    onPress={() =>
                                      bottomSheetModalRef2.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef2}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [value1, ""]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef2.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef2.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (typeof value === "string") {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
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
                      return (
                        <View
                          style={{
                            padding: 0,
                            margin: 0,
                          }}
                        >
                          {arrow(() => {
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  defaultValue={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.filter,
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
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text>{value[0]}</Text>
                                </Pressable>
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
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                              style={{
                                alignSelf: "center",
                              }}
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={colors.tailwind.slate[400]}
                                style={{ paddingHorizontal: 4 }}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={1}
                            backgroundStyle={{
                              backgroundColor: colors.custom.black[900],
                              borderColor: colors.tailwind.gray[500],
                              borderWidth: 1,
                            }}
                          >
                            <View
                              style={{
                                paddingBottom: 10,
                                marginHorizontal: 1,
                                paddingHorizontal: 8,
                                borderBottomWidth: 1,
                                backgroundColor: colors.custom.black[900],
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "bold",
                                  textAlign: "center",
                                }}
                              >
                                Fields
                              </Text>
                              <View
                                style={{
                                  justifyContent: "flex-end",
                                  paddingHorizontal: 0,
                                }}
                              >
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, new Decimal(0)],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.close();
                                  }}
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "bold",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      backgroundColor: colors.custom.red[900],
                                      borderRadius: 2,
                                    }}
                                  >
                                    Clear
                                  </Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.close()
                                  }
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "700",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      borderRadius: 2,
                                      backgroundColor: colors.custom.red[900],
                                    }}
                                  >
                                    Close
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                            <BottomSheetFlatList
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
                              keyExtractor={(_, index) => index.toString()}
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    onPress={() => {
                                      props.dispatch([
                                        "filters",
                                        props.filter,
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
                                      bottomSheetModalRef1.current?.close();
                                    }}
                                  >
                                    <View
                                      style={{
                                        justifyContent: "flex-start",
                                        margin: 10,
                                      }}
                                    >
                                      {arrow(() => {
                                        if (is_decimal(value)) {
                                          return (
                                            <Ionicons
                                              name="radio-button-off"
                                              size={24}
                                              color="red"
                                            />
                                          );
                                        } else {
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
                                                  color="red"
                                                />
                                              ) : (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color="red"
                                                />
                                              );
                                            }
                                          );
                                        }
                                      })}
                                      <Text style={{ paddingLeft: 10 }}>
                                        {list_item.item.label}
                                      </Text>
                                    </View>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </View>
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
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (is_decimal(value)) {
                                    return (
                                      <TextInput
                                        defaultValue={value.toString()}
                                        keyboardType={"number-pad"}
                                        onChangeText={(x) =>
                                          props.dispatch([
                                            "filters",
                                            props.filter,
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
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef1.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef1}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [new Decimal(0), value2]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef1.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef1.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (is_decimal(value)) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
                            );
                          })}
                          {arrow(() => {
                            const value = value2;
                            return (
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (is_decimal(value)) {
                                    return (
                                      <TextInput
                                        defaultValue={value.toString()}
                                        keyboardType={"number-pad"}
                                        onChangeText={(x) =>
                                          props.dispatch([
                                            "filters",
                                            props.filter,
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
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef2.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef2}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [value1, new Decimal(0)]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef2.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef2.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (is_decimal(value)) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
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
                      return (
                        <View
                          style={{
                            padding: 0,
                            margin: 0,
                          }}
                        >
                          {arrow(() => {
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  defaultValue={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.filter,
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
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text>{value[0]}</Text>
                                </Pressable>
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
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                              style={{
                                alignSelf: "center",
                              }}
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={colors.tailwind.slate[400]}
                                style={{ paddingHorizontal: 4 }}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={1}
                            backgroundStyle={{
                              backgroundColor: colors.custom.black[900],
                              borderColor: colors.tailwind.gray[500],
                              borderWidth: 1,
                            }}
                          >
                            <View
                              style={{
                                paddingBottom: 10,
                                marginHorizontal: 1,
                                paddingHorizontal: 8,
                                borderBottomWidth: 1,
                                backgroundColor: colors.custom.black[900],
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "bold",
                                  textAlign: "center",
                                }}
                              >
                                Fields
                              </Text>
                              <View
                                style={{
                                  justifyContent: "flex-end",
                                  paddingHorizontal: 0,
                                }}
                              >
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, new Decimal(0)],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.close();
                                  }}
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "bold",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      backgroundColor: colors.custom.red[900],
                                      borderRadius: 2,
                                    }}
                                  >
                                    Clear
                                  </Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.close()
                                  }
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "700",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      borderRadius: 2,
                                      backgroundColor: colors.custom.red[900],
                                    }}
                                  >
                                    Close
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                            <BottomSheetFlatList
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
                              keyExtractor={(_, index) => index.toString()}
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    onPress={() => {
                                      props.dispatch([
                                        "filters",
                                        props.filter,
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
                                      bottomSheetModalRef1.current?.close();
                                    }}
                                  >
                                    <View
                                      style={{
                                        justifyContent: "flex-start",
                                        margin: 10,
                                      }}
                                    >
                                      {arrow(() => {
                                        if (is_decimal(value)) {
                                          return (
                                            <Ionicons
                                              name="radio-button-off"
                                              size={24}
                                              color="red"
                                            />
                                          );
                                        } else {
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
                                                  color="red"
                                                />
                                              ) : (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color="red"
                                                />
                                              );
                                            }
                                          );
                                        }
                                      })}
                                      <Text style={{ paddingLeft: 10 }}>
                                        {list_item.item.label}
                                      </Text>
                                    </View>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </View>
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
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (is_decimal(value)) {
                                    return (
                                      <TextInput
                                        defaultValue={value.toString()}
                                        keyboardType={"number-pad"}
                                        onChangeText={(x) =>
                                          props.dispatch([
                                            "filters",
                                            props.filter,
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
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef1.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef1}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [new Decimal(0), value2]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef1.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef1.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (is_decimal(value)) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
                            );
                          })}
                          {arrow(() => {
                            const value = value2;
                            return (
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (is_decimal(value)) {
                                    return (
                                      <TextInput
                                        defaultValue={value.toString()}
                                        keyboardType={"number-pad"}
                                        onChangeText={(x) =>
                                          props.dispatch([
                                            "filters",
                                            props.filter,
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
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef2.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef2}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [value1, new Decimal(0)]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef2.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef2.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (is_decimal(value)) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
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
                      return (
                        <View
                          style={{
                            padding: 0,
                            margin: 0,
                          }}
                        >
                          {arrow(() => {
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  defaultValue={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [
                                            op,
                                            Decimal.clamp(
                                              new Decimal(x || "0").truncated(),
                                              new Decimal(
                                                "-9223372036854775807"
                                              ),
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
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text>{value[0]}</Text>
                                </Pressable>
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
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                              style={{
                                alignSelf: "center",
                              }}
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={colors.tailwind.slate[400]}
                                style={{ paddingHorizontal: 4 }}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={1}
                            backgroundStyle={{
                              backgroundColor: colors.custom.black[900],
                              borderColor: colors.tailwind.gray[500],
                              borderWidth: 1,
                            }}
                          >
                            <View
                              style={{
                                paddingBottom: 10,
                                marginHorizontal: 1,
                                paddingHorizontal: 8,
                                borderBottomWidth: 1,
                                backgroundColor: colors.custom.black[900],
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "bold",
                                  textAlign: "center",
                                }}
                              >
                                Fields
                              </Text>
                              <View
                                style={{
                                  justifyContent: "flex-end",
                                  paddingHorizontal: 0,
                                }}
                              >
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, new Decimal(0)],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.close();
                                  }}
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "bold",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      backgroundColor: colors.custom.red[900],
                                      borderRadius: 2,
                                    }}
                                  >
                                    Clear
                                  </Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.close()
                                  }
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "700",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      borderRadius: 2,
                                      backgroundColor: colors.custom.red[900],
                                    }}
                                  >
                                    Close
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                            <BottomSheetFlatList
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
                              keyExtractor={(_, index) => index.toString()}
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    onPress={() => {
                                      props.dispatch([
                                        "filters",
                                        props.filter,
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
                                      bottomSheetModalRef1.current?.close();
                                    }}
                                  >
                                    <View
                                      style={{
                                        justifyContent: "flex-start",
                                        margin: 10,
                                      }}
                                    >
                                      {arrow(() => {
                                        if (is_decimal(value)) {
                                          return (
                                            <Ionicons
                                              name="radio-button-off"
                                              size={24}
                                              color="red"
                                            />
                                          );
                                        } else {
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
                                                  color="red"
                                                />
                                              ) : (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color="red"
                                                />
                                              );
                                            }
                                          );
                                        }
                                      })}
                                      <Text style={{ paddingLeft: 10 }}>
                                        {list_item.item.label}
                                      </Text>
                                    </View>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </View>
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
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (is_decimal(value)) {
                                    return (
                                      <TextInput
                                        defaultValue={value.toString()}
                                        keyboardType={"number-pad"}
                                        onChangeText={(x) =>
                                          props.dispatch([
                                            "filters",
                                            props.filter,
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
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef1.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef1}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [new Decimal(0), value2]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef1.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef1.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (is_decimal(value)) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
                            );
                          })}
                          {arrow(() => {
                            const value = value2;
                            return (
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (is_decimal(value)) {
                                    return (
                                      <TextInput
                                        defaultValue={value.toString()}
                                        keyboardType={"number-pad"}
                                        onChangeText={(x) =>
                                          props.dispatch([
                                            "filters",
                                            props.filter,
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
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef2.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef2}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [value1, new Decimal(0)]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef2.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef2.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (is_decimal(value)) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
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
                      return (
                        <View
                          style={{
                            padding: 0,
                            margin: 0,
                          }}
                        >
                          {arrow(() => {
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  defaultValue={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.filter,
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
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text>{value[0]}</Text>
                                </Pressable>
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
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                              style={{
                                alignSelf: "center",
                              }}
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={colors.tailwind.slate[400]}
                                style={{ paddingHorizontal: 4 }}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={1}
                            backgroundStyle={{
                              backgroundColor: colors.custom.black[900],
                              borderColor: colors.tailwind.gray[500],
                              borderWidth: 1,
                            }}
                          >
                            <View
                              style={{
                                paddingBottom: 10,
                                marginHorizontal: 1,
                                paddingHorizontal: 8,
                                borderBottomWidth: 1,
                                backgroundColor: colors.custom.black[900],
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "bold",
                                  textAlign: "center",
                                }}
                              >
                                Fields
                              </Text>
                              <View
                                style={{
                                  justifyContent: "flex-end",
                                  paddingHorizontal: 0,
                                }}
                              >
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, new Decimal(0)],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.close();
                                  }}
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "bold",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      backgroundColor: colors.custom.red[900],
                                      borderRadius: 2,
                                    }}
                                  >
                                    Clear
                                  </Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.close()
                                  }
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "700",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      borderRadius: 2,
                                      backgroundColor: colors.custom.red[900],
                                    }}
                                  >
                                    Close
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                            <BottomSheetFlatList
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
                              keyExtractor={(_, index) => index.toString()}
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    onPress={() => {
                                      props.dispatch([
                                        "filters",
                                        props.filter,
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
                                      bottomSheetModalRef1.current?.close();
                                    }}
                                  >
                                    <View
                                      style={{
                                        justifyContent: "flex-start",
                                        margin: 10,
                                      }}
                                    >
                                      {arrow(() => {
                                        if (is_decimal(value)) {
                                          return (
                                            <Ionicons
                                              name="radio-button-off"
                                              size={24}
                                              color="red"
                                            />
                                          );
                                        } else {
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
                                                  color="red"
                                                />
                                              ) : (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color="red"
                                                />
                                              );
                                            }
                                          );
                                        }
                                      })}
                                      <Text style={{ paddingLeft: 10 }}>
                                        {list_item.item.label}
                                      </Text>
                                    </View>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </View>
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
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (is_decimal(value)) {
                                    return (
                                      <TextInput
                                        defaultValue={value.toString()}
                                        keyboardType={"number-pad"}
                                        onChangeText={(x) =>
                                          props.dispatch([
                                            "filters",
                                            props.filter,
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
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef1.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef1}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [new Decimal(0), value2]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef1.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef1.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (is_decimal(value)) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
                            );
                          })}
                          {arrow(() => {
                            const value = value2;
                            return (
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (is_decimal(value)) {
                                    return (
                                      <TextInput
                                        defaultValue={value.toString()}
                                        keyboardType={"number-pad"}
                                        onChangeText={(x) =>
                                          props.dispatch([
                                            "filters",
                                            props.filter,
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
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef2.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef2}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [value1, new Decimal(0)]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef2.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef2.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (is_decimal(value)) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
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
                      return (
                        <View
                          style={{
                            padding: 0,
                            margin: 0,
                          }}
                        >
                          {arrow(() => {
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  defaultValue={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.filter,
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
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text>{value[0]}</Text>
                                </Pressable>
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
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                              style={{
                                alignSelf: "center",
                              }}
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={colors.tailwind.slate[400]}
                                style={{ paddingHorizontal: 4 }}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={1}
                            backgroundStyle={{
                              backgroundColor: colors.custom.black[900],
                              borderColor: colors.tailwind.gray[500],
                              borderWidth: 1,
                            }}
                          >
                            <View
                              style={{
                                paddingBottom: 10,
                                marginHorizontal: 1,
                                paddingHorizontal: 8,
                                borderBottomWidth: 1,
                                backgroundColor: colors.custom.black[900],
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "bold",
                                  textAlign: "center",
                                }}
                              >
                                Fields
                              </Text>
                              <View
                                style={{
                                  justifyContent: "flex-end",
                                  paddingHorizontal: 0,
                                }}
                              >
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, new Decimal(0)],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.close();
                                  }}
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "bold",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      backgroundColor: colors.custom.red[900],
                                      borderRadius: 2,
                                    }}
                                  >
                                    Clear
                                  </Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.close()
                                  }
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "700",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      borderRadius: 2,
                                      backgroundColor: colors.custom.red[900],
                                    }}
                                  >
                                    Close
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                            <BottomSheetFlatList
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
                              keyExtractor={(_, index) => index.toString()}
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    onPress={() => {
                                      props.dispatch([
                                        "filters",
                                        props.filter,
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
                                      bottomSheetModalRef1.current?.close();
                                    }}
                                  >
                                    <View
                                      style={{
                                        justifyContent: "flex-start",
                                        margin: 10,
                                      }}
                                    >
                                      {arrow(() => {
                                        if (is_decimal(value)) {
                                          return (
                                            <Ionicons
                                              name="radio-button-off"
                                              size={24}
                                              color="red"
                                            />
                                          );
                                        } else {
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
                                                  color="red"
                                                />
                                              ) : (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color="red"
                                                />
                                              );
                                            }
                                          );
                                        }
                                      })}
                                      <Text style={{ paddingLeft: 10 }}>
                                        {list_item.item.label}
                                      </Text>
                                    </View>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </View>
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
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (is_decimal(value)) {
                                    return (
                                      <TextInput
                                        defaultValue={value.toString()}
                                        keyboardType={"number-pad"}
                                        onChangeText={(x) =>
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [
                                                  op,
                                                  [
                                                    new Decimal(x || "0"),
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
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef1.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef1}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [new Decimal(0), value2]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef1.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef1.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (is_decimal(value)) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
                            );
                          })}
                          {arrow(() => {
                            const value = value2;
                            return (
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (is_decimal(value)) {
                                    return (
                                      <TextInput
                                        defaultValue={value.toString()}
                                        keyboardType={"number-pad"}
                                        onChangeText={(x) =>
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [
                                                  op,
                                                  [
                                                    value1,
                                                    new Decimal(x || "0"),
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
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef2.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef2}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [value1, new Decimal(0)]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef2.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef2.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (is_decimal(value)) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
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
                      return (
                        <View
                          style={{
                            padding: 0,
                            margin: 0,
                          }}
                        >
                          {arrow(() => {
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  defaultValue={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.filter,
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
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text>{value[0]}</Text>
                                </Pressable>
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
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                              style={{
                                alignSelf: "center",
                              }}
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={colors.tailwind.slate[400]}
                                style={{ paddingHorizontal: 4 }}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={1}
                            backgroundStyle={{
                              backgroundColor: colors.custom.black[900],
                              borderColor: colors.tailwind.gray[500],
                              borderWidth: 1,
                            }}
                          >
                            <View
                              style={{
                                paddingBottom: 10,
                                marginHorizontal: 1,
                                paddingHorizontal: 8,
                                borderBottomWidth: 1,
                                backgroundColor: colors.custom.black[900],
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "bold",
                                  textAlign: "center",
                                }}
                              >
                                Fields
                              </Text>
                              <View
                                style={{
                                  justifyContent: "flex-end",
                                  paddingHorizontal: 0,
                                }}
                              >
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, new Decimal(0)],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.close();
                                  }}
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "bold",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      backgroundColor: colors.custom.red[900],
                                      borderRadius: 2,
                                    }}
                                  >
                                    Clear
                                  </Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.close()
                                  }
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "700",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      borderRadius: 2,
                                      backgroundColor: colors.custom.red[900],
                                    }}
                                  >
                                    Close
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                            <BottomSheetFlatList
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
                              keyExtractor={(_, index) => index.toString()}
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    onPress={() => {
                                      props.dispatch([
                                        "filters",
                                        props.filter,
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
                                      bottomSheetModalRef1.current?.close();
                                    }}
                                  >
                                    <View
                                      style={{
                                        justifyContent: "flex-start",
                                        margin: 10,
                                      }}
                                    >
                                      {arrow(() => {
                                        if (is_decimal(value)) {
                                          return (
                                            <Ionicons
                                              name="radio-button-off"
                                              size={24}
                                              color="red"
                                            />
                                          );
                                        } else {
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
                                                  color="red"
                                                />
                                              ) : (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color="red"
                                                />
                                              );
                                            }
                                          );
                                        }
                                      })}
                                      <Text style={{ paddingLeft: 10 }}>
                                        {list_item.item.label}
                                      </Text>
                                    </View>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </View>
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
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (is_decimal(value)) {
                                    return (
                                      <TextInput
                                        defaultValue={value.toString()}
                                        keyboardType={"number-pad"}
                                        onChangeText={(x) =>
                                          props.dispatch([
                                            "filters",
                                            props.filter,
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
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef1.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef1}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [new Decimal(0), value2]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef1.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef1.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (is_decimal(value)) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
                            );
                          })}
                          {arrow(() => {
                            const value = value2;
                            return (
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (is_decimal(value)) {
                                    return (
                                      <TextInput
                                        defaultValue={value.toString()}
                                        keyboardType={"number-pad"}
                                        onChangeText={(x) =>
                                          props.dispatch([
                                            "filters",
                                            props.filter,
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
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef2.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef2}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [value1, new Decimal(0)]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef2.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef2.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (is_decimal(value)) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
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
                        <View
                          style={{
                            padding: 0,
                            margin: 0,
                          }}
                        >
                          {arrow(() => {
                            if (typeof value === "boolean") {
                              return (
                                <Checkbox
                                  value={value}
                                  onValueChange={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [field_struct_name, [op, x]];
                                        return it;
                                      }),
                                    ])
                                  }
                                  color={
                                    value ? colors.custom.red[900] : undefined
                                  }
                                />
                              );
                            } else {
                              return (
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text>{value[0]}</Text>
                                </Pressable>
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
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                              style={{
                                alignSelf: "center",
                              }}
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={colors.tailwind.slate[400]}
                                style={{ paddingHorizontal: 4 }}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={1}
                            backgroundStyle={{
                              backgroundColor: colors.custom.black[900],
                              borderColor: colors.tailwind.gray[500],
                              borderWidth: 1,
                            }}
                          >
                            <View
                              style={{
                                paddingBottom: 10,
                                marginHorizontal: 1,
                                paddingHorizontal: 8,
                                borderBottomWidth: 1,
                                backgroundColor: colors.custom.black[900],
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "bold",
                                  textAlign: "center",
                                }}
                              >
                                Fields
                              </Text>
                              <View
                                style={{
                                  justifyContent: "flex-end",
                                  paddingHorizontal: 0,
                                }}
                              >
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, true],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.close();
                                  }}
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "bold",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      backgroundColor: colors.custom.red[900],
                                      borderRadius: 2,
                                    }}
                                  >
                                    Clear
                                  </Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.close()
                                  }
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "700",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      borderRadius: 2,
                                      backgroundColor: colors.custom.red[900],
                                    }}
                                  >
                                    Close
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                            <BottomSheetFlatList
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
                              keyExtractor={(_, index) => index.toString()}
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    onPress={() => {
                                      props.dispatch([
                                        "filters",
                                        props.filter,
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
                                      bottomSheetModalRef1.current?.close();
                                    }}
                                  >
                                    <View
                                      style={{
                                        justifyContent: "flex-start",
                                        margin: 10,
                                      }}
                                    >
                                      {arrow(() => {
                                        if (typeof value === "boolean") {
                                          return (
                                            <Ionicons
                                              name="radio-button-off"
                                              size={24}
                                              color="red"
                                            />
                                          );
                                        } else {
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
                                                  color="red"
                                                />
                                              ) : (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color="red"
                                                />
                                              );
                                            }
                                          );
                                        }
                                      })}
                                      <Text style={{ paddingLeft: 10 }}>
                                        {list_item.item.label}
                                      </Text>
                                    </View>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </View>
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
                        <View
                          style={{
                            padding: 0,
                            margin: 0,
                          }}
                        >
                          {arrow(() => {
                            if (value instanceof Date) {
                              return (
                                <>
                                  <Pressable onPress={() => setPicker1(true)}>
                                    <Text>
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
                                            "filters",
                                            props.filter,
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
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text>{value[0]}</Text>
                                </Pressable>
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
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                              style={{
                                alignSelf: "center",
                              }}
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={colors.tailwind.slate[400]}
                                style={{ paddingHorizontal: 4 }}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={1}
                            backgroundStyle={{
                              backgroundColor: colors.custom.black[900],
                              borderColor: colors.tailwind.gray[500],
                              borderWidth: 1,
                            }}
                          >
                            <View
                              style={{
                                paddingBottom: 10,
                                marginHorizontal: 1,
                                paddingHorizontal: 8,
                                borderBottomWidth: 1,
                                backgroundColor: colors.custom.black[900],
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "bold",
                                  textAlign: "center",
                                }}
                              >
                                Fields
                              </Text>
                              <View
                                style={{
                                  justifyContent: "flex-end",
                                  paddingHorizontal: 0,
                                }}
                              >
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, new Date()],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.close();
                                  }}
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "bold",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      backgroundColor: colors.custom.red[900],
                                      borderRadius: 2,
                                    }}
                                  >
                                    Clear
                                  </Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.close()
                                  }
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "700",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      borderRadius: 2,
                                      backgroundColor: colors.custom.red[900],
                                    }}
                                  >
                                    Close
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                            <BottomSheetFlatList
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
                              keyExtractor={(_, index) => index.toString()}
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    onPress={() => {
                                      props.dispatch([
                                        "filters",
                                        props.filter,
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
                                      bottomSheetModalRef1.current?.close();
                                    }}
                                  >
                                    <View
                                      style={{
                                        justifyContent: "flex-start",
                                        margin: 10,
                                      }}
                                    >
                                      {arrow(() => {
                                        if (value instanceof Date) {
                                          return (
                                            <Ionicons
                                              name="radio-button-off"
                                              size={24}
                                              color="red"
                                            />
                                          );
                                        } else {
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
                                                  color="red"
                                                />
                                              ) : (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color="red"
                                                />
                                              );
                                            }
                                          );
                                        }
                                      })}
                                      <Text style={{ paddingLeft: 10 }}>
                                        {list_item.item.label}
                                      </Text>
                                    </View>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </View>
                      );
                    }
                    case "between":
                    case "not_between": {
                      const [value1, value2] = props.filter_path.value[1][1];
                      return (
                        <>
                          {arrow(() => {
                            return (
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (value1 instanceof Date) {
                                    return (
                                      <>
                                        <Pressable
                                          onPress={() => setPicker1(true)}
                                        >
                                          <Text>
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
                                                  "filters",
                                                  props.filter,
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
                                  } else {
                                    return (
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.present()
                                        }
                                      >
                                        <Text>{value1[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef1.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef1}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [new Date(), value2]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef1.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef1.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (value1 instanceof Date) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
                            );
                          })}
                          {arrow(() => {
                            return (
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (value2 instanceof Date) {
                                    return (
                                      <>
                                        <Pressable
                                          onPress={() => setPicker2(true)}
                                        >
                                          <Text>
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
                                                  "filters",
                                                  props.filter,
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
                                  } else {
                                    return (
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.present()
                                        }
                                      >
                                        <Text>{value2[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef2.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef2}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [value1, new Date()]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef2.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef2.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (value2 instanceof Date) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
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
                        <View
                          style={{
                            padding: 0,
                            margin: 0,
                          }}
                        >
                          {arrow(() => {
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
                                            props.filter,
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
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text>{value[0]}</Text>
                                </Pressable>
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
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                              style={{
                                alignSelf: "center",
                              }}
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={colors.tailwind.slate[400]}
                                style={{ paddingHorizontal: 4 }}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={1}
                            backgroundStyle={{
                              backgroundColor: colors.custom.black[900],
                              borderColor: colors.tailwind.gray[500],
                              borderWidth: 1,
                            }}
                          >
                            <View
                              style={{
                                paddingBottom: 10,
                                marginHorizontal: 1,
                                paddingHorizontal: 8,
                                borderBottomWidth: 1,
                                backgroundColor: colors.custom.black[900],
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "bold",
                                  textAlign: "center",
                                }}
                              >
                                Fields
                              </Text>
                              <View
                                style={{
                                  justifyContent: "flex-end",
                                  paddingHorizontal: 0,
                                }}
                              >
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, new Date()],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.close();
                                  }}
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "bold",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      backgroundColor: colors.custom.red[900],
                                      borderRadius: 2,
                                    }}
                                  >
                                    Clear
                                  </Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.close()
                                  }
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "700",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      borderRadius: 2,
                                      backgroundColor: colors.custom.red[900],
                                    }}
                                  >
                                    Close
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                            <BottomSheetFlatList
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
                              keyExtractor={(_, index) => index.toString()}
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    onPress={() => {
                                      props.dispatch([
                                        "filters",
                                        props.filter,
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
                                      bottomSheetModalRef1.current?.close();
                                    }}
                                  >
                                    <View
                                      style={{
                                        justifyContent: "flex-start",
                                        margin: 10,
                                      }}
                                    >
                                      {arrow(() => {
                                        if (value instanceof Date) {
                                          return (
                                            <Ionicons
                                              name="radio-button-off"
                                              size={24}
                                              color="red"
                                            />
                                          );
                                        } else {
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
                                                  color="red"
                                                />
                                              ) : (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color="red"
                                                />
                                              );
                                            }
                                          );
                                        }
                                      })}
                                      <Text style={{ paddingLeft: 10 }}>
                                        {list_item.item.label}
                                      </Text>
                                    </View>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </View>
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
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (value instanceof Date) {
                                    return (
                                      <>
                                        <Pressable
                                          onPress={() => setPicker1(true)}
                                        >
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
                                                setPicker1(
                                                  Platform.OS === "ios"
                                                );
                                                props.dispatch([
                                                  "filters",
                                                  props.filter,
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
                                  } else {
                                    return (
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef1.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef1}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [new Date(), value2]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef1.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef1.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (value instanceof Date) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
                            );
                          })}
                          {arrow(() => {
                            const value = value2;
                            return (
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (value instanceof Date) {
                                    return (
                                      <>
                                        <Pressable
                                          onPress={() => setPicker2(true)}
                                        >
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
                                                setPicker2(
                                                  Platform.OS === "ios"
                                                );
                                                props.dispatch([
                                                  "filters",
                                                  props.filter,
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
                                  } else {
                                    return (
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef2.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef2}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [value1, new Date()]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef2.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef2.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (value instanceof Date) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
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
                        <View
                          style={{
                            padding: 0,
                            margin: 0,
                          }}
                        >
                          {arrow(() => {
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
                                                props.filter,
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
                            } else {
                              return (
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text>{value[0]}</Text>
                                </Pressable>
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
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                              style={{
                                alignSelf: "center",
                              }}
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={colors.tailwind.slate[400]}
                                style={{ paddingHorizontal: 4 }}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={1}
                            backgroundStyle={{
                              backgroundColor: colors.custom.black[900],
                              borderColor: colors.tailwind.gray[500],
                              borderWidth: 1,
                            }}
                          >
                            <View
                              style={{
                                paddingBottom: 10,
                                marginHorizontal: 1,
                                paddingHorizontal: 8,
                                borderBottomWidth: 1,
                                backgroundColor: colors.custom.black[900],
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "bold",
                                  textAlign: "center",
                                }}
                              >
                                Fields
                              </Text>
                              <View
                                style={{
                                  justifyContent: "flex-end",
                                  paddingHorizontal: 0,
                                }}
                              >
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
                                      "replace",
                                      apply(props.filter_path, (it) => {
                                        it.value = [
                                          field_struct_name,
                                          [op, new Date()],
                                        ];
                                        return it;
                                      }),
                                    ]);
                                    bottomSheetModalRef1.current?.close();
                                  }}
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "bold",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      backgroundColor: colors.custom.red[900],
                                      borderRadius: 2,
                                    }}
                                  >
                                    Clear
                                  </Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.close()
                                  }
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "700",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      borderRadius: 2,
                                      backgroundColor: colors.custom.red[900],
                                    }}
                                  >
                                    Close
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                            <BottomSheetFlatList
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
                              keyExtractor={(_, index) => index.toString()}
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    onPress={() => {
                                      props.dispatch([
                                        "filters",
                                        props.filter,
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
                                      bottomSheetModalRef1.current?.close();
                                    }}
                                  >
                                    <View
                                      style={{
                                        justifyContent: "flex-start",
                                        margin: 10,
                                      }}
                                    >
                                      {arrow(() => {
                                        if (value instanceof Date) {
                                          return (
                                            <Ionicons
                                              name="radio-button-off"
                                              size={24}
                                              color="red"
                                            />
                                          );
                                        } else {
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
                                                  color="red"
                                                />
                                              ) : (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color="red"
                                                />
                                              );
                                            }
                                          );
                                        }
                                      })}
                                      <Text style={{ paddingLeft: 10 }}>
                                        {list_item.item.label}
                                      </Text>
                                    </View>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </View>
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
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (value instanceof Date) {
                                    return (
                                      <>
                                        <Pressable
                                          onPress={() => setPicker1(true)}
                                        >
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
                                                      "filters",
                                                      props.filter,
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
                                  } else {
                                    return (
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef1.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef1}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [new Date(), value2]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef1.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef1.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef1.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (value instanceof Date) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
                            );
                          })}
                          {arrow(() => {
                            const value = value2;
                            return (
                              <View
                                style={{
                                  padding: 0,
                                  margin: 0,
                                }}
                              >
                                {arrow(() => {
                                  if (value instanceof Date) {
                                    return (
                                      <>
                                        <Pressable
                                          onPress={() => setPicker2(true)}
                                        >
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
                                                      "filters",
                                                      props.filter,
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
                                  } else {
                                    return (
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.present()
                                        }
                                      >
                                        <Text>{value[0]}</Text>
                                      </Pressable>
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
                                    onPress={() =>
                                      bottomSheetModalRef2.current?.present()
                                    }
                                    style={{
                                      alignSelf: "center",
                                    }}
                                  >
                                    <Entypo
                                      name="edit"
                                      size={16}
                                      color={colors.tailwind.slate[400]}
                                      style={{ paddingHorizontal: 4 }}
                                    />
                                  </Pressable>
                                ) : (
                                  <></>
                                )}

                                <BottomSheetModal
                                  ref={bottomSheetModalRef2}
                                  snapPoints={["50%", "82%"]}
                                  index={1}
                                  backgroundStyle={{
                                    backgroundColor: colors.custom.black[900],
                                    borderColor: colors.tailwind.gray[500],
                                    borderWidth: 1,
                                  }}
                                >
                                  <View
                                    style={{
                                      paddingBottom: 10,
                                      marginHorizontal: 1,
                                      paddingHorizontal: 8,
                                      borderBottomWidth: 1,
                                      backgroundColor: colors.custom.black[900],
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                      }}
                                    >
                                      Fields
                                    </Text>
                                    <View
                                      style={{
                                        justifyContent: "flex-end",
                                        paddingHorizontal: 0,
                                      }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          props.dispatch([
                                            "filters",
                                            props.filter,
                                            "replace",
                                            apply(props.filter_path, (it) => {
                                              it.value = [
                                                field_struct_name,
                                                [op, [value1, new Date()]],
                                              ];
                                              return it;
                                            }),
                                          ]);
                                          bottomSheetModalRef2.current?.close();
                                        }}
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                            borderRadius: 2,
                                          }}
                                        >
                                          Clear
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() =>
                                          bottomSheetModalRef2.current?.close()
                                        }
                                        style={{ paddingRight: 8 }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            textAlign: "center",
                                            paddingHorizontal: 5,
                                            paddingVertical: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                              colors.custom.red[900],
                                          }}
                                        >
                                          Close
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                  <BottomSheetFlatList
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
                                    keyExtractor={(_, index) =>
                                      index.toString()
                                    }
                                    renderItem={(list_item) => {
                                      return (
                                        <Pressable
                                          onPress={() => {
                                            props.dispatch([
                                              "filters",
                                              props.filter,
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
                                            bottomSheetModalRef2.current?.close();
                                          }}
                                        >
                                          <View
                                            style={{
                                              justifyContent: "flex-start",
                                              margin: 10,
                                            }}
                                          >
                                            {arrow(() => {
                                              if (value instanceof Date) {
                                                return (
                                                  <Ionicons
                                                    name="radio-button-off"
                                                    size={24}
                                                    color="red"
                                                  />
                                                );
                                              } else {
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
                                                        color="red"
                                                      />
                                                    ) : (
                                                      <Ionicons
                                                        name="radio-button-off"
                                                        size={24}
                                                        color="red"
                                                      />
                                                    );
                                                  }
                                                );
                                              }
                                            })}
                                            <Text style={{ paddingLeft: 10 }}>
                                              {list_item.item.label}
                                            </Text>
                                          </View>
                                        </Pressable>
                                      );
                                    }}
                                  />
                                </BottomSheetModal>
                              </View>
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
                        <View
                          style={{
                            padding: 0,
                            margin: 0,
                          }}
                        >
                          {arrow(() => {
                            if (is_decimal(value)) {
                              return (
                                <TextInput
                                  defaultValue={value.toString()}
                                  keyboardType={"number-pad"}
                                  onChangeText={(x) =>
                                    props.dispatch([
                                      "filters",
                                      props.filter,
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
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.present()
                                  }
                                >
                                  <Text>{value[0]}</Text>
                                </Pressable>
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
                              onPress={() =>
                                bottomSheetModalRef1.current?.present()
                              }
                              style={{
                                alignSelf: "center",
                              }}
                            >
                              <Entypo
                                name="edit"
                                size={16}
                                color={colors.tailwind.slate[400]}
                                style={{ paddingHorizontal: 4 }}
                              />
                            </Pressable>
                          ) : (
                            <></>
                          )}

                          <BottomSheetModal
                            ref={bottomSheetModalRef1}
                            snapPoints={["50%", "82%"]}
                            index={1}
                            backgroundStyle={{
                              backgroundColor: colors.custom.black[900],
                              borderColor: colors.tailwind.gray[500],
                              borderWidth: 1,
                            }}
                          >
                            <View
                              style={{
                                paddingBottom: 10,
                                marginHorizontal: 1,
                                paddingHorizontal: 8,
                                borderBottomWidth: 1,
                                backgroundColor: colors.custom.black[900],
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "bold",
                                  textAlign: "center",
                                }}
                              >
                                Fields
                              </Text>
                              <View
                                style={{
                                  justifyContent: "flex-end",
                                  paddingHorizontal: 0,
                                }}
                              >
                                <Pressable
                                  onPress={() => {
                                    props.dispatch([
                                      "filters",
                                      props.filter,
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
                                    bottomSheetModalRef1.current?.close();
                                  }}
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "bold",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      backgroundColor: colors.custom.red[900],
                                      borderRadius: 2,
                                    }}
                                  >
                                    Clear
                                  </Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    bottomSheetModalRef1.current?.close()
                                  }
                                  style={{ paddingRight: 8 }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "700",
                                      textAlign: "center",
                                      paddingHorizontal: 5,
                                      paddingVertical: 2,
                                      borderRadius: 2,
                                      backgroundColor: colors.custom.red[900],
                                    }}
                                  >
                                    Close
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                            <BottomSheetFlatList
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
                              keyExtractor={(_, index) => index.toString()}
                              renderItem={(list_item) => {
                                return (
                                  <Pressable
                                    onPress={() => {
                                      props.dispatch([
                                        "filters",
                                        props.filter,
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
                                      bottomSheetModalRef1.current?.close();
                                    }}
                                  >
                                    <View
                                      style={{
                                        justifyContent: "flex-start",
                                        margin: 10,
                                      }}
                                    >
                                      {arrow(() => {
                                        if (is_decimal(value)) {
                                          return (
                                            <Ionicons
                                              name="radio-button-off"
                                              size={24}
                                              color="red"
                                            />
                                          );
                                        } else {
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
                                                  color="red"
                                                />
                                              ) : (
                                                <Ionicons
                                                  name="radio-button-off"
                                                  size={24}
                                                  color="red"
                                                />
                                              );
                                            }
                                          );
                                        }
                                      })}
                                      <Text style={{ paddingLeft: 10 }}>
                                        {list_item.item.label}
                                      </Text>
                                    </View>
                                  </Pressable>
                                );
                              }}
                            />
                          </BottomSheetModal>
                        </View>
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
          }
          return null;
        })}
      </View>
    </View>
  );
}
