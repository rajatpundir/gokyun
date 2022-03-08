import { Fx } from "../../../../lib/fx";
import { DotExpression, Dot, Num } from "../../../../lib/lisp";

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
          private_resource_tag_count: new Num(0),
          public_resource_tag_count: new Num(0),
        },
      },
    },
    {}
  ),
};
