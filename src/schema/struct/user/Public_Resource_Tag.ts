import { StructSchema } from "..";

export default {
  fields: {
    public_resource: { type: "other", other: "Public_Resource" },
    tag: { type: "other", other: "Tag" },
  },
  uniqueness: [[["public_resource"], "tag"]],
  permissions: {
    borrow: {},
    ownership: {
      public_resource: {
        read: ["tag"],
        write: [],
      },
    },
    public: [],
  },
  triggers: {},
  checks: {},
} as StructSchema;
