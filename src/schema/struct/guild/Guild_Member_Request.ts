import { StructSchema } from "..";

export default {
  fields: {
    guild: { type: "other", other: "Guild" },
    user: { type: "other", other: "User" },
  },
  uniqueness: [[["guild"], "user"]],
  permissions: {
    borrow: {},
    ownership: {
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
} as StructSchema;
