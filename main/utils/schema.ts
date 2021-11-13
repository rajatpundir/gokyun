import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import {
  Add,
  And,
  Bool,
  BooleanLispExpression,
  Deci,
  DecimalComparatorExpression,
  Divide,
  Dot,
  DotExpression,
  Equals,
  GreaterThanEquals,
  LessThan,
  LessThanEquals,
  LogicalBinaryExpression,
  LogicalUnaryExpression,
  Not,
  Num,
  NumberArithmeticExpression,
  NumberComparatorExpression,
  Subtract,
  Text,
  TextComparatorExpression,
  ToDeci,
  ToNum,
  ToText,
} from "./lisp";
import { errors, ErrMsg } from "./errors";
import {
  Field,
  Struct,
  StructEffects,
  StructPermissions,
  WeakEnum,
} from "./variable";

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
    fields: Record<string, WeakEnum>;
    uniqueness: ReadonlyArray<ReadonlyArray<string>>;
    permissions: StructPermissions;
    effects: StructEffects;
    checks: Record<string, [BooleanLispExpression, ErrMsg]>;
  }
> = {
  Test: {
    fields: {
      user: { type: "other", other: "User" },
      name: { type: "str" },
      // Note. A Function modifies values for copper, silver, gold.
      // Coins cannot be modified directly
      copper: { type: "udecimal" },
      silver: { type: "udecimal" },
      gold: { type: "udecimal" },
      alliance_count: { type: "u32", default: new Decimal(0) },
      guild_count: { type: "u32", default: new Decimal(0) },
      clan_count: { type: "u32", default: new Decimal(0) },
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
    checks: {},
  },
  Product_Category: {
    fields: {
      parent: { type: "other", other: "Product_Category" },
      name: { type: "str" },
      translation_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [],
    permissions: {
      ownership: [],
      borrow: {},
      private: {},
      public: [
        [["parent"], new Bool(true)],
        [["name"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Product_Category_Translation: {
    fields: {
      product_category: { type: "other", other: "Product_Category" },
      language: { type: "other", other: "Language" },
      name: { type: "str" },
    },
    uniqueness: [["product_category", "language"]],
    permissions: {
      ownership: [],
      borrow: {},
      private: {},
      public: [
        [["product_category"], new Bool(true)],
        [["language"], new Bool(true)],
        [["name"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_product_category: {
        dependencies: [["product_category"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "product_category", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "product_category", "translation_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "product_category", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "product_category", "translation_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      language_is_not_english: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["language", "code"])),
                new Text("en"),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Service_Category: {
    fields: {
      parent: { type: "other", other: "Service_Category" },
      name: { type: "str" },
      translation_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [],
    permissions: {
      ownership: [],
      borrow: {},
      private: {},
      public: [
        [["parent"], new Bool(true)],
        [["name"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Service_Category_Translation: {
    fields: {
      service_category: { type: "other", other: "Service_Category" },
      language: { type: "other", other: "Language" },
      name: { type: "str" },
    },
    uniqueness: [["service_category", "language"]],
    permissions: {
      ownership: [],
      borrow: {},
      private: {},
      public: [
        [["service_category"], new Bool(true)],
        [["language"], new Bool(true)],
        [["name"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_service_category: {
        dependencies: [["service_category"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "service_category", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "service_category", "translation_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "service_category", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "service_category", "translation_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      language_is_not_english: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["language", "code"])),
                new Text("en"),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Tag: {
    fields: {
      name: { type: "str" },
      translation_count: { type: "u32", default: new Decimal(0) },
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
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Tag_Translation: {
    fields: {
      tag: { type: "other", other: "Tag" },
      language: { type: "other", other: "Language" },
      name: { type: "str" },
    },
    uniqueness: [["tag", "language"]],
    permissions: {
      ownership: [],
      borrow: {},
      private: {},
      public: [
        [["language"], new Bool(true)],
        [["name"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_tag: {
        dependencies: [["tag"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "tag", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "tag", "translation_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "tag", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "tag", "translation_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      language_is_not_english: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["language", "code"])),
                new Text("en"),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Country: {
    fields: {
      name: { type: "str" },
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
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  // Also need to store pincode stats for each guild
  // This is to give a high level comparison of efficiency of various guilds
  // In real world, each guild may represent a supply line of a specific compant like FedEx, UPS, etc
  // System can even utilize this information in future to suggest fastest path of delivery.
  Pincode: {
    fields: {
      country: { type: "other", other: "Country" },
      name: { type: "str" },
      // Use standard deviation for average calculation
      // values greater than 2*sigma (95%) are outliers
      // outliers should not be used to update mean and sigma, if count > 100
      //figure formula for calculatin mu and sigma as values are added/removed one at a time
      count: { type: "u32", default: new Decimal(0) },
      average_latitude: { type: "idecimal", default: new Decimal(0) },
      average_longitude: { type: "idecimal", default: new Decimal(0) },
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
        [errors.ErrEmptyField] as ErrMsg,
      ],
      // -90 to 90 for latitude and -180 to 180 for longitude
      location_is_within_bounds: [
        new LogicalBinaryExpression(
          new And([
            new DecimalComparatorExpression(
              new GreaterThanEquals<ToDeci>([
                new Deci(-90),
                new DotExpression(new Dot(["average_latitude"])),
                [new Deci(90)],
              ])
            ),
            new DecimalComparatorExpression(
              new GreaterThanEquals<ToDeci>([
                new Deci(-180),
                new DotExpression(new Dot(["average_longitude"])),
                [new Deci(180)],
              ])
            ),
            [],
          ])
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  PincodeStats: {
    fields: {
      from: { type: "other", other: "Pincode" },
      to: { type: "other", other: "Pincode" },
      // Use standard deviation for average calculation
      average_time: { type: "timestamp", default: new Date() },
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
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Language: {
    fields: {
      code: { type: "str" },
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
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  User: {
    fields: {
      //Note. name can be overwritten via separate api endpoint
      // no private permissions will be given to modify the User struct
      mobile: { type: "str" },
      nickname: { type: "str" },
      language: { type: "other", other: "Language" },
      knows_english: { type: "bool" },
      country: { type: "other", other: "Country" },
      alliance_count: { type: "u32", default: new Decimal(0) },
      guild_count: { type: "u32", default: new Decimal(0) },
      clan_count: { type: "u32", default: new Decimal(0) },
      product_family_count: { type: "u32", default: new Decimal(0) },
      product_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [["mobile"], ["nickname"]],
    permissions: {
      ownership: [],
      borrow: {},
      private: {},
      public: [
        [["nickname"], new Bool(true)],
        [["language"], new Bool(true)],
        [["knows_english"], new Bool(true)],
        [["country"], new Bool(true)],
        [["product_family_count"], new Bool(true)],
        [["product_family_variant_count"], new Bool(true)],
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
        [errors.ErrEmptyField] as ErrMsg,
      ],
      nickname_is_not_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new Text(""),
                new DotExpression(new Dot(["nickname"])),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Wallet: {
    fields: {
      user: { type: "other", other: "User" },
      name: { type: "str" },
      // Note. A Function modifies values for copper, silver, gold.
      // Coins cannot be modified directly
      copper: { type: "udecimal" },
      silver: { type: "udecimal" },
      gold: { type: "udecimal" },
      alliance_count: { type: "u32", default: new Decimal(0) },
      guild_count: { type: "u32", default: new Decimal(0) },
      clan_count: { type: "u32", default: new Decimal(0) },
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
              new LessThan<ToNum>([
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
        [errors.ErrUnexpected] as ErrMsg,
      ],
    },
  },
  Alliance: {
    fields: {
      name: { type: "str" },
      // Note. Care to be taken that wallet of just about anyone cannot be assigned
      wallet: { type: "other", other: "Wallet" },
      member_count: { type: "u32", default: new Decimal(0) },
      product_family_count: { type: "u32", default: new Decimal(0) },
      product_count: { type: "u32", default: new Decimal(0) },
      virtual_product_count: { type: "u32", default: new Decimal(0) },
      service_count: { type: "u32", default: new Decimal(0) },
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
      public: [
        [["name"], new Bool(true)],
        [["member_count"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_wallet: {
        dependencies: [["wallet"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "wallet", "alliance_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
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
              new Add<ToNum>([
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
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Guild: {
    fields: {
      name: { type: "str" },
      // Note. Care to be taken that wallet of just about anyone cannot be assigned
      wallet: { type: "other", other: "Wallet" },
      member_count: { type: "u32" },
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
              new Subtract<ToNum>([
                new DotExpression(new Dot(["_prev", "wallet", "guild_count"])),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "wallet", "guild_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
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
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Clan: {
    fields: {
      name: { type: "str" },
      // Note. Care to be taken that wallet of just about anyone cannot be assigned
      wallet: { type: "other", other: "Wallet" },
      member_count: { type: "u32" },
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
              new Subtract<ToNum>([
                new DotExpression(new Dot(["_prev", "wallet", "clan_count"])),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "wallet", "clan_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
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
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Member_Request: {
    // This is consumed by a function and converted to AllianceMember or just deleted by another.
    fields: {
      alliance: { type: "other", other: "Alliance" },
      user: { type: "other", other: "User" },
    },
    uniqueness: [["alliance", "user"]],
    permissions: {
      ownership: [["user", new Bool(true)]],
      borrow: {},
      private: {
        alliance: {
          read: [[["user"], new Bool(true)]],
          write: [],
        },
        user: {
          read: [[["alliance"], new Bool(true)]],
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
      guild: { type: "other", other: "Guild" },
      user: { type: "other", other: "User" },
    },
    uniqueness: [["guild", "user"]],
    permissions: {
      ownership: [["guild", new Bool(true)]],
      borrow: {},
      private: {
        guild: {
          read: [[["user"], new Bool(true)]],
          write: [],
        },
        user: {
          read: [[["guild"], new Bool(true)]],
          write: [],
        },
      },
      public: [],
    },
    effects: {},
    checks: {},
  },
  Clan_Member_Invite: {
    // Produced by Clan leader and consumed by a User to produce ClanMember
    fields: {
      clan: { type: "other", other: "Clan" },
      user: { type: "other", other: "User" },
    },
    uniqueness: [["clan", "user"]],
    permissions: {
      ownership: [["user", new Bool(true)]],
      borrow: {},
      private: {
        clan: {
          read: [[["user"], new Bool(true)]],
          write: [],
        },
        user: {
          read: [[["clan"], new Bool(true)]],
          write: [],
        },
      },
      public: [],
    },
    effects: {},
    checks: {},
  },
  Alliance_Member: {
    fields: {
      alliance: { type: "other", other: "Alliance" },
      member: { type: "other", other: "User" },
      variant_count: { type: "u32", default: new Decimal(0) },
      service_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [["alliance", "member"]],
    permissions: {
      ownership: [
        ["alliance", new Bool(true)],
        ["member", new Bool(true)],
      ],
      borrow: {
        alliance: {
          prove: [
            [
              "AllianceMember",
              "member",
              new NumberComparatorExpression(
                new Equals<ToNum>([
                  new DotExpression(new Dot(["alliance"])),
                  new DotExpression(new Dot(["_borrow", "alliance"])),
                  [],
                ])
              ),
            ],
          ],
          ownership: [["alliance", "wallet", "user"]],
        },
      },
      private: {
        alliance: {
          read: [
            [["member"], new Bool(true)],
            [["variant_count"], new Bool(true)],
            [["service_count"], new Bool(true)],
          ],
          write: [],
        },
        member: {
          read: [
            [["alliance"], new Bool(true)],
            [["variant_count"], new Bool(true)],
            [["service_count"], new Bool(true)],
          ],
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
              new Add<ToNum>([
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
              new Subtract<ToNum>([
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
              new Add<ToNum>([
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
              new Subtract<ToNum>([
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
      guild: { type: "other", other: "Guild" },
      member: { type: "other", other: "User" },
    },
    uniqueness: [["guild", "member"]],
    permissions: {
      ownership: [
        ["guild", new Bool(true)],
        ["member", new Bool(true)],
      ],
      borrow: {
        guild: {
          prove: [
            [
              "GuildMember",
              "member",
              new NumberComparatorExpression(
                new Equals<ToNum>([
                  new DotExpression(new Dot(["guild"])),
                  new DotExpression(new Dot(["_borrow", "guild"])),
                  [],
                ])
              ),
            ],
          ],
          ownership: [["guild", "wallet", "user"]],
        },
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
              new Add<ToNum>([
                new DotExpression(new Dot(["_curr", "guild", "member_count"])),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: ["_prev", "guild", "member_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
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
              new Add<ToNum>([
                new DotExpression(new Dot(["_curr", "member", "guild_count"])),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: ["_prev", "member", "guild_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
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
      clan: { type: "other", other: "Clan" },
      member: { type: "other", other: "User" },
    },
    uniqueness: [["clan", "member"]],
    permissions: {
      ownership: [
        ["clan", new Bool(true)],
        ["member", new Bool(true)],
      ],
      borrow: {
        clan: {
          prove: [
            [
              "ClanMember",
              "member",
              new NumberComparatorExpression(
                new Equals<ToNum>([
                  new DotExpression(new Dot(["clan"])),
                  new DotExpression(new Dot(["_borrow", "clan"])),
                  [],
                ])
              ),
            ],
          ],
          ownership: [["clan", "wallet", "user"]],
        },
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
              new Add<ToNum>([
                new DotExpression(new Dot(["_curr", "clan", "member_count"])),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: ["_prev", "clan", "member_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
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
              new Add<ToNum>([
                new DotExpression(new Dot(["_curr", "member", "clan_count"])),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: ["_prev", "member", "clan_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
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
  Alliance_Product_Family: {
    fields: {
      alliance: { type: "other", other: "Alliance" },
      name: { type: "str" },
      order: { type: "u32", default: new Decimal(1) },
      product_category: { type: "other", other: "Product_Category" },
      property_count: { type: "u32", default: new Decimal(0) },
      product_count: { type: "u32", default: new Decimal(0) },
      translation_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [
      ["alliance", "name"],
      ["alliance", "order"],
    ],
    permissions: {
      ownership: [["alliance", new Bool(true)]],
      borrow: {},
      private: {
        alliance: {
          read: [],
          write: [
            [["order"], new Bool(true)],
            [["name"], new Bool(true)],
            [["product_category"], new Bool(true)],
            [["property_count"], new Bool(true)],
            [["product_count"], new Bool(true)],
            [["translation_count"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance"], new Bool(true)],
        [["order"], new Bool(true)],
        [["name"], new Bool(true)],
        [["product_category"], new Bool(true)],
        [["property_count"], new Bool(true)],
        [["product_count"], new Bool(true)],
        [["translation_count"], new Bool(true)],
      ],
    },
    effects: {
      update_product_family_count_in_alliance: {
        dependencies: [["alliance"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "alliance", "product_family_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance", "product_family_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "alliance", "product_family_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance", "product_family_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
      update_product_count_in_alliance: {
        dependencies: [["product_count"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "alliance", "product_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance", "product_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "alliance", "product_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance", "product_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Product_Family_Translation: {
    fields: {
      alliance_product_family: {
        type: "other",
        other: "Alliance_Product_Family",
      },
      language: { type: "other", other: "Language" },
      name: { type: "str" },
    },
    uniqueness: [["alliance_product_family", "language"]],
    permissions: {
      ownership: [["alliance_product_family", new Bool(true)]],
      borrow: {},
      private: {
        alliance_product_family: {
          read: [],
          write: [
            [["language"], new Bool(true)],
            [["name"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance_product_family"], new Bool(true)],
        [["language"], new Bool(true)],
        [["name"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_alliance_product_family: {
        dependencies: [["alliance_product_family"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "alliance_product_family", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_product_family",
                    "translation_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "alliance_product_family", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_product_family",
                    "translation_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      language_is_not_english: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["language", "code"])),
                new Text("en"),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Product_Family_Property: {
    fields: {
      alliance_product_family: {
        type: "other",
        other: "Alliance_Product_Family",
      },
      name: { type: "str" },
      value_count: { type: "u32", default: new Decimal(0) },
      translation_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [["alliance_product_family", "name"]],
    permissions: {
      ownership: [["alliance_product_family", new Bool(true)]],
      borrow: {},
      private: {
        alliance_product_family: {
          read: [],
          write: [[["name"], new Bool(true)]],
        },
      },
      public: [
        [["alliance_product_family"], new Bool(true)],
        [["name"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_alliance_product_family: {
        dependencies: [["alliance_product_family"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "alliance_product_family", "property_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_product_family",
                    "property_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "alliance_product_family", "property_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_product_family",
                    "property_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Product_Family_Property_Translation: {
    fields: {
      alliance_product_family_property: {
        type: "other",
        other: "Alliance_Product_Family_Property",
      },
      language: { type: "other", other: "Language" },
      name: { type: "str" },
    },
    uniqueness: [["alliance_product_family_property", "language"]],
    permissions: {
      ownership: [["alliance_product_family_property", new Bool(true)]],
      borrow: {},
      private: {
        alliance_product_family_property: {
          read: [],
          write: [
            [["language"], new Bool(true)],
            [["name"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance_product_family_property"], new Bool(true)],
        [["language"], new Bool(true)],
        [["name"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_alliance_product_family_property: {
        dependencies: [["alliance_product_family_property"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: [
              "_prev",
              "alliance_product_family_property",
              "translation_count",
            ],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_product_family_property",
                    "translation_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: [
              "_curr",
              "alliance_product_family_property",
              "translation_count",
            ],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_product_family_property",
                    "translation_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      language_is_not_english: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["language", "code"])),
                new Text("en"),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Product_Family_Property_Value: {
    fields: {
      alliance_product_family_property: {
        type: "other",
        other: "Alliance_Product_Family_Property",
      },
      name: { type: "str" },
      order: { type: "u32", default: new Decimal(1) },
      translation_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [
      ["alliance_product_family_property", "name"],
      ["alliance_product_family_property", "order"],
    ],
    permissions: {
      ownership: [["alliance_product_family_property", new Bool(true)]],
      borrow: {},
      private: {
        alliance_product_family_property: {
          read: [],
          write: [
            [["name"], new Bool(true)],
            [["order"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance_product_family_property"], new Bool(true)],
        [["name"], new Bool(true)],
        [["order"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_alliance_product_family_property: {
        dependencies: [["alliance_product_family_property"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "alliance_product_family_property", "value_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_product_family_property",
                    "value_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "alliance_product_family_property", "value_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_product_family_property",
                    "value_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Product_Family_Property_Value_Translation: {
    fields: {
      alliance_product_family_property_value: {
        type: "other",
        other: "Alliance_Product_Family_Property_Value",
      },
      language: { type: "other", other: "Language" },
      name: { type: "str" },
    },
    uniqueness: [["alliance_product_family_property_value", "language"]],
    permissions: {
      ownership: [["alliance_product_family_property_value", new Bool(true)]],
      borrow: {},
      private: {
        alliance_product_family_property_value: {
          read: [],
          write: [
            [["language"], new Bool(true)],
            [["name"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance_product_family_property_value"], new Bool(true)],
        [["language"], new Bool(true)],
        [["name"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_alliance_product_family_property_value: {
        dependencies: [["alliance_product_family_property_value"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: [
              "_prev",
              "alliance_product_family_property_value",
              "translation_count",
            ],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_product_family_property_value",
                    "translation_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: [
              "_curr",
              "alliance_product_family_property_value",
              "translation_count",
            ],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_product_family_property_value",
                    "translation_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      language_is_not_english: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["language", "code"])),
                new Text("en"),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Product: {
    fields: {
      alliance_product_family: {
        type: "other",
        other: "Alliance_Product_Family",
      },
      name: { type: "str" },
      description: { type: "clob" },
      variant_count: { type: "u32", default: new Decimal(0) },
      tag_count: { type: "u32", default: new Decimal(0) },
      translation_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [["alliance_product_family", "name"]],
    permissions: {
      ownership: [["alliance_product_family", new Bool(true)]],
      borrow: {},
      private: {
        alliance_product_family: {
          read: [],
          write: [
            [["name"], new Bool(true)],
            [["description"], new Bool(true)],
            [["variant_count"], new Bool(true)],
            [["tag_count"], new Bool(true)],
            [["translation_count"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance_product_family"], new Bool(true)],
        [["name"], new Bool(true)],
        [["description"], new Bool(true)],
        [["variant_count"], new Bool(true)],
        [["tag_count"], new Bool(true)],
        [["translation_count"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_alliance_product_family: {
        dependencies: [["alliance_product_family"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "alliance_product_family", "product_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance_product_family", "product_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "alliance_product_family", "product_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance_product_family", "product_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      tag_count_is_less_than_system_tag_count: [
        new NumberComparatorExpression(
          new LessThanEquals<ToNum>([
            new DotExpression(new Dot(["tag_count"])),
            new DotExpression(new Dot(["_system", "tag_count"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Product_Translation: {
    fields: {
      alliance_product: {
        type: "other",
        other: "Alliance_Product",
      },
      language: { type: "other", other: "Language" },
      name: { type: "str" },
      description: { type: "clob" },
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
    effects: {
      update_count_in_alliance_product: {
        dependencies: [["alliance_product"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "alliance_product", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance_product", "translation_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "alliance_product", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance_product", "translation_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      language_is_not_english: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["language", "code"])),
                new Text("en"),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Product_Tag: {
    fields: {
      alliance_product: {
        type: "other",
        other: "Alliance_Product",
      },
      tag: { type: "other", other: "Tag" },
    },
    uniqueness: [["alliance_product", "tag"]],
    permissions: {
      ownership: [],
      borrow: {},
      private: {
        alliance_product: {
          read: [],
          write: [[["tag"], new Bool(true)]],
        },
      },
      public: [
        [["alliance_product"], new Bool(true)],
        [["tag"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_alliance_product: {
        dependencies: [["alliance_product"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            // Run on creation/updation as per rules of effects
            path: ["_curr", "alliance_product", "tag_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_curr", "alliance_product", "tag_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: ["_prev", "alliance_product", "tag_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance_product", "tag_count"])
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
  Alliance_Product_Family_Variant: {
    fields: {
      alliance_product: {
        type: "other",
        other: "Alliance_Product",
      },
      name: { type: "str" },
      min_quantity: { type: "u32", default: new Decimal(1) },
      max_quantity: { type: "u32" },
      min_price: { type: "udecimal" },
      max_price: { type: "udecimal" },
      variant_property_count: { type: "u32", default: new Decimal(0) },
      provider_count: { type: "u32", default: new Decimal(0) },
      provider_price_sum: { type: "u32", default: new Decimal(0) },
      provider_average_price: { type: "udecimal", default: new Decimal(0) },
      translation_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [["alliance_product", "name"]],
    permissions: {
      ownership: [["alliance_product", new Bool(true)]],
      borrow: {},
      private: {
        alliance_product: {
          read: [],
          write: [
            [["name"], new Bool(true)],
            [["min_quantity"], new Bool(true)],
            [["max_quantity"], new Bool(true)],
            [["min_price"], new Bool(true)],
            [["max_price"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance_product"], new Bool(true)],
        [["name"], new Bool(true)],
        [["min_quantity"], new Bool(true)],
        [["max_quantity"], new Bool(true)],
        [["min_price"], new Bool(true)],
        [["max_price"], new Bool(true)],
        [["variant_property_count"], new Bool(true)],
        [["provider_count"], new Bool(true)],
        [["provider_price_sum"], new Bool(true)],
        [["provider_average_price"], new Bool(true)],
        [["translation_count"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_alliance_product: {
        dependencies: [["alliance_product"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "alliance_product", "variant_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance_product", "variant_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "alliance_product", "variant_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance_product", "variant_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
      compute_provider_average_price: {
        dependencies: [["provider_count"], ["provider_price_sum"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            // Run on creation/updation as per rules of effects
            path: ["_curr", "provider_average_price"],
            expr: new NumberArithmeticExpression(
              new Divide<ToDeci>([
                new DotExpression(new Dot(["_curr", "provider_price_sum"])),
                [new DotExpression(new Dot(["_curr", "provider_count"]))],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      min_quantity_is_less_than_max_quantity: [
        new NumberComparatorExpression(
          new GreaterThanEquals<ToNum>([
            new DotExpression(new Dot(["min_quantity"])),
            new DotExpression(new Dot(["max_quantity"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      min_price_is_less_than_max_price: [
        new NumberComparatorExpression(
          new GreaterThanEquals<ToNum>([
            new DotExpression(new Dot(["min_price"])),
            new DotExpression(new Dot(["max_price"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Product_Family_Variant_Translation: {
    fields: {
      alliance_product_family_variant: {
        type: "other",
        other: "Alliance_Product_Family_Variant",
      },
      language: { type: "other", other: "Language" },
      name: { type: "str" },
    },
    uniqueness: [["alliance_product_family_variant", "language"]],
    permissions: {
      ownership: [["alliance_product_family_variant", new Bool(true)]],
      borrow: {},
      private: {
        alliance_product_family_variant: {
          read: [],
          write: [
            [["language"], new Bool(true)],
            [["name"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance_product_family_variant"], new Bool(true)],
        [["language"], new Bool(true)],
        [["name"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_alliance_product_family_variant: {
        dependencies: [["alliance_product_family_variant"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: [
              "_prev",
              "alliance_product_family_variant",
              "translation_count",
            ],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_product_family_variant",
                    "translation_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: [
              "_curr",
              "alliance_product_family_variant",
              "translation_count",
            ],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_product_family_variant",
                    "translation_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      language_is_not_english: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["language", "code"])),
                new Text("en"),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Product_Family_Variant_Property_Value: {
    fields: {
      alliance_product_family_variant: {
        type: "other",
        other: "Alliance_Product_Family_Variant",
      },
      order: { type: "u32", default: new Decimal(1) },
      alliance_product_family_property: {
        type: "other",
        other: "Alliance_Product_Family_Property",
      },
      alliance_product_family_property_value: {
        type: "other",
        other: "Alliance_Product_Family_Property_Value",
      },
    },
    uniqueness: [
      ["alliance_product_family_variant", "order"],
      ["alliance_product_family_variant", "alliance_product_family_property"],
    ],
    permissions: {
      ownership: [["alliance_product_family_variant", new Bool(true)]],
      borrow: {},
      private: {
        alliance_product_family_variant: {
          read: [],
          write: [
            [["order"], new Bool(true)],
            [["alliance_product_family_property"], new Bool(true)],
            [["alliance_product_family_property_value"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance_product_family_variant"], new Bool(true)],
        [["order"], new Bool(true)],
        [["alliance_product_family_property"], new Bool(true)],
        [["alliance_product_family_property_value"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_alliance_product_family_variant: {
        dependencies: [["alliance_product_family_variant"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: [
              "_prev",
              "alliance_product_family_variant",
              "variant_property_count",
            ],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_product_family_variant",
                    "variant_property_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: [
              "_curr",
              "alliance_product_family_variant",
              "variant_property_count",
            ],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_product_family_variant",
                    "variant_property_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      alliance_product_family_is_the_same: [
        new NumberComparatorExpression(
          new Equals<ToNum>([
            new DotExpression(
              new Dot([
                "alliance_product_family_property",
                "alliance_product_family",
              ])
            ),
            new DotExpression(
              new Dot([
                "alliance_product_family_variant",
                "alliance_product_family",
              ])
            ),
            [],
          ])
        ),
        [errors.ErrUnexpected] as ErrMsg,
      ],
      alliance_product_family_property_is_the_same: [
        new NumberComparatorExpression(
          new Equals<ToNum>([
            new DotExpression(
              new Dot([
                "alliance_product_family_property_value",
                "alliance_product_family_property",
              ])
            ),
            new DotExpression(new Dot(["alliance_product_family_property"])),
            [],
          ])
        ),
        [errors.ErrUnexpected] as ErrMsg,
      ],
    },
  },
  User_Product_Family: {
    fields: {
      user: { type: "other", other: "User" },
      name: { type: "str" },
      order: { type: "u32", default: new Decimal(1) },
      property_count: { type: "u32", default: new Decimal(0) },
      product_count: { type: "u32", default: new Decimal(0) },
      translation_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [
      ["alliance", "name"],
      ["alliance", "order"],
    ],
    permissions: {
      ownership: [["user", new Bool(true)]],
      borrow: {},
      private: {
        user: {
          read: [],
          write: [
            [["order"], new Bool(true)],
            [["name"], new Bool(true)],
            [["product_category"], new Bool(true)],
            [["property_count"], new Bool(true)],
            [["product_count"], new Bool(true)],
            [["translation_count"], new Bool(true)],
          ],
        },
      },
      public: [
        [["user"], new Bool(true)],
        [["order"], new Bool(true)],
        [["name"], new Bool(true)],
        [["product_category"], new Bool(true)],
        [["property_count"], new Bool(true)],
        [["product_count"], new Bool(true)],
        [["translation_count"], new Bool(true)],
      ],
    },
    effects: {
      update_product_family_count_in_user: {
        dependencies: [["user"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "user", "product_family_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "user", "product_family_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "user", "product_family_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "user", "product_family_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
      update_product_count_in_user: {
        dependencies: [["product_count"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "user", "product_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(new Dot(["_prev", "user", "product_count"])),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "user", "product_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(new Dot(["_prev", "user", "product_count"])),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  User_Product_Family_Property: {
    fields: {
      user_product_family: {
        type: "other",
        other: "User_Product_Family",
      },
      name: { type: "str" },
      value_count: { type: "u32", default: new Decimal(0) },
      translation_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [["user_product_family", "name"]],
    permissions: {
      ownership: [["user_product_family", new Bool(true)]],
      borrow: {},
      private: {
        user_product_family: {
          read: [],
          write: [[["name"], new Bool(true)]],
        },
      },
      public: [
        [["user_product_family"], new Bool(true)],
        [["name"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_user_product_family: {
        dependencies: [["user_product_family"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "user_product_family", "property_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "user_product_family", "property_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "user_product_family", "property_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "user_product_family", "property_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  User_Product_Family_Property_Value: {
    fields: {
      user_product_family_property: {
        type: "other",
        other: "User_Product_Family_Property",
      },
      name: { type: "str" },
      order: { type: "u32", default: new Decimal(1) },
      translation_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [
      ["user_product_family_property", "name"],
      ["user_product_family_property", "order"],
    ],
    permissions: {
      ownership: [["user_product_family_property", new Bool(true)]],
      borrow: {},
      private: {
        user_product_family_property: {
          read: [],
          write: [
            [["name"], new Bool(true)],
            [["order"], new Bool(true)],
          ],
        },
      },
      public: [
        [["user_product_family_property"], new Bool(true)],
        [["name"], new Bool(true)],
        [["order"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_user_product_family_property: {
        dependencies: [["user_product_family_property"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "user_product_family_property", "value_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "user_product_family_property",
                    "value_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "user_product_family_property", "value_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "user_product_family_property",
                    "value_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  User_Product: {
    fields: {
      user_product_family: {
        type: "other",
        other: "User_Product_Family",
      },
      name: { type: "str" },
      description: { type: "clob" },
      variant_count: { type: "u32", default: new Decimal(0) },
      tag_count: { type: "u32", default: new Decimal(0) },
      translation_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [["user_product_family", "name"]],
    permissions: {
      ownership: [["user_product_family", new Bool(true)]],
      borrow: {},
      private: {
        user_product_family: {
          read: [],
          write: [
            [["name"], new Bool(true)],
            [["description"], new Bool(true)],
            [["variant_count"], new Bool(true)],
            [["tag_count"], new Bool(true)],
            [["translation_count"], new Bool(true)],
          ],
        },
      },
      public: [
        [["user_product_family"], new Bool(true)],
        [["name"], new Bool(true)],
        [["description"], new Bool(true)],
        [["variant_count"], new Bool(true)],
        [["tag_count"], new Bool(true)],
        [["translation_count"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_user_product_family: {
        dependencies: [["user_product_family"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "user_product_family", "product_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "user_product_family", "product_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "user_product_family", "product_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "user_product_family", "product_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      tag_count_is_less_than_system_tag_count: [
        new NumberComparatorExpression(
          new LessThanEquals<ToNum>([
            new DotExpression(new Dot(["tag_count"])),
            new DotExpression(new Dot(["_system", "tag_count"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  User_Product_Translation: {
    fields: {
      user_product: {
        type: "other",
        other: "User_Product",
      },
      language: { type: "other", other: "Language" },
      name: { type: "str" },
      description: { type: "clob" },
    },
    uniqueness: [["user_product", "language"]],
    permissions: {
      ownership: [["user_product", new Bool(true)]],
      borrow: {},
      private: {
        user_product: {
          read: [],
          write: [
            [["language"], new Bool(true)],
            [["name"], new Bool(true)],
            [["description"], new Bool(true)],
          ],
        },
      },
      public: [
        [["user_product"], new Bool(true)],
        [["language"], new Bool(true)],
        [["name"], new Bool(true)],
        [["description"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_user_product: {
        dependencies: [["user_product"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "user_product", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "user_product", "translation_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "user_product", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "user_product", "translation_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      language_is_not_english: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["language", "code"])),
                new Text("en"),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  User_Product_Family_Variant: {
    fields: {
      user_product: {
        type: "other",
        other: "User_Product",
      },
      name: { type: "str" },
      quantity: { type: "u32", default: new Decimal(0) },
      price: { type: "udecimal" },
      variant_property_count: { type: "u32", default: new Decimal(0) },
      alliance_variant_count: { type: "u32", default: new Decimal(0) },
      translation_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [
      ["user_product", "name"],
      ["user_product", "order"],
    ],
    permissions: {
      ownership: [["user_product", new Bool(true)]],
      borrow: {},
      private: {
        user_product: {
          read: [],
          write: [
            [["order"], new Bool(true)],
            [["name"], new Bool(true)],
            [["quantity"], new Bool(true)],
            [["price"], new Bool(true)],
          ],
        },
      },
      public: [
        [["user_product"], new Bool(true)],
        [["order"], new Bool(true)],
        [["name"], new Bool(true)],
        [["quantity"], new Bool(true)],
        [["price"], new Bool(true)],
        [["variant_property_count"], new Bool(true)],
        [["translation_count"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_user_product: {
        dependencies: [["user_product"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "user_product", "variant_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "user_product", "variant_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "user_product", "variant_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "user_product", "variant_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  User_Product_Family_Variant_Property_Value: {
    fields: {
      user_product_family_variant: {
        type: "other",
        other: "User_Product_Family_Variant",
      },
      order: { type: "u32", default: new Decimal(1) },
      user_product_family_property: {
        type: "other",
        other: "User_Product_Family_Property",
      },
      user_product_family_property_value: {
        type: "other",
        other: "User_Product_Family_Property_Value",
      },
    },
    uniqueness: [
      ["user_product_family_variant", "order"],
      ["user_product_family_variant", "user_product_family_property"],
    ],
    permissions: {
      ownership: [["user_product_family_variant", new Bool(true)]],
      borrow: {},
      private: {
        user_product_family_variant: {
          read: [],
          write: [
            [["order"], new Bool(true)],
            [["user_product_family_property"], new Bool(true)],
            [["user_product_family_property_value"], new Bool(true)],
          ],
        },
      },
      public: [
        [["user_product_family_variant"], new Bool(true)],
        [["order"], new Bool(true)],
        [["user_product_family_property"], new Bool(true)],
        [["user_product_family_property_value"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_user_product_family_variant: {
        dependencies: [["user_product_family_variant"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: [
              "_prev",
              "user_product_family_variant",
              "variant_property_count",
            ],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "user_product_family_variant",
                    "variant_property_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: [
              "_curr",
              "user_product_family_variant",
              "variant_property_count",
            ],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "user_product_family_variant",
                    "variant_property_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      user_product_family_is_the_same: [
        new NumberComparatorExpression(
          new Equals<ToNum>([
            new DotExpression(
              new Dot(["user_product_family_property", "user_product_family"])
            ),
            new DotExpression(
              new Dot(["user_product_family_variant", "user_product_family"])
            ),
            [],
          ])
        ),
        [errors.ErrUnexpected] as ErrMsg,
      ],
      user_product_family_property_is_the_same: [
        new NumberComparatorExpression(
          new Equals<ToNum>([
            new DotExpression(
              new Dot([
                "user_product_family_property_value",
                "user_product_family_property",
              ])
            ),
            new DotExpression(new Dot(["user_product_family_property"])),
            [],
          ])
        ),
        [errors.ErrUnexpected] as ErrMsg,
      ],
    },
  },
  Listed_Alliance_Product_Family_Variant_Request: {
    // This struct represents a request sent to user to allow/deny linking
    // This will be consumed by a function and transformed into a Listed_Alliance_Product
    // fx(a: Listed_Alliance_Product_Family_Variant_Request) -> Create(Listed_Alliance_Product_Family_Variant), Delete(Listed_Alliance_Product_Family_Variant_Request)
    fields: {
      alliance_product_family_variant: {
        type: "other",
        other: "Alliance_Product_Family_Variant",
      },
      alliance_member: { type: "other", other: "Alliance_Member" },
      user_product_family_variant: {
        type: "other",
        other: "User_Product_Family_Variant",
      },
    },
    uniqueness: [
      ["alliance_product_family_variant", "user_product_family_variant"],
      ["alliance_member", "user_product_family_variant"],
    ],
    permissions: {
      ownership: [
        ["alliance_product_family_variant", new Bool(true)],
        ["user_product_family_variant", new Bool(true)],
      ],
      borrow: {},
      private: {
        alliance_product_family_variant: {
          read: [
            [["alliance_member"], new Bool(true)],
            [["user_product_family_variant"], new Bool(true)],
          ],
          write: [],
        },
        user_product_family_variant: {
          read: [
            [["alliance_product_family_variant"], new Bool(true)],
            [["alliance_member"], new Bool(true)],
          ],
          write: [],
        },
      },
      public: [],
    },
    effects: {},
    checks: {
      alliance_is_the_same: [
        new NumberComparatorExpression(
          new Equals<ToNum>([
            new DotExpression(
              new Dot([
                "alliance_product_family_variant",
                "alliance_product",
                "alliance_product_family",
                "alliance",
              ])
            ),
            new DotExpression(new Dot(["alliance_member", "alliance"])),
            [],
          ])
        ),
        [errors.ErrUnexpected] as ErrMsg,
      ],
      user_is_the_same: [
        new NumberComparatorExpression(
          new Equals<ToNum>([
            new DotExpression(new Dot(["alliance_member", "member"])),
            new DotExpression(
              new Dot([
                "user_product_family_variant",
                "user_product",
                "user_product_family",
                "user",
              ])
            ),
            [],
          ])
        ),
        [errors.ErrUnexpected] as ErrMsg,
      ],
      quantity_is_within_bounds: [
        new LogicalBinaryExpression(
          new And([
            new NumberComparatorExpression(
              new GreaterThanEquals([
                new DotExpression(
                  new Dot(["alliance_product_family_variant", "min_quantity"])
                ),
                new DotExpression(
                  new Dot(["user_product_family_variant", "quantity"])
                ),
                [],
              ])
            ),
            new NumberComparatorExpression(
              new LessThanEquals([
                new DotExpression(
                  new Dot(["user_product_family_variant", "quantity"])
                ),
                new DotExpression(
                  new Dot(["alliance_product_family_variant", "max_quantity"])
                ),
                [],
              ])
            ),
            [],
          ])
        ),
        [errors.ErrUnexpected] as ErrMsg,
      ],
      price_is_within_bounds: [
        new LogicalBinaryExpression(
          new And([
            new NumberComparatorExpression(
              new GreaterThanEquals([
                new DotExpression(
                  new Dot(["alliance_product_family_variant", "min_price"])
                ),
                new DotExpression(
                  new Dot(["user_product_family_variant", "price"])
                ),
                [],
              ])
            ),
            new NumberComparatorExpression(
              new LessThanEquals([
                new DotExpression(
                  new Dot(["user_product_family_variant", "price"])
                ),
                new DotExpression(
                  new Dot(["alliance_product_family_variant", "max_price"])
                ),
                [],
              ])
            ),
            [],
          ])
        ),
        [errors.ErrUnexpected] as ErrMsg,
      ],
    },
  },
  Listed_Alliance_Product_Family_Variant: {
    // This will be created after Listed_Alliance_Product_Family_Variant_Request is consumed by a function
    fields: {
      alliance_product_family_variant: {
        type: "other",
        other: "Alliance_Product_Family_Variant",
      },
      alliance_member: { type: "other", other: "Alliance_Member" },
      user_product_family_variant: {
        type: "other",
        other: "User_Product_Family_Variant",
      },
    },
    uniqueness: [
      ["alliance_product_family_variant", "user_product_family_variant"],
      ["alliance_member", "user_product_family_variant"],
    ],
    permissions: {
      ownership: [
        ["alliance_product_family_variant", new Bool(true)],
        ["alliance_member", new Bool(true)],
        ["user_product_family_variant", new Bool(true)],
      ],
      borrow: {},
      private: {
        alliance_product_family_variant: {
          read: [[["alliance_member"], new Bool(true)]],
          write: [],
        },
        user_product_family_variant: {
          read: [[["alliance_member"], new Bool(true)]],
          write: [],
        },
      },
      public: [
        [["alliance_product_family_variant"], new Bool(true)],
        [["user_product_family_variant"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_alliance_product_family_variant: {
        dependencies: [["alliance_product_family_variant"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            // Run on creation/updation as per rules of effects
            path: [
              "_curr",
              "alliance_product_family_variant",
              "provider_count",
            ],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "_curr",
                    "alliance_product_family_variant",
                    "provider_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: [
              "_prev",
              "alliance_product_family_variant",
              "provider_count",
            ],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_product_family_variant",
                    "provider_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
      update_count_in_alliance_member: {
        dependencies: [["alliance_member"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            // Run on creation/updation as per rules of effects
            path: ["_curr", "alliance_member", "variant_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_curr", "alliance_member", "variant_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: ["_prev", "alliance_member", "variant_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance_member", "variant_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
      update_count_in_user_product_family_variant: {
        dependencies: [["user_product_family_variant"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            // Run on creation/updation as per rules of effects
            path: [
              "_curr",
              "user_product_family_variant",
              "alliance_variant_count",
            ],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "_curr",
                    "user_product_family_variant",
                    "alliance_variant_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: [
              "_prev",
              "user_product_family_variant",
              "alliance_variant_count",
            ],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "user_product_family_variant",
                    "alliance_variant_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      alliance_is_the_same: [
        new NumberComparatorExpression(
          new Equals<ToNum>([
            new DotExpression(new Dot(["alliance_product", "alliance"])),
            new DotExpression(new Dot(["alliance_member", "alliance"])),
            [],
          ])
        ),
        [errors.ErrUnexpected] as ErrMsg,
      ],
      user_is_the_same: [
        new NumberComparatorExpression(
          new Equals<ToNum>([
            new DotExpression(new Dot(["alliance_member", "member"])),
            new DotExpression(new Dot(["user_product", "user"])),
            [],
          ])
        ),
        [errors.ErrUnexpected] as ErrMsg,
      ],
      price_is_within_bounds: [
        new LogicalBinaryExpression(
          new And([
            new NumberComparatorExpression(
              new GreaterThanEquals([
                new DotExpression(new Dot(["alliance_product", "min_price"])),
                new DotExpression(new Dot(["user_product", "price"])),
                [],
              ])
            ),
            new NumberComparatorExpression(
              new LessThanEquals([
                new DotExpression(new Dot(["user_product", "price"])),
                new DotExpression(new Dot(["alliance_product", "max_price"])),
                [],
              ])
            ),
            [],
          ])
        ),
        [errors.ErrUnexpected] as ErrMsg,
      ],
    },
  },
  Alliance_Virtual_Product: {
    fields: {
      alliance: { type: "other", other: "Alliance" },
      alliance_product: { type: "other", other: "Alliance_Product" },
      markup: { type: "udecimal" }, // percentage increase above base price
    },
    uniqueness: [["alliance", "alliance_product"]],
    permissions: {
      ownership: [["alliance", new Bool(true)]],
      borrow: {},
      private: {
        alliance: {
          read: [],
          write: [
            [["alliance_product"], new Bool(true)],
            [["markup"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance"], new Bool(true)],
        [["alliance_product"], new Bool(true)],
        [["markup"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_alliance: {
        dependencies: [["alliance"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            // Run on creation/updation as per rules of effects
            path: ["_curr", "alliance", "virtual_product_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_curr", "alliance", "virtual_product_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: ["_prev", "alliance", "virtual_product_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance", "virtual_product_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      alliance_is_not_same: [
        new LogicalUnaryExpression(
          new Not(
            new NumberComparatorExpression(
              new Equals<ToNum>([
                new DotExpression(
                  new Dot([
                    "alliance_product",
                    "alliance_product_family",
                    "alliance",
                  ])
                ),
                new DotExpression(new Dot(["alliance"])),
                [],
              ])
            )
          )
        ),
        [errors.ErrUnexpected] as ErrMsg,
      ],
    },
  },
  Alliance_Service: {
    fields: {
      alliance: { type: "other", other: "Alliance" },
      name: { type: "str" },
      description: { type: "clob" },
      min_price: { type: "udecimal" },
      max_price: { type: "udecimal" },
      provider_count: { type: "u32", default: new Decimal(0) },
      translation_count: { type: "u32", default: new Decimal(0) },
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
        [["provider_count"], new Bool(true)],
        [["provider_price_sum"], new Bool(true)],
        [["provider_average_price"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_alliance: {
        dependencies: [["alliance"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            // Run on creation/updation as per rules of effects
            path: ["_curr", "alliance", "service_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_curr", "alliance", "service_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: ["_prev", "alliance", "service_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance", "service_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      min_price_is_less_than_max_price: [
        new NumberComparatorExpression(
          new GreaterThanEquals<ToNum>([
            new DotExpression(new Dot(["min_price"])),
            new DotExpression(new Dot(["max_price"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Service_Translation: {
    fields: {
      alliance_service: { type: "other", other: "Alliance_Service" },
      language: { type: "other", other: "Language" },
      name: { type: "str" },
      description: { type: "clob" },
    },
    uniqueness: [["alliance_service", "language"]],
    permissions: {
      ownership: [["alliance_service", new Bool(true)]],
      borrow: {},
      private: {
        alliance_service: {
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
    effects: {
      update_count_in_alliance_service: {
        dependencies: [["alliance_service"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "alliance_service", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance_service", "translation_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "alliance_service", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance_service", "translation_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      language_is_not_english: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["language", "code"])),
                new Text("en"),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Service_Task: {
    fields: {
      alliance_service: { type: "other", other: "Alliance_Service" },
      name: { type: "str" },
      description: { type: "clob" },
      price: { type: "udecimal" },
      translation_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [["alliance_service", "name"]],
    permissions: {
      ownership: [["alliance_service", new Bool(true)]],
      borrow: {},
      private: {
        alliance_service: {
          read: [],
          write: [
            [["name"], new Bool(true)],
            [["price"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance_service"], new Bool(true)],
        [["name"], new Bool(true)],
        [["language"], new Bool(true)],
        [["description"], new Bool(true)],
        [["price"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Service_Task_Translation: {
    fields: {
      alliance_service_task: { type: "other", other: "Alliance_Service_Task" },
      language: { type: "other", other: "Language" },
      name: { type: "str" },
      description: { type: "clob" },
    },
    uniqueness: [["alliance_service_task", "language"]],
    permissions: {
      ownership: [["alliance_service_task", new Bool(true)]],
      borrow: {},
      private: {
        alliance_service_task: {
          read: [],
          write: [
            [["language"], new Bool(true)],
            [["name"], new Bool(true)],
            [["description"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance_service_task"], new Bool(true)],
        [["language"], new Bool(true)],
        [["name"], new Bool(true)],
        [["description"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_alliance_service_task: {
        dependencies: [["alliance_service_task"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "alliance_service_task", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_service_task",
                    "translation_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "alliance_service_task", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_service_task",
                    "translation_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      language_is_not_english: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["language", "code"])),
                new Text("en"),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Service_Milestone: {
    fields: {
      alliance_service: { type: "other", other: "Alliance_Service" },
      name: { type: "str" },
      description: { type: "clob" },
      order: { type: "u32" },
      translation_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [
      ["alliance_service", "name"],
      ["alliance_service", "order"],
    ],
    permissions: {
      ownership: [["alliance_service", new Bool(true)]],
      borrow: {},
      private: {
        user: {
          read: [],
          write: [[["name"], new Bool(true)]],
        },
      },
      public: [
        [["alliance_service"], new Bool(true)],
        [["name"], new Bool(true)],
        [["description"], new Bool(true)],
        [["order"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Service_Milestone_Translation: {
    fields: {
      alliance_service_milsestone: {
        type: "other",
        other: "Alliance_Service_Milestone",
      },
      language: { type: "other", other: "Language" },
      name: { type: "str" },
      description: { type: "clob" },
    },
    uniqueness: [["alliance_service_milsestone", "language"]],
    permissions: {
      ownership: [["alliance_service_milsestone", new Bool(true)]],
      borrow: {},
      private: {
        alliance_service_milsestone: {
          read: [],
          write: [
            [["language"], new Bool(true)],
            [["name"], new Bool(true)],
            [["description"], new Bool(true)],
          ],
        },
      },
      public: [
        [["alliance_service_milsestone"], new Bool(true)],
        [["language"], new Bool(true)],
        [["name"], new Bool(true)],
        [["description"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_alliance_service_milsestone: {
        dependencies: [["alliance_service_milsestone"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            path: ["_prev", "alliance_service_milsestone", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_service_milsestone",
                    "translation_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            path: ["_curr", "alliance_service_milsestone", "translation_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot([
                    "_prev",
                    "alliance_service_milsestone",
                    "translation_count",
                  ])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      language_is_not_english: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["language", "code"])),
                new Text("en"),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Service_Milestone_Task: {
    fields: {
      alliance_service_milestone: {
        type: "other",
        other: "Alliance_Service_Milestone",
      },
      alliance_service_task: { type: "other", other: "Alliance_Service_Task" },
    },
    uniqueness: [["alliance_service_milestone", "alliance_service_task"]],
    permissions: {
      ownership: [
        ["alliance_service_milestone", new Bool(true)],
        ["alliance_service_task", new Bool(true)],
      ],
      borrow: {},
      private: {
        alliance_service_milestone: {
          read: [],
          write: [],
        },
        alliance_service_task: {
          read: [],
          write: [],
        },
      },
      public: [
        [["alliance_service_milestone"], new Bool(true)],
        [["alliance_service_task"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {},
  },
  Alliance_Service_Provider: {
    fields: {
      alliance_service: { type: "other", other: "Alliance_Service" },
      alliance_member: { type: "other", other: "Alliance_Member" },
    },
    uniqueness: [["alliance_service", "alliance_member"]],
    permissions: {
      ownership: [
        ["alliance_service", new Bool(true)],
        ["alliance_member", new Bool(true)],
      ],
      borrow: {},
      private: {
        alliance_service: {
          read: [],
          write: [],
        },
      },
      public: [
        [["alliance_service"], new Bool(true)],
        [["alliance_member"], new Bool(true)],
      ],
    },
    effects: {
      update_count_in_service: {
        dependencies: [["alliance_service"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            // Run on creation/updation as per rules of effects
            path: ["_curr", "alliance_service", "provider_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_curr", "alliance_service", "provider_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: ["_prev", "alliance_service", "provider_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance_service", "provider_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
      update_count_in_member: {
        dependencies: [["alliance_member"]],
        mutate: [
          // prev keys referred by '_prev', current by '_curr'
          {
            // Run on creation/updation as per rules of effects
            path: ["_curr", "alliance_member", "service_count"],
            expr: new NumberArithmeticExpression(
              new Add<ToNum>([
                new DotExpression(
                  new Dot(["_curr", "alliance_member", "service_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
          {
            // Run on updation/deletion as per rules of effects
            path: ["_prev", "alliance_member", "service_count"],
            expr: new NumberArithmeticExpression(
              new Subtract<ToNum>([
                new DotExpression(
                  new Dot(["_prev", "alliance_member", "service_count"])
                ),
                [new Num(1)],
              ])
            ),
          },
        ],
      },
    },
    checks: {
      name_cannot_be_empty: [
        new LogicalUnaryExpression(
          new Not(
            new TextComparatorExpression(
              new Equals<ToText>([
                new DotExpression(new Dot(["name"])),
                new Text(""),
                [],
              ])
            )
          )
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Alliance_Coupon: {
    fields: {
      alliance: { type: "other", other: "Alliance" },
      name: { type: "str" },
      unused: { type: "u32", default: new Decimal(0) },
      used: { type: "u32", default: new Decimal(0) },
      min_order_amount: { type: "udecimal", default: new Decimal(0) },
      flat_discount: { type: "bool", default: true },
      discount: { type: "udecimal", default: new Decimal(0) },
      max_absolute_discount: { type: "udecimal", default: new Decimal(0) },
      valid_from: { type: "timestamp" },
      valid_to: { type: "timestamp" },
      min_clan_loyalty: { type: "udecimal", default: new Decimal(0) },
      max_clan_loyalty: { type: "udecimal", default: new Decimal(-1) },
      show_coupon: { type: "bool", default: false },
      used_coupon_count: { type: "udecimal", default: new Decimal(0) },
      used_coupon_price_sum: { type: "udecimal", default: new Decimal(0) },
    },
    uniqueness: [["alliance", "name"]],
    permissions: {
      ownership: [["alliance", new Bool(true)]],
      borrow: {},
      private: {
        alliance: {
          read: [
            [["name"], new Bool(true)],
            [["unused"], new Bool(true)],
            [["used"], new Bool(true)],
            [["min_order_value"], new Bool(true)],
            [["flat_discount"], new Bool(true)],
            [["discount"], new Bool(true)],
            [["max_absolute_discount"], new Bool(true)],
            [["valid_from"], new Bool(true)],
            [["valid_to"], new Bool(true)],
            [["min_clan_loyalty"], new Bool(true)],
            [["max_clan_loyalty"], new Bool(true)],
            [["show_coupon"], new Bool(true)],
          ],
          write: [],
        },
      },
      public: [
        [["alliance"], new Bool(true)],
        [["name"], new Bool(true)],
        [["unused"], new Bool(true)],
        [["used"], new Bool(true)],
        [["min_order_value"], new Bool(true)],
        [["min_price"], new Bool(true)],
        [["flat_discount"], new Bool(true)],
        [["discount"], new Bool(true)],
        [["max_absolute_discount"], new Bool(true)],
        [["valid_from"], new Bool(true)],
        [["valid_to"], new Bool(true)],
        [["min_clan_loyalty"], new Bool(true)],
        [["max_clan_loyalty"], new Bool(true)],
        [["show_coupon"], new Bool(true)],
      ],
    },
    effects: {},
    checks: {
      valid_from_is_less_than_valid_to: [
        new NumberComparatorExpression(
          new GreaterThanEquals<ToNum>([
            new DotExpression(new Dot(["valid_from"])),
            new DotExpression(new Dot(["valid_to"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
      min_clan_loyalty_is_less_than_max_clan_loyalty: [
        new NumberComparatorExpression(
          new GreaterThanEquals<ToNum>([
            new DotExpression(new Dot(["min_clan_loyalty"])),
            new DotExpression(new Dot(["max_clan_loyalty"])),
            [],
          ])
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  // TODO. Define Alliance_Voucher here, acts like a partial wallet after applying coupon if any
  // Could be used certain number of times as defined, owner tracks what what exactly was bought with voucher
  // The one using voucher needs to provide its code, which may not be randomly generated, unique(alliance, clan, code)
  Alliance_Customer: {
    fields: {
      alliance: { type: "other", other: "Alliance" },
      clan: { type: "other", other: "Clan" },
      order_count: { type: "udecimal" },
      order_amount_sum: { type: "udecimal" },
      order_amount_mean: { type: "udecimal" },
    },
    uniqueness: [["alliance", "clan"]],
    permissions: {
      ownership: [
        ["alliance", new Bool(true)],
        ["clan", new Bool(true)],
      ],
      borrow: {},
      private: {
        alliance: {
          read: [
            [["clan"], new Bool(true)],
            [["order_count"], new Bool(true)],
            [["order_price_sum"], new Bool(true)],
            [["order_price_mean"], new Bool(true)],
          ],
          write: [],
        },
        clan: {
          read: [
            [["alliance"], new Bool(true)],
            [["order_count"], new Bool(true)],
            [["order_price_sum"], new Bool(true)],
            [["order_price_mean"], new Bool(true)],
          ],
          write: [],
        },
      },
      public: [],
    },
    effects: {},
    checks: {},
  },
  // TODO. To Reassess below structs
  Clan_Product_Order_Draft: {
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
      ownership: [["clan", new Bool(true)]],
      borrow: {},
      private: {
        clan: {
          read: [
            [["product_count"], new Bool(true)],
            [["product_price_sum"], new Bool(true)],
          ],
          write: [],
        },
      },
      public: [],
    },
    effects: {},
    checks: {},
  },
  Clan_Product_Order_Draft_Item: {
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
    uniqueness: [["clan_product_order_draft", "listed_alliance_product"]],
    permissions: {
      ownership: [
        ["clan_product_order_draft", new Bool(true)],
        ["listed_alliance_product", new Bool(true)],
      ],
      borrow: {},
      private: {
        clan_product_order_draft: {
          read: [
            [["listed_alliance_product"], new Bool(true)],
            [["price"], new Bool(true)],
          ],
          write: [],
        },
        listed_alliance_product: {
          read: [
            [["clan_product_order_draft"], new Bool(true)],
            [["price"], new Bool(true)],
          ],
          write: [],
        },
      },
      public: [],
    },
    effects: {},
    checks: {},
  },
  Clan_Product_Order: {
    fields: {
      clan: { type: "other", other: "Clan" },
      product_count: { type: "udecimal" },
      product_price_sum: { type: "udecimal" },
    },
    uniqueness: [],
    permissions: {
      ownership: [["clan", new Bool(true)]],
      borrow: {},
      private: {
        clan: {
          read: [
            [["product_count"], new Bool(true)],
            [["product_price_sum"], new Bool(true)],
          ],
          write: [],
        },
      },
      public: [],
    },
    effects: {},
    checks: {},
  },
  Clan_Product_Order_Item: {
    fields: {
      clan_product_order: { type: "other", other: "Clan_Product_Order_Draft" },
      listed_alliance_product: {
        type: "other",
        other: "Listed_Alliance_Product",
      },
      quantity: { type: "u32" },
      price: { type: "udecimal" },
    },
    uniqueness: [["clan_product_order_draft", "listed_alliance_product"]],
    permissions: {
      ownership: [
        ["clan_product_order_draft", new Bool(true)],
        ["listed_alliance_product", new Bool(true)],
      ],
      borrow: {},
      private: {
        clan_product_order: {
          read: [
            [["listed_alliance_product"], new Bool(true)],
            [["quantity"], new Bool(true)],
            [["price"], new Bool(true)],
          ],
          write: [],
        },
        listed_alliance_product: {
          read: [
            [["clan_product_order"], new Bool(true)],
            [["quantity"], new Bool(true)],
            [["price"], new Bool(true)],
          ],
          write: [],
        },
      },
      public: [],
    },
    effects: {},
    checks: {},
  },
  Clan_Service_Order: {
    fields: {
      clan: { type: "other", other: "Clan" },
      listed_alliance_service: {
        type: "other",
        other: "Listed_Alliance_Product",
      },
    },
    uniqueness: [],
    permissions: {
      ownership: [["clan", new Bool(true)]],
      borrow: {},
      private: {
        clan: {
          read: [[["listed_alliance_service"], new Bool(true)]],
          write: [],
        },
      },
      public: [],
    },
    effects: {},
    checks: {},
  },
};

export function get_structs(): HashSet<Struct> {
  let structs: HashSet<Struct> = HashSet.of();
  for (let structName in schema) {
    const structDef = schema[structName];
    const struct: Struct = new Struct(
      structName,
      HashSet.of(),
      structDef.uniqueness,
      structDef.permissions,
      structDef.effects,
      structDef.checks
    );
    for (let fieldName in structDef.fields) {
      struct.fields = struct.fields.add(
        new Field(struct, fieldName, structDef.fields[fieldName])
      );
    }
    structs = structs.add(struct);
  }
  return structs;
}
