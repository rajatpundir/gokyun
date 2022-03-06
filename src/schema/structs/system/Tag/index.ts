import { errors, ErrMsg } from "../../../../lib/errors";
import {
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  Equals,
  ToText,
  DotExpression,
  Dot,
  Txt,
} from "../../../../lib/lisp";

// Tag will make lookups faster, so no need to remove it

// Tag can be in any language

export default {
  Tag: {
    fields: {
      name: { type: "str" },
    },
    uniqueness: [[[], "name"]],
    permissions: {
      borrow: {},
      ownership: {},
      public: ["name"],
    },
    triggers: {},
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Txt(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
};
