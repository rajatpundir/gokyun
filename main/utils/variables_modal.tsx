import React, { useEffect, useCallback, useMemo, useRef } from "react";
import { Draft, Immutable } from "immer";
import { useImmerReducer } from "use-immer";
import { HashSet } from "prelude-ts";
import Decimal from "decimal.js";
import { FlatList, StyleSheet, Button } from "react-native";

import { NavigatorProps as RootNavigatorProps } from "../../App";
import { get_variables } from "./sqlite";
import { Struct, Path, PathFilter } from "./variable";

import { Text, View, TextInput } from "../themed";

import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetSectionList,
} from "@gorhom/bottom-sheet";

// A button press is used to copy values of offline filter to online filter
// while offline_filter directly queries from the SQLite DB
// online_filter is used to query from backend, once its done, is should notify the component of such to refresh its contents from SQLite DB

type State = Immutable<{
  offline_filters: ReadonlyArray<[boolean, HashSet<PathFilter>]>;
  online_filters: ReadonlyArray<[boolean, HashSet<PathFilter>]>;
  limit: Decimal;
  offset: Decimal;
  variables: ReadonlyArray<{
    struct: Struct;
    id: Decimal;
    paths: HashSet<Path>;
  }>;
}>;

type Action =
  | ["offline_filters", Array<[boolean, HashSet<PathFilter>]>]
  | ["online_filters", Array<[boolean, HashSet<PathFilter>]>]
  | ["limit", Decimal]
  | ["offset", Decimal]
  | [
      "variables",
      Array<{
        struct: Struct;
        id: Decimal;
        paths: HashSet<Path>;
      }>
    ];

function reducer(state: Draft<State>, action: Action) {
  switch (action[0]) {
    case "offline_filters": {
      state.offline_filters = action[1];
      break;
    }
    case "online_filters": {
      state.online_filters = action[1];
      break;
    }
    case "limit": {
      state.limit = action[1];
      break;
    }
    case "offset": {
      state.offset = action[1];
      break;
    }
    case "variables": {
      state.variables = action[1] as any;
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
    offline_filters: props.route.params.filters,
    online_filters: props.route.params.filters,
    limit: props.route.params.limit,
    offset: props.route.params.offset,
    variables: [],
  };
  const [state, dispatch] = useImmerReducer<State, Action>(reducer, init);
  useEffect(() => {
    const update_variables = async () => {
      const variables = await get_variables(
        props.route.params.struct,
        props.route.params.permissions,
        props.route.params.requested_paths,
        state.online_filters,
        state.limit,
        state.offset
      );
      dispatch(["variables", variables]);
    };
    update_variables();
  }, [state.online_filters, state.limit, state.offset]);

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
            data={state.variables}
            renderItem={(list_item) => {
              return props.route.params.render_item(
                list_item.item.struct,
                list_item.item.id,
                list_item.item.paths,
                props.route.params.selected,
                props.route.params.set_selected
              );
            }}
            keyExtractor={(list_item) => list_item.id.valueOf()}
          />
          <View>
            <Text>Limit</Text>
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
            />
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
