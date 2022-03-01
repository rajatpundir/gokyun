import { StructSchema } from "../struct";

// TODO. Define Alliance_Voucher here, acts like a partial wallet after applying coupon if any
// Could be used certain number of times as defined, owner tracks what what exactly was bought with voucher
// The one using voucher needs to provide its code, which may not be randomly generated, unique(alliance, clan, code)
export default {
  fields: {
    alliance: { type: "other", other: "Alliance" },
    clan: { type: "other", other: "Clan" },
    order_count: { type: "udecimal" },
    order_amount_sum: { type: "udecimal" },
    order_amount_mean: { type: "udecimal" },
  },
  uniqueness: [[["alliance"], "clan"]],
  permissions: {
    borrow: {},
    ownership: {
      alliance: {
        read: ["clan", "order_count", "order_price_sum", "order_price_mean"],
        write: [],
      },
      clan: {
        read: [
          "alliance",
          "order_count",
          "order_price_sum",
          "order_price_mean",
        ],
        write: [],
      },
    },
    public: [],
  },
  triggers: {},
  checks: {},
} as StructSchema;
