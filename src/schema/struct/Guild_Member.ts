import {
  DotExpression,
  Dot,
  Add,
  Num,
  NumberArithmeticExpression,
  Subtract,
  ToNum,
} from "../../lib/lisp";
import { StructSchema } from "../struct";

export default {
  fields: {
    guild: { type: "other", other: "Guild" },
    member: { type: "other", other: "User" },
  },
  uniqueness: [[["guild"], "member"]],
  permissions: {
    borrow: {
      borrow_guild_wallet_user: {
        prove: ["Guild_Member", "member"],
        constraints: [
          [
            [[], "guild"],
            [[], "guild"],
          ],
        ],
        user_path: [["guild", "wallet"], "user"],
      },
    },
    ownership: {
      guild: {
        read: ["member"],
        write: [],
      },
      member: {
        read: ["guild"],
        write: [],
      },
    },
    public: [],
  },
  triggers: {
    increment_count_in_guild: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "guild"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["guild"], "member_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(new Dot(["guild", "member_count"])),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_guild: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "guild"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["guild"], "member_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(new Dot(["guild", "member_count"])),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    increment_count_in_member: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "member"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["member"], "guild_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(new Dot(["member", "guild_count"])),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_member: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "member"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["member"], "guild_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(new Dot(["member", "guild_count"])),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
  },
  checks: {},
} as StructSchema;
