import { Fx } from "../../../../lib/fx";
import { DotExpression, Dot, Num } from "../../../../lib/lisp";

export default {
  Create_Private_Resource: new Fx(
    "Create_Private_Resource",
    {
      resource_type: { type: "other", other: "Resource_Type" },
      url: { type: "str" },
    },
    {
      private_resource: {
        op: "insert_ignore",
        struct: "Private_Resource",
        fields: {
          resource_type: new DotExpression(new Dot(["resource_type"])),
          url: new DotExpression(new Dot(["url"])),
          tag_count: new Num(0),
          owner: new DotExpression(new Dot(["_system", "user"])),
        },
      },
    },
    {}
  ),
  Delete_Private_Resource: new Fx(
    "Delete_Private_Resource",
    {
      private_resource: {
        type: "other",
        other: "Private_Resource",
        delete_mode: "delete",
      },
    },
    {},
    {}
  ),
  Create_Public_Resource_From_Private_Resource: new Fx(
    "Create_Public_Resource_From_Private_Resource",
    {
      private_resource: { type: "other", other: "Private_Resource" },
    },
    {
      public_resource: {
        op: "insert_ignore",
        struct: "Public_Resource",
        fields: {
          resource_type: new DotExpression(
            new Dot(["private_resource", "resource_type"])
          ),
          url: new DotExpression(new Dot(["private_resource", "url"])),
          tag_count: new DotExpression(
            new Dot(["private_resource", "tag_count"])
          ),
          owner: new DotExpression(new Dot(["_system", "user"])),
        },
      },
    },
    {}
  ),
};
