import React, { useEffect, useCallback, useMemo, useRef } from "react";
import { Draft, Immutable } from "immer";
import { useImmerReducer } from "use-immer";
import { HashSet } from "prelude-ts";
import Decimal from "decimal.js";
import { FlatList, StyleSheet, Button } from "react-native";

import { NavigatorProps as RootNavigatorProps } from "../../App";
import { Struct, Variable } from "./variable";

import { Text, View, TextInput } from "../themed";

import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetSectionList,
} from "@gorhom/bottom-sheet";
import { get_variables, PathFilter } from "./db";
import { unwrap } from "./prelude";

// A button press is used to copy values of offline filter to online filter
// while offline_filter directly queries from the SQLite DB
// online_filter is used to query from backend, once its done, is should notify the component of such to refresh its contents from SQLite DB

export type VariableFilter = {
  variable_filters: {
    active: boolean;
    level: Decimal | undefined;
    id: ReadonlyArray<
      | ["==" | "!=" | ">=" | "<=" | ">" | "<", Decimal]
      | ["between" | "not_between", [Decimal, Decimal]]
      | undefined
    >;
    created_at: ReadonlyArray<
      | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
      | ["between" | "not_between", [Date, Date]]
      | undefined
    >;
    updated_at: ReadonlyArray<
      | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
      | ["between" | "not_between", [Date, Date]]
      | undefined
    >;
  };
  path_filters: ReadonlyArray<[string, PathFilter]>;
  limit_offset: [Decimal, Decimal] | undefined;
};

type State = Immutable<{
  struct: Struct;
  offline_filters: VariableFilter;
  online_filters: VariableFilter;
  variables: HashSet<Variable>;
}>;

type Action =
  | ["offline_filters", VariableFilter]
  | ["online_filters", VariableFilter]
  | ["variables", HashSet<Variable>];

function reducer(state: Draft<State>, action: Action) {
  switch (action[0]) {
    case "offline_filters": {
      // state.offline_filters = action[1];
      break;
    }
    case "online_filters": {
      // state.online_filters = action[1];
      break;
    }
    case "variables": {
      state.variables = action[1];
      break;
    }
    default: {
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
    }
  }
}

export function VariablesModal(
  props: RootNavigatorProps<"VariablesModal">
): JSX.Element {
  const init: State = {
    struct: props.route.params.struct,
    offline_filters: props.route.params.filter,
    online_filters: props.route.params.filter,
    variables: HashSet.of(),
  };
  const [state, dispatch] = useImmerReducer<State, Action>(reducer, init);
  useEffect(() => {
    const update_variables = async () => {
      const result = await get_variables(
        props.route.params.struct,
        state.offline_filters.variable_filters as any,
        state.offline_filters.path_filters as any,
        state.offline_filters.limit_offset as any
      );
      if (unwrap(result)) {
        dispatch(["variables", HashSet.ofIterable(result.value)]);
      }
    };
    update_variables();
  }, [state.offline_filters, state.online_filters]);

  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // variables
  const sections = useMemo(
    () =>
      Array(10)
        .fill(0)
        .map((_, index) => ({
          title: `Section ${index}`,
          data: Array(10)
            .fill(0)
            .map((_, index) => `Item ${index}`),
        })),
    []
  );
  const snapPoints = useMemo(() => ["25%", "50%", "100%"], []);

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  // const handleSnapPress = useCallback((index) => {
  //   bottomSheetModalRef.current?.snapToIndex(index);
  // }, []);

  // const handleClosePress = useCallback(() => {
  //   bottomSheetModalRef.current?.close();
  // }, []);

  // render
  const renderSectionHeader = useCallback(
    ({ section }) => (
      <View>
        <Text>{section.title}</Text>
      </View>
    ),
    []
  );

  const renderItem = useCallback(
    ({ item }) => (
      <View>
        <Text>{item}</Text>
      </View>
    ),
    []
  );

  return (
    <>
      <BottomSheetModalProvider>
        <View>
          <Button
            onPress={handlePresentModalPress}
            title="Present Modal"
            color="black"
          />
          <FlatList
            data={state.variables.toArray()}
            renderItem={(list_item) => {
              return props.route.params.render_item(
                list_item.item,
                props.route.params.selected,
                props.route.params.set_selected
              );
            }}
            keyExtractor={(list_item) => list_item.id.valueOf()}
          />
          <View>
            {/* <Text>Limit</Text>
            <TextInput
              value={state.limit.toString()}
              keyboardType={"number-pad"}
              onChangeText={(x) =>
                dispatch(["limit", new Decimal(x).truncated()])
              }
            />
            <Text>Offset</Text>
            <TextInput
              value={state.offset.toString()}
              keyboardType={"number-pad"}
              onChangeText={(x) =>
                dispatch(["offset", new Decimal(x).truncated()])
              }
            /> */}
          </View>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={1}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
          >
            <View>
              <Text>Awesome 🎉</Text>
            </View>
            <BottomSheetSectionList
              sections={sections}
              keyExtractor={(i) => i}
              renderSectionHeader={renderSectionHeader}
              renderItem={renderItem}
              // contentContainerStyle={styles.contentContainer}
            />
          </BottomSheetModal>
        </View>
      </BottomSheetModalProvider>
    </>
  );
}
