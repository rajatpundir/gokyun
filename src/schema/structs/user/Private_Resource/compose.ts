import {
  Compose,
  ComposeStep,
  Dot,
  DotExpression,
  Equals,
  ErrMsg,
  errors,
  LogicalUnaryExpression,
  Not,
  NumberComparatorExpression,
  ToNum,
} from "../../../../lib";

export default {
  Create_Private_Resource: new Compose(
    "Create_Private_Resource",
    {
      resource_type: { type: "other", other: "Resource_Type" },
      url: { type: "str" },
      tags: { type: "list" },
    },
    new ComposeStep(undefined, [
      {
        name: "Create_Private_Resource",
        type: "fx",
        invoke: "Create_Private_Resource",
        map: {
          resource_type: { type: "input", value: "resource_type" },
          url: { type: "input", value: "url" },
        },
        output: { private_resource: "private_resource" },
      },
      {
        name: "Create_Tag",
        type: "transform",
        invoke: "Create_Tag",
        map: {
          base: {
            type: "input",
            value: "tags",
          },
        },
      },
      {
        type: "transform",
        invoke: "Create_Private_Resource_Tag",
        map: {
          base: {
            type: "transform",
            value: "Create_Tag",
            map: {
              tag: "tag",
            },
            inject: {
              private_resource: {
                type: "fx",
                value: ["Create_Private_Resource", "private_resource"],
              },
            },
          },
        },
        output: "tags",
      },
    ]),
    {},
    true
  ),
  Delete_Private_Resource: new Compose(
    "Delete_Private_Resource",
    {
      private_resource: { type: "other", other: "Private_Resource" },
    },
    new ComposeStep(undefined, [
      {
        type: "fx",
        invoke: "Delete_Private_Resource_Tag_By_Private_Resource",
        map: {
          private_resource: {
            type: "input",
            value: "private_resource",
          },
        },
      },
      {
        type: "fx",
        invoke: "Delete_Private_Resource",
        map: {
          private_resource: {
            type: "input",
            value: "private_resource",
          },
        },
      },
    ]),
    {
      ownership_check: [
        new LogicalUnaryExpression(
          new Not(
            new NumberComparatorExpression(
              new Equals<ToNum>([
                new DotExpression(new Dot(["private_resource", "owner"])),
                new DotExpression(new Dot(["_system", "user"])),
                [],
              ])
            )
          )
        ),
        [errors.ErrUnexpected] as ErrMsg,
      ],
    },
    true
  ),
  Create_Public_Resource_From_Private_Resource: new Compose(
    "Create_Public_Resource_From_Private_Resource",
    {
      private_resource: { type: "other", other: "Private_Resource" },
    },
    new ComposeStep(undefined, [
      {
        name: "Create_Public_Resource_From_Private_Resource",
        type: "fx",
        invoke: "Create_Public_Resource_From_Private_Resource",
        map: {
          private_resource: {
            type: "input",
            value: "private_resource",
          },
        },
        output: {
          public_resource: "public_resource",
        },
      },
      {
        type: "transform",
        invoke: "Create_Public_Resource_Tag_From_Private_Resource_Tag",
        map: {
          base: {
            type: "inject",
            inject: {
              public_resource: {
                type: "fx",
                value: [
                  "Create_Public_Resource_From_Private_Resource",
                  "public_resource",
                ],
              },
            },
          },
          query: {
            private_resource: {
              type: "input",
              value: "private_resource",
            },
          },
        },
        output: "tags",
      },
      {
        type: "compose",
        invoke: "Delete_Private_Resource",
        map: {
          private_resource: {
            type: "input",
            value: "private_resource",
          },
        },
      },
    ]),
    {
      ownership_check: [
        new LogicalUnaryExpression(
          new Not(
            new NumberComparatorExpression(
              new Equals<ToNum>([
                new DotExpression(new Dot(["private_resource", "owner"])),
                new DotExpression(new Dot(["_system", "user"])),
                [],
              ])
            )
          )
        ),
        [errors.ErrUnexpected] as ErrMsg,
      ],
    },
    true
  ),
};
