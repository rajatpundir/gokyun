import { errors, ErrMsg } from "../../../lib/errors";
import {
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  Equals,
  ToText,
  DotExpression,
  Dot,
  Text,
} from "../../../lib/lisp";

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
};
