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
    name: { type: "str" },
    // Note. Care to be taken that wallet of just about anyone cannot be assigned
    wallet: { type: "other", other: "Wallet" },
    member_count: { type: "u32" },
  },
  uniqueness: [[[], "name"]],
  permissions: {
    private: {
      wallet: {
        read: [],
        write: ["name"],
      },
    },
    public: ["name"],
  },
  triggers: {
    increment_count_in_wallet: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "wallet"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["wallet"], "guild_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(new Dot(["wallet", "guild_count"])),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_wallet: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "wallet"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["wallet"], "guild_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(new Dot(["wallet", "guild_count"])),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
  },
  checks: {
    name_is_not_empty: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToTxt>([
              new Txt(""),
              new DotExpression(new Dot(["name"])),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
};
