import { errors, ErrMsg } from "../../../lib";
import {
  DotExpression,
  Dot,
  Equals,
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  ToText,
  Text,
} from "../../../lib";
import { StructSchema } from "..";

export default {
  fields: {
    resource_type: { type: "other", other: "Resource_Type" },
    url: { type: "lstr" },
    user: { type: "other", other: "User" },
  },
  uniqueness: [[["user"], "url"]],
  permissions: {
    borrow: {},
    ownership: {
      user: {
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
              new Text(""),
              new DotExpression(new Dot(["url"])),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
} as StructSchema;
