import { Fx, DotExpression, Dot } from "../../../../lib";

export default new Fx(
  "Create_Private_Resource_Tag",
  {
    private_resource: { type: "other", other: "Private_Resource" },
    tag: { type: "other", other: "Tag" },
  },
  {
    private_resource_tag: {
      op: "insert_ignore",
      struct: "Private_Resource_Tag",
      fields: {
        private_resource: new DotExpression(new Dot(["private_resource"])),
        tag: new DotExpression(new Dot(["tag"])),
      },
    },
  },
  {}
);
