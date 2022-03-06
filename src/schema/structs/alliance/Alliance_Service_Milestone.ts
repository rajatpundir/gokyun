import Decimal from "decimal.js";
import { errors, ErrMsg } from "../../../lib/errors";
import {
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  Equals,
  ToText,
  DotExpression,
  Dot,
  Txt,
} from "../../../lib/lisp";

export default {
  fields: {
    alliance_service: { type: "other", other: "Alliance_Service" },
    name: { type: "str" },
    description: { type: "clob" },
    order: { type: "u32" },
    translation_count: { type: "u32", default: new Decimal(0) },
  },
  uniqueness: [
    [["alliance_service"], "name"],
    [["alliance_service"], "order"],
  ],
  permissions: {
    borrow: {},
    ownership: {
      user: {
        read: [],
        write: ["name"],
      },
    },
    public: ["alliance_service", "name", "description", "order"],
  },
  triggers: {},
  checks: {
    name_cannot_be_empty: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToText>([
              new DotExpression(new Dot(["name"])),
              new Txt(""),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
};
