export default {
  fields: {
    public_resource: { type: "other", other: "Public_Resource" },
    tag: { type: "other", other: "Tag" },
  },
  uniqueness: [[["public_resource"], "tag"]],
  permissions: {
    private: {
      public_resource: {
        read: ["tag"],
        write: [],
      },
    },
    public: [],
  },
  triggers: {},
  checks: {},
};
