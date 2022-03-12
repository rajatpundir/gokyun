export default {
  fields: {
    guild: { type: "other", other: "Guild" },
    user: { type: "other", other: "User" },
  },
  uniqueness: [[["guild"], "user"]],
  permissions: {
    private: {
      guild: {
        read: ["user"],
        write: [],
      },
      user: {
        read: ["guild"],
        write: [],
      },
    },
    public: [],
  },
  triggers: {},
  checks: {},
};
