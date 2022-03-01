import { StructSchema } from "../struct";

// TODO. To Reassess below structs
export default {
  // Clan_Product_Order_Draft and Clan_Product_Order_Draft_Item are consumed by a function
  // to produce Clan_Product_Order and Clan_Product_Order_Item
  fields: {
    // This should be alliance_customer
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
} as StructSchema;
