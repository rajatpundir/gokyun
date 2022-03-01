import Decimal from "decimal.js";
import { errors, ErrMsg } from "../../../lib/errors";
import {
  DotExpression,
  Dot,
  Equals,
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  ToText,
  Text,
  Add,
  LessThanEquals,
  Num,
  NumberArithmeticExpression,
  NumberComparatorExpression,
  Subtract,
  ToNum,
} from "../../../lib/lisp";
import { StructSchema } from "..";

export default {
  fields: {
    user_product_family: {
      type: "other",
      other: "User_Product_Family",
    },
    name: { type: "str" },
    description: { type: "clob" },
    variant_count: { type: "u32", default: new Decimal(0) },
    tag_count: { type: "u32", default: new Decimal(0) },
    translation_count: { type: "u32", default: new Decimal(0) },
  },
  uniqueness: [[["user_product_family"], "name"]],
  permissions: {
    borrow: {},
    ownership: {
      user_product_family: {
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
      "user_product_family",
      "name",
      "description",
      "variant_count",
      "tag_count",
      "translation_count",
    ],
  },
  triggers: {
    increment_count_in_user_product_family: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "user_product_family"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["user_product_family"], "product_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["user_product_family", "product_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_user_product_family: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "user_product_family"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["user_product_family"], "product_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["user_product_family", "product_count"])
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
} as StructSchema;
