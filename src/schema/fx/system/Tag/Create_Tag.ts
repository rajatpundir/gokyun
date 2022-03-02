import { Fx, DotExpression, Dot } from "../../../../lib";

export default new Fx(
  "Create_Tag",
  { name: { type: "str" } },
  {
    tag: {
      op: "insert_ignore",
      struct: "Tag",
      fields: {
        name: new DotExpression(new Dot(["name"])),
      },
    },
  },
  {}
);
