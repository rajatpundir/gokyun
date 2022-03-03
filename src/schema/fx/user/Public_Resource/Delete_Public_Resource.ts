import { Fx, DotExpression, Dot } from "../../../../lib";

export default new Fx(
  "Delete_Public_Resource",
  {
    url: { type: "str" },
  },
  {
    public_resource: {
      op: "delete",
      struct: "Public_Resource",
      fields: {
        url: new DotExpression(new Dot(["resource_type"])),
        user: new DotExpression(new Dot(["_system", "user"])),
      },
    },
  },
  {}
);
