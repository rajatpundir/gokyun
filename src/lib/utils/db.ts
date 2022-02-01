import { useState } from "react";
import { getState, subscribe } from "./store";
import * as SQLite from "expo-sqlite";
import {
  apply,
  arrow,
  CustomError,
  Err,
  is_decimal,
  Ok,
  Result,
  unwrap,
} from "./prelude";
import Decimal from "decimal.js";
import {
  compare_paths,
  get_flattened_path,
  Path,
  PathString,
  StrongEnum,
  Struct,
  Variable,
} from "./variable";
import { ErrMsg, errors } from "./errors";
import { HashSet, Vector, Option as OptionTS } from "prelude-ts";
import { get_struct, get_structs } from "./schema";

// We will also need functions for activating or deactivating variable in a layer

const db_name: string = "test1.db";

const db = apply(SQLite.openDatabase(db_name), (db) => {
  db.exec(
    [
      // Note. We maybe getting some fields as null due to WAL mode.
      // { sql: "PRAGMA journal_mode = WAL;", args: [] },
      // { sql: "PRAGMA synchronous = 1;", args: [] },
      { sql: "PRAGMA foreign_keys = ON;", args: [] },
      { sql: "VACUUM;", args: [] },
      { sql: `DROP TABLE IF EXISTS "LEVELS";`, args: [] },
      { sql: `DROP TABLE IF EXISTS "REMOVED_VARS";`, args: [] },
      { sql: `DROP TABLE IF EXISTS "VARS";`, args: [] },
      { sql: `DROP TABLE IF EXISTS "VALS";`, args: [] },
      { sql: `DROP TABLE IF EXISTS "PARAMS";`, args: [] },
      { sql: `DROP TABLE IF EXISTS "COUNTERS";`, args: [] },
      {
        sql: `CREATE TABLE IF NOT EXISTS "LEVELS" ("id" INTEGER NOT NULL UNIQUE, "active" INTEGER NOT NULL DEFAULT 0, "created_at" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT));`,
        args: [],
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS "REMOVED_VARS" ("level" INTEGER NOT NULL, "struct_name" TEXT NOT NULL, "id" INTEGER NOT NULL, CONSTRAINT "PK" UNIQUE("level","struct_name","id"), CONSTRAINT "FK" FOREIGN KEY("level") REFERENCES "LEVELS"("id") ON DELETE CASCADE);`,
        args: [],
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS "VARS" ("level" INTEGER NOT NULL, "struct_name" TEXT NOT NULL COLLATE BINARY, "id" INTEGER NOT NULL, "active" INTEGER NOT NULL, "created_at" INTEGER NOT NULL, "updated_at" INTEGER NOT NULL, "requested_at" INTEGER NOT NULL, CONSTRAINT "PK" UNIQUE("level","struct_name","id"), CONSTRAINT "FK" FOREIGN KEY("level") REFERENCES "LEVELS"("id") ON DELETE CASCADE);`,
        args: [],
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS "VALS" ("level" INTEGER NOT NULL, "struct_name" TEXT NOT NULL COLLATE BINARY, "variable_id" INTEGER NOT NULL, "field_name" TEXT NOT NULL COLLATE BINARY, "field_struct_name" TEXT NOT NULL COLLATE BINARY, "text_value" TEXT COLLATE NOCASE, "integer_value" INTEGER, "real_value" INTEGER, CONSTRAINT "PK" UNIQUE("level","struct_name","variable_id","field_name"), CONSTRAINT "FK" FOREIGN KEY("level","struct_name","variable_id") REFERENCES "VARS"("level","struct_name","id") ON DELETE CASCADE, CHECK (((CASE WHEN text_value IS NULL THEN 0 ELSE 1 END) + (CASE WHEN integer_value IS NULL THEN 0 ELSE 1 END) + (CASE WHEN real_value IS NULL THEN 0 ELSE 1 END)) == 1));`,
        args: [],
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS "PARAMS" ("name"	TEXT NOT NULL UNIQUE, "field_struct_name" TEXT NOT NULL, "text_value"	TEXT, "integer_value" INTEGER, "real_value" REAL, CHECK (((CASE WHEN text_value IS NULL THEN 0 ELSE 1 END) + (CASE WHEN integer_value IS NULL THEN 0 ELSE 1 END) + (CASE WHEN real_value IS NULL THEN 0 ELSE 1 END)) == 1));`,
        args: [],
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS "COUNTERS" ("struct_name" TEXT NOT NULL, "count"	INTEGER NOT NULL, PRIMARY KEY("struct_name"));`,
        args: [],
      },
      {
        sql: `REPLACE INTO "LEVELS"("id", "active", "created_at") VALUES (?, ?, ?);`,
        args: [0, 1, 0],
      },
    ],
    false,
    () => {
      // console.log("Successfully run statements")
    }
  );
  return db;
});

export function useDB() {
  const [db_updation_toggle, set_db_updation_toggle] = useState(
    getState().db_updation_toggle
  );
  subscribe((store) => {
    set_db_updation_toggle(store.db_updation_toggle);
  });
  return db;
}

export function execute_transaction(
  sql: string,
  args: Array<string | number>
): Promise<SQLite.SQLResultSet> {
  return new Promise((resolve, reject) => {
    db.transaction(
      async (tx) => {
        tx.executeSql(sql, args, (_, result_set) => resolve(result_set));
      },
      (err) => {
        console.log("TRANSACTION ERROR: ", sql, args, err);
        reject(String(err));
      }
    );
  });
}

function query(
  struct: Struct,
  active: boolean,
  level: Decimal | undefined,
  init_filter: Filter,
  filters: HashSet<Filter>,
  limit: Decimal,
  offset: Decimal
): Promise<SQLite.SQLResultSet> {
  const join_count: number = Math.max(
    0,
    ...init_filter.filter_paths
      .toArray()
      .map((filter_path) => filter_path.path[0].length + 1),
    ...filters
      .toArray()
      .flatMap((filter) =>
        filter.filter_paths
          .toArray()
          .map((filter_path) => filter_path.path[0].length + 1)
      )
  );

  let select_stmt: string = "SELECT \n";
  const append_to_select_stmt = (stmt: string) => {
    select_stmt += arrow(() => {
      if (select_stmt === "SELECT \n") {
        return ` ${stmt}`;
      } else {
        return `,\n ${stmt}`;
      }
    });
  };
  arrow(() => {
    append_to_select_stmt("v1.level AS _level");
    append_to_select_stmt("v1.struct_name AS _struct_name");
    append_to_select_stmt("v1.id AS _id");
    append_to_select_stmt("v1.active AS _active");
    append_to_select_stmt("v1.created_at AS _created_at");
    append_to_select_stmt("v1.updated_at AS _updated_at");
    append_to_select_stmt("v1.requested_at AS _requested_at");
  });
  const get_path_name_expression = (n: number) => {
    return Array.from(Array(n).keys())
      .map((x) => {
        const val_ref = x * 2 + 2;
        return `IFNULL(v${val_ref}.field_name, '')`;
      })
      .join(` || '.' || `);
  };
  arrow(() => {
    let intermediate_paths = HashSet.of<Vector<string>>();
    for (let filter_path of init_filter.filter_paths) {
      const path: PathString = filter_path.path;
      const flattened_path: ReadonlyArray<string> = get_flattened_path(path);
      const path_name_expression = get_path_name_expression(path[0].length + 1);
      if (path[0].length != 0) {
        intermediate_paths = intermediate_paths.add(Vector.ofIterable(path[0]));
      }
      const val_ref: number = flattened_path.length * 2;
      const field_struct_name = filter_path.value[0];
      const stmt = arrow(() => {
        switch (field_struct_name) {
          case "str":
          case "lstr":
          case "clob": {
            return `MAX(CASE WHEN (${path_name_expression} = '${flattened_path.join(
              "."
            )}') THEN (v${val_ref}.text_value) END) AS '${flattened_path.join(
              "."
            )}'`;
          }
          case "i32":
          case "u32":
          case "i64":
          case "u64": {
            return `MAX(CASE WHEN (${path_name_expression} = '${flattened_path.join(
              "."
            )}') THEN (v${val_ref}.integer_value) END) AS '${flattened_path.join(
              "."
            )}'`;
          }
          case "idouble":
          case "udouble":
          case "idecimal":
          case "udecimal": {
            return `MAX(CASE WHEN (${path_name_expression} = '${flattened_path.join(
              "."
            )}') THEN (v${val_ref}.real_value) END) AS '${flattened_path.join(
              "."
            )}'`;
          }
          case "bool": {
            return `MAX(CASE WHEN (${path_name_expression} = '${flattened_path.join(
              "."
            )}') THEN (v${val_ref}.integer_value) END) AS '${flattened_path.join(
              "."
            )}'`;
          }
          case "date":
          case "time":
          case "timestamp": {
            return `MAX(CASE WHEN (${path_name_expression} = '${flattened_path.join(
              "."
            )}') THEN (v${val_ref}.integer_value) END) AS '${flattened_path.join(
              "."
            )}'`;
          }
          case "other": {
            return `MAX(CASE WHEN (${path_name_expression} = '${flattened_path.join(
              "."
            )}') THEN (v${val_ref}.integer_value) END) AS '${flattened_path.join(
              "."
            )}'`;
          }
          default: {
            const _exhaustiveCheck: never = field_struct_name;
            return _exhaustiveCheck;
          }
        }
      });
      append_to_select_stmt(stmt);
    }
    for (let intermediate_path of intermediate_paths) {
      const var_ref: number = (intermediate_path.length() - 1) * 2 + 1;
      append_to_select_stmt(
        `MAX(CASE WHEN(${get_path_name_expression(
          intermediate_path.length()
        )} = '${intermediate_path
          .toArray()
          .join(".")}') THEN (v${var_ref}.id) END) AS '${intermediate_path
          .toArray()
          .join(".")}'`
      );
      append_to_select_stmt(
        `MAX(CASE WHEN(${get_path_name_expression(
          intermediate_path.length()
        )} = '${intermediate_path.toArray().join(".")}') THEN (v${
          var_ref + 1
        }.field_struct_name) END) AS '${intermediate_path
          .toArray()
          .join(".")}._struct_name'`
      );
      append_to_select_stmt(
        `MAX(CASE WHEN(${get_path_name_expression(
          intermediate_path.length()
        )} = '${intermediate_path
          .toArray()
          .join(".")}') THEN (v${var_ref}.active) END) AS '${intermediate_path
          .toArray()
          .join(".")}._active'`
      );
      append_to_select_stmt(
        `MAX(CASE WHEN(${get_path_name_expression(
          intermediate_path.length()
        )} = '${intermediate_path
          .toArray()
          .join(
            "."
          )}') THEN (v${var_ref}.created_at) END) AS '${intermediate_path
          .toArray()
          .join(".")}._created_at'`
      );
      append_to_select_stmt(
        `MAX(CASE WHEN(${get_path_name_expression(
          intermediate_path.length()
        )} = '${intermediate_path
          .toArray()
          .join(
            "."
          )}') THEN (v${var_ref}.updated_at) END) AS '${intermediate_path
          .toArray()
          .join(".")}._updated_at'`
      );
      if (intermediate_path.length() > 1) {
        for (let i = intermediate_path.length(); i > 0; i--) {
          const temp_path = Vector.ofIterable(
            intermediate_path.toArray().slice(0, i)
          );
          if (
            !intermediate_paths.contains(temp_path) &&
            !HashSet.ofIterable(
              init_filter.filter_paths.map((filter_path) =>
                Vector.ofIterable(get_flattened_path(filter_path.path))
              )
            ).contains(temp_path)
          ) {
            const temp_var_ref: number =
              (intermediate_path.length() - 1) * 2 + 1;
            append_to_select_stmt(
              `MAX(CASE WHEN(${get_path_name_expression(
                intermediate_path.length()
              )} = '${intermediate_path
                .toArray()
                .join(
                  "."
                )}') THEN (v${temp_var_ref}.id) END) AS '${intermediate_path
                .toArray()
                .join(".")}'`
            );
            append_to_select_stmt(
              `MAX(CASE WHEN(${get_path_name_expression(
                intermediate_path.length()
              )} = '${intermediate_path
                .toArray()
                .join(
                  "."
                )}') THEN (v${temp_var_ref}.active) END) AS '${intermediate_path
                .toArray()
                .join(".")}._active'`
            );
            append_to_select_stmt(
              `MAX(CASE WHEN(${get_path_name_expression(
                intermediate_path.length()
              )} = '${intermediate_path
                .toArray()
                .join(
                  "."
                )}') THEN (v${temp_var_ref}.created_at) END) AS '${intermediate_path
                .toArray()
                .join(".")}._created_at'`
            );
            append_to_select_stmt(
              `MAX(CASE WHEN(${get_path_name_expression(
                intermediate_path.length()
              )} = '${intermediate_path
                .toArray()
                .join(
                  "."
                )}') THEN (v${temp_var_ref}.updated_at) END) AS '${intermediate_path
                .toArray()
                .join(".")}._updated_at'`
            );
          }
        }
      }
    }
  });

  let where_stmt: string = "WHERE ";
  const append_to_where_stmt = (stmt: string) => {
    where_stmt += arrow(() => {
      if (where_stmt === "WHERE ") {
        return `(${stmt})`;
      } else {
        return `\n AND (${stmt})`;
      }
    });
  };

  if (level !== undefined) {
    const value: Decimal = level;
    let stmt = `v1.level = '${value.abs().truncated().toString()}'`;
    append_to_where_stmt(stmt);
  }
  append_to_where_stmt(`v1.struct_name = '${struct.name}'`);
  append_to_where_stmt(`v1.active = ${active ? "1" : "0"}`);

  let from_stmt: string =
    "FROM vars AS v1 LEFT JOIN vals as v2 ON (v2.level <= v1.level AND v2.struct_name = v1.struct_name AND v2.variable_id = v1.id)";
  append_to_where_stmt(
    `v1.level = (SELECT MAX(vars.level) FROM vars INNER JOIN levels ON (vars.level = levels.id) LEFT JOIN removed_vars ON(removed_vars.level = vars.level AND removed_vars.struct_name = vars.struct_name AND removed_vars.id = vars.id) WHERE  levels.active = 1 AND vars.struct_name = v1.struct_name AND vars.id = v1.id AND removed_vars.id IS NULL)`
  );
  append_to_where_stmt(
    `v2.level = (SELECT MAX(vals.level) FROM vals INNER JOIN levels ON (vals.level = levels.id) LEFT JOIN removed_vars ON(removed_vars.level = vals.level AND removed_vars.struct_name = vals.struct_name AND removed_vars.id = vals.variable_id) WHERE levels.active = 1 AND vals.struct_name = v2.struct_name AND vals.variable_id = v2.variable_id AND vals.field_name = v2.field_name AND removed_vars.id IS NULL)`
  );

  for (let i = 1; i < join_count; i++) {
    let var_ref = i * 2 + 1;
    const prev_val_ref = var_ref - 1;
    const next_val_ref = var_ref + 1;
    from_stmt += `\n LEFT JOIN vars AS v${var_ref} ON (v${var_ref}.level <= v${prev_val_ref}.level AND v${var_ref}.struct_name = v${prev_val_ref}.field_struct_name AND  v${var_ref}.id = v${prev_val_ref}.integer_value)`;
    from_stmt += `\n LEFT JOIN vals AS v${next_val_ref} ON (v${next_val_ref}.level <= v${var_ref}.level AND v${next_val_ref}.struct_name = v${var_ref}.struct_name AND v${next_val_ref}.variable_id = v${var_ref}.id)`;
    append_to_where_stmt(
      `v${var_ref}.level IS NULL OR v${var_ref}.level = (SELECT MAX(vars.level) FROM vars INNER JOIN levels ON (vars.level = levels.id) LEFT JOIN removed_vars ON(removed_vars.level = vars.level AND removed_vars.struct_name = vars.struct_name AND removed_vars.id = vars.id) WHERE  levels.active = 1 AND vars.struct_name = v${var_ref}.struct_name AND vars.id = v${var_ref}.id AND removed_vars.id IS NULL)`
    );
    append_to_where_stmt(
      `v${next_val_ref}.level IS NULL OR v${next_val_ref}.level = (SELECT MAX(vals.level) FROM vals INNER JOIN levels ON (vals.level = levels.id) LEFT JOIN removed_vars ON(removed_vars.level = vals.level AND removed_vars.struct_name = vals.struct_name AND removed_vars.id = vals.variable_id) WHERE levels.active = 1 AND vals.struct_name = v${next_val_ref}.struct_name AND vals.variable_id = v${next_val_ref}.variable_id AND vals.field_name = v${next_val_ref}.field_name AND removed_vars.id IS NULL)`
    );
  }

  apply(
    init_filter.filter_paths
      .toArray()
      .map((filter_path) => {
        const path: PathString = filter_path.path;
        const flattened_path: ReadonlyArray<string> = get_flattened_path(path);
        let stmt = path[0]
          .map((field_name, i) => `v${i * 2 + 2}.field_name = '${path[0][i]}'`)
          .join(" AND ");
        const field_struct_name = apply(filter_path.value[0], (it) => {
          if (filter_path.value[0] === "other") {
            return filter_path.value[2].name;
          }
          return it;
        });
        if (stmt !== "") {
          stmt += " AND ";
        }
        stmt += `v${path[0].length * 2 + 2}.field_name = '${path[1]}' AND v${
          path[0].length * 2 + 2
        }.field_struct_name = '${field_struct_name}'`;
        return `(${stmt})`;
      })
      .join(" OR "),
    (it) => {
      if (it !== "") {
        append_to_where_stmt(it);
      }
    }
  );

  const group_by_stmt: string = "GROUP BY v1.struct_name, v1.id";

  const args: Array<string | number> = [];
  const having_stmt: string = apply([] as Array<string>, (it) => {
    const init_filters_stmt = apply(get_filter_stmt(init_filter), (it) => {
      const [stmt, filter_args] = it;
      if (stmt !== "") {
        for (let arg of filter_args) {
          args.push(arg);
        }
      }
      return stmt;
    });
    const filters_stmt = filters
      .toArray()
      .map((x) => {
        const [stmt, filter_args] = get_filter_stmt(x);
        if (stmt !== "") {
          for (let arg of filter_args) {
            args.push(arg);
          }
        }
        return stmt;
      })
      .filter((x) => x !== "")
      .map((x) => `(${x})`)
      .join(" \nOR ");
    if (init_filters_stmt !== "") {
      it.push(`(${init_filters_stmt})`);
    }
    if (filters_stmt !== "") {
      it.push(`(${filters_stmt})`);
    }
    const combined_filter_stmt = it.join(" AND ");
    if (combined_filter_stmt !== "") {
      return `HAVING ${combined_filter_stmt}`;
    }
    return "";
  });

  let order_by_stmt: string = "ORDER BY ";
  const append_to_order_by_stmt = (stmt: string) => {
    order_by_stmt += arrow(() => {
      if (order_by_stmt === "ORDER BY ") {
        return stmt;
      } else {
        return `, ${stmt}`;
      }
    });
  };
  apply(
    init_filter.filter_paths
      .toArray()
      .map((filter_path) => ({
        path: get_flattened_path(filter_path.path),
        sort_option: filter_path.ordering,
      }))
      .filter((path_filter) => path_filter.sort_option !== undefined)
      .sort((a, b) => {
        if (a.sort_option !== undefined && b.sort_option !== undefined) {
          if (a.sort_option[0] < b.sort_option[0]) {
            return -1;
          } else if (a.sort_option[0] > b.sort_option[0]) {
            return 1;
          } else {
            const path_a: string = a.path.join(".");
            const path_b: string = a.path.join(".");
            if (path_a < path_b) {
              return -1;
            } else if (path_a > path_b) {
              return 1;
            } else {
              return 0;
            }
          }
        }
        return 0;
      }),
    (path_filters) => {
      for (let path_filter of path_filters) {
        if (path_filter.sort_option !== undefined) {
          const path: ReadonlyArray<string> = path_filter.path;
          const sort_order = path_filter.sort_option[1] ? "DESC" : "ASC";
          append_to_order_by_stmt(`"${path.join(".")}" ${sort_order}`);
        }
      }
    }
  );
  append_to_order_by_stmt(
    "v1.requested_at DESC, v1.updated_at DESC, v1.id DESC"
  );

  const limit_offset_stmt: string = `LIMIT ${limit
    .abs()
    .truncated()
    .toString()} OFFSET ${offset.abs().truncated().toString()}`;

  const final_stmt = `\n\n${select_stmt} \n\n${from_stmt} \n\n${where_stmt}  \n\n${group_by_stmt} \n\n${having_stmt} \n\n${order_by_stmt}  \n\n${limit_offset_stmt};\n\n`;
  console.log("FINAL STMT = ", final_stmt);
  console.log("ARGS:", args);
  return execute_transaction(final_stmt, args);
}

