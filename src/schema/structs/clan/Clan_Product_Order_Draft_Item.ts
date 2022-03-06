export default {
  // Also think about variations that can be applied to a product
  fields: {
    clan_product_order_draft: {
      type: "other",
      other: "Clan_Product_Order_Draft",
    },
    listed_alliance_product: {
      type: "other",
      other: "Listed_Alliance_Product",
    },
    quantity: { type: "u32" },
  },
  uniqueness: [[["clan_product_order_draft"], "listed_alliance_product"]],
  permissions: {
    borrow: {},
    ownership: {
      clan_product_order_draft: {
        read: ["listed_alliance_product", "price"],
        write: [],
      },
      listed_alliance_product: {
        read: ["clan_product_order_draft", "price"],
        write: [],
      },
    },
    public: [],
  },
  triggers: {},
  checks: {},
};
