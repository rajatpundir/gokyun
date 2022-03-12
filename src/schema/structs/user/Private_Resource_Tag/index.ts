export default {
  fields: {
    private_resource: { type: "other", other: "Private_Resource" },
    tag: { type: "other", other: "Tag" },
  },
  uniqueness: [[["private_resource"], "tag"]],
  permissions: {
    private: {
      owner: {
        entrypoint: [["private_resource"], "owner"],
        read: ["private_resource", "tag"],
        write: [],
        down: [
          { struct_path: [[], "private_resource"], permission_name: "owner" },
        ],
      },
    },
    public: [],
  },
  triggers: {},
  checks: {},
};
