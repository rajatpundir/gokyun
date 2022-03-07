import { Compose, ComposeStep } from "../../../../lib/compose";
import { errors, ErrMsg } from "../../../../lib/errors";
import {
  LogicalUnaryExpression,
  Not,
  NumberComparatorExpression,
  Equals,
  ToNum,
  DotExpression,
  Dot,
} from "../../../../lib/lisp";

export default {
  Create_Public_Resource: new Compose(
    "Create_Public_Resource",
    {
      resource_type: { type: "other", other: "Resource_Type" },
      url: { type: "str" },
      tags: { type: "list" },
    },
    new ComposeStep(undefined, [
      {
        name: "Create_Public_Resource",
        type: "fx",
        invoke: "Create_Public_Resource",
        map: {
          resource_type: { type: "input", value: "resource_type" },
          url: { type: "input", value: "url" },
        },
        output: { public_resource: "public_resource" },
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
        invoke: "Create_Public_Resource_Tag",
        map: {
          base: {
            type: "transform",
            value: "Create_Tag",
            map: {
              tag: "tag",
            },
            inject: {
              public_resource: {
                type: "fx",
                value: ["Create_Public_Resource", "public_resource"],
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
  Delete_Public_Resource: new Compose(
    "Delete_Public_Resource",
    {
      public_resource: { type: "other", other: "Public_Resource" },
    },
    new ComposeStep(undefined, [
      {
        type: "transform",
        invoke: "Delete_Public_Resource_Tag_By_Public_Resource",
        map: {
          query: {
            public_resource: {
              type: "input",
              value: "public_resource",
            },
          },
        },
      },
      // Note. Below should be useful where aggregate is not updated in multiple places on some parent in the hierarchy
      // {
      //   type: "fx",
      //   invoke: "Delete_Public_Resource_Tag_By_Public_Resource",
      //   map: {
      //     public_resource: {
      //       type: "input",
      //       value: "public_resource",
      //     },
      //   },
      // },
      {
        type: "fx",
        invoke: "Delete_Public_Resource",
        map: {
          public_resource: {
            type: "input",
            value: "public_resource",
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
                new DotExpression(new Dot(["public_resource", "owner"])),
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
  Create_Private_Resource_From_Public_Resource: new Compose(
    "Create_Private_Resource_From_Public_Resource",
    {
      public_resource: { type: "other", other: "Public_Resource" },
    },
    new ComposeStep(undefined, [
      {
        name: "Create_Private_Resource_From_Public_Resource",
        type: "fx",
        invoke: "Create_Private_Resource_From_Public_Resource",
        map: {
          public_resource: {
            type: "input",
            value: "public_resource",
          },
        },
        output: {
          private_resource: "private_resource",
        },
      },
      {
        type: "transform",
        invoke: "Create_Private_Resource_Tag_From_Public_Resource_Tag",
        map: {
          base: {
            type: "inject",
            inject: {
              private_resource: {
                type: "fx",
                value: [
                  "Create_Private_Resource_From_Public_Resource",
                  "private_resource",
                ],
              },
            },
          },
          query: {
            public_resource: {
              type: "input",
              value: "public_resource",
            },
          },
        },
        output: "tags",
      },
      {
        type: "compose",
        invoke: "Delete_Public_Resource",
        map: {
          public_resource: {
            type: "input",
            value: "public_resource",
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
                new DotExpression(new Dot(["public_resource", "owner"])),
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
