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
  Num,
  NumberArithmeticExpression,
  Subtract,
  ToNum,
} from "../../lib/lisp";
import { StructSchema } from "../struct";

export default {
  fields: {
    product_category: { type: "other", other: "Product_Category" },
    language: { type: "other", other: "Language" },
    name: { type: "str" },
  },
  uniqueness: [[["product_category"], "language"]],
  permissions: {
    borrow: {},
    ownership: {},
    public: ["product_category", "language", "name"],
  },
  triggers: {
    increment_count_in_product_category: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "product_category"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["product_category"], "translation_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["product_category", "translation_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_product_category: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "product_category"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["product_category"], "translation_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["product_category", "translation_count"])
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
    language_is_not_english: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToText>([
              new DotExpression(new Dot(["language", "code"])),
              new Text("en"),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
} as StructSchema;
