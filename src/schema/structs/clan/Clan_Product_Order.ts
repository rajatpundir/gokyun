export default {
  fields: {
    clan: { type: "other", other: "Clan" },
    product_count: { type: "udecimal" },
    product_price_sum: { type: "udecimal" },
  },
  uniqueness: [],
  permissions: {
    borrow: {},
    ownership: {
      clan: {
        read: ["product_count", "product_price_sum"],
        write: [],
      },
    },
    public: [],
  },
  triggers: {},
  checks: {},
};
