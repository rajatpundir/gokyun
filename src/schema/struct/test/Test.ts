import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { get_struct, StructSchema } from "..";
import {
  NumberArithmeticExpression,
  Multiply,
  ToNum,
  DotExpression,
  Dot,
  DecimalArithmeticExpression,
  ToDeci,
  NumberComparatorExpression,
  Equals,
  Modulus,
  Num,
  errors,
  ErrMsg,
  Path,
  replace_variable,
  Variable,
} from "../../../lib";
import { user_ids } from "../system/User";

export default {
  fields: {
    str: { type: "str" },
    lstr: { type: "lstr" },
    clob: { type: "clob" },
    u32: { type: "u32", default: new Decimal(11) },
    i32: { type: "i32" },
    u64: { type: "u64", default: new Decimal(3) },
    i64: { type: "i64" },
    udouble: { type: "udouble" },
    idouble: { type: "idouble" },
    udecimal: { type: "udecimal", default: new Decimal(5) },
    idecimal: { type: "idecimal", default: new Decimal(7) },
    bool: { type: "bool" },
    date: { type: "date" },
    time: { type: "time" },
    timestamp: { type: "timestamp" },
    user: { type: "other", other: "User" },
  },
  uniqueness: [],
  permissions: {
    borrow: {},
    ownership: {
      user: {
        read: [],
        write: [
          "str",
          "lstr",
          "clob",
          "u32",
          "i32",
          "u64",
          "i64",
          "udouble",
          "idouble",
          "udecimal",
          "idecimal",
          "bool",
          "date",
          "time",
          "timestamp",
          "user",
        ],
      },
    },
    public: [
      "str",
      "lstr",
      "clob",
      "u32",
      "i32",
      "u64",
      "i64",
      "udouble",
      "idouble",
      "udecimal",
      "idecimal",
      "bool",
      "date",
      "time",
      "timestamp",
      "user",
    ],
  },
  triggers: {
    add_something: {
      event: ["after_creation", "after_update"],
      monitor: [
        [[], "u32"],
        [[], "u64"],
      ],
      operation: {
        op: "update",
        path_updates: [
          [
            [[], "i64"],
            new NumberArithmeticExpression(
              new Multiply<ToNum>([
                new DotExpression(new Dot(["u32"])),
                [new DotExpression(new Dot(["u64"]))],
              ])
            ),
          ],
        ],
      },
    },
    add_something_2: {
      event: ["after_creation", "after_update"],
      monitor: [
        [[], "u32"],
        [[], "u64"],
      ],
      operation: {
        op: "update",
        path_updates: [
          [
            [[], "udouble"],
            new DecimalArithmeticExpression(
              new Multiply<ToDeci>([
                new DotExpression(new Dot(["udecimal"])),
                [new DotExpression(new Dot(["u32"]))],
              ])
            ),
          ],
        ],
      },
    },
  },
  checks: {
    u32_is_even: [
      new NumberComparatorExpression(
        new Equals<ToNum>([
          new NumberArithmeticExpression(
            new Modulus<ToNum>([
              new DotExpression(new Dot(["u32"])),
              [new Num(2)],
            ])
          ),
          new Num(0),
          [],
        ])
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
} as StructSchema;

export const test_ids = {
  Test: {
    first: {
      _id: new Decimal(0),
      str: "STR STR STR",
      lstr: "LSTR LSTR LSTR",
      clob: "CLOB CLOB CLOB",
      u32: new Decimal(59),
      i32: new Decimal(-50),
      u64: new Decimal(75),
      i64: new Decimal(-95),
      udouble: new Decimal(59),
      idouble: new Decimal(-50),
      udecimal: new Decimal(75),
      idecimal: new Decimal(-95),
      bool: true,
      date: new Date(),
      time: new Date(),
      timestamp: new Date(),
      user: user_ids.User["John Smith"]._id,
    },
  },
};

export async function load_test() {
  const struct = get_struct("Test");
  for (let key of Object.keys(test_ids.Test)) {
    const value = test_ids.Test[key as keyof typeof test_ids.Test];
    await replace_variable(
      value._id,
      new Variable(
        struct,
        new Decimal(1),
        new Date(),
        new Date(),
        HashSet.ofIterable([
          new Path("STR", [[], ["str", { type: "str", value: value.str }]]),
          new Path("LSTR", [[], ["lstr", { type: "lstr", value: value.lstr }]]),
          new Path("CLOB", [[], ["clob", { type: "clob", value: value.clob }]]),
          new Path("U32", [[], ["u32", { type: "u32", value: value.u32 }]]),
          new Path("I32", [[], ["i32", { type: "i32", value: value.i32 }]]),
          new Path("U64", [[], ["u64", { type: "u64", value: value.u64 }]]),
          new Path("I64", [[], ["i64", { type: "i64", value: value.i64 }]]),
          new Path("UDOUBLE", [
            [],
            ["udouble", { type: "udouble", value: value.udouble }],
          ]),
          new Path("IDOUBLE", [
            [],
            ["idouble", { type: "idouble", value: value.idouble }],
          ]),
          new Path("UDECIMAL", [
            [],
            ["udecimal", { type: "udecimal", value: value.udecimal }],
          ]),
          new Path("IDECIMAL", [
            [],
            ["idecimal", { type: "idecimal", value: value.idecimal }],
          ]),
          new Path("BOOL", [[], ["bool", { type: "bool", value: value.bool }]]),
          new Path("DATE", [[], ["date", { type: "date", value: value.date }]]),
          new Path("TIME", [[], ["time", { type: "time", value: value.time }]]),
          new Path("TIMESTAMP", [
            [],
            ["timestamp", { type: "timestamp", value: value.timestamp }],
          ]),
          new Path("USER", [
            [],
            ["user", { type: "other", other: "User", value: value.user }],
          ]),
        ])
      )
    );
  }
}