function get_filter_stmt(
  filter: Filter
): [string, ReadonlyArray<string | number>] {
  const args: Array<string | number> = [];
  let filter_stmt: string = "";
  const append_to_filter_stmt = (stmt: string) => {
    filter_stmt += arrow(() => {
      if (filter_stmt === "") {
        return `${stmt}`;
      } else {
        return ` AND ${stmt}`;
      }
    });
  };
  if (filter.id[0]) {
    const value = filter.id[1];
    if (value !== undefined) {
      const stmt = arrow(() => {
        const op = value[0];
        switch (op) {
          case "==":
          case "!=":
          case ">=":
          case "<=":
          case ">":
          case "<": {
            args.push(value[1].truncated().toString());
            return `v1.id ${op} ?`;
          }
          case "between":
          case "not_between": {
            args.push(value[1][0].truncated().toString());
            args.push(value[1][1].truncated().toString());
            return `v1.id ${
              op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
            } ? AND ?`;
          }
          default: {
            const _exhaustiveCheck: never = op;
            return _exhaustiveCheck;
          }
        }
      });
      append_to_filter_stmt(stmt);
    }
  }
  if (filter.created_at[0]) {
    const value = filter.created_at[1];
    if (value !== undefined) {
      const stmt = arrow(() => {
        const op = value[0];
        switch (op) {
          case "==":
          case "!=":
          case ">=":
          case "<=":
          case ">":
          case "<": {
            args.push(value[1].getTime().toString());
            return `v1.created_at ${op} ?`;
          }
          case "between":
          case "not_between": {
            args.push(value[1][0].getTime().toString());
            args.push(value[1][1].getTime().toString());
            return `v1.created_at ${
              op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
            } ? AND ?`;
          }
          default: {
            const _exhaustiveCheck: never = op;
            return _exhaustiveCheck;
          }
        }
      });
      append_to_filter_stmt(stmt);
    }
  }
  if (filter.updated_at[0]) {
    const value = filter.updated_at[1];
    if (value !== undefined) {
      const stmt = arrow(() => {
        const op = value[0];
        switch (op) {
          case "==":
          case "!=":
          case ">=":
          case "<=":
          case ">":
          case "<": {
            args.push(value[1].getTime().toString());
            return `v1.updated_at ${op} ?`;
          }
          case "between":
          case "not_between": {
            args.push(value[1][0].getTime().toString());
            args.push(value[1][1].getTime().toString());
            return `v1.updated_at ${
              op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
            } ? AND ?`;
          }
          default: {
            const _exhaustiveCheck: never = op;
            return _exhaustiveCheck;
          }
        }
      });
      append_to_filter_stmt(stmt);
    }
  }
  for (let filter_path of filter.filter_paths) {
    if (filter_path.active) {
      const [stmt, filter_path_args] = get_filter_path_stmt(filter_path);
      if (stmt !== "") {
        append_to_filter_stmt(stmt);
        for (let arg of filter_path_args) {
          args.push(arg);
        }
      }
    }
  }
  return [filter_stmt, args];
}

