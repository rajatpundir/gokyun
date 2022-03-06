import Decimal from "decimal.js";
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

export default {
  Public_Resource: {
    fields: {
      resource_type: { type: "other", other: "Resource_Type" },
      url: { type: "lstr" },
      tag_count: { type: "u32", default: new Decimal(0) },
      owner: { type: "other", other: "User" },
    },
    uniqueness: [[["owner"], "url"]],
    permissions: {
      borrow: {},
      ownership: {
        owner: {
          read: ["resource_type", "url"],
          write: [],
        },
      },
      public: [],
    },
    triggers: {},
    checks: {
      url_is_not_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new Txt(""),
                new DotExpression(new Dot(["url"])),
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
