export default {
  fields: {
    public_resource: { type: "other", other: "Public_Resource" },
    tag: { type: "other", other: "Tag" },
  },
  uniqueness: [[["public_resource"], "tag"]],
  permissions: {
    private: {
      owner: {
        entrypoint: [["public_resource"], "owner"],
        read: ["public_resource", "tag"],
        write: [],
        down: [
          { struct_path: [[], "public_resource"], permission_name: "owner" },
        ],
      },
    },
    public: ["public_resource", "tag"],
  },
  triggers: {},
  checks: {},
};
