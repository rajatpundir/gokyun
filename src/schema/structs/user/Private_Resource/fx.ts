import { Fx, DotExpression, Dot } from "../../../../lib";

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
          owner: new DotExpression(new Dot(["_system", "user"])),
        },
      },
    },
    {},
    false
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
    {},
    false
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
          owner: new DotExpression(new Dot(["_system", "user"])),
        },
      },
    },
    {},
    false
  ),
};
