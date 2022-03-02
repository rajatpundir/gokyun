import { StructSchema } from "..";

export default {
  fields: {
    private_resource: { type: "other", other: "Private_Resource" },
    tag: { type: "other", other: "Tag" },
  },
  uniqueness: [[["private_resource"], "tag"]],
  permissions: {
    borrow: {},
    ownership: {
      private_resource: {
        read: ["tag"],
        write: [],
      },
    },
    public: [],
  },
  triggers: {},
  checks: {},
} as StructSchema;