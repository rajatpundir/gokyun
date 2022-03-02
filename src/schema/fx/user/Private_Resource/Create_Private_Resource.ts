import { Fx, DotExpression, Dot } from "../../../../lib";

export default new Fx(
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
        url: new DotExpression(new Dot(["resource_type"])),
        user: new DotExpression(new Dot(["_system", "user"])),
      },
    },
  },
  {}
);
