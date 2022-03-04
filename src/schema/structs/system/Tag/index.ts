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
                new Text(""),
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
