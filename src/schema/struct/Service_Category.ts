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
import { StructSchema } from "../struct";

export default {
  fields: {
    parent: { type: "other", other: "Service_Category" },
    name: { type: "str" },
    translation_count: { type: "u32", default: new Decimal(0) },
  },
  uniqueness: [],
  permissions: {
    borrow: {},
    ownership: {},
    public: ["parent", "name"],
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
