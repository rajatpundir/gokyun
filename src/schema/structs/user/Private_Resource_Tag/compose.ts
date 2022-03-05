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
  Create_Private_Resource_Tag: new Compose(
    "Create_Private_Resource_Tag",
    {
      private_resource: { type: "other", other: "Private_Resource" },
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
        invoke: "Create_Private_Resource_Tag",
        map: {
          private_resource: {
            type: "input",
            value: "private_resource",
          },
          tag: {
            type: "fx",
            value: ["Create_Tag", "tag"],
          },
        },
        output: { private_resource_tag: "private_resource_tag" },
      },
    ]),
    {
      ownership_check: [
        new LogicalUnaryExpression(
          new Not(
            new NumberComparatorExpression(
              new Equals<ToNum>([
                new DotExpression(new Dot(["private_resource", "owner"])),
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
