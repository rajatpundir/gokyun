import { errors, ErrMsg } from "../../../lib/errors";
import {
  NumberArithmeticExpression,
  Add,
  ToNum,
  DotExpression,
  Dot,
  Num,
  Subtract,
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  Equals,
  ToTxt,
  Txt,
} from "../../../lib/lisp";

export default {
  fields: {
    alliance_service: { type: "other", other: "Alliance_Service" },
    alliance_member: { type: "other", other: "Alliance_Member" },
  },
  uniqueness: [[["alliance_service"], "alliance_member"]],
  permissions: {
    private: {
      alliance_service: {
        read: [],
        write: [],
      },
    },
    public: ["alliance_service", "alliance_member"],
  },
  triggers: {
    increment_count_in_alliance_service: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance_service"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_service"], "provider_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["alliance_service", "provider_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_alliance_service: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "alliance_service"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_service"], "provider_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["alliance_service", "provider_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    increment_count_in_alliance_member: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance_member"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_member"], "service_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["alliance_member", "service_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_alliance_member: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "alliance_member"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_member"], "service_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["alliance_member", "service_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
  },
  checks: {
    name_cannot_be_empty: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToTxt>([
              new DotExpression(new Dot(["name"])),
              new Txt(""),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
};
