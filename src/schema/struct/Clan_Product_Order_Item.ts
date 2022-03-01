import { StructSchema } from ".";

export default {
  fields: {
    clan_product_order: { type: "other", other: "Clan_Product_Order_Draft" },
    listed_alliance_product: {
      type: "other",
      other: "Listed_Alliance_Product",
    },
    quantity: { type: "u32" },
    price: { type: "udecimal" },
  },
  uniqueness: [[["clan_product_order_draft"], "listed_alliance_product"]],
  permissions: {
    borrow: {},
    ownership: {
      clan_product_order: {
        read: ["listed_alliance_product", "quantity", "price"],
        write: [],
      },
      listed_alliance_product: {
        read: ["clan_product_order", "quantity", "price"],
        write: [],
      },
    },
    public: [],
  },
  triggers: {},
  checks: {},
} as StructSchema;
