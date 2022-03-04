import { Fx, DotExpression, Dot } from "../../../../lib";

export default {
  Create_Public_Resource: new Fx(
    "Create_Public_Resource",
    {
      resource_type: { type: "other", other: "Resource_Type" },
      url: { type: "str" },
    },
    {
      public_resource: {
        op: "insert_ignore",
        struct: "Public_Resource",
        fields: {
          resource_type: new DotExpression(new Dot(["resource_type"])),
          url: new DotExpression(new Dot(["url"])),
          user: new DotExpression(new Dot(["_system", "user"])),
        },
      },
    },
    {}
  ),
  Delete_Public_Resource: new Fx(
    "Delete_Public_Resource",
    {
      public_resource: {
        type: "other",
        other: "Public_Resource",
        delete_mode: "delete",
      },
    },
    {},
    {}
  ),
};
