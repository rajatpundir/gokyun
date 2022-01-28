import React, { useCallback } from "react";
import { FlatList, ListRenderItemInfo } from "react-native";
import Decimal from "decimal.js";
import { Menu, Text, Pressable, Row } from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { Portal } from "@gorhom/portal";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { arrow } from "./prelude";
import { PathString, Variable } from "./variable";
import { tw } from "./tailwind";
import { bs_theme } from "./theme";
import { ListAction, ListState, RenderListElement } from "./list";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";

export function ListVariant(
  props: VariantCommonProps & {
    options: ListVariantOptions;
  }
): JSX.Element {
  switch (props.options[0]) {
    case "list": {
      return <FlatlistVariant {...props} {...props.options[1]} />;
    }
    case "menu": {
      return <MenuVariant {...props} {...props.options[1]} />;
    }
    default: {
      const _exhaustiveCheck: never = props.options[0];
      return _exhaustiveCheck;
    }
  }
}

export type ListVariantOptions =
  | ["list", FlatlistVariantProps]
  | ["menu", MenuVariantProps];

type VariantCommonProps = {
  state: ListState;
  dispatch: React.Dispatch<ListAction>;
  selected: Decimal;
  update_parent_values: (variable: Variable) => void;
  bsm_view_ref: React.RefObject<BottomSheetModalMethods>;
  bsm_sorting_ref: React.RefObject<BottomSheetModalMethods>;
  bsm_sorting_fields_ref: React.RefObject<BottomSheetModalMethods>;
  bsm_filters_ref: React.RefObject<BottomSheetModalMethods>;
};

type FlatlistVariantProps = {
  ListElement: RenderListElement;
  user_paths: Array<PathString>;
  borrows: Array<string>;
  horizontal?: boolean;
  title?: string;
  element?: JSX.Element;
};

function FlatlistVariant(props: VariantCommonProps & FlatlistVariantProps) {
  const renderItem = useCallback(
    (list_item: ListRenderItemInfo<Variable>) => {
      const ElementJSX = arrow(() => {
        if (props.state.layout in props.ListElement[1]) {
          return props.ListElement[1][props.state.layout];
        }
        return props.ListElement[0];
      });
      return (
        <ElementJSX
          struct={props.state.struct}
          user_paths={props.user_paths}
          borrows={props.borrows}
          variable={list_item.item}
          selected={list_item.item.id.equals(props.selected)}
          update_parent_values={() =>
            props.update_parent_values(list_item.item)
          }
        />
      );
    },
    [props.state.struct, props.state.layout, props.selected]
  );

  const keyExtractor = useCallback(
    (list_item: Variable) => list_item.id.toString(),
    []
  );

  const ListFooterComponent = useCallback(() => {
    if (!props.state.reached_end) {
      return (
        <Text my={"1"} textAlign={"center"}>
          Loading...
        </Text>
      );
    }
    return <></>;
  }, [props.state.reached_end]);

  console.log(props.state.refreshing, "---------");

  return (
    <>
      <FlatList
        data={props.state.variables}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={!!props.state.refreshing}
        onRefresh={() => {}}
        onEndReachedThreshold={0.5}
        onEndReached={() => props.dispatch(["offset"])}
        ListFooterComponent={ListFooterComponent}
        horizontal={!!props.horizontal}
        nestedScrollEnabled={true}
      />
      <Portal>
        <BottomSheetModal
          ref={props.bsm_view_ref}
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
            borderBottomColor={bs_theme.border}
            borderBottomWidth={"1"}
            px={"3"}
            pb={"2"}
          >
            <Text bold>VIEW</Text>
            <Pressable
              onPress={() => props.bsm_view_ref.current?.forceClose()}
              borderColor={bs_theme.primary}
              borderWidth={"1"}
              borderRadius={"xs"}
              px={"2"}
              py={"0.5"}
            >
              <Text>Close</Text>
            </Pressable>
          </Row>
          <BottomSheetScrollView contentContainerStyle={tw.style(["m-2"], {})}>
            <Pressable
              onPress={() => {
                if (props.state.layout !== "") {
                  props.bsm_view_ref.current?.forceClose();
                  props.dispatch(["layout", ""]);
                }
              }}
              flex={1}
              flexDirection={"row"}
              py={"0.5"}
            >
              {props.state.layout === "" ? (
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
              <Text pl={1}>Default</Text>
            </Pressable>
            {Object.keys(props.ListElement[1]).map((layout) => (
              <Pressable
                onPress={() => {
                  if (props.state.layout !== layout) {
                    props.bsm_view_ref.current?.forceClose();
                    props.dispatch(["layout", layout]);
                  }
                }}
                flex={1}
                flexDirection={"row"}
                py={"0.5"}
              >
                {props.state.layout === layout ? (
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
                <Text pl={1}>{layout}</Text>
              </Pressable>
            ))}
          </BottomSheetScrollView>
        </BottomSheetModal>
      </Portal>
    </>
  );
}

type MenuVariantProps = {
  element: JSX.Element;
  render_menu_item: (variable: Variable) => JSX.Element;
};

function MenuVariant(props: VariantCommonProps & MenuVariantProps) {
  return (
    <Menu
      shouldOverlapWithTrigger={true}
      trigger={(menu_props) => (
        <Pressable {...menu_props}>{props.element}</Pressable>
      )}
    >
      {props.state.variables.map((variable) => {
        return (
          <Menu.Item onPress={() => props.update_parent_values(variable)}>
            {props.render_menu_item(variable)}
            {/* <Text>TODO. Test this</Text> */}
          </Menu.Item>
        );
      })}
    </Menu>
  );
}
