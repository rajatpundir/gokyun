import Decimal from "decimal.js";
import { errors, ErrMsg } from "../../../lib/errors";
import {
  NumberArithmeticExpression,
  Add,
  ToNum,
  DotExpression,
  Dot,
  Num,
  Subtract,
  NumberComparatorExpression,
  Equals,
} from "../../../lib/lisp";

export default {
  fields: {
    user_product_family_variant: {
      type: "other",
      other: "User_Product_Family_Variant",
    },
    order: { type: "u32", default: new Decimal(1) },
    user_product_family_property: {
      type: "other",
      other: "User_Product_Family_Property",
    },
    user_product_family_property_value: {
      type: "other",
      other: "User_Product_Family_Property_Value",
    },
  },
  uniqueness: [
    [["user_product_family_variant"], "order"],
    [["user_product_family_variant"], "user_product_family_property"],
  ],
  permissions: {
    private: {
      user_product_family_variant: {
        read: [],
        write: [
          "order",
          "user_product_family_property",
          "user_product_family_property_value",
        ],
      },
    },
    public: [
      "user_product_family_variant",
      "order",
      "user_product_family_property",
      "user_product_family_property_value",
    ],
  },
  triggers: {
    increment_count_in_user_product_family_variant: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "user_product_family_variant"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["user_product_family_variant"], "variant_property_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "user_product_family_variant",
                    "variant_property_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_user_product_family_variant: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "user_product_family_variant"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["user_product_family_variant"], "variant_property_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "user_product_family_variant",
                    "variant_property_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
  },
  checks: {
    user_product_family_is_the_same: [
      new NumberComparatorExpression(
        new Equals<ToNum>([
          new DotExpression(
            new Dot(["user_product_family_property", "user_product_family"])
          ),
          new DotExpression(
            new Dot(["user_product_family_variant", "user_product_family"])
          ),
          [],
        ])
      ),
      [errors.ErrUnexpected] as ErrMsg,
    ],
    user_product_family_property_is_the_same: [
      new NumberComparatorExpression(
        new Equals<ToNum>([
          new DotExpression(
            new Dot([
              "user_product_family_property_value",
              "user_product_family_property",
            ])
          ),
          new DotExpression(new Dot(["user_product_family_property"])),
          [],
        ])
      ),
      [errors.ErrUnexpected] as ErrMsg,
    ],
  },
};
