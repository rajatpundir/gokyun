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
  Add,
  Num,
  NumberArithmeticExpression,
  Subtract,
  ToNum,
} from "../../../lib";
import { StructSchema } from "..";

export default {
  fields: {
    alliance_service: { type: "other", other: "Alliance_Service" },
    alliance_member: { type: "other", other: "Alliance_Member" },
  },
  uniqueness: [[["alliance_service"], "alliance_member"]],
  permissions: {
    borrow: {},
    ownership: {
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
            new Equals<ToText>([
              new DotExpression(new Dot(["name"])),
              new Text(""),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
} as StructSchema;
