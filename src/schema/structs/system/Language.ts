import { errors, ErrMsg } from "../../../lib/errors";
import {
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  Equals,
  ToTxt,
  DotExpression,
  Dot,
  Txt,
} from "../../../lib/lisp";

export default {
  fields: {
    code: { type: "str" },
  },
  uniqueness: [[[], "code"]],
  permissions: {
    private: {},
    public: ["code"],
  },
  triggers: {},
  checks: {
    code_is_not_empty: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToTxt>([
              new Txt(""),
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
