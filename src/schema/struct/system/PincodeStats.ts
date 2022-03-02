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
    from: { type: "other", other: "Pincode" },
    to: { type: "other", other: "Pincode" },
    // Use standard deviation for average calculation
    average_time: { type: "timestamp", default: new Date() },
  },
  uniqueness: [[["from"], "to"]],
  permissions: {
    borrow: {},
    ownership: {},
    public: ["from", "to", "average_time"],
  },
  triggers: {},
  checks: {
    name_is_not_empty: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToText>([
              new Text(""),
              new DotExpression(new Dot(["name"])),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
} as StructSchema;