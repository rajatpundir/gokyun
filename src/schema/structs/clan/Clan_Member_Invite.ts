import { StructSchema } from "../../struct";

export default {
  // Produced by Clan leader and consumed by a User to produce ClanMember
  fields: {
    clan: { type: "other", other: "Clan" },
    user: { type: "other", other: "User" },
  },
  uniqueness: [[["clan"], "user"]],
  permissions: {
    borrow: {},
    ownership: {
      clan: {
        read: ["user"],
        write: [],
      },
      user: {
        read: ["clan"],
        write: [],
      },
    },
    public: [],
  },
  triggers: {},
  checks: {},
} as StructSchema;
