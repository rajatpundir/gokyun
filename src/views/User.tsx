import React from "react";
import { Pressable } from "react-native";
import { ComponentViews } from "../lib/utils/component";
import { Label, Field } from "../lib/utils/fields";
import { View, Text } from "../lib/themed";
import { colors } from "../lib/themed/colors";
import { arrow } from "../lib/utils/prelude";

export default {
  Default: {
    create: () => <></>,
    update: () => <></>,
    show: (props) => {
      return (
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            borderRadius: 5,
            borderWidth: 1,
            paddingHorizontal: 10,
            paddingVertical: 10,
            marginHorizontal: 10,
            marginBottom: 10,
            backgroundColor: arrow(() => {
              if (props.selected) {
                return colors.tailwind.slate[800];
              }
              return colors.tailwind.slate[900];
            }),
          }}
        >
          <View>
            <Text>Unique ID</Text>
            <Text>{props.state.id.toString()}</Text>
          </View>
          <View>
            <Label {...props} path={"nickname"} />
            <Field {...props} path={"nickname"} />
          </View>
          <View>
            <Label {...props} path={"knows_english"} />
            <Field {...props} path={"knows_english"} />
          </View>
          <View>
            <Label {...props} path={"mobile"} />
            <Field {...props} path={"mobile"} />
          </View>
          <View>
            <Label {...props} path={"product_count"} />
            <Field {...props} path={"product_count"} />
          </View>
          {arrow(() => {
            if (!props.selected) {
              return (
                <Pressable
                  onPress={props.update_parent_values}
                  style={{
                    alignSelf: "flex-end",
                    paddingVertical: 10,
                    paddingRight: 5,
                  }}
                >
                  <Text
                    style={{
                      backgroundColor: colors.tailwind.slate[700],
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      fontWeight: "bold",
                      borderRadius: 2,
                    }}
                  >
                    OK
                  </Text>
                </Pressable>
              );
            }
          })}
        </View>
      );
    },
  },
} as ComponentViews;
