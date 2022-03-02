import Decimal from "decimal.js";
import { StructSchema } from "..";
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
  errors,
  ErrMsg,
} from "../../../lib";

export default {
  fields: {
    alliance_product_family_variant: {
      type: "other",
      other: "Alliance_Product_Family_Variant",
    },
    order: { type: "u32", default: new Decimal(1) },
    alliance_product_family_property: {
      type: "other",
      other: "Alliance_Product_Family_Property",
    },
    alliance_product_family_property_value: {
      type: "other",
      other: "Alliance_Product_Family_Property_Value",
    },
  },
  uniqueness: [
    [["alliance_product_family_variant"], "order"],
    [["alliance_product_family_variant"], "alliance_product_family_property"],
  ],
  permissions: {
    borrow: {},
    ownership: {
      alliance_product_family_variant: {
        read: [],
        write: [
          "order",
          "alliance_product_family_property",
          "alliance_product_family_property_value",
        ],
      },
    },
    public: [
      "alliance_product_family_variant",
      "order",
      "alliance_product_family_property",
      "alliance_product_family_property_value",
    ],
  },
  triggers: {
    increment_count_in_alliance_product_family_variant: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance_product_family_variant"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_product_family_variant"], "variant_property_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "alliance_product_family_variant",
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
    decrement_count_in_alliance_product_family_variant: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "alliance_product_family_variant"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_product_family_variant"], "variant_property_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "alliance_product_family_variant",
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
    alliance_product_family_is_the_same: [
      new NumberComparatorExpression(
        new Equals<ToNum>([
          new DotExpression(
            new Dot([
              "alliance_product_family_property",
              "alliance_product_family",
            ])
          ),
          new DotExpression(
            new Dot([
              "alliance_product_family_variant",
              "alliance_product_family",
            ])
          ),
          [],
        ])
      ),
      [errors.ErrUnexpected] as ErrMsg,
    ],
    alliance_product_family_property_is_the_same: [
      new NumberComparatorExpression(
        new Equals<ToNum>([
          new DotExpression(
            new Dot([
              "alliance_product_family_property_value",
              "alliance_product_family_property",
            ])
          ),
          new DotExpression(new Dot(["alliance_product_family_property"])),
          [],
        ])
      ),
      [errors.ErrUnexpected] as ErrMsg,
    ],
  },
} as StructSchema;
