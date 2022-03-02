import Decimal from "decimal.js";
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
    member_count: { type: "u32", default: new Decimal(0) },
    product_family_count: { type: "u32", default: new Decimal(0) },
    product_count: { type: "u32", default: new Decimal(0) },
    virtual_product_count: { type: "u32", default: new Decimal(0) },
    service_count: { type: "u32", default: new Decimal(0) },
  },
  uniqueness: [[[], "name"]],
  permissions: {
    borrow: {},
    ownership: {
      wallet: {
        read: [],
        write: ["name"],
      },
    },
    public: ["name", "member_count"],
  },
  triggers: {
    increment_count_in_wallet: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "wallet"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["wallet"], "alliance_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(new Dot(["wallet", "alliance_count"])),
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
            [["wallet"], "alliance_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(new Dot(["wallet", "alliance_count"])),
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