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
    private: {
      clan: {
        read: ["listed_alliance_service"],
        write: [],
      },
    },
    public: [],
  },
  triggers: {},
  checks: {},
};
