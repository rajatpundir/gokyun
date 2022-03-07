import { errors, ErrMsg } from "../../../../lib/errors";
import { Fx } from "../../../../lib/fx";
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
  NumberComparatorExpression,
  Equals,
} from "../../../../lib/lisp";

export default {
  Create_Public_Resource_Tag: new Fx(
    "Create_Public_Resource_Tag",
    {
      public_resource: {
        type: "other",
        other: "Public_Resource",
        updates: [
          {
            path: [[], "tag_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(new Dot(["public_resource", "tag_count"])),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
      tag: {
        type: "other",
        other: "Tag",
        updates: [
          {
            path: [[], "public_resource_tag_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["tag", "public_resource_tag_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    {
      public_resource_tag: {
        op: "insert_ignore",
        struct: "Public_Resource_Tag",
        fields: {
          public_resource: new DotExpression(new Dot(["public_resource"])),
          tag: new DotExpression(new Dot(["tag"])),
        },
      },
    },
    {},
    false
  ),
  Delete_Public_Resource_Tag: new Fx(
    "Delete_Public_Resource_Tag",
    {
      public_resource_tag: {
        type: "other",
        other: "Public_Resource_Tag",
        delete_mode: "delete",
        updates: [
          {
            path: [["public_resource"], "tag_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "public_resource_tag",
                    "public_resource",
                    "tag_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: [["tag"], "public_resource_tag_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "public_resource_tag",
                    "tag",
                    "public_resource_tag_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    {},
    {
      ownership_check: [
        new LogicalUnaryExpression(
          new Not(
            new NumberComparatorExpression(
              new Equals<ToNum>([
                new DotExpression(
                  new Dot(["public_resource_tag", "public_resource", "owner"])
                ),
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
  // Note. Below should be useful where aggregate is not updated in multiple places on some parent in the hierarchy
  // Delete_Public_Resource_Tag_By_Public_Resource: new Fx(
  //   "Delete_Public_Resource_Tag_By_Public_Resource",
  //   {
  //     public_resource: {
  //       type: "other",
  //       other: "Public_Resource",
  //       updates: [{ path: [[], "tag_count"], expr: new Num(0) }],
  //     },
  //   },
  //   {
  //     public_resource_tag: {
  //       op: "delete_all",
  //       struct: "Public_Resource_Tag",
  //       fields: [
  //         {
  //           path: [[], "public_resource"],
  //           expr: new DotExpression(new Dot(["public_resource"])),
  //         },
  //       ],
  //     },
  //   },
  //   {},
  //   false
  // ),
  Create_Private_Resource_Tag_From_Public_Resource_Tag: new Fx(
    "Create_Private_Resource_Tag_From_Public_Resource_Tag",
    {
      private_resource: { type: "other", other: "Private_Resource" },
      public_resource_tag: { type: "other", other: "Public_Resource_Tag" },
    },
    {
      private_resource_tag: {
        op: "insert_ignore",
        struct: "Private_Resource_Tag",
        fields: {
          private_resource: new DotExpression(new Dot(["private_resource"])),
          tag: new DotExpression(new Dot(["public_resource_tag", "tag"])),
        },
      },
    },
    {},
    false
  ),
};
