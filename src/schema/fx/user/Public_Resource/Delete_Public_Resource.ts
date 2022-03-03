import { Fx, DotExpression, Dot } from "../../../../lib";

export default new Fx(
  "Delete_Public_Resource",
  {
    public_resource: { type: "other", other: "Public_Resource" },
  },
  {
    public_resource: {
      op: "delete",
      struct: "Public_Resource",
      id: new DotExpression(new Dot(["public_resource"])),
    },
  },
  {}
);
