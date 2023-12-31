import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { apply, arrow, CustomError, Err, Ok, Result, unwrap } from "./prelude";
import { ErrMsg, errors } from "./errors";
import { create_level, execute_transaction, remove_level } from "./db";
import { StrongEnum, Variable } from "./variable";
import { getState, BrokerKey } from "./store";
import { terminal } from "./terminal";

async function replace_variable_in_db(
  level: Decimal,
  requested_at: Date,
  struct_name: string,
  id: Decimal,
  created_at: Date,
  updated_at: Date,
  paths: Array<
    [
      Array<
        [
          string,
          {
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
  terminal([
    "db_variables",
    `REPLACE: ${level.toString()} ${struct_name} ${id.toString()}`,
  ]);
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
      `DELETE FROM "REMOVED_VARS" WHERE level = ? AND struct_name = ? AND id = ?;`,
      [
        level.abs().truncated().toString(),
        struct_name,
        id.truncated().toString(),
      ]
    );
    await execute_transaction(
      `UPDATE "VARS" SET created_at=?, updated_at=?, requested_at=? WHERE level=? AND struct_name=? AND id=?`,
      [
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
        `INSERT INTO "VARS"("level", "struct_name", "id", "created_at", "updated_at", "requested_at") VALUES (?, ?, ?, ?, ?, ?);`,
        [
          level.abs().truncated().toString(),
          struct_name,
          id.truncated().toString(),
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
    for (const [path, [leaf_field_name, leaf_value]] of paths) {
      let ref_struct_name = struct_name;
      let ref_id: Decimal = id.truncated();
      for (const [field_name, next_var] of path) {
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
          `UPDATE "VARS" SET created_at=?, updated_at=?, requested_at=? WHERE level=? AND struct_name=? AND id=?`,
          [
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
            `INSERT INTO "VARS"("level", "struct_name", "id", "created_at", "updated_at", "requested_at") VALUES (?, ?, ?, ?, ?, ?);`,
            [
              level.abs().truncated().toString(),
              ref_struct_name,
              ref_id.toString(),
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
    terminal(["error", ["db_variables", ``]]);
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok(changes);
}

export async function remove_variables_in_db(
  level: Decimal,
  struct_name: string,
  ids: ReadonlyArray<Decimal>
): Promise<Result<[]>> {
  terminal(["db_variables", `REMOVE: ${struct_name} ${ids}`]);
  try {
    if (level.equals(0)) {
      for (const id of ids) {
        await execute_transaction(
          `DELETE FROM "VARS" WHERE level = 0 AND struct_name = ? AND id = ?;`,
          [struct_name, id.truncated().toString()]
        );
      }
    } else {
      for (const id of ids) {
        await execute_transaction(
          `DELETE FROM "VARS" WHERE level = ? AND struct_name = ? AND id = ?;`,
          [
            level.abs().truncated().toString(),
            struct_name,
            id.truncated().toString(),
          ]
        );
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
    terminal(["error", ["db_variables", ``]]);
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok([] as []);
}

export async function replace_variable(
  variable: Variable,
  lvl?: Decimal,
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
  const level = await arrow(() => {
    if (lvl !== undefined) {
      return new Ok(lvl);
    } else return create_level();
  });
  if (unwrap(level)) {
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
        level.value,
        requested_at,
        variable.struct.name,
        variable.id,
        variable.created_at,
        variable.updated_at,
        variable.paths.toArray().map((x) => [
          x.path[0].map((y) => [
            y[0],
            {
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
      } else {
        if (lvl === undefined) {
          await remove_level(level.value);
        }
      }
    } catch (err) {
      terminal(["error", ["db_variables", ``]]);
      return new Err(
        new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg)
      );
    }
    if (entrypoint) {
      getState().announce_message(changes);
    }
    return new Ok(changes);
  } else {
    terminal(["error", ["db_variables", ``]]);
    return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  }
}

export async function replace_variables(
  variables: HashSet<Variable>,
  lvl?: Decimal,
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
  const level = await arrow(() => {
    if (lvl !== undefined) {
      return new Ok(lvl);
    } else return create_level();
  });
  if (unwrap(level)) {
    const changes = {} as Record<
      BrokerKey,
      {
        create: Array<number>;
        update: Array<number>;
        remove: Array<number>;
      }
    >;
    try {
      for (const variable of variables) {
        const result: Result<
          Record<
            BrokerKey,
            {
              create: Array<number>;
              update: Array<number>;
              remove: Array<number>;
            }
          >
        > = await replace_variable(variable, level.value, requested_at, false);
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
      if (lvl === undefined) {
        await remove_level(level.value);
      }
      terminal(["error", ["db_variables", ``]]);
      return new Err(
        new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg)
      );
    }
    getState().announce_message(changes);
    return new Ok(changes);
  } else {
    terminal(["error", ["db_variables", ``]]);
    return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  }
}
