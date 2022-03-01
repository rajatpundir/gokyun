import Decimal from "decimal.js";
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
  LessThan,
  Num,
  NumberArithmeticExpression,
  NumberComparatorExpression,
  ToNum,
} from "../../lib/lisp";
import { StructSchema } from ".";

export default {
  fields: {
    user: { type: "other", other: "User" },
    name: { type: "str" },
    // Note. A Function modifies values for copper, silver, gold.
    // Coins cannot be modified directly
    copper: { type: "udecimal" },
    silver: { type: "udecimal" },
    gold: { type: "udecimal" },
    alliance_count: { type: "u32", default: new Decimal(0) },
    guild_count: { type: "u32", default: new Decimal(0) },
    clan_count: { type: "u32", default: new Decimal(0) },
  },
  uniqueness: [[["user"], "name"]],
  permissions: {
    borrow: {},
    ownership: {
      user: {
        read: ["copper", "silver", "gold"],
        write: [],
      },
    },
    public: ["user"],
  },
  triggers: {},
  checks: {
    // Wallet should not be attached to more than one alliance / guild / clan
    wallet_is_attached_uniquely: [
      new LogicalUnaryExpression(
        new Not(
          new NumberComparatorExpression(
            new LessThan<ToNum>([
              new NumberArithmeticExpression(
                new Add([
                  new DotExpression(new Dot(["alliance_count"])),
                  [
                    new DotExpression(new Dot(["guild_count"])),
                    new DotExpression(new Dot(["clan_count"])),
                  ],
                ])
              ),
              new Num(2),
              [],
            ])
          )
        )
      ),
      [errors.ErrUnexpected] as ErrMsg,
    ],
  },
} as StructSchema;
