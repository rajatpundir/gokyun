import { Fx, DotExpression, Dot } from "../../../../lib";

export default new Fx(
  "Delete_Private_Resource_Tag",
  {
    private_resource: { type: "other", other: "Private_Resource" },
    tag: { type: "other", other: "Tag" },
  },
  {
    private_resource_tag: {
      op: "delete",
      struct: "Private_Resource_Tag",
      fields: {
        private_resource: new DotExpression(new Dot(["private_resource"])),
        tag: new DotExpression(new Dot(["tag"])),
      },
    },
  },
  {}
);
