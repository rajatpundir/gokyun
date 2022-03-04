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
    code: { type: "str" },
  },
  uniqueness: [[[], "code"]],
  permissions: {
    borrow: {},
    ownership: {},
    public: ["code"],
  },
  triggers: {},
  checks: {
    code_is_not_empty: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToText>([
              new Text(""),
              new DotExpression(new Dot(["code"])),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
} as StructSchema;
