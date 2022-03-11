import { errors, ErrMsg } from "../../../../lib/errors";
import {
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  Equals,
  ToTxt,
  Txt,
  DotExpression,
  Dot,
} from "../../../../lib/lisp";

export default {
  fields: {
    type: { type: "str" },
    subtype: { type: "str" },
  },
  uniqueness: [[["type"], "subtype"]],
  permissions: {
    private: {},
    public: ["type", "subtype"],
  },
  triggers: {},
  checks: {
    type_is_not_empty: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToTxt>([
              new Txt(""),
              new DotExpression(new Dot(["type"])),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
    subtype_is_not_empty: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToTxt>([
              new Txt(""),
              new DotExpression(new Dot(["subtype"])),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
};
