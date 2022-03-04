import Decimal from "decimal.js";
import { StructSchema } from "../../struct";
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
} from "../../../lib";

export default {
  fields: {
    parent: { type: "other", other: "Product_Category" },
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
