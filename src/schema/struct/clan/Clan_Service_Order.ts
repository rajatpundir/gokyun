import { StructSchema } from "..";

export default {
  fields: {
    clan: { type: "other", other: "Clan" },
    listed_alliance_service: {
      type: "other",
      other: "Listed_Alliance_Product",
    },
  },
  uniqueness: [],
  permissions: {
    borrow: {},
    ownership: {
      clan: {
        read: ["listed_alliance_service"],
        write: [],
      },
    },
    public: [],
  },
  triggers: {},
  checks: {},
} as StructSchema;
