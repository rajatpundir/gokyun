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
  Text,
} from "../../../lib/lisp";

export default {
  fields: {
    user_product: {
      type: "other",
      other: "User_Product",
    },
    language: { type: "other", other: "Language" },
    name: { type: "str" },
    description: { type: "clob" },
  },
  uniqueness: [[["user_product"], "language"]],
  permissions: {
    borrow: {},
    ownership: {
      user_product: {
        read: [],
        write: ["language", "name", "description"],
      },
    },
    public: ["user_product", "language", "name", "description"],
  },
  triggers: {
    increment_count_in_user_product: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "user_product"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["user_product"], "translation_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["user_product", "translation_count"])
                ),
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
            [["user_product"], "translation_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["user_product", "translation_count"])
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
};
