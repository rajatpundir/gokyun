import { Fx, DotExpression, Dot } from "../../../../lib";

export default new Fx(
  "Delete_Private_Resource",
  {
    private_resource: { type: "other", other: "Private_Resource" },
  },
  {
    private_resource: {
      op: "delete",
      struct: "Private_Resource",
      id: new DotExpression(new Dot(["private_resource"])),
    },
  },
  {}
);