function get_filter_path_stmt(
  filter_path: FilterPath
): [string, ReadonlyArray<string | number>] {
  const args: Array<string | number> = [];
  let filter_path_stmt: string = "";
  const append_to_filter_path_stmt = (stmt: string) => {
    filter_path_stmt += arrow(() => {
      if (filter_path_stmt === "") {
        return `${stmt}`;
      } else {
        return ` AND ${stmt}`;
      }
    });
  };
  if (filter_path.active) {
    const path_ref: string = get_flattened_path(filter_path.path).join(".");
    const stmt = arrow(() => {
      const value = filter_path.value;
      if (value[1] !== undefined) {
        const field_struct_name = value[0];
        const get_path_ref = (x: PathString) =>
          `"${[...x[1][0], x[1][1]].join(".")}"`;
        switch (field_struct_name) {
          case "str":
          case "lstr":
          case "clob": {
            const op = value[1][0];
            switch (op) {
              case "==":
              case "!=":
              case ">=":
              case "<=":
              case ">":
              case "<":
              case "like":
              case "glob": {
                return `"${path_ref}" ${op} ${apply(value[1][1], (it) => {
                  if (typeof it === "string") {
                    if (op === "like") {
                      args.push(
                        `%${it
                          .split(" ")
                          .map((x) => x.trim())
                          .filter((x) => x !== "")
                          .join("%")}%`
                      );
                    } else if (op === "glob") {
                      args.push(
                        `*${it
                          .split(" ")
                          .map((x) => x.trim())
                          .filter((x) => x !== "")
                          .join("*")}*`
                      );
                    } else {
                      args.push(it);
                    }
                    return "?";
                  } else {
                    return get_path_ref(it[1]);
                  }
                })}`;
              }
              case "between":
              case "not_between": {
                const start_value = value[1][1][0];
                const end_value = value[1][1][1];
                return `"${path_ref}" ${
                  op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
                } ${arrow(() => {
                  if (typeof start_value === "string") {
                    if (typeof end_value === "string") {
                      args.push(start_value);
                      args.push(end_value);
                      return `? AND ?`;
                    } else {
                      args.push(start_value);
                      return `? AND ${get_path_ref(end_value[1])}`;
                    }
                  } else {
                    if (typeof end_value === "string") {
                      args.push(end_value);
                      return `${get_path_ref(start_value[1])} AND ?`;
                    } else {
                      return `${get_path_ref(
                        start_value[1]
                      )} AND ${get_path_ref(end_value[1])}`;
                    }
                  }
                })}`;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
          case "i32":
          case "u32":
          case "i64":
          case "u64":
          case "idouble":
          case "udouble":
          case "idecimal":
          case "udecimal": {
            const op = value[1][0];
            switch (op) {
              case "==":
              case "!=":
              case ">=":
              case "<=":
              case ">":
              case "<": {
                return `"${path_ref}" ${op} ${apply(value[1][1], (it) => {
                  if (is_decimal(it)) {
                    return `${it.toString()}`;
                  } else {
                    return get_path_ref(it[1]);
                  }
                })}`;
              }
              case "between":
              case "not_between": {
                const start_value = value[1][1][0];
                const end_value = value[1][1][1];
                return `"${path_ref}" ${
                  op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
                } ${arrow(() => {
                  if (is_decimal(start_value)) {
                    if (is_decimal(end_value)) {
                      return `${start_value.toString()} AND ${end_value.toString()}`;
                    } else {
                      return `${start_value.toString()} AND ${get_path_ref(
                        end_value[1]
                      )}`;
                    }
                  } else {
                    if (is_decimal(end_value)) {
                      return `${get_path_ref(
                        start_value[1]
                      )} AND ${end_value.toString()}`;
                    } else {
                      return `${get_path_ref(
                        start_value[1]
                      )} AND ${get_path_ref(end_value[1])}`;
                    }
                  }
                })}`;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
          case "bool": {
            const op = value[1][0];
            switch (op) {
              case "==":
              case "!=": {
                return `"${path_ref}" ${op} ${apply(value[1][1], (it) => {
                  if (typeof it === "boolean") {
                    return `${it ? "1" : "0"}`;
                  } else {
                    return get_path_ref(it[1]);
                  }
                })}`;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
          case "date":
          case "time":
          case "timestamp": {
            const op = value[1][0];
            switch (op) {
              case "==":
              case "!=":
              case ">=":
              case "<=":
              case ">":
              case "<": {
                return `"${path_ref}" ${op} ${apply(value[1][1], (it) => {
                  if (it instanceof Date) {
                    return `${it.getTime().toString()}`;
                  } else {
                    return get_path_ref(it[1]);
                  }
                })}`;
              }
              case "between":
              case "not_between": {
                const start_value = value[1][1][0];
                const end_value = value[1][1][1];
                return `"${path_ref}" ${
                  op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
                } ${arrow(() => {
                  if (start_value instanceof Date) {
                    if (end_value instanceof Date) {
                      return `${start_value
                        .getTime()
                        .toString()} AND ${end_value.getTime().toString()}`;
                    } else {
                      return `${start_value
                        .getTime()
                        .toString()} AND ${get_path_ref(end_value[1])}`;
                    }
                  } else {
                    if (end_value instanceof Date) {
                      return `${get_path_ref(start_value[1])} AND ${end_value
                        .getTime()
                        .toString()}`;
                    } else {
                      return `${get_path_ref(
                        start_value[1]
                      )} AND ${get_path_ref(end_value[1])}`;
                    }
                  }
                })}`;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
          case "other": {
            const op = value[1][0];
            switch (op) {
              case "==":
              case "!=": {
                return `"${path_ref}" ${op} ${apply(value[1][1], (it) => {
                  if (is_decimal(it)) {
                    return `${it.truncated().toString()}`;
                  } else {
                    return get_path_ref(it[1]);
                  }
                })}`;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
          default: {
            const _exhaustiveCheck: never = field_struct_name;
            return _exhaustiveCheck;
          }
        }
      }
    });
    if (stmt !== undefined) {
      append_to_filter_path_stmt(stmt);
    }
  }
  return [filter_path_stmt, args];
}

export async function get_max_level(): Promise<Result<Decimal>> {
  try {
    const result_set = await execute_transaction(
      `SELECT MAX("id") AS "max_id" FROM "LEVELS";`,
      []
    );
    if (result_set.rows.length == 1) {
      const result = result_set.rows._array[0];
      if ("max_id" in result) {
        return new Ok(new Decimal(result["max_id"]).abs().truncated());
      }
    }
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

export async function create_level(id: Decimal): Promise<Result<[]>> {
  try {
    await execute_transaction(
      `INSERT INTO "LEVELS"("id", "created_at") VALUES (?, ?);`,
      [id.abs().truncated().toString(), new Date().getTime().toString()]
    );
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok([] as []);
}

export async function activate_level(id: Decimal): Promise<Result<[]>> {
  try {
    await execute_transaction(`UPDATE "LEVELS" SET active = 1 WHERE id = ?;`, [
      id.abs().truncated().toString(),
    ]);
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok([] as []);
}

export async function deactivate_level(id: Decimal): Promise<Result<[]>> {
  try {
    await execute_transaction(`UPDATE "LEVELS" SET active = 0 WHERE id = ?;`, [
      id.abs().truncated().toString(),
    ]);
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok([] as []);
}

export async function remove_level(id: Decimal): Promise<Result<[]>> {
  try {
    await execute_transaction(`DELETE FROM "LEVELS" WHERE id = ?;`, [
      id.abs().truncated().toString(),
    ]);
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok([] as []);
}

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
): Promise<Result<[]>> {
  const q = await execute_transaction("SELECT COUNT(*) FROM VALS;", []);
  console.log(q);
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
    } catch (e) {}
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
        } catch (e) {}
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
  const x = await execute_transaction("SELECT COUNT(*) FROM VALS;", []);
  console.log(x);
  const r = await execute_transaction("SELECT * FROM VALS;", []);
  console.log(r);
  const w = await execute_transaction("SELECT * FROM VARS;", []);
  console.log(w);
  return new Ok([] as []);
}

async function remove_variables_in_db(
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
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok([] as []);
}

export async function replace_param(
  name: string,
  value:
    | {
        type: "str" | "lstr" | "clob";
        value: string;
      }
    | {
        type:
          | "i32"
          | "u32"
          | "i64"
          | "u64"
          | "idouble"
          | "udouble"
          | "idecimal"
          | "udecimal";
        value: Decimal;
      }
    | {
        type: "bool";
        value: boolean;
      }
    | {
        type: "date" | "time" | "timestamp";
        value: Date;
      }
    | {
        type: "other";
        other: string;
        value: Decimal;
      }
): Promise<Result<[]>> {
  try {
    switch (value.type) {
      case "str":
      case "lstr":
      case "clob": {
        await execute_transaction(
          `REPLACE INTO "PARAMS"("name", "field_struct_name", "text_value") VALUES (?, ?, ?);`,
          [name, value.type, value.value]
        );
        break;
      }
      case "i32":
      case "u32":
      case "i64":
      case "u64": {
        await execute_transaction(
          `REPLACE INTO "PARAMS"("name", "field_struct_name", "integer_value") VALUES (?, ?, ?);`,
          [name, value.type, value.value.truncated().toString()]
        );
        break;
      }
      case "idouble":
      case "udouble":
      case "idecimal":
      case "udecimal": {
        await execute_transaction(
          `REPLACE INTO "PARAMS"("name", "field_struct_name", "real_value") VALUES (?, ?, ?);`,
          [name, value.type, value.value.toString()]
        );
        break;
      }
      case "bool": {
        await execute_transaction(
          `REPLACE INTO "PARAMS"("name", "field_struct_name", "integer_value") VALUES (?, ?, ?);`,
          [name, value.type, value.value ? "1" : "0"]
        );
        break;
      }
      case "date":
      case "time":
      case "timestamp": {
        await execute_transaction(
          `REPLACE INTO "PARAMS"("name", "field_struct_name", "integer_value") VALUES (?, ?, ?);`,
          [name, value.type, value.value.getTime().toString()]
        );
        break;
      }
      case "other": {
        await execute_transaction(
          `REPLACE INTO "PARAMS"("name", "field_struct_name", "integer_value") VALUES (?, ?, ?);`,
          [name, value.other, value.value.truncated().toString()]
        );
        break;
      }
      default: {
        const _exhaustiveCheck: never = value;
        return _exhaustiveCheck;
      }
    }
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok([] as []);
}

export async function get_param_text(name: string): Promise<Result<string>> {
  try {
    const result_set = await execute_transaction(
      `SELECT name, field_struct_name, text_value FROM params WHERE name = ? AND text_value IS NOT NULL`,
      [name]
    );
    if (result_set.rows.length == 1) {
      const result = result_set.rows._array[0];
      if ("text_value" in result) {
        return new Ok(String(result["text_value"]));
      }
    }
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

export async function get_param_integer(
  name: string
): Promise<Result<Decimal>> {
  try {
    const result_set = await execute_transaction(
      `SELECT name, field_struct_name, integer_value FROM params WHERE name = ? AND integer_value IS NOT NULL`,
      [name]
    );
    if (result_set.rows.length == 1) {
      const result = result_set.rows._array[0];
      if ("integer_value" in result) {
        return new Ok(new Decimal(result["integer_value"]).truncated());
      }
    }
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

export async function get_param_decimal(
  name: string
): Promise<Result<Decimal>> {
  try {
    const result_set = await execute_transaction(
      `SELECT name, field_struct_name, real_value FROM params WHERE name = ? AND real_value IS NOT NULL`,
      [name]
    );
    if (result_set.rows.length == 1) {
      const result = result_set.rows._array[0];
      if ("real_value" in result) {
        return new Ok(new Decimal(result["real_value"]));
      }
    }
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

export async function get_param_boolean(
  name: string
): Promise<Result<boolean>> {
  try {
    const result_set = await execute_transaction(
      `SELECT name, field_struct_name, integer_value FROM params WHERE name = ? AND integer_value IS NOT NULL`,
      [name]
    );
    if (result_set.rows.length == 1) {
      const result = result_set.rows._array[0];
      if ("integer_value" in result) {
        return new Ok(new Decimal(result["integer_value"]) === new Decimal(1));
      }
    }
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

export async function get_param_date(name: string): Promise<Result<Date>> {
  try {
    const result_set = await execute_transaction(
      `SELECT name, field_struct_name, integer_value FROM params WHERE name = ? AND integer_value IS NOT NULL`,
      [name]
    );
    if (result_set.rows.length == 1) {
      const result = result_set.rows._array[0];
      if ("integer_value" in result) {
        return new Ok(
          new Date(
            new Decimal(result["integer_value"]).abs().truncated().toNumber()
          )
        );
      }
    }
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

export async function get_param_other(
  name: string
): Promise<Result<[string, Decimal]>> {
  try {
    const result_set = await execute_transaction(
      `SELECT name, field_struct_name, integer_value FROM params WHERE name = ? AND integer_value IS NOT NULL`,
      [name]
    );
    if (result_set.rows.length == 1) {
      const result = result_set.rows._array[0];
      if ("field_struct_name" in result && "integer_value" in result) {
        return new Ok([
          String(result["field_struct_name"]),
          new Decimal(result["integer_value"]).truncated(),
        ] as [string, Decimal]);
      }
    }
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

export async function get_struct_counter(
  name: string
): Promise<Result<Decimal>> {
  try {
    const result_set = await execute_transaction(
      `SELECT struct_name, count FROM counters WHERE struct_name = ?`,
      [name]
    );
    if (result_set.rows.length == 1) {
      const result = result_set.rows._array[0];
      if ("count" in result) {
        return new Ok(new Decimal(result["count"]).abs().truncated());
      }
    } else {
      try {
        const result_set = await execute_transaction(
          `REPLACE INTO "COUNTERS" ("struct_name", "count") VALUES(?, 2)`,
          [name]
        );
        return new Ok(new Decimal(2));
      } catch (err) {
        return new Err(
          new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg)
        );
      }
    }
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

export async function increment_struct_counter(
  name: string
): Promise<Result<[]>> {
  try {
    const result_set = await execute_transaction(
      `UPDATE "COUNTERS" SET count = count + 1 WHERE struct_name = ?`,
      [name]
    );
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok([] as []);
}

export async function get_variables(
  struct: Struct,
  active: boolean,
  level: Decimal | undefined,
  init_filter: Filter,
  filters: HashSet<Filter>,
  limit: Decimal,
  offset: Decimal
): Promise<Result<Array<Variable>>> {
  try {
    const variables: Array<Variable> = [];
    const result_set = await query(
      struct,
      active,
      level,
      init_filter,
      filters,
      limit,
      offset
    );
    console.log(result_set);
    for (let result of result_set.rows._array) {
      try {
        const paths: Array<Path> = [];
        for (let filter_path of init_filter.filter_paths) {
          const label = filter_path.label;
          const path: ReadonlyArray<string> = get_flattened_path(
            filter_path.path
          );
          if (path.length !== 0) {
            const init: ReadonlyArray<string> = path.slice(0, path.length - 1);
            const last: string = path[path.length - 1];
            const init_path: Array<
              [
                string,
                {
                  struct: Struct;
                  id: Decimal;
                  active: boolean;
                  created_at: Date;
                  updated_at: Date;
                }
              ]
            > = [];
            for (let [index, field_name] of init.entries()) {
              const ref: string = init.slice(0, index + 1).join(".");
              const ref_struct_name = new String(
                result[`${ref}._struct_name`]
              ).valueOf();
              const ref_struct: OptionTS<Struct> = get_structs()
                .filter((x) => x.name === ref_struct_name)
                .single();
              if (ref_struct.isSome()) {
                init_path.push([
                  field_name,
                  {
                    struct: ref_struct.get(),
                    id: new Decimal(result[`${ref}`]).truncated(),
                    active: new Decimal(result[`${ref}._active`]).equals(1),
                    created_at: new Date(result[`${ref}._created_at`]),
                    updated_at: new Date(result[`${ref}._updated_at`]),
                  },
                ]);
              } else {
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            }
            const leaf: [string, StrongEnum] = arrow(() => {
              const ref: string = init.join(".");
              const field_struct_name = filter_path.value[0];
              switch (field_struct_name) {
                case "str":
                case "lstr":
                case "clob": {
                  return [
                    last,
                    {
                      type: field_struct_name,
                      value: arrow(() => {
                        if (ref === "") {
                          return new String(result[`${last}`]).valueOf();
                        } else {
                          return new String(result[`${ref}.${last}`]).valueOf();
                        }
                      }),
                    },
                  ] as [string, StrongEnum];
                }
                case "i32":
                case "u32":
                case "i64":
                case "u64":
                case "idouble":
                case "udouble":
                case "idecimal":
                case "udecimal": {
                  return [
                    last,
                    {
                      type: field_struct_name,
                      value: arrow(() => {
                        const integer_fields = ["i32", "u32", "i64", "u64"];
                        return arrow(() => {
                          if (integer_fields.includes(field_struct_name)) {
                            if (ref === "") {
                              return new Decimal(result[`${last}`]).truncated();
                            } else {
                              return new Decimal(
                                result[`${ref}.${last}`]
                              ).truncated();
                            }
                          } else {
                            if (ref === "") {
                              return new Decimal(result[`${last}`]);
                            } else {
                              return new Decimal(result[`${ref}.${last}`]);
                            }
                          }
                        });
                      }),
                    },
                  ] as [string, StrongEnum];
                }
                case "bool": {
                  return [
                    last,
                    {
                      type: field_struct_name,
                      value: arrow(() => {
                        if (ref === "") {
                          return new Decimal(result[`${last}`]).equals(1);
                        } else {
                          return new Decimal(result[`${ref}.${last}`]).equals(
                            1
                          );
                        }
                      }),
                    },
                  ] as [string, StrongEnum];
                }
                case "date":
                case "time":
                case "timestamp": {
                  return [
                    last,
                    {
                      type: field_struct_name,
                      value: arrow(() => {
                        if (ref === "") {
                          return new Date(result[`${last}`]);
                        } else {
                          return new Date(result[`${ref}.${last}`]);
                        }
                      }),
                    },
                  ] as [string, StrongEnum];
                }
                case "other": {
                  const field_struct_name = filter_path.value[2].name;
                  return [
                    last,
                    {
                      type: "other",
                      other: field_struct_name,
                      value: arrow(() => {
                        if (ref === "") {
                          return new Decimal(result[`${last}`]).truncated();
                        } else {
                          return new Decimal(
                            result[`${ref}.${last}`]
                          ).truncated();
                        }
                      }),
                    },
                  ] as [string, StrongEnum];
                }
                default: {
                  const _exhaustiveCheck: never = field_struct_name;
                  return _exhaustiveCheck;
                }
              }
            });
            paths.push(new Path(label, [init_path, leaf]));
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        }
        variables.push(
          new Variable(
            struct,
            new Decimal(result["_id"]).truncated(),
            new Decimal(result["_active"]).equals(1),
            new Date(result["_created_at"]),
            new Date(result["_updated_at"]),
            HashSet.ofIterable(paths)
          )
        );
      } catch (err) {
        console.log("SOMOMOMOMOMOEETTHHIINNNGG1111111111111", err);
      }
    }
    return new Ok(variables);
  } catch (err) {
    console.log("SOMOMOMOMOMOEETTHHIINNNGG", err);
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
}

export async function get_variable(
  struct: Struct,
  active: boolean,
  level: Decimal | undefined,
  id: Decimal,
  filter_paths: HashSet<FilterPath>
): Promise<Result<Variable>> {
  try {
    const result = await get_variables(
      struct,
      active,
      level,
      new Filter(
        0,
        [true, ["==", id]],
        [false, undefined],
        [false, undefined],
        filter_paths
      ),
      HashSet.of(),
      new Decimal(1),
      new Decimal(0)
    );
    if (unwrap(result)) {
      if (result.value.length === 1) {
        return new Ok(result.value[0]);
      }
    }
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

export async function replace_variable(
  level: Decimal,
  variable: Variable,
  requested_at: Date = new Date()
): Promise<Result<[]>> {
  try {
    await replace_variable_in_db(
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
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok([] as []);
}

export async function replace_variables(
  level: Decimal,
  variables: HashSet<Variable>,
  requested_at: Date = new Date()
): Promise<Result<[]>> {
  try {
    for (let variable of variables) {
      await replace_variable(level, variable, requested_at);
    }
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok([] as []);
}

export async function remove_variables(
  level: Decimal,
  struct: Struct,
  variables: HashSet<Variable>
): Promise<Result<[]>> {
  try {
    await remove_variables_in_db(
      level,
      struct.name,
      variables.toArray().map((x) => x.id)
    );
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok([] as []);
}

///////////////////////////////////

type FilterPathValue =
  | [
      "str" | "lstr" | "clob",
      (
        | [
            "==" | "!=" | ">=" | "<=" | ">" | "<" | "like" | "glob",
            string | [string, PathString]
          ]
        | undefined
      )
    ]
  | [
      "str" | "lstr" | "clob",
      (
        | [
            "between" | "not_between",
            [string | [string, PathString], string | [string, PathString]]
          ]
        | undefined
      )
    ]
  | [
      (
        | "i32"
        | "u32"
        | "i64"
        | "u64"
        | "idouble"
        | "udouble"
        | "idecimal"
        | "udecimal"
      ),
      (
        | [
            "==" | "!=" | ">=" | "<=" | ">" | "<",
            Decimal | [string, PathString]
          ]
        | undefined
      )
    ]
  | [
      (
        | "i32"
        | "u32"
        | "i64"
        | "u64"
        | "idouble"
        | "udouble"
        | "idecimal"
        | "udecimal"
      ),
      (
        | [
            "between" | "not_between",
            [Decimal | [string, PathString], Decimal | [string, PathString]]
          ]
        | undefined
      )
    ]
  | ["bool", ["==" | "!=", boolean | [string, PathString]] | undefined]
  | [
      "date" | "time" | "timestamp",
      (
        | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date | [string, PathString]]
        | undefined
      )
    ]
  | [
      "date" | "time" | "timestamp",
      (
        | [
            "between" | "not_between",
            [Date | [string, PathString], Date | [string, PathString]]
          ]
        | undefined
      )
    ]
  | [
      "other",
      ["==" | "!=", Decimal | [string, PathString]] | undefined,
      Struct
    ];

export class FilterPath {
  label: string;
  active: boolean = false;
  path: PathString;
  value: FilterPathValue;
  ordering: [Decimal, boolean] | undefined;

  constructor(
    label: string,
    path: PathString,
    value: FilterPathValue,
    ordering: [Decimal, boolean] | undefined
  ) {
    this.label = label;
    this.path = path;
    this.value = value;
    this.ordering = ordering;
  }

  equals(other: FilterPath): boolean {
    if (!other) {
      return false;
    }
    return compare_paths(this.path, other.path);
  }

  hashCode(): number {
    return 0;
  }

  toString(): string {
    return String({
      path: this.path,
      value: this.value,
    });
  }
}

export class Filter {
  index: number;
  id: [
    boolean,
    (
      | ["==" | "!=" | ">=" | "<=" | ">" | "<", Decimal]
      | ["between" | "not_between", [Decimal, Decimal]]
      | undefined
    )
  ];
  created_at: [
    boolean,
    (
      | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
      | ["between" | "not_between", [Date, Date]]
      | undefined
    )
  ];
  updated_at: [
    boolean,
    (
      | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
      | ["between" | "not_between", [Date, Date]]
      | undefined
    )
  ];
  filter_paths: HashSet<FilterPath>;

  constructor(
    index: number,
    id: [
      boolean,
      (
        | ["==" | "!=" | ">=" | "<=" | ">" | "<", Decimal]
        | ["between" | "not_between", [Decimal, Decimal]]
        | undefined
      )
    ],
    created_at: [
      boolean,
      (
        | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
        | ["between" | "not_between", [Date, Date]]
        | undefined
      )
    ],
    updated_at: [
      boolean,
      (
        | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
        | ["between" | "not_between", [Date, Date]]
        | undefined
      )
    ],
    filter_paths: HashSet<FilterPath>
  ) {
    this.index = index;
    this.id = id;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.filter_paths = filter_paths;
  }

  equals(other: Filter): boolean {
    if (!other) {
      return false;
    }
    return this.index === other.index;
  }

  hashCode(): number {
    return 0;
  }

  toString(): string {
    return "";
  }

  clone() {
    return new Filter(
      this.index,
      this.id,
      this.created_at,
      this.updated_at,
      this.filter_paths
    );
  }
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
        // new Variable(
        //   struct.value,
        //   new Decimal(2),
        //   true,
        //   new Date(),
        //   new Date(),
        //   HashSet.ofIterable([
        //     new Path("NICKNAME", [
        //       [],
        //       ["nickname", { type: "str", value: "NUMBER FOUR" }],
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
        //       ["product_count", { type: "u32", value: new Decimal(34) }],
        //     ]),
        //   ])
        // ),
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
  await load_users();
  await load_tests();
  // const x = await execute_transaction("SELECT * FROM VARS;", []);
  // console.log(x);
  // console.log("-------------------------------------");
  // const y = await execute_transaction("SELECT * FROM VALS;", []);
  // console.log(y);
}
