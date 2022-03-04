import {
  Compose,
  Result,
  Ok,
  Err,
  CustomError,
  errors,
  ErrMsg,
  ComposeStep,
} from "../../lib";

// Tag will make lookups faster, so no need to remove it

// Conversion to/from PrivateResource and PublicResource with their tags

// Add checks to match user when deleting private/public resource or their tags
// This is required because others may provide them as args because of readability only
// Same goes for replace operation

const schema: Record<string, Compose> = {
  Create_Private_Resource: new Compose(
    "Create_Private_Resource",
    {
      resource_type: { type: "other", other: "Resource_Type" },
      url: { type: "str" },
      tags: { type: "list" },
    },
    new ComposeStep(undefined, [
      {
        name: "Create_Private_Resource",
        type: "fx",
        invoke: "Create_Private_Resource",
        map: {
          resource_type: { type: "input", value: "resource_type" },
          url: { type: "input", value: "url" },
        },
        output: { private_resource: "private_resource" },
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
        invoke: "Create_Private_Resource_Tag",
        map: {
          base: {
            type: "transform",
            value: "Create_Tag",
            map: {
              tag: "tag",
            },
            inject: {
              private_resource: {
                type: "fx",
                value: ["Create_Private_Resource", "private_resource"],
              },
            },
          },
        },
        output: "tags",
      },
    ]),
    {}
  ),
  Delete_Private_Resource: new Compose(
    "Delete_Private_Resource",
    {
      private_resource: { type: "other", other: "Private_Resource" },
    },
    new ComposeStep(undefined, [
      {
        type: "fx",
        invoke: "Delete_Private_Resource_Tag_By_Private_Resource",
        map: {
          private_resource: {
            type: "input",
            value: "private_resource",
          },
        },
      },
      {
        type: "fx",
        invoke: "Delete_Private_Resource",
        map: {
          private_resource: {
            type: "input",
            value: "private_resource",
          },
        },
      },
    ]),
    {}
  ),
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
  Create_Public_Resource_From_Private_Resource: new Compose(
    "Create_Public_Resource_From_Private_Resource",
    {
      private_resource: { type: "other", other: "Private_Resource" },
    },
    new ComposeStep(undefined, [
      {
        name: "Create_Public_Resource_From_Private_Resource",
        type: "fx",
        invoke: "Create_Public_Resource_From_Private_Resource",
        map: {
          private_resource: {
            type: "input",
            value: "private_resource",
          },
        },
      },
      {
        type: "transform",
        invoke: "Create_Public_Resource_Tag_From_Private_Resource_Tag",
        map: {
          base: {
            type: "inject",
            inject: {
              public_resource: {
                type: "fx",
                value: [
                  "Create_Public_Resource_From_Private_Resource",
                  "public_resource",
                ],
              },
            },
          },
          query: {
            private_resource: {
              type: "input",
              value: "private_resource",
            },
          },
        },
      },
      {
        type: "compose",
        invoke: "Delete_Private_Resource",
        map: {
          private_resource: {
            type: "input",
            value: "private_resource",
          },
        },
      },
    ]),
    {}
  ),
};

export function get_compose(compose_name: string): Result<Compose> {
  if (compose_name in schema) {
    return new Ok(schema[compose_name]);
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
