import { StructSchema } from "../../../struct";

export default {
  Private_Resource_Tag: {
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
  } as StructSchema,
};
