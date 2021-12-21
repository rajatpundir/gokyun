import React, { useRef } from "react";
import { Draft } from "immer";
import { useEffect } from "react";
import { FlatList } from "react-native-gesture-handler";
import { useImmerReducer } from "use-immer";
import { NavigatorProps as RootNavigatorProps } from "../../App";
import { Filter, FilterPath, get_variables } from "../../main/utils/db";
import { Struct, Variable } from "../../main/utils/variable";
import { View, Text } from "../../main/themed";
import Decimal from "decimal.js";
import { Pressable } from "react-native";
import { apply, unwrap } from "../../main/utils/prelude";
import { HashSet } from "prelude-ts";
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import { FontAwesome } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { FilterComponent } from "./filter";
import { colors } from "../../main/themed/colors";

// Bottom sheet, instead of sroll view, for field selection

// Ordering
// Limit Offset

// id, created_at and updated_at in having clause
// Prevent SQL injection

// Custom outer search fields
// Create / Update Test component
// List Test component

type State = {
  struct: Struct;
  active: boolean;
  level: Decimal | undefined;
  filters: [Filter, HashSet<Filter>];
  limit_offset: [Decimal, Decimal] | undefined;
  variables: Array<Variable>;
};

export type Action =
  | ["variables", Array<Variable>]
  | ["active", boolean]
  | ["level", Decimal | undefined]
  | ["limit_offset", [Decimal, Decimal] | undefined]
  | ["filter", "add"]
  | ["filter", "remove", Filter]
  | ["filter", "replace", Filter]
  | ["filters", Filter, "remove", FilterPath]
  | ["filters", Filter, "replace", FilterPath];

export function reducer(state: Draft<State>, action: Action) {
  switch (action[0]) {
    case "variables": {
      state.variables = action[1] as any;
      break;
    }
    case "active": {
      state.active = action[1];
      break;
    }
    case "level": {
      state.level = action[1];
      break;
    }
    case "limit_offset": {
      state.limit_offset = action[1];
      break;
    }
    case "filter": {
      switch (action[1]) {
        case "add": {
          state.filters[1] = state.filters[1].add(
            new Filter(
              1 +
                Math.max(-1, ...state.filters[1].map((x) => x.index).toArray()),
              [false, undefined],
              [false, undefined],
              [false, undefined],
              HashSet.of()
            )
          );
          break;
        }
        case "remove": {
          state.filters[1] = state.filters[1].remove(action[2]);
          break;
        }
        case "replace": {
          state.filters[1] = state.filters[1].remove(action[2]);
          state.filters[1] = state.filters[1].add(action[2]);
          break;
        }
        default: {
          const _exhaustiveCheck: never = action[1];
          return _exhaustiveCheck;
        }
      }
      break;
    }
    case "filters": {
      const result = state.filters[1].findAny((x) => x === action[1]);
      if (result.isSome()) {
        state.filters[1] = apply(result.get(), (filter) => {
          switch (action[2]) {
            case "replace": {
              filter.filter_paths = filter.filter_paths.add(action[3]);
              break;
            }
            case "remove": {
              filter.filter_paths = filter.filter_paths.remove(action[3]);
              break;
            }
            default: {
              const _exhaustiveCheck: never = action[2];
              return _exhaustiveCheck;
            }
          }
          return state.filters[1].add(filter);
        });
      }
      break;
    }
    default: {
      const _exhaustiveCheck: never = action[0];
      return _exhaustiveCheck;
    }
  }
}

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

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  return (
    <BottomSheetModalProvider>
      <View style={{ flex: 1, flexDirection: "column" }}>
        <Pressable onPress={() => bottomSheetModalRef.current?.present()}>
          <Text
            style={{
              alignSelf: "flex-end",
              fontSize: 15,
              fontWeight: "500",
              textAlign: "center",
              paddingHorizontal: 10,
              paddingVertical: 2,
              borderColor: "white",
              borderWidth: 1,
              borderRadius: 8,
            }}
          >
            Filter
            <FontAwesome name="filter" size={16} color="white" />
          </Text>
        </Pressable>

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
        <BottomSheetModal
          ref={bottomSheetModalRef}
          snapPoints={["50%", "100%"]}
          index={1}
          backgroundStyle={{
            backgroundColor: colors.custom.black[900],
            borderColor: "white",
            borderWidth: 1,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "column",
              backgroundColor: colors.custom.black[900],
              borderColor: "white",
              borderLeftWidth: 1,
              borderRightWidth: 1,
              paddingHorizontal: 0,
            }}
          >
            <View
              style={{
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
                FILTERS
              </Text>

              <View
                style={{
                  paddingHorizontal: 4,
                  paddingVertical: 4,
                  backgroundColor: colors.custom.black[900],
                }}
              >
                <Text>Active</Text>
                <Checkbox
                  value={state.active}
                  onValueChange={(x) => dispatch(["active", x])}
                  color={state.active ? colors.custom.red[900] : undefined}
                  style={{
                    alignSelf: "center",
                    marginRight: 6,
                  }}
                />
              </View>

              <View
                style={{
                  paddingHorizontal: 4,
                  paddingVertical: 4,
                  marginBottom: 2,
                  backgroundColor: colors.custom.black[900],
                }}
              >
                <Text>Unsynced</Text>
                <Checkbox
                  value={!state.level ? true : false}
                  onValueChange={(x) =>
                    dispatch(["level", x ? undefined : new Decimal(0)])
                  }
                  color={!state.level ? colors.custom.red[900] : undefined}
                  style={{
                    alignSelf: "center",
                    marginRight: 6,
                  }}
                />
              </View>

              <Pressable
                onPress={() => {
                  dispatch(["filter", "add"]);
                }}
              >
                <Text
                  style={{
                    backgroundColor: colors.custom.red[900],
                    alignSelf: "flex-end",
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    fontWeight: "bold",
                    marginRight: 4,
                    color: "white",
                    borderRadius: 2,
                  }}
                >
                  Add Filter
                </Text>
              </Pressable>
            </View>

            <BottomSheetFlatList
              data={state.filters[1]
                .toArray()
                .sort((a, b) =>
                  a.index > b.index ? 1 : a.index < b.index ? -1 : 0
                )}
              keyExtractor={(list_item) => list_item.index.toString()}
              renderItem={(list_item) => {
                return (
                  <FilterComponent
                    key={list_item.item.index}
                    init_filter={state.filters[0]}
                    filter={list_item.item}
                    dispatch={dispatch}
                  />
                );
              }}
            />
          </View>
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  );
}
