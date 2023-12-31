import React, { useCallback, useRef } from "react";
import { FlatList, ListRenderItemInfo } from "react-native";
import Decimal from "decimal.js";
import { Menu, Text, Pressable, Row, Column, Spinner } from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { Portal } from "@gorhom/portal";
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { apply, arrow } from "./prelude";
import { Struct, Variable } from "./variable";
import { tw } from "./tailwind";
import { ListAction, ListState, RenderListElement } from "./list";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { useBSTheme, useTheme } from "./theme";
import { Entrypoint } from "./permissions";

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
    case "sheet": {
      return <SheetVariant {...props} {...props.options[1]} />;
    }
    case "row": {
      return <RowVariant {...props} {...props.options[1]} />;
    }
    case "column": {
      return <ColumnVariant {...props} {...props.options[1]} />;
    }
    default: {
      const _exhaustiveCheck: never = props.options[0];
      return _exhaustiveCheck;
    }
  }
}

export type ListVariantOptions =
  | ["list", FlatlistVariantProps]
  | ["menu", MenuVariantProps]
  | ["sheet", SheetVariantProps]
  | ["row", RowVariantProps]
  | ["column", ColumnVariantProps];

type VariantCommonProps = {
  state: ListState;
  dispatch: React.Dispatch<ListAction>;
  selected: Decimal;
  on_select: (variable: Variable) => void;
  bsm_view_ref: React.RefObject<BottomSheetModalMethods>;
  bsm_sorting_ref: React.RefObject<BottomSheetModalMethods>;
  bsm_sorting_fields_ref: React.RefObject<BottomSheetModalMethods>;
  bsm_filters_ref: React.RefObject<BottomSheetModalMethods>;
};

type FlatlistVariantProps = {
  RenderElement: RenderListElement;
  entrypoints: Array<Entrypoint>;
  horizontal?: boolean;
  title?: string;
  element?: JSX.Element;
};

