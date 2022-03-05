import { Fx, DotExpression, Dot } from "../../../../lib";

export default {
  Create_Tag: new Fx(
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
    {},
    false
  ),
};
