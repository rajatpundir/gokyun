import Decimal from "decimal.js";
import { errors, ErrMsg } from "../../lib/errors";
import {
  DotExpression,
  Dot,
  Equals,
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  ToText,
  Text,
} from "../../lib/lisp";
import { StructSchema } from ".";

export default {
  fields: {
    alliance_service: { type: "other", other: "Alliance_Service" },
    name: { type: "str" },
    description: { type: "clob" },
    price: { type: "udecimal" },
    translation_count: { type: "u32", default: new Decimal(0) },
  },
  uniqueness: [[["alliance_service"], "name"]],
  permissions: {
    borrow: {},
    ownership: {
      alliance_service: {
        read: [],
        write: ["name", "price"],
      },
    },
    public: ["alliance_service", "name", "language", "description", "price"],
  },
  triggers: {},
  checks: {
    name_cannot_be_empty: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToText>([
              new DotExpression(new Dot(["name"])),
              new Text(""),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
} as StructSchema;
