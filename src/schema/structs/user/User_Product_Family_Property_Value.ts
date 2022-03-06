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
  ToTxt,
  Txt,
} from "../../../lib/lisp";

export default {
  fields: {
    user_product_family_property: {
      type: "other",
      other: "User_Product_Family_Property",
    },
    name: { type: "str" },
    order: { type: "u32", default: new Decimal(1) },
    translation_count: { type: "u32", default: new Decimal(0) },
  },
  uniqueness: [
    [["user_product_family_property"], "name"],
    [["user_product_family_property"], "order"],
  ],
  permissions: {
    borrow: {},
    ownership: {
      user_product_family_property: {
        read: [],
        write: ["name", "order"],
      },
    },
    public: ["user_product_family_property", "name", "order"],
  },
  triggers: {
    increment_count_in_user_product_family_property: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "user_product_family_property"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["user_product_family_property"], "value_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["user_product_family_property", "value_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_user_product_family_property: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "user_product_family_property"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["user_product_family_property"], "value_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["user_product_family_property", "value_count"])
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
            new Equals<ToTxt>([
              new DotExpression(new Dot(["name"])),
              new Txt(""),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
};
