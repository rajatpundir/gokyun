import { Fx, DotExpression, Dot } from "../../../../lib";

export default new Fx(
  "Delete_Public_Resource_Tag_By_Public_Resource",
  {
    public_resource: { type: "other", other: "Public_Resource" },
  },
  {
    public_resource_tag: {
      op: "delete_all",
      struct: "Public_Resource_Tag",
      fields: {
        public_resource: new DotExpression(new Dot(["public_resource"])),
      },
    },
  },
  {}
);
