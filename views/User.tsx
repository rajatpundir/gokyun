import React from "react";
import { Pressable } from "react-native";
import { ComponentViews } from "../main/utils/component";
import { Label, Field } from "../main/utils/fields";
import { View, Text } from "../main/themed";
import { colors } from "../main/themed/colors";

export default {
  Default: {
    create: () => <></>,
    update: () => <></>,
    show: (props) => {
      if (props.selected) {
        return (
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              borderRadius: 5,
              paddingVertical: 5,
              marginVertical: 5,
              backgroundColor: colors.tailwind.slate[800],
              borderWidth: 1,
            }}
          >
            <View>
              <Text>Unique ID</Text>
              <Text>{props.state.id.toString()}</Text>
            </View>
            <View>
              <Text>Created</Text>
              <Text>{props.state.created_at.toString()}</Text>
            </View>
            <View>
              <Text>Updated</Text>
              <Text>{props.state.updated_at.toString()}</Text>
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
          </View>
        );
      } else {
        return (
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              borderRadius: 5,
              paddingVertical: 5,
              marginVertical: 5,
              backgroundColor: colors.tailwind.slate[900],
            }}
          >
            <View>
              <Text>Unique ID</Text>
              <Text>{props.state.id.toString()}</Text>
            </View>
            <View>
              <Text>Created</Text>
              <Text>{props.state.created_at.toString()}</Text>
            </View>
            <View>
              <Text>Updated</Text>
              <Text>{props.state.updated_at.toString()}</Text>
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
          </View>
        );
      }
    },
  },
} as ComponentViews;
