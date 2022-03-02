import Decimal from "decimal.js";
import { errors, ErrMsg } from "../../../lib";
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
  Num,
  NumberArithmeticExpression,
  Subtract,
  ToNum,
} from "../../../lib";
import { StructSchema } from "..";

export default {
  fields: {
    user_product: {
      type: "other",
      other: "User_Product",
    },
    name: { type: "str" },
    quantity: { type: "u32", default: new Decimal(0) },
    price: { type: "udecimal" },
    variant_property_count: { type: "u32", default: new Decimal(0) },
    alliance_variant_count: { type: "u32", default: new Decimal(0) },
    translation_count: { type: "u32", default: new Decimal(0) },
  },
  uniqueness: [
    [["user_product"], "name"],
    [["user_product"], "order"],
  ],
  permissions: {
    borrow: {},
    ownership: {
      user_product: {
        read: [],
        write: ["order", "name", "quantity", "price"],
      },
    },
    public: [
      "user_product",
      "order",
      "name",
      "quantity",
      "price",
      "variant_property_count",
      "translation_count",
    ],
  },
  triggers: {
    increment_count_in_user_product: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "user_product"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["user_product"], "variant_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(new Dot(["user_product", "variant_count"])),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_user_product: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "user_product"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["user_product"], "variant_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(new Dot(["user_product", "variant_count"])),
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
} as StructSchema;