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
  Num,
  NumberArithmeticExpression,
  Subtract,
  ToNum,
} from "../../../lib/lisp";
import { StructSchema } from "..";

export default {
  fields: {
    service_category: { type: "other", other: "Service_Category" },
    language: { type: "other", other: "Language" },
    name: { type: "str" },
  },
  uniqueness: [[["service_category"], "language"]],
  permissions: {
    borrow: {},
    ownership: {},
    public: ["service_category", "language", "name"],
  },
  triggers: {
    increment_count_in_service_category: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "service_category"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["service_category"], "translation_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["service_category", "translation_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_service_category: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "service_category"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["service_category"], "translation_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["service_category", "translation_count"])
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
