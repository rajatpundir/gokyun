import Decimal from "decimal.js";
import { StructSchema } from "../../struct";
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
  errors,
  ErrMsg,
  Text,
} from "../../../lib";

export default {
  fields: {
    alliance: { type: "other", other: "Alliance" },
    name: { type: "str" },
    order: { type: "u32", default: new Decimal(1) },
    product_category: { type: "other", other: "Product_Category" },
    property_count: { type: "u32", default: new Decimal(0) },
    product_count: { type: "u32", default: new Decimal(0) },
    translation_count: { type: "u32", default: new Decimal(0) },
  },
  uniqueness: [
    [["alliance"], "name"],
    [["alliance"], "order"],
  ],
  permissions: {
    borrow: {},
    ownership: {
      alliance: {
        read: [],
        write: [
          "order",
          "name",
          "product_category",
          "property_count",
          "product_count",
          "translation_count",
        ],
      },
    },
    public: [
      "alliance",
      "order",
      "name",
      "product_category",
      "property_count",
      "product_count",
      "translation_count",
    ],
  },
  triggers: {
    increment_product_family_count_in_alliance: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance"], "product_family_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["alliance", "product_family_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_product_family_count_in_alliance: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "alliance"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance"], "product_family_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["alliance", "product_family_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    increment_product_count_in_alliance: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "product_count"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance"], "product_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(new Dot(["alliance", "product_count"])),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_product_count_in_alliance: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "product_count"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance"], "product_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(new Dot(["alliance", "product_count"])),
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
