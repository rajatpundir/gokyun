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
  NumberComparatorExpression,
  LessThanEquals,
  Txt,
} from "../../../lib/lisp";

export default {
  fields: {
    alliance_product_family: {
      type: "other",
      other: "Alliance_Product_Family",
    },
    name: { type: "str" },
    description: { type: "clob" },
    variant_count: { type: "u32", default: new Decimal(0) },
    tag_count: { type: "u32", default: new Decimal(0) },
    translation_count: { type: "u32", default: new Decimal(0) },
  },
  uniqueness: [[["alliance_product_family"], "name"]],
  permissions: {
    private: {
      alliance_product_family: {
        read: [],
        write: [
          "name",
          "description",
          "variant_count",
          "tag_count",
          "translation_count",
        ],
      },
    },
    public: [
      "alliance_product_family",
      "name",
      "description",
      "variant_count",
      "tag_count",
      "translation_count",
    ],
  },
  triggers: {
    increment_count_in_alliance_product_family: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance_product_family"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_product_family"], "product_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["alliance_product_family", "product_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_alliance_product_family: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "alliance_product_family"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_product_family"], "product_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["alliance_product_family", "product_count"])
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
    tag_count_is_less_than_system_tag_count: [
      new NumberComparatorExpression(
        new LessThanEquals<ToNum>([
          new DotExpression(new Dot(["tag_count"])),
          new DotExpression(new Dot(["_system", "tag_count"])),
          [],
        ])
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
};
