import { Fx, DotExpression, Dot } from "../../../../lib";

export default new Fx(
  "Delete_Private_Resource_Tag_By_Private_Resource",
  {
    private_resource: { type: "other", other: "Private_Resource" },
  },
  {
    private_resource_tag: {
      op: "delete_all",
      struct: "Private_Resource_Tag",
      fields: {
        private_resource: new DotExpression(new Dot(["private_resource"])),
      },
    },
  },
  {}
);
