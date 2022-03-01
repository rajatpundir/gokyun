import Decimal from "decimal.js";
import {
  DotExpression,
  Dot,
  Add,
  Num,
  NumberArithmeticExpression,
  Subtract,
  ToNum,
} from "../../lib/lisp";
import { StructSchema } from ".";

export default {
  fields: {
    alliance: { type: "other", other: "Alliance" },
    member: { type: "other", other: "User" },
    variant_count: { type: "u32", default: new Decimal(0) },
    service_count: { type: "u32", default: new Decimal(0) },
  },
  uniqueness: [[["alliance"], "member"]],
  permissions: {
    borrow: {
      borrow_alliance_wallet_user: {
        prove: ["Alliance_Member", "member"],
        constraints: [
          [
            [[], "alliance"],
            [[], "alliance"],
          ],
        ],
        user_path: [["alliance", "wallet"], "user"],
      },
    },
    ownership: {
      alliance: {
        read: ["member", "variant_count", "service_count"],
        write: [],
      },
      member: {
        read: ["alliance", "variant_count", "service_count"],
        write: [],
      },
    },
    public: [],
  },
  triggers: {
    increment_count_in_alliance: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance"], "member_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(new Dot(["alliance", "member_count"])),
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
            [["alliance"], "member_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(new Dot(["alliance", "member_count"])),
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
            [["member"], "alliance_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(new Dot(["member", "alliance_count"])),
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
            [["member"], "alliance_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(new Dot(["member", "alliance_count"])),
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
