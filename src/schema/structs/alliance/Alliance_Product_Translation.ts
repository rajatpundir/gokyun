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
  ToText,
  Txt,
} from "../../../lib/lisp";

export default {
  fields: {
    alliance_product: {
      type: "other",
      other: "Alliance_Product",
    },
    language: { type: "other", other: "Language" },
    name: { type: "str" },
    description: { type: "clob" },
  },
  uniqueness: [[["alliance_product"], "language"]],
  permissions: {
    borrow: {},
    ownership: {
      alliance_product: {
        read: [],
        write: ["language", "name", "description"],
      },
    },
    public: ["alliance_product", "language", "name", "description"],
  },
  triggers: {
    increment_count_in_alliance_product: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance_product"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_product"], "translation_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["alliance_product", "translation_count"])
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
            [["alliance_product"], "translation_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["alliance_product", "translation_count"])
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
            new Equals<ToText>([
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
