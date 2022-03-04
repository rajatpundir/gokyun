import { StructSchema } from "../../../struct";
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
} from "../../../../lib";

export default {
  Public_Resource: {
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
  } as StructSchema,
};
