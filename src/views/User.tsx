import React from "react";
import { Column, Pressable, Row, Text } from "native-base";
import { ComponentViews } from "../lib/utils/component";
import { Template } from "../lib/utils/templates";
import { arrow } from "../lib/utils/prelude";
import { theme } from "../lib/utils/theme";

const views = {};

const common_default_component: ComponentViews[string]["show"] = (props) => {
  return (
    <Column
      p={"2"}
      m={"1"}
      borderWidth={"1"}
      borderRadius={"md"}
      borderColor={theme.border}
      backgroundColor={arrow(() => {
        if (props.selected) {
          return theme.border;
        }
        return theme.background;
      })}
    >
      <Row justifyContent={"space-between"}>
        <Column>
          <Text>Unique ID</Text>
        </Column>
        <Column>
          <Text>{props.state.id.toString()}</Text>
        </Column>
      </Row>
      <Template
        {...props}
        type={"CLB"}
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
                <Text bold>OK</Text>
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
