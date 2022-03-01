import Decimal from "decimal.js";
import { errors, ErrMsg } from "../../lib/errors";
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
  Divide,
  GreaterThanEquals,
  Num,
  NumberArithmeticExpression,
  NumberComparatorExpression,
  Subtract,
  ToDeci,
  ToNum,
} from "../../lib/lisp";
import { StructSchema } from "../struct";

export default {
  fields: {
    alliance_product: {
      type: "other",
      other: "Alliance_Product",
    },
    name: { type: "str" },
    min_quantity: { type: "u32", default: new Decimal(1) },
    max_quantity: { type: "u32" },
    min_price: { type: "udecimal" },
    max_price: { type: "udecimal" },
    variant_property_count: { type: "u32", default: new Decimal(0) },
    provider_count: { type: "u32", default: new Decimal(0) },
    provider_price_sum: { type: "u32", default: new Decimal(0) },
    provider_average_price: { type: "udecimal", default: new Decimal(0) },
    translation_count: { type: "u32", default: new Decimal(0) },
  },
  uniqueness: [[["alliance_product"], "name"]],
  permissions: {
    borrow: {},
    ownership: {
      alliance_product: {
        read: [],
        write: [
          "name",
          "min_quantity",
          "max_quantity",
          "min_price",
          "max_price",
        ],
      },
    },
    public: [
      "alliance_product",
      "name",
      "min_quantity",
      "max_quantity",
      "min_price",
      "max_price",
      "variant_property_count",
      "provider_count",
      "provider_price_sum",
      "provider_average_price",
      "translation_count",
    ],
  },
  triggers: {
    increment_count_in_alliance_product: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance_product"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_product"], "variant_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["alliance_product", "variant_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_alliance_product: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "alliance_product"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_product"], "variant_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["alliance_product", "variant_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    compute_provider_average_price: {
      event: ["after_creation", "after_update"],
      monitor: [
        [[], "provider_count"],
        [[], "provider_price_sum"],
      ],
      operation: {
        op: "update",
        path_updates: [
          [
            [[], "provider_average_price"],
            new NumberArithmeticExpression(
              new Divide<ToDeci>([
                new DotExpression(new Dot(["provider_price_sum"])),
                [new DotExpression(new Dot(["provider_count"]))],
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
    min_quantity_is_less_than_max_quantity: [
      new NumberComparatorExpression(
        new GreaterThanEquals<ToNum>([
          new DotExpression(new Dot(["min_quantity"])),
          new DotExpression(new Dot(["max_quantity"])),
          [],
        ])
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
    min_price_is_less_than_max_price: [
      new NumberComparatorExpression(
        new GreaterThanEquals<ToNum>([
          new DotExpression(new Dot(["min_price"])),
          new DotExpression(new Dot(["max_price"])),
          [],
        ])
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
} as StructSchema;
