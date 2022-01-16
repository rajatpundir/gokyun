import React from "react";
import { Pressable } from "react-native";
import { ComponentViews } from "../lib/utils/component";
import { arrow } from "../lib/utils/prelude";
import { colors, tw } from "../lib/utils/tailwind";
import { Column, Row, Text } from "native-base";
import { SBS } from "../lib/utils/templates";
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
          <SBS
            {...props}
            fields={[
              {
                path: "nickname",
              },
              {
                path: "knows_english",
              },
              {
                path: "mobile",
              },
              {
                path: "product_count",
              },
            ]}
          />
          <Row justifyContent={"flex-end"}>
            {arrow(() => {
              if (!props.selected) {
                return (
                  <Pressable
                    onPress={props.update_parent_values}
                    style={tw.style(
                      ["px-4", "py-2", "rounded", "border", "mx-2"],
                      {
                        borderColor: theme.placeholder,
                      }
                    )}
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
