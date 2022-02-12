import { getState, BrokerKey } from "./store";
import { apply, CustomError, Err, Ok, Result, unwrap } from "./prelude";
import Decimal from "decimal.js";
import { Path, StrongEnum, Variable } from "./variable";
import { ErrMsg, errors } from "./errors";
import { HashSet } from "prelude-ts";
import { get_struct } from "./schema";
import { execute_transaction, replace_param } from "./db";

async function replace_variable_in_db(
  level: Decimal,
  requested_at: Date,
  struct_name: string,
  id: Decimal,
  active: boolean,
  created_at: Date,
  updated_at: Date,
  paths: Array<
    [
      Array<
        [
          string,
          {
            active: boolean;
            created_at: Date;
            updated_at: Date;
            value: {
              type: "other";
              other: string;
              value: Decimal;
            };
          }
        ]
      >,
      [string, StrongEnum]
    ]
  >
): Promise<
  Result<
    Record<
      BrokerKey,
      {
        create: Array<number>;
        update: Array<number>;
        remove: Array<number>;
      }
    >
  >
> {
  const changes = {} as Record<
    BrokerKey,
    {
      create: Array<number>;
      update: Array<number>;
      remove: Array<number>;
    }
  >;
  try {
    await execute_transaction(
      `UPDATE "VARS" SET active=?, created_at=?, updated_at=?, requested_at=? WHERE level=? AND struct_name=? AND id=?`,
      [
        active ? "1" : "0",
        created_at.getTime().toString(),
        updated_at.getTime().toString(),
        requested_at.getTime().toString(),
        level.abs().truncated().toString(),
        struct_name,
        id.truncated().toString(),
      ]
    );
    try {
      await execute_transaction(
        `INSERT INTO "VARS"("level", "struct_name", "id", "active", "created_at", "updated_at", "requested_at") VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          level.abs().truncated().toString(),
          struct_name,
          id.truncated().toString(),
          active ? "1" : "0",
          created_at.getTime().toString(),
          updated_at.getTime().toString(),
          requested_at.getTime().toString(),
        ]
      );
      // variable was inserted as there was no exception
      if (struct_name in getState().broker) {
        if (struct_name in changes) {
          changes[struct_name as BrokerKey] = {
            ...changes[struct_name as BrokerKey],
            create: changes[struct_name as BrokerKey].create.concat([
              id.truncated().toNumber(),
            ]),
          };
        } else {
          changes[struct_name as BrokerKey] = {
            create: [id.truncated().toNumber()],
            update: [],
            remove: [],
          };
        }
      }
    } catch (e) {
      // variable could not be inserted, so must have already existed and updated instead
      if (struct_name in getState().broker) {
        if (struct_name in changes) {
          changes[struct_name as BrokerKey] = {
            ...changes[struct_name as BrokerKey],
            update: changes[struct_name as BrokerKey].update.concat([
              id.truncated().toNumber(),
            ]),
          };
        } else {
          changes[struct_name as BrokerKey] = {
            create: [],
            update: [id.truncated().toNumber()],
            remove: [],
          };
        }
      }
    }
    for (let [path, [leaf_field_name, leaf_value]] of paths) {
      let ref_struct_name = struct_name;
      let ref_id: Decimal = id.truncated();
      for (let [field_name, next_var] of path) {
        await execute_transaction(
          `REPLACE INTO "VALS"("level", "struct_name", "variable_id", "field_name", "field_struct_name", "integer_value") VALUES (?, ?, ?, ?, ?, ?);`,
          [
            level.abs().truncated().toString(),
            ref_struct_name,
            ref_id.toString(),
            field_name,
            next_var.value.other,
            next_var.value.value.truncated().toString(),
          ]
        );
        ref_struct_name = next_var.value.other;
        ref_id = next_var.value.value.truncated();
        await execute_transaction(
          `UPDATE "VARS" SET active=?, created_at=?, updated_at=?, requested_at=? WHERE level=? AND struct_name=? AND id=?`,
          [
            next_var.active ? "1" : "0",
            next_var.created_at.getTime().toString(),
            next_var.updated_at.getTime().toString(),
            requested_at.getTime().toString(),
            level.abs().truncated().toString(),
            ref_struct_name,
            ref_id.toString(),
          ]
        );
        try {
          await execute_transaction(
            `INSERT INTO "VARS"("level", "struct_name", "id", "active", "created_at", "updated_at", "requested_at") VALUES (?, ?, ?, ?, ?, ?, ?);`,
            [
              level.abs().truncated().toString(),
              ref_struct_name,
              ref_id.toString(),
              next_var.active ? "1" : "0",
              next_var.created_at.getTime().toString(),
              next_var.updated_at.getTime().toString(),
              requested_at.getTime().toString(),
            ]
          );
          // variable was inserted as there was no exception
          if (ref_struct_name in getState().broker) {
            if (ref_struct_name in changes) {
              changes[ref_struct_name as BrokerKey] = {
                ...changes[ref_struct_name as BrokerKey],
                create: changes[ref_struct_name as BrokerKey].create.concat([
                  ref_id.toNumber(),
                ]),
              };
            } else {
              changes[ref_struct_name as BrokerKey] = {
                create: [ref_id.toNumber()],
                update: [],
                remove: [],
              };
            }
          }
        } catch (e) {
          // variable could not be inserted, so must have already existed and updated instead
          if (ref_struct_name in getState().broker) {
            if (ref_struct_name in changes) {
              changes[ref_struct_name as BrokerKey] = {
                ...changes[ref_struct_name as BrokerKey],
                update: changes[ref_struct_name as BrokerKey].update.concat([
                  ref_id.toNumber(),
                ]),
              };
            } else {
              changes[ref_struct_name as BrokerKey] = {
                create: [],
                update: [ref_id.toNumber()],
                remove: [],
              };
            }
          }
        }
      }
      const leaf_value_type = leaf_value.type;
      switch (leaf_value_type) {
        case "str":
        case "lstr":
        case "clob": {
          await execute_transaction(
            `REPLACE INTO "VALS"("level", "struct_name", "variable_id", "field_name", "field_struct_name", "text_value") VALUES (?, ?, ?, ?, ?, ?);`,
            [
              level.abs().truncated().toString(),
              ref_struct_name,
              ref_id.toString(),
              leaf_field_name,
              leaf_value_type,
              leaf_value.value,
            ]
          );
          break;
        }
        case "i32":
        case "u32":
        case "i64":
        case "u64": {
          await execute_transaction(
            `REPLACE INTO "VALS"("level", "struct_name", "variable_id", "field_name", "field_struct_name", "integer_value") VALUES (?, ?, ?, ?, ?, ?);`,
            [
              level.abs().truncated().toString(),
              ref_struct_name,
              ref_id.toString(),
              leaf_field_name,
              leaf_value_type,
              leaf_value.value.truncated().toString(),
            ]
          );
          break;
        }
        case "idouble":
        case "udouble":
        case "idecimal":
        case "udecimal": {
          await execute_transaction(
            `REPLACE INTO "VALS"("level", "struct_name", "variable_id", "field_name", "field_struct_name", "real_value") VALUES (?, ?, ?, ?, ?, ?);`,
            [
              level.abs().truncated().toString(),
              ref_struct_name,
              ref_id.toString(),
              leaf_field_name,
              leaf_value_type,
              leaf_value.value.toString(),
            ]
          );
          break;
        }
        case "bool": {
          await execute_transaction(
            `REPLACE INTO "VALS"("level", "struct_name", "variable_id", "field_name", "field_struct_name", "integer_value") VALUES (?, ?, ?, ?, ?, ?);`,
            [
              level.abs().truncated().toString(),
              ref_struct_name,
              ref_id.toString(),
              leaf_field_name,
              leaf_value_type,
              leaf_value.value ? "1" : "0",
            ]
          );
          break;
        }
        case "date":
        case "time":
        case "timestamp": {
          await execute_transaction(
            `REPLACE INTO "VALS"("level", "struct_name", "variable_id", "field_name", "field_struct_name", "integer_value") VALUES (?, ?, ?, ?, ?, ?);`,
            [
              level.abs().truncated().toString(),
              ref_struct_name,
              ref_id.toString(),
              leaf_field_name,
              leaf_value_type,
              leaf_value.value.getTime().toString(),
            ]
          );
          break;
        }
        case "other": {
          await execute_transaction(
            `REPLACE INTO "VALS"("level", "struct_name", "variable_id", "field_name", "field_struct_name", "integer_value") VALUES (?, ?, ?, ?, ?, ?);`,
            [
              level.abs().truncated().toString(),
              ref_struct_name,
              ref_id.toString(),
              leaf_field_name,
              leaf_value.other,
              leaf_value.value.truncated().toString(),
            ]
          );
          break;
        }
        default: {
          const _exhaustiveCheck: never = leaf_value_type;
          return _exhaustiveCheck;
        }
      }
    }
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok(changes);
}

export async function remove_variables_in_db(
  level: Decimal,
  struct_name: string,
  ids: ReadonlyArray<Decimal>
): Promise<Result<[]>> {
  try {
    if (level.equals(0)) {
      for (let id of ids) {
        await execute_transaction(
          `DELETE FROM "VARS" WHERE level = 0 AND struct_name = ? AND id = ?;`,
          [struct_name, id.truncated().toString()]
        );
      }
    } else {
      for (let id of ids) {
        await execute_transaction(
          `REPLACE INTO "REMOVED_VARS"("level", "struct_name", "id") VALUES (?, ?, ?);`,
          [
            level.abs().truncated().toString(),
            struct_name,
            id.truncated().toString(),
          ]
        );
      }
    }
    if (struct_name in getState().broker) {
      getState().announce_message(
        apply(
          {} as Record<
            BrokerKey,
            {
              create: ReadonlyArray<number>;
              update: ReadonlyArray<number>;
              remove: ReadonlyArray<number>;
            }
          >,
          (it) => {
            it[struct_name as BrokerKey] = {
              create: [],
              update: [],
              remove: ids.map((x) => x.truncated().toNumber()),
            };
            return it;
          }
        )
      );
    }
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok([] as []);
}

export async function replace_variable(
  level: Decimal,
  variable: Variable,
  requested_at: Date = new Date(),
  entrypoint: boolean = true
): Promise<
  Result<
    Record<
      BrokerKey,
      {
        create: Array<number>;
        update: Array<number>;
        remove: Array<number>;
      }
    >
  >
> {
  let changes = {} as Record<
    BrokerKey,
    {
      create: Array<number>;
      update: Array<number>;
      remove: Array<number>;
    }
  >;
  try {
    const result = await replace_variable_in_db(
      level,
      requested_at,
      variable.struct.name,
      variable.id,
      variable.active,
      variable.created_at,
      variable.updated_at,
      variable.paths.toArray().map((x) => [
        x.path[0].map((y) => [
          y[0],
          {
            active: y[1].active,
            created_at: y[1].created_at,
            updated_at: y[1].updated_at,
            value: {
              type: "other",
              other: y[1].struct.name,
              value: y[1].id,
            },
          },
        ]),
        x.path[1],
      ])
    );
    if (unwrap(result)) {
      changes = result.value;
    }
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  if (entrypoint) {
    getState().announce_message(changes);
  }
  return new Ok(changes);
}

export async function replace_variables(
  level: Decimal,
  variables: HashSet<Variable>,
  requested_at: Date = new Date()
): Promise<
  Result<
    Record<
      BrokerKey,
      {
        create: Array<number>;
        update: Array<number>;
        remove: Array<number>;
      }
    >
  >
> {
  const changes = {} as Record<
    BrokerKey,
    {
      create: Array<number>;
      update: Array<number>;
      remove: Array<number>;
    }
  >;
  try {
    for (let variable of variables) {
      const result = await replace_variable(
        level,
        variable,
        requested_at,
        false
      );
      if (unwrap(result)) {
        for (const struct_name of Object.keys(result.value)) {
          if (struct_name in changes) {
            changes[struct_name as BrokerKey] = {
              create: changes[struct_name as BrokerKey].create.concat(
                result.value[struct_name as BrokerKey].create
              ),
              update: changes[struct_name as BrokerKey].update.concat(
                result.value[struct_name as BrokerKey].update
              ),
              remove: changes[struct_name as BrokerKey].remove.concat(
                result.value[struct_name as BrokerKey].remove
              ),
            };
          } else {
            changes[struct_name as BrokerKey] = {
              create: result.value[struct_name as BrokerKey].create,
              update: result.value[struct_name as BrokerKey].update,
              remove: result.value[struct_name as BrokerKey].remove,
            };
          }
        }
      }
    }
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  getState().announce_message(changes);
  return new Ok(changes);
}

///////////////////////////////////

async function load_users() {
  const struct = get_struct("User");
  if (unwrap(struct)) {
    await replace_variables(
      new Decimal(0),
      HashSet.ofIterable([
        new Variable(
          struct.value,
          new Decimal(1),
          true,
          new Date(),
          new Date(),
          HashSet.ofIterable([
            new Path("NICKNAME", [
              [],
              ["nickname", { type: "str", value: "JOHN SMITH" }],
            ]),
            new Path("MOBILE", [
              [],
              ["mobile", { type: "str", value: "1234" }],
            ]),
            new Path("KNOWS ENGLISH", [
              [],
              ["knows_english", { type: "bool", value: true }],
            ]),
            new Path("Product Count", [
              [],
              ["product_count", { type: "u32", value: new Decimal(5) }],
            ]),
          ])
        ),
        new Variable(
          struct.value,
          new Decimal(2),
          true,
          new Date(),
          new Date(),
          HashSet.ofIterable([
            new Path("NICKNAME", [
              [],
              ["nickname", { type: "str", value: "NUMBER FOUR" }],
            ]),
            new Path("MOBILE", [
              [],
              ["mobile", { type: "str", value: "5678" }],
            ]),
            new Path("KNOWS ENGLISH", [
              [],
              ["knows_english", { type: "bool", value: false }],
            ]),
            new Path("Product Count", [
              [],
              ["product_count", { type: "u32", value: new Decimal(34) }],
            ]),
          ])
        ),
        // new Variable(
        //   struct.value,
        //   new Decimal(3),
        //   true,
        //   new Date(),
        //   new Date(),
        //   HashSet.ofIterable([
        //     new Path("NICKNAME", [
        //       [],
        //       ["nickname", { type: "str", value: "NUMBER 3" }],
        //     ]),
        //     new Path("MOBILE", [
        //       [],
        //       ["mobile", { type: "str", value: "5678" }],
        //     ]),
        //     new Path("KNOWS ENGLISH", [
        //       [],
        //       ["knows_english", { type: "bool", value: false }],
        //     ]),
        //     new Path("Product Count", [
        //       [],
        //       ["product_count", { type: "u32", value: new Decimal(33) }],
        //     ]),
        //   ])
        // ),
        // new Variable(
        //   struct.value,
        //   new Decimal(4),
        //   true,
        //   new Date(),
        //   new Date(),
        //   HashSet.ofIterable([
        //     new Path("NICKNAME", [
        //       [],
        //       ["nickname", { type: "str", value: "NUMBER 42" }],
        //     ]),
        //     new Path("MOBILE", [
        //       [],
        //       ["mobile", { type: "str", value: "5678" }],
        //     ]),
        //     new Path("KNOWS ENGLISH", [
        //       [],
        //       ["knows_english", { type: "bool", value: false }],
        //     ]),
        //     new Path("Product Count", [
        //       [],
        //       ["product_count", { type: "u32", value: new Decimal(53) }],
        //     ]),
        //   ])
        // ),
        // new Variable(
        //   struct.value,
        //   new Decimal(5),
        //   true,
        //   new Date(),
        //   new Date(),
        //   HashSet.ofIterable([
        //     new Path("NICKNAME", [
        //       [],
        //       ["nickname", { type: "str", value: "NUMBER 5" }],
        //     ]),
        //     new Path("MOBILE", [
        //       [],
        //       ["mobile", { type: "str", value: "5678" }],
        //     ]),
        //     new Path("KNOWS ENGLISH", [
        //       [],
        //       ["knows_english", { type: "bool", value: false }],
        //     ]),
        //     new Path("Product Count", [
        //       [],
        //       ["product_count", { type: "u32", value: new Decimal(63) }],
        //     ]),
        //   ])
        // ),
        // new Variable(
        //   struct.value,
        //   new Decimal(6),
        //   true,
        //   new Date(),
        //   new Date(),
        //   HashSet.ofIterable([
        //     new Path("NICKNAME", [
        //       [],
        //       ["nickname", { type: "str", value: "NUMBER 6" }],
        //     ]),
        //     new Path("MOBILE", [
        //       [],
        //       ["mobile", { type: "str", value: "5678" }],
        //     ]),
        //     new Path("KNOWS ENGLISH", [
        //       [],
        //       ["knows_english", { type: "bool", value: false }],
        //     ]),
        //     new Path("Product Count", [
        //       [],
        //       ["product_count", { type: "u32", value: new Decimal(73) }],
        //     ]),
        //   ])
        // ),
        // new Variable(
        //   struct.value,
        //   new Decimal(7),
        //   true,
        //   new Date(),
        //   new Date(),
        //   HashSet.ofIterable([
        //     new Path("NICKNAME", [
        //       [],
        //       ["nickname", { type: "str", value: "NUMBER 7" }],
        //     ]),
        //     new Path("MOBILE", [
        //       [],
        //       ["mobile", { type: "str", value: "5678" }],
        //     ]),
        //     new Path("KNOWS ENGLISH", [
        //       [],
        //       ["knows_english", { type: "bool", value: false }],
        //     ]),
        //     new Path("Product Count", [
        //       [],
        //       ["product_count", { type: "u32", value: new Decimal(83) }],
        //     ]),
        //   ])
        // ),
        // new Variable(
        //   struct.value,
        //   new Decimal(8),
        //   true,
        //   new Date(),
        //   new Date(),
        //   HashSet.ofIterable([
        //     new Path("NICKNAME", [
        //       [],
        //       ["nickname", { type: "str", value: "NUMBER 8" }],
        //     ]),
        //     new Path("MOBILE", [
        //       [],
        //       ["mobile", { type: "str", value: "5678" }],
        //     ]),
        //     new Path("KNOWS ENGLISH", [
        //       [],
        //       ["knows_english", { type: "bool", value: false }],
        //     ]),
        //     new Path("Product Count", [
        //       [],
        //       ["product_count", { type: "u32", value: new Decimal(93) }],
        //     ]),
        //   ])
        // ),
        // new Variable(
        //   struct.value,
        //   new Decimal(9),
        //   true,
        //   new Date(),
        //   new Date(),
        //   HashSet.ofIterable([
        //     new Path("NICKNAME", [
        //       [],
        //       ["nickname", { type: "str", value: "NUMBER 9" }],
        //     ]),
        //     new Path("MOBILE", [
        //       [],
        //       ["mobile", { type: "str", value: "5678" }],
        //     ]),
        //     new Path("KNOWS ENGLISH", [
        //       [],
        //       ["knows_english", { type: "bool", value: false }],
        //     ]),
        //     new Path("Product Count", [
        //       [],
        //       ["product_count", { type: "u32", value: new Decimal(39) }],
        //     ]),
        //   ])
        // ),
        // new Variable(
        //   struct.value,
        //   new Decimal(10),
        //   true,
        //   new Date(),
        //   new Date(),
        //   HashSet.ofIterable([
        //     new Path("NICKNAME", [
        //       [],
        //       ["nickname", { type: "str", value: "NUMBER 10" }],
        //     ]),
        //     new Path("MOBILE", [
        //       [],
        //       ["mobile", { type: "str", value: "5678" }],
        //     ]),
        //     new Path("KNOWS ENGLISH", [
        //       [],
        //       ["knows_english", { type: "bool", value: false }],
        //     ]),
        //     new Path("Product Count", [
        //       [],
        //       ["product_count", { type: "u32", value: new Decimal(38) }],
        //     ]),
        //   ])
        // ),
        // new Variable(
        //   struct.value,
        //   new Decimal(11),
        //   true,
        //   new Date(),
        //   new Date(),
        //   HashSet.ofIterable([
        //     new Path("NICKNAME", [
        //       [],
        //       ["nickname", { type: "str", value: "NUMBER 11" }],
        //     ]),
        //     new Path("MOBILE", [
        //       [],
        //       ["mobile", { type: "str", value: "5678" }],
        //     ]),
        //     new Path("KNOWS ENGLISH", [
        //       [],
        //       ["knows_english", { type: "bool", value: false }],
        //     ]),
        //     new Path("Product Count", [
        //       [],
        //       ["product_count", { type: "u32", value: new Decimal(37) }],
        //     ]),
        //   ])
        // ),
        // new Variable(
        //   struct.value,
        //   new Decimal(12),
        //   true,
        //   new Date(),
        //   new Date(),
        //   HashSet.ofIterable([
        //     new Path("NICKNAME", [
        //       [],
        //       ["nickname", { type: "str", value: "NUMBER 12" }],
        //     ]),
        //     new Path("MOBILE", [
        //       [],
        //       ["mobile", { type: "str", value: "5678" }],
        //     ]),
        //     new Path("KNOWS ENGLISH", [
        //       [],
        //       ["knows_english", { type: "bool", value: false }],
        //     ]),
        //     new Path("Product Count", [
        //       [],
        //       ["product_count", { type: "u32", value: new Decimal(36) }],
        //     ]),
        //   ])
        // ),
        // new Variable(
        //   struct.value,
        //   new Decimal(13),
        //   true,
        //   new Date(),
        //   new Date(),
        //   HashSet.ofIterable([
        //     new Path("NICKNAME", [
        //       [],
        //       ["nickname", { type: "str", value: "NUMBER 13" }],
        //     ]),
        //     new Path("MOBILE", [
        //       [],
        //       ["mobile", { type: "str", value: "5678" }],
        //     ]),
        //     new Path("KNOWS ENGLISH", [
        //       [],
        //       ["knows_english", { type: "bool", value: false }],
        //     ]),
        //     new Path("Product Count", [
        //       [],
        //       ["product_count", { type: "u32", value: new Decimal(3) }],
        //     ]),
        //   ])
        // ),
      ])
    );
  }
}

async function load_tests() {
  const struct = get_struct("Test");
  if (unwrap(struct)) {
    await replace_variables(
      new Decimal(0),
      HashSet.ofIterable([
        new Variable(
          struct.value,
          new Decimal(1),
          true,
          new Date(),
          new Date(),
          HashSet.ofIterable([
            new Path("STR", [
              [],
              ["str", { type: "str", value: "STR STR STR" }],
            ]),
            new Path("LSTR", [
              [],
              ["lstr", { type: "lstr", value: "LSTR LSTR LSTR" }],
            ]),
            new Path("CLOB", [
              [],
              ["clob", { type: "clob", value: "CLOB CLOB CLOB" }],
            ]),

            new Path("U32", [
              [],
              ["u32", { type: "u32", value: new Decimal(59) }],
            ]),
            new Path("I32", [
              [],
              ["i32", { type: "i32", value: new Decimal(-50) }],
            ]),
            new Path("U64", [
              [],
              ["u64", { type: "u64", value: new Decimal(75) }],
            ]),
            new Path("I64", [
              [],
              ["i64", { type: "i64", value: new Decimal(-95) }],
            ]),
            new Path("UDOUBLE", [
              [],
              ["udouble", { type: "udouble", value: new Decimal(59) }],
            ]),
            new Path("IDOUBLE", [
              [],
              ["idouble", { type: "idouble", value: new Decimal(-50) }],
            ]),
            new Path("UDECIMAL", [
              [],
              ["udecimal", { type: "udecimal", value: new Decimal(75) }],
            ]),
            new Path("IDECIMAL", [
              [],
              ["idecimal", { type: "idecimal", value: new Decimal(-95) }],
            ]),
            new Path("BOOL", [[], ["bool", { type: "bool", value: true }]]),
            new Path("DATE", [
              [],
              ["date", { type: "date", value: new Date() }],
            ]),
            new Path("TIME", [
              [],
              ["time", { type: "time", value: new Date() }],
            ]),
            new Path("TIMESTAMP", [
              [],
              ["timestamp", { type: "timestamp", value: new Date() }],
            ]),
            new Path("USER", [
              [],
              ["user", { type: "other", other: "User", value: new Decimal(1) }],
            ]),
          ])
        ),
      ])
    );
  }
}

export async function load_test_data() {
  await replace_param("theme", { type: "str", value: "Black" });
  await load_users();
  await load_tests();
  // const x = await execute_transaction("SELECT * FROM VARS;", []);
  // console.log(x);
  // console.log("-------------------------------------");
  // const y = await execute_transaction("SELECT * FROM VALS;", []);
  // console.log(y);
}
