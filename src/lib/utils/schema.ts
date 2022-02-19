import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import {
  Add,
  And,
  BooleanLispExpression,
  Deci,
  DecimalArithmeticExpression,
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
  Modulus,
  Multiply,
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
import { Struct, StructPermissions, StructTrigger, WeakEnum } from "./variable";
import { CustomError, Err, Ok, Result } from "./prelude";

// All structs are created via Transformers

// ResourceType {
// 	name: string
// }

// Resource {
// 	type: ResourceType
// 	url: string
//  name: string
//  user: User
// }

const schema: Record<
  string,
  {
    fields: Record<string, WeakEnum>;
    uniqueness: ReadonlyArray<[ReadonlyArray<string>, string]>;
    permissions: StructPermissions;
    triggers: Record<string, StructTrigger>;
    checks: Record<string, [BooleanLispExpression, ErrMsg]>;
  }
> = {
  Test: {
    fields: {
      str: { type: "str" },
      lstr: { type: "lstr" },
      clob: { type: "clob" },
      u32: { type: "u32", default: new Decimal(11) },
      i32: { type: "i32" },
      u64: { type: "u64", default: new Decimal(3) },
      i64: { type: "i64" },
      udouble: { type: "udouble" },
      idouble: { type: "idouble" },
      udecimal: { type: "udecimal", default: new Decimal(5) },
      idecimal: { type: "idecimal", default: new Decimal(7) },
      bool: { type: "bool" },
      date: { type: "date" },
      time: { type: "time" },
      timestamp: { type: "timestamp" },
      user: { type: "other", other: "User" },
    },
    uniqueness: [],
    permissions: {
      borrow: {},
      ownership: {
        user: {
          read: [],
          write: [
            "str",
            "lstr",
            "clob",
            "u32",
            "i32",
            "u64",
            "i64",
            "udouble",
            "idouble",
            "udecimal",
            "idecimal",
            "bool",
            "date",
            "time",
            "timestamp",
            "user",
          ],
        },
      },
      public: [
        "str",
        "lstr",
        "clob",
        "u32",
        "i32",
        "u64",
        "i64",
        "udouble",
        "idouble",
        "udecimal",
        "idecimal",
        "bool",
        "date",
        "time",
        "timestamp",
        "user",
      ],
    },
    triggers: {
      add_something: {
        event: ["after_creation", "after_update"],
        monitor: [
          [[], "u32"],
          [[], "u64"],
        ],
        operation: {
          op: "update",
          path_updates: [
            [
              [[], "i64"],
              new NumberArithmeticExpression(
                new Multiply<ToNum>([
                  new DotExpression(new Dot(["u32"])),
                  [new DotExpression(new Dot(["u64"]))],
                ])
              ),
            ],
          ],
        },
      },
      add_something_2: {
        event: ["after_creation", "after_update"],
        monitor: [
          [[], "u32"],
          [[], "u64"],
        ],
        operation: {
          op: "update",
          path_updates: [
            [
              [[], "udouble"],
              new DecimalArithmeticExpression(
                new Multiply<ToDeci>([
                  new DotExpression(new Dot(["udecimal"])),
                  [new DotExpression(new Dot(["u32"]))],
                ])
              ),
            ],
          ],
        },
      },
    },
    checks: {
      u32_is_even: [
        new NumberComparatorExpression(
          new Equals<ToNum>([
            new NumberArithmeticExpression(
              new Modulus<ToNum>([
                new DotExpression(new Dot(["u32"])),
                [new Num(2)],
              ])
            ),
            new Num(0),
            [],
          ])
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Test2: {
    fields: {
      str: { type: "str" },
      lstr: { type: "lstr" },
      clob: { type: "clob" },
      u32: { type: "u32", default: new Decimal(77) },
      i32: { type: "i32" },
      u64: { type: "u64", default: new Decimal(11) },
      i64: { type: "i64" },
      udouble: { type: "udouble" },
      idouble: { type: "idouble" },
      udecimal: { type: "udecimal" },
      idecimal: { type: "idecimal" },
      bool: { type: "bool" },
      date: { type: "date" },
      time: { type: "time" },
      timestamp: { type: "timestamp" },
      user: { type: "other", other: "User" },
    },
    uniqueness: [],
    permissions: {
      borrow: {},
      ownership: {
        user: {
          read: [],
          write: [
            "str",
            "lstr",
            "clob",
            "u32",
            "i32",
            "u64",
            "i64",
            "udouble",
            "idouble",
            "udecimal",
            "idecimal",
            "bool",
            "date",
            "time",
            "timestamp",
            "user",
          ],
        },
      },
      public: [
        "str",
        "lstr",
        "clob",
        "u32",
        "i32",
        "u64",
        "i64",
        "udouble",
        "idouble",
        "udecimal",
        "idecimal",
        "bool",
        "date",
        "time",
        "timestamp",
        "user",
      ],
    },
    triggers: {
      add_something: {
        event: ["after_creation", "after_update"],
        monitor: [
          [[], "u32"],
          [[], "u64"],
        ],
        operation: {
          op: "update",
          path_updates: [
            [
              [["z"], "i32"],
              new NumberArithmeticExpression(
                new Multiply<ToNum>([
                  new DotExpression(new Dot(["z", "u32"])),
                  [new DotExpression(new Dot(["u64"]))],
                ])
              ),
            ],
          ],
        },
      },
      add_something_2: {
        event: ["after_creation", "after_update"],
        monitor: [
          [[], "u32"],
          [[], "u64"],
        ],
        operation: {
          op: "update",
          path_updates: [
            [
              [[], "i32"],
              new NumberArithmeticExpression(
                new Multiply<ToNum>([
                  new DotExpression(new Dot(["z", "i32"])),
                  [new DotExpression(new Dot(["u32"]))],
                ])
              ),
            ],
          ],
        },
      },
    },
    checks: {
      z_u32_is_even: [
        new NumberComparatorExpression(
          new Equals<ToNum>([
            new NumberArithmeticExpression(
              new Modulus<ToNum>([
                new DotExpression(new Dot(["z", "u32"])),
                [new Num(2)],
              ])
            ),
            new Num(0),
            [],
          ])
        ),
        [errors.ErrEmptyField] as ErrMsg,
      ],
    },
  },
  Product_Category: {
    fields: {
      parent: { type: "other", other: "Product_Category" },
      name: { type: "str" },
      translation_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [],
    permissions: {
      borrow: {},
      ownership: {},
      public: ["parent", "name"],
    },
    triggers: {},
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
    uniqueness: [[["product_category"], "language"]],
    permissions: {
      borrow: {},
      ownership: {},
      public: ["product_category", "language", "name"],
    },
    triggers: {
      increment_count_in_product_category: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "product_category"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["product_category"], "translation_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["product_category", "translation_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_product_category: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "product_category"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["product_category"], "translation_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["product_category", "translation_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
      borrow: {},
      ownership: {},
      public: ["parent", "name"],
    },
    triggers: {},
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
    uniqueness: [[["service_category"], "language"]],
    permissions: {
      borrow: {},
      ownership: {},
      public: ["service_category", "language", "name"],
    },
    triggers: {
      increment_count_in_service_category: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "service_category"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["service_category"], "translation_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["service_category", "translation_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_service_category: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "service_category"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["service_category"], "translation_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["service_category", "translation_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[[], "name"]],
    permissions: {
      borrow: {},
      ownership: {},
      public: ["name"],
    },
    triggers: {},
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
    uniqueness: [[["tag"], "language"]],
    permissions: {
      borrow: {},
      ownership: {},
      public: ["language", "name"],
    },
    triggers: {
      increment_count_in_tag: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "tag"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["tag"], "translation_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(new Dot(["tag", "translation_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_tag: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "tag"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["tag"], "translation_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(new Dot(["tag", "translation_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[[], "name"]],
    permissions: {
      borrow: {},
      ownership: {},
      public: ["name"],
    },
    triggers: {},
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
    uniqueness: [[["country"], "name"]],
    permissions: {
      borrow: {},
      ownership: {},
      public: ["country", "name"],
    },
    triggers: {},
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
    uniqueness: [[["from"], "to"]],
    permissions: {
      borrow: {},
      ownership: {},
      public: ["from", "to", "average_time"],
    },
    triggers: {},
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
    uniqueness: [[[], "code"]],
    permissions: {
      borrow: {},
      ownership: {},
      public: ["code"],
    },
    triggers: {},
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
    uniqueness: [
      [[], "mobile"],
      [[], "nickname"],
    ],
    permissions: {
      borrow: {},
      ownership: {},
      public: [
        "nickname",
        "language",
        "knows_english",
        "country",
        "product_count",
        "product_family_count",
        "mobile",
      ],
    },
    triggers: {},
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
    uniqueness: [[["user"], "name"]],
    permissions: {
      borrow: {},
      ownership: {
        user: {
          read: ["copper", "silver", "gold"],
          write: [],
        },
      },
      public: ["user"],
    },
    triggers: {},
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
    uniqueness: [[[], "name"]],
    permissions: {
      borrow: {},
      ownership: {
        wallet: {
          read: [],
          write: ["name"],
        },
      },
      public: ["name", "member_count"],
    },
    triggers: {
      increment_count_in_wallet: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "wallet"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["wallet"], "alliance_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(new Dot(["wallet", "alliance_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_wallet: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "wallet"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["wallet"], "alliance_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(new Dot(["wallet", "alliance_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[[], "name"]],
    permissions: {
      borrow: {},
      ownership: {
        wallet: {
          read: [],
          write: ["name"],
        },
      },
      public: ["name"],
    },
    triggers: {
      increment_count_in_wallet: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "wallet"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["wallet"], "guild_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(new Dot(["wallet", "guild_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_wallet: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "wallet"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["wallet"], "guild_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(new Dot(["wallet", "guild_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
      borrow: {},
      ownership: {
        wallet: {
          read: [],
          write: ["name"],
        },
      },
      public: ["name"],
    },
    triggers: {
      increment_count_in_wallet: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "wallet"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["wallet"], "clan_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(new Dot(["wallet", "clan_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_wallet: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "wallet"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["wallet"], "clan_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(new Dot(["wallet", "clan_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["alliance"], "user"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance: {
          read: ["user"],
          write: [],
        },
        user: {
          read: ["alliance"],
          write: [],
        },
      },
      public: [],
    },
    triggers: {},
    checks: {},
  },
  Guild_Member_Request: {
    fields: {
      guild: { type: "other", other: "Guild" },
      user: { type: "other", other: "User" },
    },
    uniqueness: [[["guild"], "user"]],
    permissions: {
      borrow: {},
      ownership: {
        guild: {
          read: ["user"],
          write: [],
        },
        user: {
          read: ["guild"],
          write: [],
        },
      },
      public: [],
    },
    triggers: {},
    checks: {},
  },
  Clan_Member_Invite: {
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
  },
  Alliance_Member: {
    fields: {
      alliance: { type: "other", other: "Alliance" },
      member: { type: "other", other: "User" },
      variant_count: { type: "u32", default: new Decimal(0) },
      service_count: { type: "u32", default: new Decimal(0) },
    },
    uniqueness: [[["alliance"], "member"]],
    permissions: {
      borrow: {
        borrow_alliance_wallet_user: {
          prove: ["Alliance_Member", "member"],
          constraints: [
            [
              [[], "alliance"],
              [[], "alliance"],
            ],
          ],
          user_path: [["alliance", "wallet"], "user"],
        },
      },
      ownership: {
        alliance: {
          read: ["member", "variant_count", "service_count"],
          write: [],
        },
        member: {
          read: ["alliance", "variant_count", "service_count"],
          write: [],
        },
      },
      public: [],
    },
    triggers: {
      increment_count_in_alliance: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance"], "member_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(new Dot(["alliance", "member_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance"], "member_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(new Dot(["alliance", "member_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      increment_count_in_member: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "member"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["member"], "alliance_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(new Dot(["member", "alliance_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_member: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "member"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["member"], "alliance_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(new Dot(["member", "alliance_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
    },
    checks: {},
  },
  Guild_Member: {
    fields: {
      guild: { type: "other", other: "Guild" },
      member: { type: "other", other: "User" },
    },
    uniqueness: [[["guild"], "member"]],
    permissions: {
      borrow: {
        borrow_guild_wallet_user: {
          prove: ["Guild_Member", "member"],
          constraints: [
            [
              [[], "guild"],
              [[], "guild"],
            ],
          ],
          user_path: [["guild", "wallet"], "user"],
        },
      },
      ownership: {
        guild: {
          read: ["member"],
          write: [],
        },
        member: {
          read: ["guild"],
          write: [],
        },
      },
      public: [],
    },
    triggers: {
      increment_count_in_guild: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "guild"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["guild"], "member_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(new Dot(["guild", "member_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_guild: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "guild"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["guild"], "member_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(new Dot(["guild", "member_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      increment_count_in_member: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "member"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["member"], "guild_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(new Dot(["member", "guild_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_member: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "member"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["member"], "guild_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(new Dot(["member", "guild_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
    },
    checks: {},
  },
  Clan_Member: {
    fields: {
      clan: { type: "other", other: "Clan" },
      member: { type: "other", other: "User" },
    },
    uniqueness: [[["clan"], "member"]],
    permissions: {
      borrow: {
        borrow_clan_wallet_user: {
          prove: ["Clan_Member", "member"],
          constraints: [
            [
              [[], "clan"],
              [[], "clan"],
            ],
          ],
          user_path: [["clan", "wallet"], "user"],
        },
      },
      ownership: {
        clan: {
          read: ["member"],
          write: [],
        },
        member: {
          read: ["clan"],
          write: [],
        },
      },
      public: [],
    },
    triggers: {
      increment_count_in_clan: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "clan"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["clan"], "member_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(new Dot(["clan", "member_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_clan: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "clan"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["clan"], "member_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(new Dot(["clan", "member_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      increment_count_in_member: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "member"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["member"], "clan_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(new Dot(["member", "clan_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_member: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "member"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["member"], "clan_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(new Dot(["member", "clan_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
      [["alliance"], "name"],
      [["alliance"], "order"],
    ],
    permissions: {
      borrow: {},
      ownership: {
        alliance: {
          read: [],
          write: [
            "order",
            "name",
            "product_category",
            "property_count",
            "product_count",
            "translation_count",
          ],
        },
      },
      public: [
        "alliance",
        "order",
        "name",
        "product_category",
        "property_count",
        "product_count",
        "translation_count",
      ],
    },
    triggers: {
      increment_product_family_count_in_alliance: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance"], "product_family_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["alliance", "product_family_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_product_family_count_in_alliance: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance"], "product_family_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["alliance", "product_family_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      increment_product_count_in_alliance: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "product_count"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance"], "product_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(new Dot(["alliance", "product_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_product_count_in_alliance: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "product_count"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance"], "product_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(new Dot(["alliance", "product_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["alliance_product_family"], "language"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance_product_family: {
          read: [],
          write: ["language", "name"],
        },
      },
      public: ["alliance_product_family", "language", "name"],
    },
    triggers: {
      increment_count_in_alliance_product_family: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_product_family"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family"], "translation_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_product_family", "translation_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_product_family: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_product_family"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family"], "translation_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_product_family", "translation_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["alliance_product_family"], "name"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance_product_family: {
          read: [],
          write: ["name"],
        },
      },
      public: ["alliance_product_family", "name"],
    },
    triggers: {
      increment_count_in_alliance_product_family: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_product_family"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family"], "property_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_product_family", "property_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_product_family: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_product_family"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family"], "property_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_product_family", "property_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["alliance_product_family_property"], "language"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance_product_family_property: {
          read: [],
          write: ["language", "name"],
        },
      },
      public: ["alliance_product_family_property", "language", "name"],
    },
    triggers: {
      increment_count_in_alliance_product_family_property: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_product_family_property"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family_property"], "translation_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot([
                      "alliance_product_family_property",
                      "translation_count",
                    ])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_product_family_property: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_product_family_property"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family_property"], "translation_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot([
                      "alliance_product_family_property",
                      "translation_count",
                    ])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
      [["alliance_product_family_property"], "name"],
      [["alliance_product_family_property"], "order"],
    ],
    permissions: {
      borrow: {},
      ownership: {
        alliance_product_family_property: {
          read: [],
          write: ["name", "order"],
        },
      },
      public: ["alliance_product_family_property", "name", "order"],
    },
    triggers: {
      increment_count_in_alliance_product_family_property: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_product_family_property"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family_property"], "value_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_product_family_property", "value_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_product_family_property: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_product_family_property"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family_property"], "value_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_product_family_property", "value_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["alliance_product_family_property_value"], "language"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance_product_family_property_value: {
          read: [],
          write: ["language", "name"],
        },
      },
      public: ["alliance_product_family_property_value", "language", "name"],
    },
    triggers: {
      increment_count_in_alliance_product_family_property_value: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_product_family_property_value"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family_property_value"], "translation_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot([
                      "alliance_product_family_property_value",
                      "translation_count",
                    ])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_product_family_property_value: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_product_family_property_value"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family_property_value"], "translation_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot([
                      "alliance_product_family_property_value",
                      "translation_count",
                    ])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["alliance_product_family"], "name"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance_product_family: {
          read: [],
          write: [
            "name",
            "description",
            "variant_count",
            "tag_count",
            "translation_count",
          ],
        },
      },
      public: [
        "alliance_product_family",
        "name",
        "description",
        "variant_count",
        "tag_count",
        "translation_count",
      ],
    },
    triggers: {
      increment_count_in_alliance_product_family: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_product_family"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family"], "product_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_product_family", "product_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_product_family: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_product_family"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family"], "product_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_product_family", "product_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["alliance_product"], "language"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance_product: {
          read: [],
          write: ["language", "name", "description"],
        },
      },
      public: ["alliance_product", "language", "name", "description"],
    },
    triggers: {
      increment_count_in_alliance_product: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_product"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product"], "translation_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_product", "translation_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_product: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_product"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product"], "translation_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_product", "translation_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["alliance_product"], "tag"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance_product: {
          read: [],
          write: ["tag"],
        },
      },
      public: ["alliance_product", "tag"],
    },
    triggers: {
      increment_count_in_alliance_product: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_product"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product"], "tag_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(new Dot(["alliance_product", "tag_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_product: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_product"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product"], "tag_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(new Dot(["alliance_product", "tag_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["alliance_product"], "name"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance_product: {
          read: [],
          write: [
            "name",
            "min_quantity",
            "max_quantity",
            "min_price",
            "max_price",
          ],
        },
      },
      public: [
        "alliance_product",
        "name",
        "min_quantity",
        "max_quantity",
        "min_price",
        "max_price",
        "variant_property_count",
        "provider_count",
        "provider_price_sum",
        "provider_average_price",
        "translation_count",
      ],
    },
    triggers: {
      increment_count_in_alliance_product: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_product"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product"], "variant_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_product", "variant_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_product: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_product"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product"], "variant_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_product", "variant_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      compute_provider_average_price: {
        event: ["after_creation", "after_update"],
        monitor: [
          [[], "provider_count"],
          [[], "provider_price_sum"],
        ],
        operation: {
          op: "update",
          path_updates: [
            [
              [[], "provider_average_price"],
              new NumberArithmeticExpression(
                new Divide<ToDeci>([
                  new DotExpression(new Dot(["provider_price_sum"])),
                  [new DotExpression(new Dot(["provider_count"]))],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["alliance_product_family_variant"], "language"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance_product_family_variant: {
          read: [],
          write: ["language", "name"],
        },
      },
      public: ["alliance_product_family_variant", "language", "name"],
    },
    triggers: {
      increment_count_in_alliance_product_family_variant: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_product_family_variant"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family_variant"], "translation_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot([
                      "alliance_product_family_variant",
                      "translation_count",
                    ])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_product_family_variant: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_product_family_variant"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family_variant"], "translation_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot([
                      "alliance_product_family_variant",
                      "translation_count",
                    ])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
      [["alliance_product_family_variant"], "order"],
      [["alliance_product_family_variant"], "alliance_product_family_property"],
    ],
    permissions: {
      borrow: {},
      ownership: {
        alliance_product_family_variant: {
          read: [],
          write: [
            "order",
            "alliance_product_family_property",
            "alliance_product_family_property_value",
          ],
        },
      },
      public: [
        "alliance_product_family_variant",
        "order",
        "alliance_product_family_property",
        "alliance_product_family_property_value",
      ],
    },
    triggers: {
      increment_count_in_alliance_product_family_variant: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_product_family_variant"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family_variant"], "variant_property_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot([
                      "alliance_product_family_variant",
                      "variant_property_count",
                    ])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_product_family_variant: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_product_family_variant"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family_variant"], "variant_property_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot([
                      "alliance_product_family_variant",
                      "variant_property_count",
                    ])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
      [["alliance"], "name"],
      [["alliance"], "order"],
    ],
    permissions: {
      borrow: {},
      ownership: {
        user: {
          read: [],
          write: [
            "order",
            "name",
            "product_category",
            "property_count",
            "product_count",
            "translation_count",
          ],
        },
      },
      public: [
        "user",
        "order",
        "name",
        "product_category",
        "property_count",
        "product_count",
        "translation_count",
      ],
    },
    triggers: {
      increment_product_family_count_in_user: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "user"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user"], "product_family_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(new Dot(["user", "product_family_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_product_family_count_in_user: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "user"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user"], "product_family_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(new Dot(["user", "product_family_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      increment_product_count_in_user: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "product_count"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user"], "product_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(new Dot(["user", "product_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_product_count_in_user: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "product_count"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user"], "product_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(new Dot(["user", "product_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["user_product_family"], "name"]],
    permissions: {
      borrow: {},
      ownership: {
        user_product_family: {
          read: [],
          write: ["name"],
        },
      },
      public: ["user_product_family", "name"],
    },
    triggers: {
      increment_count_in_user_product_family: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "user_product_family"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user_product_family"], "property_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["user_product_family", "property_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_user_product_family: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "user_product_family"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user_product_family"], "property_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["user_product_family", "property_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
      [["user_product_family_property"], "name"],
      [["user_product_family_property"], "order"],
    ],
    permissions: {
      borrow: {},
      ownership: {
        user_product_family_property: {
          read: [],
          write: ["name", "order"],
        },
      },
      public: ["user_product_family_property", "name", "order"],
    },
    triggers: {
      increment_count_in_user_product_family_property: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "user_product_family_property"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user_product_family_property"], "value_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["user_product_family_property", "value_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_user_product_family_property: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "user_product_family_property"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user_product_family_property"], "value_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["user_product_family_property", "value_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["user_product_family"], "name"]],
    permissions: {
      borrow: {},
      ownership: {
        user_product_family: {
          read: [],
          write: [
            "name",
            "description",
            "variant_count",
            "tag_count",
            "translation_count",
          ],
        },
      },
      public: [
        "user_product_family",
        "name",
        "description",
        "variant_count",
        "tag_count",
        "translation_count",
      ],
    },
    triggers: {
      increment_count_in_user_product_family: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "user_product_family"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user_product_family"], "product_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["user_product_family", "product_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_user_product_family: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "user_product_family"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user_product_family"], "product_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["user_product_family", "product_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["user_product"], "language"]],
    permissions: {
      borrow: {},
      ownership: {
        user_product: {
          read: [],
          write: ["language", "name", "description"],
        },
      },
      public: ["user_product", "language", "name", "description"],
    },
    triggers: {
      increment_count_in_user_product: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "user_product"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user_product"], "translation_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["user_product", "translation_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_user_product: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "user_product"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user_product"], "translation_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["user_product", "translation_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
      [["user_product"], "name"],
      [["user_product"], "order"],
    ],
    permissions: {
      borrow: {},
      ownership: {
        user_product: {
          read: [],
          write: ["order", "name", "quantity", "price"],
        },
      },
      public: [
        "user_product",
        "order",
        "name",
        "quantity",
        "price",
        "variant_property_count",
        "translation_count",
      ],
    },
    triggers: {
      increment_count_in_user_product: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "user_product"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user_product"], "variant_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(new Dot(["user_product", "variant_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_user_product: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "user_product"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user_product"], "variant_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(new Dot(["user_product", "variant_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
      [["user_product_family_variant"], "order"],
      [["user_product_family_variant"], "user_product_family_property"],
    ],
    permissions: {
      borrow: {},
      ownership: {
        user_product_family_variant: {
          read: [],
          write: [
            "order",
            "user_product_family_property",
            "user_product_family_property_value",
          ],
        },
      },
      public: [
        "user_product_family_variant",
        "order",
        "user_product_family_property",
        "user_product_family_property_value",
      ],
    },
    triggers: {
      increment_count_in_user_product_family_variant: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "user_product_family_variant"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user_product_family_variant"], "variant_property_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot([
                      "user_product_family_variant",
                      "variant_property_count",
                    ])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_user_product_family_variant: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "user_product_family_variant"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user_product_family_variant"], "variant_property_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot([
                      "user_product_family_variant",
                      "variant_property_count",
                    ])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
      [["alliance_product_family_variant"], "user_product_family_variant"],
      [["alliance_member"], "user_product_family_variant"],
    ],
    permissions: {
      borrow: {},
      ownership: {
        alliance_product_family_variant: {
          read: ["alliance_member", "user_product_family_variant"],
          write: [],
        },
        user_product_family_variant: {
          read: ["alliance_product_family_variant", "alliance_member"],
          write: [],
        },
      },
      public: [],
    },
    triggers: {},
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
      [["alliance_product_family_variant"], "user_product_family_variant"],
      [["alliance_member"], "user_product_family_variant"],
    ],
    permissions: {
      borrow: {},
      ownership: {
        alliance_product_family_variant: {
          read: ["alliance_member"],
          write: [],
        },
        user_product_family_variant: {
          read: ["alliance_member"],
          write: [],
        },
      },
      public: [
        "alliance_product_family_variant",
        "user_product_family_variant",
      ],
    },
    triggers: {
      increment_count_in_alliance_product_family_variant: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_product_family_variant"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family_variant"], "provider_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot([
                      "alliance_product_family_variant",
                      "provider_count",
                    ])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_product_family_variant: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_product_family_variant"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_product_family_variant"], "provider_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot([
                      "alliance_product_family_variant",
                      "provider_count",
                    ])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      increment_count_in_alliance_member: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_member"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_member"], "variant_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_member", "variant_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_member: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_member"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_member"], "variant_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_member", "variant_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      increment_count_in_user_product_family_variant: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "user_product_family_variant"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user_product_family_variant"], "alliance_variant_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot([
                      "user_product_family_variant",
                      "alliance_variant_count",
                    ])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_user_product_family_variant: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "user_product_family_variant"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["user_product_family_variant"], "alliance_variant_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot([
                      "user_product_family_variant",
                      "alliance_variant_count",
                    ])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["alliance"], "alliance_product"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance: {
          read: [],
          write: ["alliance_product", "markup"],
        },
      },
      public: ["alliance", "alliance_product", "markup"],
    },
    triggers: {
      increment_count_in_alliance: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance"], "virtual_product_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["alliance", "virtual_product_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance"], "virtual_product_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["alliance", "virtual_product_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["alliance"], "name"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance: {
          read: [],
          write: ["name", "language", "description", "min_price", "max_price"],
        },
      },
      public: [
        "alliance",
        "name",
        "language",
        "description",
        "min_price",
        "max_price",
        "provider_count",
        "provider_price_sum",
        "provider_average_price",
      ],
    },
    triggers: {
      increment_count_in_alliance: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance"], "service_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(new Dot(["alliance", "service_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance"], "service_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(new Dot(["alliance", "service_count"])),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["alliance_service"], "language"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance_service: {
          read: [],
          write: ["language", "name", "description"],
        },
      },
      public: ["alliance_service", "language", "name", "description"],
    },
    triggers: {
      increment_count_in_alliance_service: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_service"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_service"], "translation_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_service", "translation_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_service: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_service"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_service"], "translation_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_service", "translation_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["alliance_service"], "name"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance_service: {
          read: [],
          write: ["name", "price"],
        },
      },
      public: ["alliance_service", "name", "language", "description", "price"],
    },
    triggers: {},
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
    uniqueness: [[["alliance_service_task"], "language"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance_service_task: {
          read: [],
          write: ["language", "name", "description"],
        },
      },
      public: ["alliance_service_task", "language", "name", "description"],
    },
    triggers: {
      increment_count_in_alliance_service_task: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_service_task"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_service_task"], "translation_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_service_task", "translation_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_service_task: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_service_task"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_service_task"], "translation_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_service_task", "translation_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
      [["alliance_service"], "name"],
      [["alliance_service"], "order"],
    ],
    permissions: {
      borrow: {},
      ownership: {
        user: {
          read: [],
          write: ["name"],
        },
      },
      public: ["alliance_service", "name", "description", "order"],
    },
    triggers: {},
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
    uniqueness: [[["alliance_service_milsestone"], "language"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance_service_milsestone: {
          read: [],
          write: ["language", "name", "description"],
        },
      },
      public: [
        "alliance_service_milsestone",
        "language",
        "name",
        "description",
      ],
    },
    triggers: {
      increment_count_in_alliance_service_milsestone: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_service_milsestone"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_service_milsestone"], "translation_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot([
                      "alliance_service_milsestone",
                      "translation_count",
                    ])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_service_milsestone: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_service_milsestone"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_service_milsestone"], "translation_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot([
                      "alliance_service_milsestone",
                      "translation_count",
                    ])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["alliance_service_milestone"], "alliance_service_task"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance_service_milestone: {
          read: [],
          write: [],
        },
        alliance_service_task: {
          read: [],
          write: [],
        },
      },
      public: ["alliance_service_milestone", "alliance_service_task"],
    },
    triggers: {},
    checks: {},
  },
  Alliance_Service_Provider: {
    fields: {
      alliance_service: { type: "other", other: "Alliance_Service" },
      alliance_member: { type: "other", other: "Alliance_Member" },
    },
    uniqueness: [[["alliance_service"], "alliance_member"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance_service: {
          read: [],
          write: [],
        },
      },
      public: ["alliance_service", "alliance_member"],
    },
    triggers: {
      increment_count_in_alliance_service: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_service"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_service"], "provider_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_service", "provider_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_service: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_service"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_service"], "provider_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_service", "provider_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      increment_count_in_alliance_member: {
        event: ["after_creation", "after_update"],
        monitor: [[[], "alliance_member"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_member"], "service_count"],
              new NumberArithmeticExpression(
                new Add<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_member", "service_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
      },
      decrement_count_in_alliance_member: {
        event: ["before_deletion", "before_update"],
        monitor: [[[], "alliance_member"]],
        operation: {
          op: "update",
          path_updates: [
            [
              [["alliance_member"], "service_count"],
              new NumberArithmeticExpression(
                new Subtract<ToNum>([
                  new DotExpression(
                    new Dot(["alliance_member", "service_count"])
                  ),
                  [new Num(1)],
                ])
              ),
            ],
          ],
        },
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
    uniqueness: [[["alliance"], "name"]],
    permissions: {
      borrow: {},
      ownership: {
        alliance: {
          read: [
            "name",
            "unused",
            "used",
            "min_order_value",
            "flat_discount",
            "discount",
            "max_absolute_discount",
            "valid_from",
            "valid_to",
            "min_clan_loyalty",
            "max_clan_loyalty",
            "show_coupon",
          ],
          write: [],
        },
      },
      public: [
        "alliance",
        "name",
        "unused",
        "used",
        "min_order_value",
        "min_price",
        "flat_discount",
        "discount",
        "max_absolute_discount",
        "valid_from",
        "valid_to",
        "min_clan_loyalty",
        "max_clan_loyalty",
        "show_coupon",
      ],
    },
    triggers: {},
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
  },
  Clan_Product_Order: {
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
  },
};

export function get_structs(): HashSet<Struct> {
  let structs: HashSet<Struct> = HashSet.of();
  for (const structName in schema) {
    const structDef = schema[structName];
    const struct: Struct = new Struct(
      structName,
      {},
      structDef.uniqueness,
      structDef.permissions,
      structDef.triggers,
      structDef.checks
    );
    for (const fieldName in structDef.fields) {
      struct.fields[fieldName] = structDef.fields[fieldName];
    }
    structs = structs.add(struct);
  }
  return structs;
}

export function get_struct(struct_name: string): Result<Struct> {
  const struct = get_structs()
    .filter((s) => s.name === struct_name)
    .single();
  if (struct.isSome()) {
    return new Ok(struct.get());
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
