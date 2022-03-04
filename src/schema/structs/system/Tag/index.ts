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

// Tag is same for all languages
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
