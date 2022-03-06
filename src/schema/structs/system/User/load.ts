import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { replace_variable } from "../../../../lib/db_variables";
import { Path, Variable } from "../../../../lib/variable";
import { get_struct } from "../../../struct";

export const user_ids = {
  User: {
    "John Smith": {
      _id: new Decimal(0),
      nickname: "John Smith",
      mobile: "1234",
      knows_enligh: true,
      product_count: new Decimal(5),
    },
    "Number Four": {
      _id: new Decimal(1),
      nickname: "Number Four",
      mobile: "5678",
      knows_enligh: false,
      product_count: new Decimal(34),
    },
  },
};

export async function load_user() {
  const struct = get_struct("User");
  for (let key of Object.keys(user_ids.User)) {
    const value = user_ids.User[key as keyof typeof user_ids.User];
    await replace_variable(
      new Decimal(0),
      new Variable(
        struct,
        value._id,
        new Date(),
        new Date(),
        HashSet.ofIterable([
          new Path("NICKNAME", [
            [],
            ["nickname", { type: "str", value: value.nickname }],
          ]),
          new Path("MOBILE", [
            [],
            ["mobile", { type: "str", value: value.mobile }],
          ]),
          new Path("KNOWS ENGLISH", [
            [],
            ["knows_english", { type: "bool", value: value.knows_enligh }],
          ]),
          new Path("Product Count", [
            [],
            ["product_count", { type: "u32", value: value.product_count }],
          ]),
        ])
      )
    );
  }
}