function FlatlistVariant(props: VariantCommonProps & FlatlistVariantProps) {
  const bs_theme = useBSTheme();
  const renderItem = useCallback(
    (list_item: ListRenderItemInfo<Variable>) => {
      const ElementJSX = arrow(() => {
        if (props.state.layout in props.RenderElement[1]) {
          return props.RenderElement[1][props.state.layout];
        }
        return props.RenderElement[0];
      });
      return (
        <ElementJSX
          struct={props.state.struct}
          entrypoints={props.entrypoints}
          variable={list_item.item}
          selected={list_item.item.id.equals(props.selected)}
          on_select={() => props.on_select(list_item.item)}
        />
      );
    },
    [props.state.struct, props.state.layout, props.selected]
  );

  const keyExtractor = (variable: Variable) => variable.id.toString();

  const ListFooterComponent = useCallback(() => {
    if (!props.state.reached_end) {
      return (
        <Row justifyContent={"center"} alignItems={"center"}>
          <Text my={"1"} color={bs_theme.text}>
            Loading
          </Text>
          <Spinner size={"sm"} color={bs_theme.primary} />
        </Row>
      );
    }
    return <></>;
  }, [props.state.reached_end]);

  return (
    <>
      <FlatList
        data={props.state.variables}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={!!props.state.refreshing}
        onRefresh={() => props.dispatch(["reload"])}
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
            borderBottomColor={bs_theme.primary}
            borderBottomWidth={"1"}
            px={"3"}
            pb={"2"}
          >
            <Text bold color={bs_theme.text}>
              VIEW
            </Text>
            <Pressable
              onPress={() => props.bsm_view_ref.current?.forceClose()}
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
              <Text pl={1} color={bs_theme.text}>
                Default
              </Text>
            </Pressable>
            {Object.keys(props.RenderElement[1]).map((layout) => (
              <Pressable
                key={layout}
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
                <Text pl={1} color={bs_theme.text}>
                  {layout}
                </Text>
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
  RenderElement: (variable: Variable) => string;
};

function MenuVariant(props: VariantCommonProps & MenuVariantProps) {
  const theme = useTheme();
  return (
    <Menu
      mx={"3"}
      shouldOverlapWithTrigger={true}
      backgroundColor={theme.background}
      borderColor={theme.border}
      trigger={(menu_props) => (
        <Pressable
          {...menu_props}
          flexDirection={"row"}
          alignItems={"center"}
          borderColor={theme.border}
          borderWidth={"1"}
          borderRadius={"sm"}
          pl={"1.5"}
          pr={"0"}
          py={"0.5"}
        >
          {props.element}
        </Pressable>
      )}
    >
      {props.state.variables.map((variable) => {
        return (
          <Menu.Item
            key={variable.id.toString()}
            onPress={() => props.on_select(variable)}
          >
            <Text color={theme.text}>{props.RenderElement(variable)}</Text>
          </Menu.Item>
        );
      })}
    </Menu>
  );
}

export type SheetVariantProps = {
  element: JSX.Element;
  RenderElement: (variable: Variable) => (selected: boolean) => JSX.Element;
  title?: string;
  bsm_ref?: React.RefObject<BottomSheetModalMethods>;
};

function SheetVariant(props: VariantCommonProps & SheetVariantProps) {
  const bs_theme = useBSTheme();
  const bsm_ref_1 = useRef<BottomSheetModal>(null);
  const bsm_ref = apply(props.bsm_ref, (it) => {
    if (it !== undefined) {
      return it;
    }
    return bsm_ref_1;
  });

  const renderItem = useCallback(
    (list_item: ListRenderItemInfo<Variable>) => {
      return (
        <Pressable
          onPress={() => {
            props.on_select(list_item.item);
            bsm_ref.current?.forceClose();
          }}
        >
          {props.RenderElement(list_item.item)(
            props.selected.equals(list_item.item.id)
          )}
        </Pressable>
      );
    },
    [props.selected, props.RenderElement, props.on_select]
  );

  const keyExtractor = (variable: Variable) => variable.id.toString();

  const ListFooterComponent = useCallback(() => {
    if (!props.state.reached_end) {
      return (
        <Text my={"1"} textAlign={"center"} color={bs_theme.text}>
          Loading...
        </Text>
      );
    }
    return <></>;
  }, [props.state.reached_end]);

  return (
    <Portal>
      <BottomSheetModal
        ref={props.bsm_ref}
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
            {props.title}
          </Text>
          <Pressable
            onPress={() => bsm_ref.current?.forceClose()}
            borderColor={bs_theme.primary}
            borderWidth={"1"}
            borderRadius={"xs"}
            px={"2"}
            py={"0.5"}
          >
            <Text color={bs_theme.text}>Close</Text>
          </Pressable>
        </Row>
        <BottomSheetFlatList
          contentContainerStyle={tw.style(["m-2"], {})}
          data={props.state.variables}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshing={!!props.state.refreshing}
          onRefresh={() => props.dispatch(["reload"])}
          onEndReachedThreshold={0.5}
          onEndReached={() => props.dispatch(["offset"])}
          ListFooterComponent={ListFooterComponent}
          nestedScrollEnabled={true}
        />
      </BottomSheetModal>
    </Portal>
  );
}

export type RenderWrappedItemProps = {
  struct: Struct;
  entrypoints: Array<Entrypoint>;
  variable: Variable;
  selected: boolean;
  on_select: () => void;
};

type RowVariantProps = {
  RenderElement: (props: RenderWrappedItemProps) => JSX.Element;
  entrypoints: Array<Entrypoint>;
};

function RowVariant(props: VariantCommonProps & RowVariantProps) {
  return (
    <Row space={"2"} flexWrap={"wrap"}>
      {props.state.variables.map((variable) => (
        <props.RenderElement
          key={variable.id.toString()}
          struct={props.state.struct}
          entrypoints={props.entrypoints}
          variable={variable}
          selected={variable.id.equals(props.selected)}
          on_select={() => props.on_select(variable)}
        />
      ))}
    </Row>
  );
}

type ColumnVariantProps = {
  RenderElement: (props: RenderWrappedItemProps) => JSX.Element;
  entrypoints: Array<Entrypoint>;
};

function ColumnVariant(props: VariantCommonProps & ColumnVariantProps) {
  return (
    <Column space={"2"} flexWrap={"wrap"}>
      {props.state.variables.map((variable) => (
        <props.RenderElement
          key={variable.id.toString()}
          struct={props.state.struct}
          entrypoints={props.entrypoints}
          variable={variable}
          selected={variable.id.equals(props.selected)}
          on_select={() => props.on_select(variable)}
        />
      ))}
    </Column>
  );
}
