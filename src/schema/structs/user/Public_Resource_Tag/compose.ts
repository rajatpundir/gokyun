import {
  Compose,
  ComposeStep,
  Dot,
  DotExpression,
  Equals,
  ErrMsg,
  errors,
  LogicalUnaryExpression,
  Not,
  NumberComparatorExpression,
  ToNum,
} from "../../../../lib";

export default {
  Create_Public_Resource_Tag: new Compose(
    "Create_Public_Resource_Tag",
    {
      public_resource: { type: "other", other: "Public_Resource" },
      name: { type: "other", other: "str" },
    },
    new ComposeStep(undefined, [
      {
        name: "Create_Tag",
        type: "fx",
        invoke: "Create_Tag",
        map: {
          name: {
            type: "input",
            value: "name",
          },
        },
      },
      {
        type: "fx",
        invoke: "Create_Public_Resource_Tag",
        map: {
          public_resource: {
            type: "input",
            value: "public_resource",
          },
          tag: {
            type: "fx",
            value: ["Create_Tag", "tag"],
          },
        },
        output: { public_resource_tag: "public_resource_tag" },
      },
    ]),
    {
      ownership_check: [
        new LogicalUnaryExpression(
          new Not(
            new NumberComparatorExpression(
              new Equals<ToNum>([
                new DotExpression(new Dot(["public_resource", "user"])),
                new DotExpression(new Dot(["_system", "user"])),
                [],
              ])
            )
          )
        ),
        [errors.ErrUnexpected] as ErrMsg,
      ],
    },
    true
  ),
};
