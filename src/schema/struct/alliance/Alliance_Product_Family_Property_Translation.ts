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
} from "../../../lib";

export default {
  fields: {
    alliance_product_family_property: {
      type: "other",
      other: "Alliance_Product_Family_Property",
    },
    language: { type: "other", other: "Language" },
    name: { type: "str" },
  },
  uniqueness: [[["alliance_product_family_property"], "language"]],
  permissions: {
    borrow: {},
    ownership: {
      alliance_product_family_property: {
        read: [],
        write: ["language", "name"],
      },
    },
    public: ["alliance_product_family_property", "language", "name"],
  },
  triggers: {
    increment_count_in_alliance_product_family_property: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance_product_family_property"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_product_family_property"], "translation_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "alliance_product_family_property",
                    "translation_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_alliance_product_family_property: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "alliance_product_family_property"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_product_family_property"], "translation_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "alliance_product_family_property",
                    "translation_count",
                  ])
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
