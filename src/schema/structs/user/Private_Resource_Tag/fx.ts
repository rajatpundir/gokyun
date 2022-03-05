import {
  Fx,
  DotExpression,
  Dot,
  Equals,
  ErrMsg,
  errors,
  LogicalUnaryExpression,
  Not,
  NumberComparatorExpression,
  ToNum,
} from "../../../../lib";

export default {
  Create_Private_Resource_Tag: new Fx(
    "Create_Private_Resource_Tag",
    {
      private_resource: { type: "other", other: "Private_Resource" },
      tag: { type: "other", other: "Tag" },
    },
    {
      private_resource_tag: {
        op: "insert_ignore",
        struct: "Private_Resource_Tag",
        fields: {
          private_resource: new DotExpression(new Dot(["private_resource"])),
          tag: new DotExpression(new Dot(["tag"])),
        },
      },
    },
    {},
    false
  ),
  Delete_Private_Resource_Tag: new Fx(
    "Delete_Private_Resource_Tag",
    {
      private_resource_tag: {
        type: "other",
        other: "Private_Resource_Tag",
        delete_mode: "delete",
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
                  new Dot(["private_resource_tag", "private_resource", "owner"])
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
  Delete_Private_Resource_Tag_By_Private_Resource: new Fx(
    "Delete_Private_Resource_Tag_By_Private_Resource",
    {
      private_resource: { type: "other", other: "Private_Resource" },
    },
    {
      private_resource_tag: {
        op: "delete_all",
        struct: "Private_Resource_Tag",
        fields: [
          {
            path: [[], "private_resource"],
            expr: new DotExpression(new Dot(["private_resource"])),
          },
        ],
      },
    },
    {},
    false
  ),
  Create_Public_Resource_Tag_From_Private_Resource_Tag: new Fx(
    "Create_Public_Resource_Tag_From_Private_Resource_Tag",
    {
      public_resource: { type: "other", other: "Public_Resource" },
      private_resource_tag: { type: "other", other: "Private_Resource_Tag" },
    },
    {
      public_resource_tag: {
        op: "insert_ignore",
        struct: "Public_Resource_Tag",
        fields: {
          public_resource: new DotExpression(new Dot(["public_resource"])),
          tag: new DotExpression(new Dot(["private_resource_tag", "tag"])),
        },
      },
    },
    {},
    false
  ),
};
