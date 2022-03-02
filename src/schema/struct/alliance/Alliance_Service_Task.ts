import Decimal from "decimal.js";
import { StructSchema } from "..";
import {
  DotExpression,
  Dot,
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  Equals,
  ToText,
  errors,
  ErrMsg,
  Text,
} from "../../../lib";

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
