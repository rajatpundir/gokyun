import Decimal from "decimal.js";
import { errors, ErrMsg } from "../../../../lib/errors";
import {
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  Equals,
  ToTxt,
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
      private_resource_tag_count: { type: "u32", default: new Decimal(0) },
      public_resource_tag_count: { type: "u32", default: new Decimal(0) },
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
              new Equals<ToTxt>([
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
