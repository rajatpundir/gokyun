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
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  Equals,
  ToText,
  errors,
  ErrMsg,
  Text,
  NumberComparatorExpression,
  GreaterThanEquals,
} from "../../../lib";

export default {
  fields: {
    alliance: { type: "other", other: "Alliance" },
    name: { type: "str" },
    description: { type: "clob" },
    min_price: { type: "udecimal" },
    max_price: { type: "udecimal" },
    provider_count: { type: "u32", default: new Decimal(0) },
    translation_count: { type: "u32", default: new Decimal(0) },
  },
  uniqueness: [[["alliance"], "name"]],
  permissions: {
    borrow: {},
    ownership: {
      alliance: {
        read: [],
        write: ["name", "language", "description", "min_price", "max_price"],
      },
    },
    public: [
      "alliance",
      "name",
      "language",
      "description",
      "min_price",
      "max_price",
      "provider_count",
      "provider_price_sum",
      "provider_average_price",
    ],
  },
  triggers: {
    increment_count_in_alliance: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance"], "service_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(new Dot(["alliance", "service_count"])),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_alliance: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "alliance"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance"], "service_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(new Dot(["alliance", "service_count"])),
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
