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
  NumberComparatorExpression,
  Equals,
} from "../../../lib/lisp";

export default {
  fields: {
    alliance: { type: "other", other: "Alliance" },
    alliance_product: { type: "other", other: "Alliance_Product" },
    markup: { type: "udecimal" }, // percentage increase above base price
  },
  uniqueness: [[["alliance"], "alliance_product"]],
  permissions: {
    private: {
      alliance: {
        read: [],
        write: ["alliance_product", "markup"],
      },
    },
    public: ["alliance", "alliance_product", "markup"],
  },
  triggers: {
    increment_count_in_alliance: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance"], "virtual_product_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["alliance", "virtual_product_count"])
                ),
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
            [["alliance"], "virtual_product_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["alliance", "virtual_product_count"])
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
    alliance_is_not_same: [
      new LogicalUnaryExpression(
        new Not(
          new NumberComparatorExpression(
            new Equals<ToNum>([
              new DotExpression(
                new Dot([
                  "alliance_product",
                  "alliance_product_family",
                  "alliance",
                ])
              ),
              new DotExpression(new Dot(["alliance"])),
              [],
            ])
          )
        )
      ),
      [errors.ErrUnexpected] as ErrMsg,
    ],
  },
};
