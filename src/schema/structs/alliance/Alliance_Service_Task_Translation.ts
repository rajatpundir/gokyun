import { StructSchema } from "../../struct";
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
  ToText,
  errors,
  ErrMsg,
  Text,
} from "../../../lib";

export default {
  fields: {
    alliance_service_task: { type: "other", other: "Alliance_Service_Task" },
    language: { type: "other", other: "Language" },
    name: { type: "str" },
    description: { type: "clob" },
  },
  uniqueness: [[["alliance_service_task"], "language"]],
  permissions: {
    borrow: {},
    ownership: {
      alliance_service_task: {
        read: [],
        write: ["language", "name", "description"],
      },
    },
    public: ["alliance_service_task", "language", "name", "description"],
  },
  triggers: {
    increment_count_in_alliance_service_task: {
      event: ["after_creation", "after_update"],
      monitor: [[[], "alliance_service_task"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_service_task"], "translation_count"],
            new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["alliance_service_task", "translation_count"])
                ),
                [new Num(1)],
              ])
            ),
          ],
        ],
      },
    },
    decrement_count_in_alliance_service_task: {
      event: ["before_deletion", "before_update"],
      monitor: [[[], "alliance_service_task"]],
      operation: {
        op: "update",
        path_updates: [
          [
            [["alliance_service_task"], "translation_count"],
            new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["alliance_service_task", "translation_count"])
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
    language_is_not_english: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToText>([
              new DotExpression(new Dot(["language", "code"])),
              new Text("en"),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
} as StructSchema;