import React from "react";
import { Pressable } from "react-native";
import { Column, Row, Text } from "native-base";
import { ComponentViews } from "../lib/utils/component";
import { Template } from "../lib/utils/templates";
import { arrow } from "../lib/utils/prelude";
import { colors, tw } from "../lib/utils/tailwind";
import { theme } from "../lib/utils/theme";

export default {
  Default: {
    create: () => <></>,
    update: () => <></>,
    show: (props) => {
      return (
        <Column
          p={"2"}
          m={"1"}
          borderWidth={"1"}
          borderRadius={"md"}
          borderColor={colors.slate[600]}
          backgroundColor={arrow(() => {
            if (props.selected) {
              return colors.slate[800];
            }
            return colors.slate[900];
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
            type={"CLB"}
            {...props}
            fields={["nickname", "knows_english", "mobile", "product_count"]}
          />
          <Row justifyContent={"flex-end"}>
            {arrow(() => {
              if (!props.selected) {
                return (
                  <Pressable
                    onPress={props.update_parent_values}
                    style={tw.style(["px-2", "py-1", "rounded", "border"], {
                      borderColor: theme.placeholder,
                    })}
                  >
                    <Text fontWeight={"bold"}>OK</Text>
                  </Pressable>
                );
              }
            })}
          </Row>
        </Column>
      );
    },
  },
} as ComponentViews;
