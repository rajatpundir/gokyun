import { Compose, ComposeStep } from "../../../../lib";

export default {
  Create_Public_Resource: new Compose(
    "Create_Public_Resource",
    {
      resource_type: { type: "other", other: "Resource_Type" },
      url: { type: "str" },
      tags: { type: "list" },
    },
    new ComposeStep(undefined, [
      {
        name: "Create_Public_Resource",
        type: "fx",
        invoke: "Create_Public_Resource",
        map: {
          resource_type: { type: "input", value: "resource_type" },
          url: { type: "input", value: "url" },
        },
        output: { public_resource: "public_resource" },
      },
      {
        name: "Create_Tag",
        type: "transform",
        invoke: "Create_Tag",
        map: {
          base: {
            type: "input",
            value: "tags",
          },
        },
      },
      {
        type: "transform",
        invoke: "Create_Public_Resource_Tag",
        map: {
          base: {
            type: "transform",
            value: "Create_Tag",
            map: {
              tag: "tag",
            },
            inject: {
              public_resource: {
                type: "fx",
                value: ["Create_Public_Resource", "public_resource"],
              },
            },
          },
        },
        output: "tags",
      },
    ]),
    {}
  ),
  Delete_Public_Resource: new Compose(
    "Delete_Public_Resource",
    {
      public_resource: { type: "other", other: "Public_Resource" },
    },
    new ComposeStep(undefined, [
      {
        type: "fx",
        invoke: "Delete_Public_Resource_Tag_By_Public_Resource",
        map: {
          public_resource: {
            type: "input",
            value: "public_resource",
          },
        },
      },
      {
        type: "fx",
        invoke: "Delete_Public_Resource",
        map: {
          public_resource: {
            type: "input",
            value: "public_resource",
          },
        },
      },
    ]),
    {}
  ),
};
