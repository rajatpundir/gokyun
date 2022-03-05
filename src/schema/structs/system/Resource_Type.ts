import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { get_struct, StructSchema } from "../../struct";
import {
  LogicalUnaryExpression,
  Not,
  TextComparatorExpression,
  Equals,
  ToText,
  DotExpression,
  Dot,
  errors,
  ErrMsg,
  Text,
  Variable,
  Path,
  replace_variable,
} from "../../../lib";

export default {
  fields: {
    type: { type: "str" },
    subtype: { type: "str" },
  },
  uniqueness: [[["type"], "subtype"]],
  permissions: {
    borrow: {},
    ownership: {},
    public: ["type", "subtype"],
  },
  triggers: {},
  checks: {
    type_is_not_empty: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToText>([
              new Text(""),
              new DotExpression(new Dot(["type"])),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
    subtype_is_not_empty: [
      new LogicalUnaryExpression(
        new Not(
          new TextComparatorExpression(
            new Equals<ToText>([
              new Text(""),
              new DotExpression(new Dot(["subtype"])),
              [],
            ])
          )
        )
      ),
      [errors.ErrEmptyField] as ErrMsg,
    ],
  },
} as StructSchema;

export const resource_type_ids = {
  ResourceType: {
    "image/png": {
      _id: new Decimal(0),
      type: "image",
      subtype: "png",
    },
    "image/jpeg": {
      _id: new Decimal(1),
      type: "image",
      subtype: "jpeg",
    },
    "image/webp": {
      _id: new Decimal(2),
      type: "image",
      subtype: "webp",
    },
    "video/mp4": {
      _id: new Decimal(3),
      type: "video",
      subtype: "mp4",
    },
    "application/pdf": {
      _id: new Decimal(4),
      type: "application",
      subtype: "pdf",
    },
    "text/youtube": {
      _id: new Decimal(5),
      type: "text",
      subtype: "youtube",
    },
  },
};

export async function load_resource_type() {
  const struct = get_struct("Resource_Type");
  for (let key of Object.keys(resource_type_ids.ResourceType)) {
    const value =
      resource_type_ids.ResourceType[
        key as keyof typeof resource_type_ids.ResourceType
      ];
    await replace_variable(
      new Decimal(0),
      new Variable(
        struct,
        value._id,
        new Date(),
        new Date(),
        HashSet.ofIterable([
          new Path("type", [[], ["type", { type: "str", value: value.type }]]),
          new Path("subtype", [
            [],
            ["subtype", { type: "str", value: value.subtype }],
          ]),
        ])
      )
    );
  }
}
