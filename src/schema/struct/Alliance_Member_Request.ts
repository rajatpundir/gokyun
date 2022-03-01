import { StructSchema } from "../struct";

export default {
  // This is consumed by a function and converted to AllianceMember or just deleted by another.
  fields: {
    alliance: { type: "other", other: "Alliance" },
    user: { type: "other", other: "User" },
  },
  uniqueness: [[["alliance"], "user"]],
  permissions: {
    borrow: {},
    ownership: {
      alliance: {
        read: ["user"],
        write: [],
      },
      user: {
        read: ["alliance"],
        write: [],
      },
    },
    public: [],
  },
  triggers: {},
  checks: {},
} as StructSchema;
