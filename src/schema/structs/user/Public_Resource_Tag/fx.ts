import { Fx, DotExpression, Dot } from "../../../../lib";

export default {
  Create_Public_Resource_Tag: new Fx(
    "Create_Public_Resource_Tag",
    {
      public_resource: { type: "other", other: "Public_Resource" },
      tag: { type: "other", other: "Tag" },
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
    {}
  ),
  Delete_Public_Resource_Tag_By_Public_Resource: new Fx(
    "Delete_Public_Resource_Tag_By_Public_Resource",
    {
      public_resource: { type: "other", other: "Public_Resource" },
    },
    {
      public_resource_tag: {
        op: "delete_all",
        struct: "Public_Resource_Tag",
        fields: [
          {
            path: [[], "public_resource"],
            expr: new DotExpression(new Dot(["public_resource"])),
          },
        ],
      },
    },
    {}
  ),
};
