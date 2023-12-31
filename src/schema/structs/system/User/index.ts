import Decimal from "decimal.js";
import {
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  Equals,
  ToTxt,
  DotExpression,
  Dot,
  Txt,
} from "../../../../lib/lisp";
import { ErrMsg, errors } from "../../../../lib/errors";

export default {
  fields: {
    //Note. name can be overwritten via separate api endpoint
    // no private permissions will be given to modify the User struct
    mobile: { type: "str" },
    nickname: { type: "str" },
    language: { type: "other", other: "Language" },
    knows_english: { type: "bool" },
    country: { type: "other", other: "Country" },
    alliance_count: { type: "u32", default: new Decimal(0) },
    guild_count: { type: "u32", default: new Decimal(0) },
    clan_count: { type: "u32", default: new Decimal(0) },
    product_family_count: { type: "u32", default: new Decimal(0) },
    product_count: { type: "u32", default: new Decimal(0) },
  },
  uniqueness: [
    [[], "mobile"],
    [[], "nickname"],
  ],
  permissions: {
    private: {},
    public: [
      "nickname",
      "language",
      "knows_english",
      "country",
      "product_count",
      "product_family_count",
      "mobile",
    ],
  },
  triggers: {},
  checks: {
    mobile_is_not_empty: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToTxt>([
              new Txt(""),
              new DotExpression(new Dot(["mobile"])),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
    nickname_is_not_empty: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToTxt>([
              new Txt(""),
              new DotExpression(new Dot(["nickname"])),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
};
