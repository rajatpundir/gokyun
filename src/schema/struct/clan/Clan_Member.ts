import {
  DotExpression,
  Dot,
  Add,
  Num,
  NumberArithmeticExpression,
  Subtract,
  ToNum,
} from "../../../lib/lisp";
import { StructSchema } from "..";

export default {
  fields: {
    clan: { type: "other", other: "Clan" },
    member: { type: "other", other: "User" },
  },
  uniqueness: [[["clan"], "member"]],
  permissions: {
    borrow: {
      borrow_clan_wallet_user: {
        prove: ["Clan_Member", "member"],
        constraints: [
          [
            [[], "clan"],
            [[], "clan"],
          ],
        ],
        user_path: [["clan", "wallet"], "user"],
      },
    },
    ownership: {
      clan: {
        read: ["member"],
        write: [],
      },
      member: {
        read: ["clan"],
        write: [],
      },
    },
    public: [],
  },
  triggers: {
    increment_count_in_clan: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "clan"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["clan"], "member_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(new Dot(["clan", "member_count"])),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_clan: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "clan"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["clan"], "member_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(new Dot(["clan", "member_count"])),
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
            [["member"], "clan_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(new Dot(["member", "clan_count"])),
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
            [["member"], "clan_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(new Dot(["member", "clan_count"])),
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
