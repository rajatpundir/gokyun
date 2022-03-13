import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { replace_variable } from "../../../../lib/db_variables";
import { Path, Variable } from "../../../../lib/variable";
import { get_struct } from "../../../struct";
import { user_ids } from "../../system/User/load";

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
      new Variable(
        struct,
        value._id,
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
      ),
      new Decimal(0)
    );
  }
}
