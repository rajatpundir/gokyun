import Decimal from "decimal.js";
import { Fx, DotExpression, Dot } from "../../../../lib";

export default {
  Create_Test: new Fx(
    "Create_Test",
    {
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
    {
      test: {
        op: "insert_ignore",
        struct: "Test",
        fields: {
          str: new DotExpression(new Dot(["str"])),
          lstr: new DotExpression(new Dot(["lstr"])),
          clob: new DotExpression(new Dot(["clob"])),
          u32: new DotExpression(new Dot(["u32"])),
          i32: new DotExpression(new Dot(["i32"])),
          u64: new DotExpression(new Dot(["u64"])),
          i64: new DotExpression(new Dot(["i64"])),
          udouble: new DotExpression(new Dot(["udouble"])),
          idouble: new DotExpression(new Dot(["idouble"])),
          udecimal: new DotExpression(new Dot(["udecimal"])),
          idecimal: new DotExpression(new Dot(["idecimal"])),
          bool: new DotExpression(new Dot(["bool"])),
          date: new DotExpression(new Dot(["date"])),
          time: new DotExpression(new Dot(["time"])),
          timestamp: new DotExpression(new Dot(["timestamp"])),
          user: new DotExpression(new Dot(["user"])),
        },
      },
    },
    {},
    true
  ),
  Delete_Test: new Fx(
    "Delete_Test",
    {
      test: {
        type: "other",
        other: "Test",
        delete_mode: "delete",
      },
    },
    {},
    {},
    true
  ),
};
