import { errors, ErrMsg } from "../../../lib/errors";
import {
  NumberComparatorExpression,
  Equals,
  ToNum,
  DotExpression,
  Dot,
  LogicalBinaryExpression,
  And,
  GreaterThanEquals,
  LessThanEquals,
} from "../../../lib/lisp";

export default {
  // This struct represents a request sent to user to allow/deny linking
  // This will be consumed by a function and transformed into a Listed_Alliance_Product
  // fx(a: Listed_Alliance_Product_Family_Variant_Request) -> Create(Listed_Alliance_Product_Family_Variant), Delete(Listed_Alliance_Product_Family_Variant_Request)
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
    private: {
      alliance_product_family_variant: {
        read: ["alliance_member", "user_product_family_variant"],
        write: [],
      },
      user_product_family_variant: {
        read: ["alliance_product_family_variant", "alliance_member"],
        write: [],
      },
    },
    public: [],
  },
  triggers: {},
  checks: {
    alliance_is_the_same: [
      new NumberComparatorExpression(
        new Equals<ToNum>([
          new DotExpression(
            new Dot([
              "alliance_product_family_variant",
              "alliance_product",
              "alliance_product_family",
              "alliance",
            ])
          ),
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
          new DotExpression(
            new Dot([
              "user_product_family_variant",
              "user_product",
              "user_product_family",
              "user",
            ])
          ),
          [],
        ])
      ),
      [errors.ErrUnexpected] as ErrMsg,
    ],
    quantity_is_within_bounds: [
      new LogicalBinaryExpression(
        new And([
          new NumberComparatorExpression(
            new GreaterThanEquals([
              new DotExpression(
                new Dot(["alliance_product_family_variant", "min_quantity"])
              ),
              new DotExpression(
                new Dot(["user_product_family_variant", "quantity"])
              ),
              [],
            ])
          ),
          new NumberComparatorExpression(
            new LessThanEquals([
              new DotExpression(
                new Dot(["user_product_family_variant", "quantity"])
              ),
              new DotExpression(
                new Dot(["alliance_product_family_variant", "max_quantity"])
              ),
              [],
            ])
          ),
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
              new DotExpression(
                new Dot(["alliance_product_family_variant", "min_price"])
              ),
              new DotExpression(
                new Dot(["user_product_family_variant", "price"])
              ),
              [],
            ])
          ),
          new NumberComparatorExpression(
            new LessThanEquals([
              new DotExpression(
                new Dot(["user_product_family_variant", "price"])
              ),
              new DotExpression(
                new Dot(["alliance_product_family_variant", "max_price"])
              ),
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
