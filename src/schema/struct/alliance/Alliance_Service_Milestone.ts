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
} from "../../../lib";
import { StructSchema } from "..";

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
