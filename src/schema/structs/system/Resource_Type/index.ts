import { errors, ErrMsg } from "../../../../lib/errors";
import {
  Dot,
  DotExpression,
  Equals,
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  ToText,
  Txt,
} from "../../../../lib/lisp";

export default {
  fields: {
    type: { type: "str" },
    subtype: { type: "str" },
  },
  uniqueness: [[["type"], "subtype"]],
  permissions: {
    borrow: {},
    ownership: {},
    public: ["type", "subtype"],
  },
  triggers: {},
  checks: {
    type_is_not_empty: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToText>([
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
            new Equals<ToText>([
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
