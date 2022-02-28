import React from "react";
import { Column, Pressable, Row, Text } from "native-base";
import { ComponentViews } from "../lib/component";
import { Template } from "../lib/templates";
import { arrow } from "../lib/prelude";
import { useTheme } from "../lib/theme";

const views = {};

const common_default_component: ComponentViews[string]["show"] = (props) => {
  const theme = useTheme();
  return (
    <Column
      p={"2"}
      m={"1"}
      borderWidth={"1"}
      borderRadius={"md"}
      borderColor={theme.border}
      backgroundColor={arrow(() => {
        if (props.selected) {
          return theme.background;
        }
        return theme.background;
      })}
    >
      <Row justifyContent={"space-between"}>
        <Column>
          <Text bold color={theme.label}>
            Unique ID
          </Text>
        </Column>
        <Column>
          <Text color={theme.text}>{props.state.id.toString()}</Text>
        </Column>
      </Row>
      <Template
        {...props}
        type={"CH"}
        fields={["nickname", "knows_english", "mobile", "product_count"]}
      />
      <Row justifyContent={"flex-end"}>
        {arrow(() => {
          if (!props.selected) {
            return (
              <Pressable
                px={"4"}
                py={"2"}
                rounded={"sm"}
                backgroundColor={theme.primary}
                onPress={props.update_parent_values}
              >
                <Text bold color={"white"}>
                  OK
                </Text>
              </Pressable>
            );
          }
        })}
      </Row>
    </Column>
  );
};

export default {
  Default: {
    create: () => <></>,
    update: common_default_component,
    show: common_default_component,
  },
} as ComponentViews;
