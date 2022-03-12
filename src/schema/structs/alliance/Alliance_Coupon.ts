import Decimal from "decimal.js";
import { errors, ErrMsg } from "../../../lib/errors";
import {
  NumberComparatorExpression,
  GreaterThanEquals,
  ToNum,
  DotExpression,
  Dot,
} from "../../../lib/lisp";

export default {
  fields: {
    alliance: { type: "other", other: "Alliance" },
    name: { type: "str" },
    unused: { type: "u32", default: new Decimal(0) },
    used: { type: "u32", default: new Decimal(0) },
    min_order_amount: { type: "udecimal", default: new Decimal(0) },
    flat_discount: { type: "bool", default: true },
    discount: { type: "udecimal", default: new Decimal(0) },
    max_absolute_discount: { type: "udecimal", default: new Decimal(0) },
    valid_from: { type: "timestamp" },
    valid_to: { type: "timestamp" },
    min_clan_loyalty: { type: "udecimal", default: new Decimal(0) },
    max_clan_loyalty: { type: "udecimal", default: new Decimal(-1) },
    show_coupon: { type: "bool", default: false },
    used_coupon_count: { type: "udecimal", default: new Decimal(0) },
    used_coupon_price_sum: { type: "udecimal", default: new Decimal(0) },
  },
  uniqueness: [[["alliance"], "name"]],
  permissions: {
    private: {
      alliance: {
        read: [
          "name",
          "unused",
          "used",
          "min_order_value",
          "flat_discount",
          "discount",
          "max_absolute_discount",
          "valid_from",
          "valid_to",
          "min_clan_loyalty",
          "max_clan_loyalty",
          "show_coupon",
        ],
        write: [],
      },
    },
    public: [
      "alliance",
      "name",
      "unused",
      "used",
      "min_order_value",
      "min_price",
      "flat_discount",
      "discount",
      "max_absolute_discount",
      "valid_from",
      "valid_to",
      "min_clan_loyalty",
      "max_clan_loyalty",
      "show_coupon",
    ],
  },
  triggers: {},
  checks: {
    valid_from_is_less_than_valid_to: [
      new NumberComparatorExpression(
        new GreaterThanEquals<ToNum>([
          new DotExpression(new Dot(["valid_from"])),
          new DotExpression(new Dot(["valid_to"])),
          [],
        ])
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
    min_clan_loyalty_is_less_than_max_clan_loyalty: [
      new NumberComparatorExpression(
        new GreaterThanEquals<ToNum>([
          new DotExpression(new Dot(["min_clan_loyalty"])),
          new DotExpression(new Dot(["max_clan_loyalty"])),
          [],
        ])
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
};
