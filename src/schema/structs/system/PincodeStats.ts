import { StructSchema } from "../../struct";
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
} from "../../../lib";

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
