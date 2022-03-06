import { errors, ErrMsg } from "../../../lib/errors";
import {
  NumberArithmeticExpression,
  Add,
  ToNum,
  DotExpression,
  Dot,
  Num,
  Subtract,
  NumberComparatorExpression,
  Equals,
  LogicalBinaryExpression,
  And,
  GreaterThanEquals,
  LessThanEquals,
} from "../../../lib/lisp";

export default {
  // This will be created after Listed_Alliance_Product_Family_Variant_Request is consumed by a function
  fields: {
    alliance_product_family_variant: {
      type: "other",
      other: "Alliance_Product_Family_Variant",
    },
    alliance_member: { type: "other", other: "Alliance_Member" },
    user_product_family_variant: {
      type: "other",
      other: "User_Product_Family_Variant",
    },
  },
  uniqueness: [
    [["alliance_product_family_variant"], "user_product_family_variant"],
    [["alliance_member"], "user_product_family_variant"],
  ],
  permissions: {
    borrow: {},
    ownership: {
      alliance_product_family_variant: {
        read: ["alliance_member"],
        write: [],
      },
      user_product_family_variant: {
        read: ["alliance_member"],
        write: [],
      },
    },
    public: ["alliance_product_family_variant", "user_product_family_variant"],
  },
  triggers: {
    increment_count_in_alliance_product_family_variant: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance_product_family_variant"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_product_family_variant"], "provider_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["alliance_product_family_variant", "provider_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_alliance_product_family_variant: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "alliance_product_family_variant"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_product_family_variant"], "provider_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["alliance_product_family_variant", "provider_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    increment_count_in_alliance_member: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance_member"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_member"], "variant_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["alliance_member", "variant_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_alliance_member: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "alliance_member"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_member"], "variant_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["alliance_member", "variant_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    increment_count_in_user_product_family_variant: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "user_product_family_variant"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["user_product_family_variant"], "alliance_variant_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "user_product_family_variant",
                    "alliance_variant_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_user_product_family_variant: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "user_product_family_variant"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["user_product_family_variant"], "alliance_variant_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "user_product_family_variant",
                    "alliance_variant_count",
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
    alliance_is_the_same: [
      new NumberComparatorExpression(
        new Equals<ToNum>([
          new DotExpression(new Dot(["alliance_product", "alliance"])),
          new DotExpression(new Dot(["alliance_member", "alliance"])),
          [],
        ])
      ),
      [errors.ErrUnexpected] as ErrMsg,
    ],
    user_is_the_same: [
      new NumberComparatorExpression(
        new Equals<ToNum>([
          new DotExpression(new Dot(["alliance_member", "member"])),
          new DotExpression(new Dot(["user_product", "user"])),
          [],
        ])
      ),
      [errors.ErrUnexpected] as ErrMsg,
    ],
    price_is_within_bounds: [
      new LogicalBinaryExpression(
        new And([
          new NumberComparatorExpression(
            new GreaterThanEquals([
              new DotExpression(new Dot(["alliance_product", "min_price"])),
              new DotExpression(new Dot(["user_product", "price"])),
              [],
            ])
          ),
          new NumberComparatorExpression(
            new LessThanEquals([
              new DotExpression(new Dot(["user_product", "price"])),
              new DotExpression(new Dot(["alliance_product", "max_price"])),
              [],
            ])
          ),
          [],
        ])
      ),
      [errors.ErrUnexpected] as ErrMsg,
    ],
  },
};
