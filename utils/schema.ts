import {
  Add,
  And,
  Bool,
  BooleanLispExpression,
  Decimal,
  DecimalComparatorExpression,
  Dot,
  DotExpression,
  Equals,
  GreaterThan,
  GreaterThanEquals,
  LessThan,
  LogicalBinaryExpression,
  LogicalUnaryExpression,
  Not,
  Num,
  NumberArithmeticExpression,
  NumberComparatorExpression,
  Subtract,
  Text,
  TextComparatorExpression,
  ToDecimal,
  ToNumber,
  ToText,
} from "./lisp";
import { errors, Message } from "./prelude";
import { StructEffects, StructPermissions, WeakEnum } from "./variable";

// get permissions for struct,
// select subset of paths that wish to be shown in form,
// select subset of paths that need to be updated,
// ask to update the paths
// {
//     "a.b.c": 2,
//     "a.b.c.d_1": 3,
//     "a": 4 // Either children or parent can be updated, not both
// }

const schema: Record<
  string,
  {
    fields: Record<string, ReadonlyArray<WeakEnum>>;
    uniqueness: ReadonlyArray<ReadonlyArray<string>>;
    permissions: StructPermissions;
    effects: StructEffects;
    checks: Record<string, [BooleanLispExpression, Message]>;
  }
