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
    product_category: { type: "other", other: "Product_Category" },
    language: { type: "other", other: "Language" },
    name: { type: "str" },
  },
  uniqueness: [[["product_category"], "language"]],
  permissions: {
    private: {},
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
    language_is_not_english: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToTxt>([
              new DotExpression(new Dot(["language", "code"])),
              new Txt("en"),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
};
