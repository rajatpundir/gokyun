import Decimal from "decimal.js";
import { errors, ErrMsg } from "../../lib/errors";
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
} from "../../lib/lisp";
import { StructSchema } from ".";

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
