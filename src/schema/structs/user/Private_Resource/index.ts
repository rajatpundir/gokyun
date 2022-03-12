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

export default {
  fields: {
    resource_type: { type: "other", other: "Resource_Type" },
    url: { type: "str" },
    tag_count: { type: "u32", default: new Decimal(0) },
    owner: { type: "other", other: "User" },
  },
  uniqueness: [[["owner"], "url"]],
  permissions: {
    private: {
      owner: {
        entrypoint: [[], "owner"],
        read: ["resource_type", "url", "tag_count", "owner"],
        write: [],
        down: [],
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
            new Equals<ToTxt>([
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
};
