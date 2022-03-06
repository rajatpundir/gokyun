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
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  Equals,
  ToText,
  Text,
} from "../../../lib/lisp";

export default {
  fields: {
    alliance_product_family_property: {
      type: "other",
      other: "Alliance_Product_Family_Property",
    },
    name: { type: "str" },
    order: { type: "u32", default: new Decimal(1) },
    translation_count: { type: "u32", default: new Decimal(0) },
  },
  uniqueness: [
    [["alliance_product_family_property"], "name"],
    [["alliance_product_family_property"], "order"],
  ],
  permissions: {
    borrow: {},
    ownership: {
      alliance_product_family_property: {
        read: [],
        write: ["name", "order"],
      },
    },
    public: ["alliance_product_family_property", "name", "order"],
  },
  triggers: {
    increment_count_in_alliance_product_family_property: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance_product_family_property"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_product_family_property"], "value_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["alliance_product_family_property", "value_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_alliance_product_family_property: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "alliance_product_family_property"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_product_family_property"], "value_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["alliance_product_family_property", "value_count"])
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
    name_cannot_be_empty: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToText>([
              new DotExpression(new Dot(["name"])),
              new Text(""),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
};
