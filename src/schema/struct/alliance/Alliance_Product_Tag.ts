import {
  DotExpression,
  Dot,
  Add,
  Num,
  NumberArithmeticExpression,
  Subtract,
  ToNum,
} from "../../../lib";
import { StructSchema } from "..";

export default {
  fields: {
    alliance_product: {
      type: "other",
      other: "Alliance_Product",
    },
    tag: { type: "other", other: "Tag" },
  },
  uniqueness: [[["alliance_product"], "tag"]],
  permissions: {
    borrow: {},
    ownership: {
      alliance_product: {
        read: [],
        write: ["tag"],
      },
    },
    public: ["alliance_product", "tag"],
  },
  triggers: {
    increment_count_in_alliance_product: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance_product"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_product"], "tag_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(new Dot(["alliance_product", "tag_count"])),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_alliance_product: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "alliance_product"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_product"], "tag_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(new Dot(["alliance_product", "tag_count"])),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
  },
  checks: {},
} as StructSchema;
