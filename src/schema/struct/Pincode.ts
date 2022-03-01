import Decimal from "decimal.js";
import { errors, ErrMsg } from "../../lib/errors";
import {
  DotExpression,
  Dot,
  Equals,
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  ToText,
  Text,
  And,
  Deci,
  DecimalComparatorExpression,
  GreaterThanEquals,
  LogicalBinaryExpression,
  ToDeci,
} from "../../lib/lisp";
import { StructSchema } from "../struct";

// Also need to store pincode stats for each guild
// This is to give a high level comparison of efficiency of various guilds
// In real world, each guild may represent a supply line of a specific compant like FedEx, UPS, etc
// System can even utilize this information in future to suggest fastest path of delivery.

export default {
  fields: {
    country: { type: "other", other: "Country" },
    name: { type: "str" },
    // Use standard deviation for average calculation
    // values greater than 2*sigma (95%) are outliers
    // outliers should not be used to update mean and sigma, if count > 100
    //figure formula for calculatin mu and sigma as values are added/removed one at a time
    count: { type: "u32", default: new Decimal(0) },
    average_latitude: { type: "idecimal", default: new Decimal(0) },
    average_longitude: { type: "idecimal", default: new Decimal(0) },
  },
  uniqueness: [[["country"], "name"]],
  permissions: {
    borrow: {},
    ownership: {},
    public: ["country", "name"],
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
    // -90 to 90 for latitude and -180 to 180 for longitude
    location_is_within_bounds: [
      new LogicalBinaryExpression(
        new And([
          new DecimalComparatorExpression(
            new GreaterThanEquals<ToDeci>([
              new Deci(-90),
              new DotExpression(new Dot(["average_latitude"])),
              [new Deci(90)],
            ])
          ),
          new DecimalComparatorExpression(
            new GreaterThanEquals<ToDeci>([
              new Deci(-180),
              new DotExpression(new Dot(["average_longitude"])),
              [new Deci(180)],
            ])
          ),
          [],
        ])
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
} as StructSchema;
