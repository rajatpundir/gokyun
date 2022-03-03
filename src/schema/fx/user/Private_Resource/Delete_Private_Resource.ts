import { Fx, DotExpression, Dot } from "../../../../lib";

export default new Fx(
  "Delete_Private_Resource",
  {
    url: { type: "str" },
  },
  {
    private_resource: {
      op: "delete",
      struct: "Private_Resource",
      fields: {
        url: new DotExpression(new Dot(["resource_type"])),
        user: new DotExpression(new Dot(["_system", "user"])),
      },
    },
  },
  {}
);
