import { errors, ErrMsg } from "../../../lib";
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
} from "../../../lib";
import { StructSchema } from "..";

export default {
  fields: {
    name: { type: "str" },
    // Note. Care to be taken that wallet of just about anyone cannot be assigned
    wallet: { type: "other", other: "Wallet" },
    member_count: { type: "u32" },
  },
  uniqueness: [],
  permissions: {
    borrow: {},
    ownership: {
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
            [["wallet"], "clan_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(new Dot(["wallet", "clan_count"])),
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
            [["wallet"], "clan_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(new Dot(["wallet", "clan_count"])),
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
            new Equals<ToText>([
              new Text(""),
              new DotExpression(new Dot(["name"])),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
} as StructSchema;