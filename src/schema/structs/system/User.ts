import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { get_struct, StructSchema } from "../../struct";
import {
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  Equals,
  ToText,
  DotExpression,
  Dot,
  errors,
  ErrMsg,
  Text,
  Path,
  replace_variable,
  Variable,
} from "../../../lib";

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
    borrow: {},
    ownership: {},
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
            new Equals<ToText>([
              new Text(""),
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
            new Equals<ToText>([
              new Text(""),
              new DotExpression(new Dot(["nickname"])),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
} as StructSchema;

export const user_ids = {
  User: {
    "John Smith": {
      _id: new Decimal(0),
      nickname: "John Smith",
      mobile: "1234",
      knows_enligh: true,
      product_count: new Decimal(5),
    },
    "Number Four": {
      _id: new Decimal(1),
      nickname: "Number Four",
      mobile: "5678",
      knows_enligh: false,
      product_count: new Decimal(34),
    },
  },
};

export async function load_user() {
  const struct = get_struct("User");
  for (let key of Object.keys(user_ids.User)) {
    const value = user_ids.User[key as keyof typeof user_ids.User];
    await replace_variable(
      value._id,
      new Variable(
        struct,
        new Decimal(1),
        new Date(),
        new Date(),
        HashSet.ofIterable([
          new Path("NICKNAME", [
            [],
            ["nickname", { type: "str", value: value.nickname }],
          ]),
          new Path("MOBILE", [
            [],
            ["mobile", { type: "str", value: value.mobile }],
          ]),
          new Path("KNOWS ENGLISH", [
            [],
            ["knows_english", { type: "bool", value: value.knows_enligh }],
          ]),
          new Path("Product Count", [
            [],
            ["product_count", { type: "u32", value: value.product_count }],
          ]),
        ])
      )
    );
  }
}