> = {
  Country: {
    fields: {
      name: [{ type: "str" }],
    },
    uniqueness: [["name"]],
    permissions: {
      ownership: [],
      borrow: {},
      private: {},
      public: [[["name"], new Bool(true)]],
    },
    effects: {},
    checks: {
      name_cannot_be_empty: [
        new TextComparatorExpression(
          new Equals<ToText>([
            new Text(""),
            new DotExpression(new Dot(["name"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as Message,
      ],
    },
  },
  // Also need to store pincode stats for each guild
  // This is to give a high level comparison of efficiency of various guilds
  // In real world, each guild may represent a supply line of a specific compant like FedEx, UPS, etc
  // System can even utilize this information in future to suggest fastest path of delivery.
  Pincode: {
    fields: {
      country: [{ type: "other", other: "Country" }],
      name: [{ type: "str" }],
      // Use standard deviation for average calculation
      // values greater than 2*sigma (95%) are outliers
      // outliers should not be used to update mean and sigma, if count > 100
      //figure formula for calculatin mu and sigma as values are added/removed one at a time
      count: [{ type: "u32", default: 0 }],
      average_latitude: [{ type: "idecimal", default: 0 }],
      average_longitude: [{ type: "idecimal", default: 0 }],
    },
    uniqueness: [["country", "name"]],
    permissions: {
      ownership: [],
      borrow: {},
      private: {},
      public: [[["country", "name"], new Bool(true)]],
    },
    effects: {},
    checks: {
      name_is_not_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new Text(""),
                new DotExpression(new Dot(["name"])),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as Message,
      ],
      // -90 to 90 for latitude and -180 to 180 for longitude
      location_is_within_bounds: [
        new LogicalBinaryExpression(
          new And([
            new DecimalComparatorExpression(
              new GreaterThanEquals<ToDecimal>([
                new Decimal(-90),
                new DotExpression(new Dot(["average_latitude"])),
                [new Decimal(90)],
              ])
            ),
            new DecimalComparatorExpression(
              new GreaterThanEquals<ToDecimal>([
                new Decimal(-180),
                new DotExpression(new Dot(["average_longitude"])),
                [new Decimal(180)],
              ])
            ),
            [],
          ])
        ),
        [errors.ErrEmptyField] as Message,
      ],
    },
  },
  PincodeStats: {
    fields: {
      from: [{ type: "other", other: "Pincode" }],
      to: [{ type: "other", other: "Pincode" }],
      // Use standard deviation for average calculation
      average_time: [{ type: "timestamp", default: 0 }],
    },
    uniqueness: [["from", "to"]],
    permissions: {
      ownership: [],
      borrow: {},
      private: {},
      public: [
        [["from"], new Bool(true)],
        [["to"], new Bool(true)],
        [["average_time"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {
      name_is_not_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new Text(""),
                new DotExpression(new Dot(["name"])),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as Message,
      ],
    },
  },
  Language: {
    fields: {
      code: [{ type: "str" }],
    },
    uniqueness: [["code"]],
    permissions: {
      ownership: [],
      borrow: {},
      private: {},
      public: [[["code"], new Bool(true)]],
    },
    effects: {},
    checks: {
      code_is_not_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new Text(""),
                new DotExpression(new Dot(["code"])),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as Message,
      ],
    },
  },
  User: {
    fields: {
      //Note. name can be overwritten via separate api endpoint
      // no private permissions will be given to modify the User struct
      mobile: [{ type: "str" }],
      name: [{ type: "str" }],
      language: [{ type: "other", other: "Language" }],
      knows_english: [{ type: "bool" }],
      country: [{ type: "other", other: "Country" }],
      alliance_count: [{ type: "u32", default: 0 }],
      guild_count: [{ type: "u32", default: 0 }],
      clan_count: [{ type: "u32", default: 0 }],
    },
    uniqueness: [["mobile"]],
    permissions: {
      ownership: [],
      borrow: {},
      private: {},
      public: [
        [["mobile"], new Bool(true)],
        [["name"], new Bool(true)],
        [["language"], new Bool(true)],
        [["knows_english"], new Bool(true)],
        [["country"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {
      mobile_is_not_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new Text(""),
                new DotExpression(new Dot(["mobile"])),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as Message,
      ],
      name_is_not_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new Text(""),
                new DotExpression(new Dot(["name"])),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as Message,
      ],
    },
  },
  Wallet: {
    fields: {
      user: [{ type: "other", other: "User" }],
      name: [{ type: "str" }],
      // Note. A Function modifies values for copper, silver, gold.
      // Coins cannot be modified directly
      copper: [{ type: "udecimal" }],
      silver: [{ type: "udecimal" }],
      gold: [{ type: "udecimal" }],
      alliance_count: [{ type: "u32", default: 0 }],
      guild_count: [{ type: "u32", default: 0 }],
      clan_count: [{ type: "u32", default: 0 }],
    },
    uniqueness: [["user", "name"]],
    permissions: {
      ownership: [["user", new Bool(true)]],
      borrow: {},
      private: {
        user: {
          read: [
            [["copper"], new Bool(true)],
            [["silver"], new Bool(true)],
            [["gold"], new Bool(true)],
          ],
          write: [],
        },
      },
      public: [[["user"], new Bool(true)]],
    },
    effects: {},
    checks: {
      // Wallet should not be attached to more than one alliance / guild / clan
      wallet_is_attached_uniquely: [
        new LogicalUnaryExpression(
          new Not(
            new NumberComparatorExpression(
              new LessThan<ToNumber>([
                new NumberArithmeticExpression(
                  new Add([
                    new DotExpression(new Dot(["alliance_count"])),
                    [
                      new DotExpression(new Dot(["guild_count"])),
                      new DotExpression(new Dot(["clan_count"])),
                    ],
                  ])
                ),
                new Num(2),
                [],
              ])
            )
          )
        ),
        [errors.ErrUnexpected] as Message,
      ],
    },
  },
  Alliance: {
    fields: {
      name: [{ type: "str" }],
      // Note. Care to be taken that wallet of just about anyone cannot be assigned
      wallet: [{ type: "other", other: "Wallet" }],
      member_count: [{ type: "u32" }],
      product_count: [{ type: "u32" }],
      service_count: [{ type: "u32" }],
    },
    uniqueness: [["name"]],
    permissions: {
      ownership: [["wallet", new Bool(true)]],
      borrow: {},
      private: {
        wallet: {
          read: [],
          write: [[["name"], new Bool(true)]],
        },
      },
      public: [[["name", "member_count"], new Bool(true)]],
    },
    effects: {
      update_count_in_wallet: {
        dependencies: [["wallet"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "wallet", "alliance_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNumber>([
                new DotExpression(
                  new Dot(["_prev", "wallet", "alliance_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "wallet", "alliance_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNumber>([
                new DotExpression(
                  new Dot(["_prev", "wallet", "alliance_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_is_not_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new Text(""),
                new DotExpression(new Dot(["name"])),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as Message,
      ],
    },
  },
  Guild: {
    fields: {
      name: [{ type: "str" }],
      // Note. Care to be taken that wallet of just about anyone cannot be assigned
      wallet: [{ type: "other", other: "Wallet" }],
      member_count: [{ type: "u32" }],
    },
    uniqueness: [["name"]],
    permissions: {
      ownership: [["wallet", new Bool(true)]],
      borrow: {},
      private: {
        wallet: {
          read: [],
          write: [[["name"], new Bool(true)]],
        },
      },
      public: [[["name"], new Bool(true)]],
    },
    effects: {
      update_count_in_wallet: {
        dependencies: [["wallet"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "wallet", "guild_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNumber>([
                new DotExpression(new Dot(["_prev", "wallet", "guild_count"])),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "wallet", "guild_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNumber>([
                new DotExpression(new Dot(["_prev", "wallet", "guild_count"])),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_is_not_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new Text(""),
                new DotExpression(new Dot(["name"])),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as Message,
      ],
    },
  },
  Clan: {
    fields: {
      name: [{ type: "str" }],
      // Note. Care to be taken that wallet of just about anyone cannot be assigned
      wallet: [{ type: "other", other: "Wallet" }],
      member_count: [{ type: "u32" }],
    },
    uniqueness: [],
    permissions: {
      ownership: [["wallet", new Bool(true)]],
      borrow: {},
      private: {
        wallet: {
          read: [],
          write: [[["name"], new Bool(true)]],
        },
      },
      public: [[["name"], new Bool(true)]],
    },
    effects: {
      increment_count_in_wallet: {
        dependencies: [["wallet"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "wallet", "clan_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNumber>([
                new DotExpression(new Dot(["_prev", "wallet", "clan_count"])),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "wallet", "clan_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNumber>([
                new DotExpression(new Dot(["_prev", "wallet", "clan_count"])),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_is_not_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new Text(""),
                new DotExpression(new Dot(["name"])),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as Message,
      ],
    },
  },
  Alliance_Member: {
    fields: {
      alliance: [{ type: "other", other: "Alliance" }],
      member: [{ type: "other", other: "User" }],
    },
    uniqueness: [["alliance", "member"]],
    permissions: {
      ownership: [
        ["alliance", new Bool(true)],
        ["member", new Bool(true)],
      ],
      borrow: {
        alliance: [
          [
            "Alliance_Member",
            "member",
            new NumberComparatorExpression(
              new Equals<ToNumber>([
                new DotExpression(new Dot(["alliance"])),
                new DotExpression(new Dot(["_borrow", "alliance"])),
                [],
              ])
            ),
          ],
        ],
      },
      private: {
        alliance: {
          read: [[["member"], new Bool(true)]],
          write: [],
        },
        member: {
          read: [[["alliance"], new Bool(true)]],
          write: [],
        },
      },
      public: [],
    },
    effects: {
      update_count_in_alliance: {
        dependencies: [["alliance"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            // Run on creation/updation as per rules of effects
            path: ["_curr", "alliance", "member_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNumber>([
                new DotExpression(
                  new Dot(["_curr", "alliance", "member_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: ["_prev", "alliance", "member_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNumber>([
                new DotExpression(
                  new Dot(["_prev", "alliance", "member_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
      update_count_in_member: {
        dependencies: [["member"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            // Run on creation/updation as per rules of effects
            path: ["_curr", "member", "alliance_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNumber>([
                new DotExpression(
                  new Dot(["_curr", "member", "alliance_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: ["_prev", "member", "alliance_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNumber>([
                new DotExpression(
                  new Dot(["_prev", "member", "alliance_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {},
  },
  Guild_Member: {
    fields: {
      guild: [{ type: "other", other: "Guild" }],
      member: [{ type: "other", other: "User" }],
    },
    uniqueness: [["guild", "member"]],
    permissions: {
      ownership: [
        ["guild", new Bool(true)],
        ["member", new Bool(true)],
      ],
      borrow: {
        guild: [
          [
            "GuildMember",
            "member",
            new NumberComparatorExpression(
              new Equals<ToNumber>([
                new DotExpression(new Dot(["guild"])),
                new DotExpression(new Dot(["_borrow", "guild"])),
                [],
              ])
            ),
          ],
        ],
      },
      private: {
        guild: {
          read: [[["member"], new Bool(true)]],
          write: [],
        },
        member: {
          read: [[["guild"], new Bool(true)]],
          write: [],
        },
      },
      public: [],
    },
    effects: {
      update_count_in_guild: {
        dependencies: [["guild"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            // Run on creation/updation as per rules of effects
            path: ["_curr", "guild", "member_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNumber>([
                new DotExpression(new Dot(["_curr", "guild", "member_count"])),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: ["_prev", "guild", "member_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNumber>([
                new DotExpression(new Dot(["_prev", "guild", "member_count"])),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
      update_count_in_member: {
        dependencies: [["member"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            // Run on creation/updation as per rules of effects
            path: ["_curr", "member", "guild_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNumber>([
                new DotExpression(new Dot(["_curr", "member", "guild_count"])),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: ["_prev", "member", "guild_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNumber>([
                new DotExpression(new Dot(["_prev", "member", "guild_count"])),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {},
  },
  Clan_Member: {
    fields: {
      clan: [{ type: "other", other: "Clan" }],
      member: [{ type: "other", other: "User" }],
    },
    uniqueness: [["clan", "member"]],
    permissions: {
      ownership: [
        ["clan", new Bool(true)],
        ["member", new Bool(true)],
      ],
      borrow: {
        clan: [
          [
            "ClanMember",
            "member",
            new NumberComparatorExpression(
              new Equals<ToNumber>([
                new DotExpression(new Dot(["clan"])),
                new DotExpression(new Dot(["_borrow", "clan"])),
                [],
              ])
            ),
          ],
        ],
      },
      private: {
        clan: {
          read: [[["member"], new Bool(true)]],
          write: [],
        },
        member: {
          read: [[["clan"], new Bool(true)]],
          write: [],
        },
      },
      public: [],
    },
    effects: {
      update_count_in_clan: {
        dependencies: [["clan"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            // Run on creation/updation as per rules of effects
            path: ["_curr", "clan", "member_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNumber>([
                new DotExpression(new Dot(["_curr", "clan", "member_count"])),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: ["_prev", "clan", "member_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNumber>([
                new DotExpression(new Dot(["_prev", "clan", "member_count"])),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
      update_count_in_member: {
        dependencies: [["member"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            // Run on creation/updation as per rules of effects
            path: ["_curr", "member", "clan_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNumber>([
                new DotExpression(new Dot(["_curr", "member", "clan_count"])),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: ["_prev", "member", "clan_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNumber>([
                new DotExpression(new Dot(["_prev", "member", "clan_count"])),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {},
  },
  Alliance_Product: {
    fields: {
      alliance: [{ type: "other", other: "Alliance" }],
      name: [{ type: "str" }],
      language: [{ type: "other", other: "Language" }],
      description: [{ type: "clob" }],
      min_price: [{ type: "udecimal" }],
      max_price: [{ type: "udecimal" }],
    },
    uniqueness: [["alliance", "name"]],
    permissions: {
      ownership: [["alliance", new Bool(true)]],
      borrow: {},
      private: {
        alliance: {
          read: [],
          write: [
            [["name"], new Bool(true)],
            [["language"], new Bool(true)],
            [["description"], new Bool(true)],
            [["min_price"], new Bool(true)],
            [["max_price"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance"], new Bool(true)],
        [["name"], new Bool(true)],
        [["language"], new Bool(true)],
        [["description"], new Bool(true)],
        [["min_price"], new Bool(true)],
        [["max_price"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {
      name_cannot_be_empty: [
        new TextComparatorExpression(
          new Equals<ToText>([
            new Text(""),
            new DotExpression(new Dot(["name"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as Message,
      ],
      min_price_is_less_than_max_price: [
        new NumberComparatorExpression(
          new GreaterThanEquals<ToNumber>([
            new DotExpression(new Dot(["min_price"])),
            new DotExpression(new Dot(["max_price"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as Message,
      ],
    },
  },
  Alliance_Product_Translation: {
    fields: {
      alliance_product: [{ type: "other", other: "Alliance_Product" }],
      language: [{ type: "other", other: "Language" }],
      name: [{ type: "str" }],
      description: [{ type: "clob" }],
    },
    uniqueness: [["alliance_product", "language"]],
    permissions: {
      ownership: [["alliance_product", new Bool(true)]],
      borrow: {},
      private: {
        alliance_product: {
          read: [],
          write: [
            [["language"], new Bool(true)],
            [["name"], new Bool(true)],
            [["description"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance_product"], new Bool(true)],
        [["language"], new Bool(true)],
        [["name"], new Bool(true)],
        [["description"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {
      name_cannot_be_empty: [
        new TextComparatorExpression(
          new Equals<ToText>([
            new Text(""),
            new DotExpression(new Dot(["name"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as Message,
      ],
      language_is_not_being_redefined: [
        new TextComparatorExpression(
          new Equals<ToText>([
            new DotExpression(new Dot(["language"])),
            new DotExpression(new Dot(["alliance_product", "language"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as Message,
      ],
    },
  },
  User_Product: {
    fields: {
      user: [{ type: "other", other: "User" }],
      name: [{ type: "str" }],
      price: [{ type: "udecimal" }],
    },
    uniqueness: [["user", "name"]],
    permissions: {
      ownership: [["user", new Bool(true)]],
      borrow: {},
      private: {
        user: {
          read: [],
          write: [
            [["name"], new Bool(true)],
            [["price"], new Bool(true)],
          ],
        },
      },
      public: [
        [["name"], new Bool(true)],
        [["price"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {
      name_cannot_be_empty: [
        new TextComparatorExpression(
          new Equals<ToText>([
            new Text(""),
            new DotExpression(new Dot(["name"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as Message,
      ],
    },
  },
  // Send request to User first to link AllianceProduct to UserProduct
  // Rename below to LinkedUserProduct or something
  // Ensure that a user product can only be linked to one alliance product
  Listed_Alliance_Product: {
    fields: {
      alliance_product: [{ type: "other", other: "Alliance_Product" }],
      member: [{ type: "other", other: "Alliance_Member" }],
      user_product: [{ type: "other", other: "User_Product" }],
    },
    uniqueness: [["alliance_product", "unlisted_product"]],
    permissions: {
      ownership: [
        ["alliance_product", new Bool(true)],
        ["user_product", new Bool(true)],
      ],
      borrow: {},
      private: {},
      public: [
        [["alliance_product"], new Bool(true)],
        [["user_product"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {},
  },
  Alliance_Virtual_Product: {
    fields: {
      alliance: [{ type: "other", other: "Alliance" }],
      listed_alliance_product: [
        { type: "other", other: "Listed_Alliance_Product" },
      ],
      markup: [{ type: "udecimal" }], // percentage increase above base price
    },
    uniqueness: [["alliance", "listed_alliance_product"]],
    permissions: {
      ownership: [["alliance", new Bool(true)]],
      borrow: {},
      private: {
        alliance: {
          read: [],
          write: [
            [["listed_alliance_product"], new Bool(true)],
            [["markup"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance"], new Bool(true)],
        [["listed_alliance_product"], new Bool(true)],
        [["markup"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {
      // listed_alliance_product.alliance != alliance
    },
  },
  Alliance_Service: {
    fields: {
      alliance: [{ type: "other", other: "Alliance" }],
      language: [{ type: "other", other: "Language" }],
      name: [{ type: "str" }],
      description: [{ type: "clob" }],
      min_price: [{ type: "udecimal" }],
      max_price: [{ type: "udecimal" }],
    },
    uniqueness: [["alliance", "name"]],
    permissions: {
      ownership: [["alliance", new Bool(true)]],
      borrow: {},
      private: {
        alliance: {
          read: [],
          write: [
            [["language"], new Bool(true)],
            [["name"], new Bool(true)],
            [["description"], new Bool(true)],
            [["min_price"], new Bool(true)],
            [["max_price"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance"], new Bool(true)],
        [["language"], new Bool(true)],
        [["name"], new Bool(true)],
        [["description"], new Bool(true)],
        [["min_price"], new Bool(true)],
        [["max_price"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {
      name_cannot_be_empty: [
        new TextComparatorExpression(
          new Equals<ToText>([
            new Text(""),
            new DotExpression(new Dot(["name"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as Message,
      ],
      min_price_is_less_than_max_price: [
        new NumberComparatorExpression(
          new GreaterThanEquals<ToNumber>([
            new DotExpression(new Dot(["min_price"])),
            new DotExpression(new Dot(["max_price"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as Message,
      ],
    },
  },
  Alliance_Service_Translation: {
    fields: {
      alliance_service: [{ type: "other", other: "Alliance_Service" }],
      language: [{ type: "other", other: "Language" }],
      name: [{ type: "str" }],
      description: [{ type: "clob" }],
    },
    uniqueness: [["alliance_service", "language"]],
    permissions: {
      ownership: [["alliance_service", new Bool(true)]],
      borrow: {},
      private: {
        alliance: {
          read: [],
          write: [
            [["language"], new Bool(true)],
            [["name"], new Bool(true)],
            [["description"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance_service"], new Bool(true)],
        [["language"], new Bool(true)],
        [["name"], new Bool(true)],
        [["description"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {
      name_cannot_be_empty: [
        new TextComparatorExpression(
          new Equals<ToText>([
            new Text(""),
            new DotExpression(new Dot(["name"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as Message,
      ],
      // language != alliance_service.language (base language of product)
    },
  },
  Unlisted_Service: {
    // Service should have tasks that needs to be done
    // Milestones and Tasks are predefined
    // Tasks are filled into milestone against AllianceService at time of delivery to determine price
    fields: {
      user: [{ type: "other", other: "User" }],
      name: [{ type: "str" }],
      price: [{ type: "udecimal" }],
    },
    uniqueness: [["user", "name"]],
    permissions: {
      ownership: [["user", new Bool(true)]],
      borrow: {},
      private: {
        user: {
          read: [],
          write: [
            [["name"], new Bool(true)],
            [["price"], new Bool(true)],
          ],
        },
      },
      public: [
        [["name"], new Bool(true)],
        [["price"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {
      name_cannot_be_empty: [
        new TextComparatorExpression(
          new Equals<ToText>([
            new Text(""),
            new DotExpression(new Dot(["name"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as Message,
      ],
    },
  },
  Unlisted_Service_Task: {
    fields: {
      unlisted_service: [{ type: "other", other: "Unlisted_Service" }],
      name: [{ type: "str" }],
      price: [{ type: "udecimal" }],
    },
    uniqueness: [["unlisted_service", "name"]],
    permissions: {
      ownership: [["unlisted_service", new Bool(true)]],
      borrow: {},
      private: {
        user: {
          read: [],
          write: [
            [["name"], new Bool(true)],
            [["price"], new Bool(true)],
          ],
        },
      },
      public: [
        [["name"], new Bool(true)],
        [["price"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {
      name_cannot_be_empty: [
        new TextComparatorExpression(
          new Equals<ToText>([
            new Text(""),
            new DotExpression(new Dot(["name"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as Message,
      ],
    },
  },
  Listed_Alliance_Service: {
    fields: {
      alliance_service: [{ type: "other", other: "Alliance_Service" }],
      member: [{ type: "other", other: "Alliance_Member" }],
      unlisted_service: [{ type: "other", other: "Unlisted_Service" }],
    },
    uniqueness: [["alliance_service", "unlisted_service"]],
    permissions: {
      ownership: [
        ["alliance_service", new Bool(true)],
        ["unlisted_service", new Bool(true)],
      ],
      borrow: {},
      private: {},
      public: [
        [["alliance_service"], new Bool(true)],
        [["unlisted_service"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {},
  },
  Alliance_Member_Request: {
    fields: {
      alliance: [{ type: "other", other: "Alliance" }],
      user: [{ type: "other", other: "User" }],
      status: [{ type: "bool" }],
    },
    uniqueness: [["alliance", "user"]],
    permissions: {
      ownership: [["alliance", new Bool(true)]],
      borrow: {},
      private: {
        user: {
          read: [
            [["alliance"], new Bool(true)],
            [["status"], new Bool(true)],
          ],
          write: [],
        },
      },
      public: [],
    },
    effects: {},
    checks: {},
  },
  Guild_Member_Request: {
    fields: {
      guild: [{ type: "other", other: "Guild" }],
      user: [{ type: "other", other: "User" }],
      status: [{ type: "bool" }],
    },
    uniqueness: [["guild", "user"]],
    permissions: {
      ownership: [["guild", new Bool(true)]],
      borrow: {},
      private: {
        user: {
          read: [
            [["guild"], new Bool(true)],
            [["status"], new Bool(true)],
          ],
          write: [],
        },
      },
      public: [],
    },
    effects: {},
    checks: {},
  },
  Clan_Member_Invite: {
    fields: {
      clan: [{ type: "other", other: "Clan" }],
      user: [{ type: "other", other: "User" }],
      status: [{ type: "bool" }],
    },
    uniqueness: [["clan", "user"]],
    permissions: {
      ownership: [["user", new Bool(true)]],
      borrow: {},
      private: {
        user: {
          read: [
            [["clan"], new Bool(true)],
            [["status"], new Bool(true)],
          ],
          write: [],
        },
      },
      public: [],
    },
    effects: {},
    checks: {},
  },
};

// export function get_structs(): HashSet<Struct> {
//     const structs: HashSet<Struct> = HashSet.of()
//     for (let structName in schema) {
//         const struct: Struct = new Struct(structName, HashSet.of())
//         for (let fieldName in schema[structName]) {
//             const field = new Field(struct, fieldName, HashSet.of())
//             for (let variant of schema[structName][fieldName]) {
//                 field.variants.add(new FieldVariant(field, variant))
//             }
//             struct.fields.add(field)
//         }
//         structs.add(struct)
//     }
//     return structs
// }
