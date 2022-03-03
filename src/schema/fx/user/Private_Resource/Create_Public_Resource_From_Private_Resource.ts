import { Fx, DotExpression, Dot } from "../../../../lib";

export default new Fx(
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
        user: new DotExpression(new Dot(["_system", "user"])),
      },
    },
  },
  {}
);
