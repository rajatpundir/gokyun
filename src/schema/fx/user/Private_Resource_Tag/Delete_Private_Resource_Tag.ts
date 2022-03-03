import { Fx, DotExpression, Dot } from "../../../../lib";

export default new Fx(
  "Delete_Private_Resource_Tag",
  {
    private_resource_tag: { type: "other", other: "Private_Resource_Tag" },
  },
  {
    private_resource_tag: {
      op: "delete",
      struct: "Private_Resource_Tag",
      id: new DotExpression(new Dot(["private_resource_tag"])),
    },
  },
  {}
);
