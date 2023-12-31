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
    alliance_product_family: {
      type: "other",
      other: "Alliance_Product_Family",
    },
    language: { type: "other", other: "Language" },
    name: { type: "str" },
  },
  uniqueness: [[["alliance_product_family"], "language"]],
  permissions: {
    private: {
      alliance_product_family: {
        read: [],
        write: ["language", "name"],
      },
    },
    public: ["alliance_product_family", "language", "name"],
  },
  triggers: {
    increment_count_in_alliance_product_family: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance_product_family"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_product_family"], "translation_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["alliance_product_family", "translation_count"])
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
            [["alliance_product_family"], "translation_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["alliance_product_family", "translation_count"])
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
