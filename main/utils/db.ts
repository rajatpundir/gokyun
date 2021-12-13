import { useState } from "react";
import { getState, subscribe } from "./store";
import * as SQLite from "expo-sqlite";
import {
  apply,
  CustomError,
  Err,
  fold,
  is_decimal,
  Ok,
  Result,
  unwrap,
} from "./prelude";
import Decimal from "decimal.js";
import {
  compare_paths,
  Path,
  PathString,
  StrongEnum,
  Struct,
  Variable,
} from "./variable";
import { ErrMsg, errors } from "./errors";
import { HashSet, Vector, Option as OptionTS } from "prelude-ts";
import { get_struct, get_structs } from "./schema";

// TODO. n per group should be performed, so that we get (struct_name, id) combination with max level
// We could also have the HAVING clause eliminate possibility of nulls for aggregate column aliases
// We will also need functions for activating or deactivating variable in a layer

const db_name: string = "test1.db";

const db = apply(SQLite.openDatabase(db_name), (db) => {
  db.exec(
    [
      { sql: "PRAGMA journal_mode = WAL;", args: [] },
      { sql: "PRAGMA synchronous = 1;", args: [] },
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
  args: Array<string>
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

export type PathFilter =
  | [
      ReadonlyArray<string>,
      "str" | "lstr" | "clob",
      [Decimal, boolean] | undefined,
      ReadonlyArray<
        | [
            "==" | "!=" | ">=" | "<=" | ">" | "<" | "like" | "glob",
            string | ReadonlyArray<string>
          ]
        | undefined
      >
    ]
  | [
      ReadonlyArray<string>,
      "str" | "lstr" | "clob",
      [Decimal, boolean] | undefined,
      ReadonlyArray<
        | [
            "between" | "not_between",
            [string | ReadonlyArray<string>, string | ReadonlyArray<string>]
          ]
        | undefined
      >
    ]
  | [
      ReadonlyArray<string>,
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
      [Decimal, boolean] | undefined,
      ReadonlyArray<
        | [
            "==" | "!=" | ">=" | "<=" | ">" | "<",
            Decimal | ReadonlyArray<string>
          ]
        | undefined
      >
    ]
  | [
      ReadonlyArray<string>,
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
      [Decimal, boolean] | undefined,
      ReadonlyArray<
        | [
            "between" | "not_between",
            [Decimal | ReadonlyArray<string>, Decimal | ReadonlyArray<string>]
          ]
        | undefined
      >
    ]
  | [
      ReadonlyArray<string>,
      "bool",
      [Decimal, boolean] | undefined,
      ReadonlyArray<["==" | "!=", boolean | ReadonlyArray<string>] | undefined>
    ]
  | [
      ReadonlyArray<string>,
      "date" | "time" | "timestamp",
      [Decimal, boolean] | undefined,
      ReadonlyArray<
        | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date | ReadonlyArray<string>]
        | undefined
      >
    ]
  | [
      ReadonlyArray<string>,
      "date" | "time" | "timestamp",
      [Decimal, boolean] | undefined,
      ReadonlyArray<
        | [
            "between" | "not_between",
            [Date | ReadonlyArray<string>, Date | ReadonlyArray<string>]
          ]
        | undefined
      >
    ]
  | [
      ReadonlyArray<string>,
      "other",
      [Decimal, boolean] | undefined,
      ReadonlyArray<["==" | "!=", Decimal | ReadonlyArray<string>] | undefined>,
      string
    ];

export function query(
  struct_name: string,
  variable_filters: {
    active: boolean;
    level: Decimal | undefined;
    id: ReadonlyArray<
      | ["==" | "!=" | ">=" | "<=" | ">" | "<", Decimal]
      | ["between" | "not_between", [Decimal, Decimal]]
      | undefined
    >;
    created_at: ReadonlyArray<
      | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
      | ["between" | "not_between", [Date, Date]]
      | undefined
    >;
    updated_at: ReadonlyArray<
      | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
      | ["between" | "not_between", [Date, Date]]
      | undefined
    >;
  },
  path_filters: ReadonlyArray<PathFilter>,
  limit_offset: [Decimal, Decimal] | undefined
): Promise<SQLite.SQLResultSet> {
  const join_count: number = fold(0, path_filters, (acc, val) =>
    Math.max(acc, val[0].length)
  );

  let select_stmt: string = "SELECT \n";
  const append_to_select_stmt = (stmt: string) => {
    select_stmt += apply(undefined, () => {
      if (select_stmt === "SELECT \n") {
        return ` ${stmt}`;
      } else {
        return `,\n ${stmt}`;
      }
    });
  };
  apply(undefined, () => {
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
  apply(undefined, () => {
    let intermediate_paths = HashSet.of<Vector<string>>();
    path_filters.map((path_filter) => {
      const path: ReadonlyArray<string> = path_filter[0];
      const path_name_expression = get_path_name_expression(path.length);
      if (path.length > 1) {
        const intermediate_path = Vector.ofIterable(
          path.slice(0, path.length - 1)
        );
        intermediate_paths = intermediate_paths.add(intermediate_path);
      }
      const val_ref: number = path.length * 2;
      const field_struct_name = path_filter[1];
      const stmt = apply(undefined, () => {
        switch (field_struct_name) {
          case "str":
          case "lstr":
          case "clob": {
            return `MAX(CASE WHEN (${path_name_expression} = '${path.join(
              "."
            )}') THEN (v${val_ref}.text_value) END) AS '${path.join(".")}'`;
          }
          case "i32":
          case "u32":
          case "i64":
          case "u64": {
            return `MAX(CASE WHEN (${path_name_expression} = '${path.join(
              "."
            )}') THEN (v${val_ref}.integer_value) END) AS '${path.join(".")}'`;
          }
          case "idouble":
          case "udouble":
          case "idecimal":
          case "udecimal": {
            return `MAX(CASE WHEN (${path_name_expression} = '${path.join(
              "."
            )}') THEN (v${val_ref}.real_value) END) AS '${path.join(".")}'`;
          }
          case "bool": {
            return `MAX(CASE WHEN (${path_name_expression} = '${path.join(
              "."
            )}') THEN (v${val_ref}.integer_value) END) AS '${path.join(".")}'`;
          }
          case "date":
          case "time":
          case "timestamp": {
            return `MAX(CASE WHEN (${path_name_expression} = '${path.join(
              "."
            )}') THEN (v${val_ref}.integer_value) END) AS '${path.join(".")}'`;
          }
          case "other": {
            return `MAX(CASE WHEN (${path_name_expression} = '${path.join(
              "."
            )}') THEN (v${val_ref}.integer_value) END) AS '${path.join(".")}'`;
          }
          default: {
            const _exhaustiveCheck: never = field_struct_name;
            return _exhaustiveCheck;
          }
        }
      });
      append_to_select_stmt(stmt);
    });
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
              path_filters.map((x) => Vector.ofIterable(x[0]))
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
    where_stmt += apply(undefined, () => {
      if (where_stmt === "WHERE ") {
        return `(${stmt})`;
      } else {
        return `\n AND (${stmt})`;
      }
    });
  };

  if (variable_filters.level !== undefined) {
    const value: Decimal = variable_filters.level;
    let stmt = `v1.level = '${value.truncated().toString()}'`;
    append_to_where_stmt(stmt);
  }
  append_to_where_stmt(`v1.struct_name = '${struct_name}'`);
  append_to_where_stmt(`v1.active = ${variable_filters.active ? "1" : "0"}`);

  let from_stmt: string =
    "FROM vars AS v1 LEFT JOIN vals as v2 ON (v2.level = v1.level AND v2.struct_name = v1.struct_name AND v2.variable_id = v1.id)";
  append_to_where_stmt(
    `NOT EXISTS(SELECT 1 FROM removed_vars AS rv1 INNER JOIN levels AS rvl1 ON (rv1.level = rvl1.id) WHERE (rvl1.active = 1 AND v1.level > rv1.level AND rv1.struct_name = v1.struct_name AND rv1.id = v1.id))`
  );
  for (let i = 1; i < join_count; i++) {
    let var_ref = i * 2 + 1;
    const prev_val_ref = var_ref - 1;
    const next_val_ref = var_ref + 1;
    from_stmt += `\n LEFT JOIN vars AS v${var_ref} ON (v${var_ref}.struct_name = v${prev_val_ref}.field_struct_name AND  v${var_ref}.id = v${prev_val_ref}.integer_value)`;
    from_stmt += `\n LEFT JOIN vals AS v${next_val_ref} ON (v${next_val_ref}.level = v${var_ref}.level AND v${next_val_ref}.struct_name = v${var_ref}.struct_name AND v${next_val_ref}.variable_id = v${var_ref}.id)`;
    append_to_where_stmt(
      `IFNULL(v${prev_val_ref}.level, 0) >= IFNULL(v${var_ref}.level, 0)`
    );
    append_to_where_stmt(
      `NOT EXISTS(SELECT 1 FROM removed_vars AS rv${var_ref} INNER JOIN levels AS rvl${var_ref} ON (rv${var_ref}.level = rvl${var_ref}.id) WHERE (rvl${var_ref}.active = 1  AND v${prev_val_ref}.level > rv${var_ref}.level AND rv${var_ref}.level > v${var_ref}.level AND rv${var_ref}.struct_name = v${var_ref}.struct_name AND rv${var_ref}.id = v${var_ref}.id))`
    );
  }
  append_to_where_stmt(
    path_filters
      .map((path_filter) => {
        const path: ReadonlyArray<string> = path_filter[0];
        const path_length: number = path.length;
        let stmt = path
          .slice(0, path.length - 1)
          .map((field_name, i) => `v${i * 2 + 2}.field_name = '${path[i]}'`)
          .join(" AND ");
        const field_struct_name = apply(path_filter[1], (it) => {
          if (path_filter[1] === "other") {
            return path_filter[4];
          }
          return it;
        });
        if (stmt !== "") {
          stmt += " AND ";
        }
        stmt += `v${(path.length - 1) * 2 + 2}.field_name = '${
          path[path.length - 1]
        }' AND v${
          (path.length - 1) * 2 + 2
        }.field_struct_name = '${field_struct_name}'`;
        return `(${stmt})`;
      })
      .join(" OR ")
  );

  const where_filters_stmt: Array<Array<string>> = [];
  for (let [index, filter] of variable_filters.id.entries()) {
    let stmt: string | undefined = undefined;
    if (filter !== undefined) {
      const op = filter[0];
      switch (op) {
        case "==":
        case "!=":
        case ">=":
        case "<=":
        case ">":
        case "<": {
          const value = filter[1];
          stmt = `v1.id ${op} ${value.truncated().toString()}`;
          break;
        }
        case "between":
        case "not_between": {
          const start_value = filter[1][0];
          const end_value = filter[1][1];
          stmt = `v1.id BETWEEN ${start_value
            .truncated()
            .toString()} AND ${end_value.truncated().toString()}`;
          break;
        }
        default: {
          const _exhaustiveCheck: never = op;
          return _exhaustiveCheck;
        }
      }
      if (stmt !== undefined) {
        if (index >= where_filters_stmt.length) {
          for (let j = 0; j <= index - where_filters_stmt.length; j++) {
            where_filters_stmt.push([]);
          }
        }
        where_filters_stmt[index].push(stmt);
      }
    }
  }
  for (let [index, filter] of variable_filters.created_at.entries()) {
    let stmt: string | undefined = undefined;
    if (filter !== undefined) {
      const op = filter[0];
      switch (op) {
        case "==":
        case "!=":
        case ">=":
        case "<=":
        case ">":
        case "<": {
          const value = filter[1];
          stmt = `v1.created_at ${op} ${value.getTime()}`;
          break;
        }
        case "between":
        case "not_between": {
          const start_value = filter[1][0];
          const end_value = filter[1][1];
          stmt = `v1.created_at BETWEEN ${start_value.getTime()} AND ${end_value.getTime()}`;
          break;
        }
        default: {
          const _exhaustiveCheck: never = op;
          return _exhaustiveCheck;
        }
      }
      if (stmt !== undefined) {
        if (index >= where_filters_stmt.length) {
          for (let j = 0; j <= index - where_filters_stmt.length; j++) {
            where_filters_stmt.push([]);
          }
        }
        where_filters_stmt[index].push(stmt);
      }
    }
  }
  for (let [index, filter] of variable_filters.updated_at.entries()) {
    let stmt: string | undefined = undefined;
    if (filter !== undefined) {
      const op = filter[0];
      switch (op) {
        case "==":
        case "!=":
        case ">=":
        case "<=":
        case ">":
        case "<": {
          const value = filter[1];
          stmt = `v1.updated_at ${op} ${value.getTime()}`;
          break;
        }
        case "between":
        case "not_between": {
          const start_value = filter[1][0];
          const end_value = filter[1][1];
          stmt = `v1.updated_at BETWEEN ${start_value.getTime()} AND ${end_value.getTime()}`;
          break;
        }
        default: {
          const _exhaustiveCheck: never = op;
          return _exhaustiveCheck;
        }
      }
      if (stmt !== undefined) {
        if (index >= where_filters_stmt.length) {
          for (let j = 0; j <= index - where_filters_stmt.length; j++) {
            where_filters_stmt.push([]);
          }
        }
        where_filters_stmt[index].push(stmt);
      }
    }
  }
  apply(
    `${where_filters_stmt.map((x) => `(${x.join(" AND ")})`).join(" OR ")}`,
    (it) => {
      if (it !== "") {
        append_to_where_stmt(it);
      }
    }
  );

  let having_stmt: string = "HAVING ";
  const append_to_having_stmt = (stmt: string) => {
    having_stmt += apply(undefined, () => {
      if (having_stmt === "HAVING ") {
        return `(${stmt})`;
      } else {
        return `\n AND (${stmt})`;
      }
    });
  };

  const having_filters_stmt: Array<Array<string>> = [];
  for (let path_filter of path_filters) {
    const path: ReadonlyArray<string> = path_filter[0];
    const path_ref: string = path.join(".");
    const val_ref: number = path_filter[0].length * 2;
    const field_struct_name = path_filter[1];
    switch (field_struct_name) {
      case "str":
      case "lstr":
      case "clob": {
        for (let [index, filter] of path_filter[3].entries()) {
          let stmt: string | undefined = undefined;
          if (filter !== undefined) {
            const op = filter[0];
            switch (op) {
              case "==":
              case "!=":
              case ">=":
              case "<=":
              case ">":
              case "<":
              case "like":
              case "glob": {
                const value = filter[1];
                stmt = apply(undefined, () => {
                  if (typeof value === "object") {
                    return `"${path_ref}" ${op} "${value.join(".")}"`;
                  } else {
                    return `"${path_ref}" ${op} '${value}'`;
                  }
                });
                break;
              }
              case "between":
              case "not_between": {
                const start_value = filter[1][0];
                const end_value = filter[1][1];
                stmt = apply(undefined, () => {
                  if (typeof start_value === "object") {
                    if (typeof end_value === "object") {
                      return `"${path_ref}" ${
                        op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
                      } "${start_value.join(".")}" AND "${end_value.join(
                        "."
                      )}"`;
                    } else {
                      return `"${path_ref}" ${
                        op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
                      } "${start_value.join(".")}" AND '${end_value}'`;
                    }
                  } else {
                    if (typeof end_value === "object") {
                      return `"${path_ref}" ${
                        op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
                      } '${start_value}' AND "${end_value.join(".")}"`;
                    } else {
                      return `"${path_ref}" ${
                        op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
                      } '${start_value}' AND '${end_value}'`;
                    }
                  }
                });
                break;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
          if (stmt !== undefined) {
            if (index >= having_filters_stmt.length) {
              for (let j = 0; j <= index - having_filters_stmt.length; j++) {
                having_filters_stmt.push([]);
              }
            }
            having_filters_stmt[index].push(stmt);
          }
        }
        break;
      }
      case "i32":
      case "u32":
      case "i64":
      case "u64":
      case "idouble":
      case "udouble":
      case "idecimal":
      case "udecimal": {
        const integer_fields = ["i32", "u32", "i64", "u64"];
        for (let [index, filter] of path_filter[3].entries()) {
          let stmt: string | undefined = undefined;
          if (filter !== undefined) {
            const op = filter[0];
            switch (op) {
              case "==":
              case "!=":
              case ">=":
              case "<=":
              case ">":
              case "<": {
                const value = filter[1];
                stmt = apply(undefined, () => {
                  if (is_decimal(value)) {
                    return `"${path_ref}" ${op} ${apply(undefined, () => {
                      if (integer_fields.includes(field_struct_name)) {
                        return value.truncated().toString();
                      } else {
                        return value.toString();
                      }
                    })}`;
                  } else {
                    return `"${path_ref}" ${op} "${value.join(".")}")`;
                  }
                });
                break;
              }
              case "between":
              case "not_between": {
                const start_value = filter[1][0];
                const end_value = filter[1][1];
                stmt = apply(undefined, () => {
                  if (is_decimal(start_value)) {
                    if (is_decimal(end_value)) {
                      return `"${path_ref}" ${
                        op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
                      } ${apply(undefined, () => {
                        if (integer_fields.includes(field_struct_name)) {
                          return start_value.truncated().toString();
                        } else {
                          return start_value.toString();
                        }
                      })} AND ${apply(undefined, () => {
                        if (integer_fields.includes(field_struct_name)) {
                          return end_value.truncated().toString();
                        } else {
                          return end_value.toString();
                        }
                      })}`;
                    } else {
                      return `"${path_ref}" ${
                        op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
                      } ${apply(undefined, () => {
                        if (integer_fields.includes(field_struct_name)) {
                          return start_value.truncated().toString();
                        } else {
                          return start_value.toString();
                        }
                      })} AND "${end_value.join(".")}"`;
                    }
                  } else {
                    if (is_decimal(end_value)) {
                      return `"${path_ref}" ${
                        op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
                      } "${start_value.join(".")}" AND ${apply(
                        undefined,
                        () => {
                          if (integer_fields.includes(field_struct_name)) {
                            return end_value.truncated().toString();
                          } else {
                            return end_value.toString();
                          }
                        }
                      )}`;
                    } else {
                      return `"${path_ref}" ${
                        op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
                      } "${start_value.join(".")}" AND "${end_value.join(
                        "."
                      )}"`;
                    }
                  }
                });
                break;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
          if (stmt !== undefined) {
            if (index >= having_filters_stmt.length) {
              for (let j = 0; j <= index - having_filters_stmt.length; j++) {
                having_filters_stmt.push([]);
              }
            }
            having_filters_stmt[index].push(stmt);
          }
        }
        break;
      }
      case "bool": {
        for (let [index, filter] of path_filter[3].entries()) {
          let stmt: string | undefined = undefined;
          if (filter !== undefined) {
            const op = filter[0];
            switch (op) {
              case "==":
              case "!=": {
                const value = filter[1];
                stmt = apply(undefined, () => {
                  if (typeof value === "object") {
                    return `"${path_ref}" ${op} "${value.join(".")}"`;
                  } else {
                    return `"${path_ref}" ${op} ${value ? 1 : 0}`;
                  }
                });
                break;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
          if (stmt !== undefined) {
            if (index >= having_filters_stmt.length) {
              for (let j = 0; j <= index - having_filters_stmt.length; j++) {
                having_filters_stmt.push([]);
              }
            }
            having_filters_stmt[index].push(stmt);
          }
        }
        break;
      }
      case "date":
      case "time":
      case "timestamp": {
        for (let [index, filter] of path_filter[3].entries()) {
          let stmt: string | undefined = undefined;
          if (filter !== undefined) {
            const op = filter[0];
            switch (op) {
              case "==":
              case "!=":
              case ">=":
              case "<=":
              case ">":
              case "<": {
                const value = filter[1];
                stmt = apply(undefined, () => {
                  if (value instanceof Date) {
                    return `"${path_ref}" ${op} ${value.getTime()}`;
                  } else {
                    return `"${path_ref}" ${op} "${value.join(".")}"`;
                  }
                });
                break;
              }
              case "between":
              case "not_between": {
                const start_value = filter[1][0];
                const end_value = filter[1][1];
                stmt = apply(undefined, () => {
                  if (start_value instanceof Date) {
                    if (end_value instanceof Date) {
                      return `"${path_ref}" ${
                        op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
                      } ${start_value.toString()} AND ${end_value.toString()}`;
                    } else {
                      return `"${path_ref}" ${
                        op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
                      } ${start_value.toString()} AND "${end_value.join(".")}"`;
                    }
                  } else {
                    if (end_value instanceof Date) {
                      return `"${path_ref}" ${
                        op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
                      } "${start_value.join(".")}" AND ${end_value.toString()}`;
                    } else {
                      if (is_decimal(end_value)) {
                        return `"${path_ref}" ${
                          op === "not_between" ? "NOT BETWEEN" : "BETWEEN"
                        } "${start_value.join(".")}" AND "${end_value.join(
                          "."
                        )}"`;
                      }
                    }
                  }
                });
                break;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
          if (stmt !== undefined) {
            if (index >= having_filters_stmt.length) {
              for (let j = 0; j <= index - having_filters_stmt.length; j++) {
                having_filters_stmt.push([]);
              }
            }
            having_filters_stmt[index].push(stmt);
          }
        }
        break;
      }
      case "other": {
        for (let [index, filter] of path_filter[3].entries()) {
          let stmt: string | undefined = undefined;
          if (filter !== undefined) {
            const op = filter[0];
            switch (op) {
              case "==":
              case "!=": {
                const value = filter[1];
                stmt = apply(undefined, () => {
                  if (is_decimal(value)) {
                    return `"${path_ref}" ${op} ${value
                      .truncated()
                      .toString()}`;
                  } else {
                    return `"${path_ref}" ${op} "${value.join(".")}"`;
                  }
                });
                break;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
          if (stmt !== undefined) {
            if (index >= having_filters_stmt.length) {
              for (let j = 0; j <= index - having_filters_stmt.length; j++) {
                having_filters_stmt.push([]);
              }
            }
            having_filters_stmt[index].push(stmt);
          }
        }
        break;
      }
      default: {
        const _exhaustiveCheck: never = field_struct_name;
        return _exhaustiveCheck;
      }
    }
  }
  apply(
    `${having_filters_stmt.map((x) => `(${x.join(" AND ")})`).join(" OR ")}`,
    (it) => {
      if (it !== "") {
        append_to_having_stmt(it);
      }
    }
  );

  const group_by_stmt: string = "GROUP BY v1.level, v1.struct_name, v1.id";

  let order_by_stmt: string = "ORDER BY ";
  const append_to_order_by_stmt = (stmt: string) => {
    order_by_stmt += apply(undefined, () => {
      if (order_by_stmt === "ORDER BY ") {
        return stmt;
      } else {
        return `, ${stmt}`;
      }
    });
  };
  apply(
    path_filters
      .map((path_filter) => ({
        path: path_filter[0],
        type: path_filter[1],
        sort_option: path_filter[2],
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
  append_to_order_by_stmt("v1.requested_at DESC, v1.updated_at DESC");

  const limit_offset_stmt: string = apply(undefined, () => {
    if (limit_offset !== undefined) {
      return `LIMIT ${limit_offset[0]
        .truncated()
        .toString()} OFFSET ${limit_offset[1].truncated().toString()}`;
    }
    return "";
  });
  if (having_stmt === "HAVING ") {
    having_stmt = "";
  }
  const final_stmt = `\n\n${select_stmt} \n\n${from_stmt} \n\n${where_stmt}  \n\n${group_by_stmt} \n\n${having_stmt} \n\n${order_by_stmt}  \n\n${limit_offset_stmt};\n\n`;
  console.log("FINAL STMT = ", final_stmt);
  return execute_transaction(final_stmt, []);
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
        return new Ok(new Decimal(result["max_id"]).truncated());
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
      [id.truncated().toString(), new Date().getTime().toString()]
    );
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok([] as []);
}

export async function activate_level(id: Decimal): Promise<Result<[]>> {
  try {
    await execute_transaction(`UPDATE "LEVELS" SET active = 1 WHERE id = ?;`, [
      id.truncated().toString(),
    ]);
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok([] as []);
}

export async function deactivate_level(id: Decimal): Promise<Result<[]>> {
  try {
    await execute_transaction(`UPDATE "LEVELS" SET active = 0 WHERE id = ?;`, [
      id.truncated().toString(),
    ]);
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok([] as []);
}

export async function remove_level(id: Decimal): Promise<Result<[]>> {
  try {
    await execute_transaction(`DELETE FROM "LEVELS" WHERE id = ?;`, [
      id.truncated().toString(),
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
  try {
    await execute_transaction(
      `REPLACE INTO "VARS"("level", "struct_name", "id", "active", "created_at", "updated_at", "requested_at") VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        level.truncated().toString(),
        struct_name,
        id.truncated().toString(),
        active ? "1" : "0",
        created_at.getTime().toString(),
        updated_at.getTime().toString(),
        requested_at.getTime().toString(),
      ]
    );
    for (let [path, [leaf_field_name, leaf_value]] of paths) {
      let ref_struct_name = struct_name;
      let ref_id: Decimal = id.truncated();
      for (let [field_name, next_var] of path) {
        await execute_transaction(
          `REPLACE INTO "VALS"("level", "struct_name", "variable_id", "field_name", "field_struct_name", "integer_value") VALUES (?, ?, ?, ?, ?, ?);`,
          [
            level.truncated().toString(),
            ref_struct_name,
            ref_id.truncated().toString(),
            field_name,
            next_var.value.other,
            next_var.value.value.truncated().toString(),
          ]
        );
        ref_struct_name = next_var.value.other;
        ref_id = next_var.value.value.truncated();
        await execute_transaction(
          `REPLACE INTO "VARS"("level", "struct_name", "id", "active", "created_at", "updated_at", "requested_at") VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            level.truncated().toString(),
            ref_struct_name,
            ref_id.truncated().toString(),
            next_var.active ? "1" : "0",
            next_var.created_at.getTime().toString(),
            next_var.updated_at.getTime().toString(),
            requested_at.getTime().toString(),
          ]
        );
      }
      const leaf_value_type = leaf_value.type;
      switch (leaf_value_type) {
        case "str":
        case "lstr":
        case "clob": {
          await execute_transaction(
            `REPLACE INTO "VALS"("level", "struct_name", "variable_id", "field_name", "field_struct_name", "text_value") VALUES (?, ?, ?, ?, ?, ?);`,
            [
              level.truncated().toString(),
              ref_struct_name,
              ref_id.truncated().toString(),
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
              level.truncated().toString(),
              ref_struct_name,
              ref_id.truncated().toString(),
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
              level.truncated().toString(),
              ref_struct_name,
              ref_id.truncated().toString(),
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
              level.truncated().toString(),
              ref_struct_name,
              ref_id.truncated().toString(),
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
              level.truncated().toString(),
              ref_struct_name,
              ref_id.truncated().toString(),
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
              level.truncated().toString(),
              ref_struct_name,
              ref_id.truncated().toString(),
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
          [level.truncated().toString(), struct_name, id.truncated().toString()]
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
          new Date(new Decimal(result["integer_value"]).truncated().toNumber())
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
        return new Ok(new Decimal(result["count"]).truncated());
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
  filters: ReadonlyArray<Filter>,
  limit_offset: [Decimal, Decimal] | undefined
): Promise<Result<Array<Variable>>> {
  const variable_filters = get_variable_filters(active, level, filters);
  const path_filters = get_path_filters(filters);
  try {
    const variables: Array<Variable> = [];
    const result_set = await query(
      struct.name,
      variable_filters,
      path_filters.map((x) => x[1]),
      limit_offset
    );
    for (let result of result_set.rows._array) {
      const paths: Array<Path> = [];
      for (let [label, path_filter] of path_filters) {
        const path: ReadonlyArray<string> = path_filter[0];
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
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
          }
          const leaf: [string, StrongEnum] = apply(undefined, () => {
            const ref: string = init.join(".");
            const field_struct_name = path_filter[1];
            switch (field_struct_name) {
              case "str":
              case "lstr":
              case "clob": {
                return [
                  last,
                  {
                    type: field_struct_name,
                    value: apply(undefined, () => {
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
                    value: apply(undefined, () => {
                      const integer_fields = ["i32", "u32", "i64", "u64"];
                      return apply(undefined, () => {
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
                    value: apply(undefined, () => {
                      if (ref === "") {
                        return new Decimal(result[`${last}`]).equals(1);
                      } else {
                        return new Decimal(result[`${ref}.${last}`]).equals(1);
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
                    value: apply(undefined, () => {
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
                const field_struct_name = path_filter[4];
                return [
                  last,
                  {
                    type: "other",
                    other: field_struct_name,
                    value: apply(undefined, () => {
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
    }
    return new Ok(variables);
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
}

export async function get_variable(
  struct: Struct,
  active: boolean,
  level: Decimal | undefined,
  id: Decimal
): Promise<Result<Variable>> {
  try {
    const result = await get_variables(
      struct,
      active,
      level,
      [
        {
          id: ["==", id],
          created_at: undefined,
          updated_at: undefined,
          filter_paths: HashSet.of<FilterPath>(),
        },
      ],
      [new Decimal(1), new Decimal(0)]
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
            string | PathString
          ]
        | undefined
      )
    ]
  | [
      "str" | "lstr" | "clob",
      (
        | [
            "between" | "not_between",
            [string | PathString, string | PathString]
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
      ["==" | "!=" | ">=" | "<=" | ">" | "<", Decimal | PathString] | undefined
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
            [Decimal | PathString, Decimal | PathString]
          ]
        | undefined
      )
    ]
  | ["bool", ["==" | "!=", boolean | PathString] | undefined]
  | [
      "date" | "time" | "timestamp",
      ["==" | "!=" | ">=" | "<=" | ">" | "<", Date | PathString] | undefined
    ]
  | [
      "date" | "time" | "timestamp",
      (
        | ["between" | "not_between", [Date | PathString, Date | PathString]]
        | undefined
      )
    ]
  | ["other", ["==" | "!=", Decimal | PathString] | undefined, Struct];

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

export type Filter = {
  id:
    | ["==" | "!=" | ">=" | "<=" | ">" | "<", Decimal]
    | ["between" | "not_between", [Decimal, Decimal]]
    | undefined;
  created_at:
    | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
    | ["between" | "not_between", [Date, Date]]
    | undefined;
  updated_at:
    | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
    | ["between" | "not_between", [Date, Date]]
    | undefined;
  filter_paths: HashSet<FilterPath>;
};

function get_variable_filters(
  active: boolean,
  level: Decimal | undefined,
  filters: ReadonlyArray<Filter>
): {
  active: boolean;
  level: Decimal | undefined;
  id: ReadonlyArray<
    | ["==" | "!=" | ">=" | "<=" | ">" | "<", Decimal]
    | ["between" | "not_between", [Decimal, Decimal]]
    | undefined
  >;
  created_at: ReadonlyArray<
    | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
    | ["between" | "not_between", [Date, Date]]
    | undefined
  >;
  updated_at: ReadonlyArray<
    | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
    | ["between" | "not_between", [Date, Date]]
    | undefined
  >;
} {
  return {
    active: active,
    level: level,
    id: filters.map((x) => x.id),
    created_at: filters.map((x) => x.created_at),
    updated_at: filters.map((x) => x.updated_at),
  };
}

function get_path_filters(filters: ReadonlyArray<Filter>) {
  console.log("-------------", filters, "----------------");
  const get_flattened_path = (x: PathString) => [...x[0], x[1]];
  let path_filters: Array<[string, PathFilter]> = [];
  const used_filter_paths: HashSet<FilterPath> = apply(
    HashSet.of<FilterPath>(),
    (it) => {
      for (let filter of filters) {
        for (let filter_path of filter.filter_paths) {
          if (filter_path.active) {
            it = it.add(filter_path);
          }
        }
      }
      return it;
    }
  );
  console.log(used_filter_paths);
  for (let filter_path of used_filter_paths) {
    const field_struct_name = filter_path.value[0];
    switch (field_struct_name) {
      case "str":
      case "lstr":
      case "clob": {
        const field_filters_1: Array<
          | [
              "==" | "!=" | ">=" | "<=" | ">" | "<" | "like" | "glob",
              string | ReadonlyArray<string>
            ]
          | undefined
        > = [];
        const field_filters_2: Array<
          | [
              "between" | "not_between",
              [string | ReadonlyArray<string>, string | ReadonlyArray<string>]
            ]
          | undefined
        > = [];
        for (let filter of filters) {
          let check = true;
          const result = filter.filter_paths.findAny((x) =>
            x.equals(filter_path)
          );
          if (result.isSome()) {
            const other_filter_path = result.get();
            if (
              other_filter_path.value[0] === field_struct_name &&
              other_filter_path.value[1] !== undefined
            ) {
              const op = other_filter_path.value[1][0];
              switch (op) {
                case "==":
                case "!=":
                case ">=":
                case "<=":
                case ">":
                case "<":
                case "like":
                case "glob": {
                  field_filters_2.push(undefined);
                  const value = other_filter_path.value[1][1];
                  if (typeof value === "object") {
                    field_filters_1.push([op, get_flattened_path(value)]);
                  } else {
                    field_filters_1.push([op, value]);
                  }
                  break;
                }
                case "between":
                case "not_between": {
                  field_filters_1.push(undefined);
                  const [value1, value2] = other_filter_path.value[1][1];
                  if (typeof value1 === "object") {
                    if (typeof value2 === "object") {
                      field_filters_2.push([
                        op,
                        [
                          get_flattened_path(value1),
                          get_flattened_path(value2),
                        ],
                      ]);
                    } else {
                      field_filters_2.push([
                        op,
                        [get_flattened_path(value1), value2],
                      ]);
                    }
                  } else {
                    if (typeof value2 === "object") {
                      field_filters_2.push([
                        op,
                        [value1, get_flattened_path(value2)],
                      ]);
                    } else {
                      field_filters_2.push([op, [value1, value2]]);
                    }
                  }
                  break;
                }
                default: {
                  const _exhaustiveCheck: never = op;
                  return _exhaustiveCheck;
                }
              }
              check = false;
            }
          }
          if (check) {
            field_filters_1.push(undefined);
            field_filters_2.push(undefined);
          }
        }
        apply(
          [
            fold(false as boolean, field_filters_1, (acc, val) => {
              if (!acc) {
                if (val !== undefined) {
                  return true;
                }
              }
              return acc;
            }),
            fold(false as boolean, field_filters_2, (acc, val) => {
              if (!acc) {
                if (val !== undefined) {
                  return true;
                }
              }
              return acc;
            }),
          ] as [boolean, boolean],
          ([field_filters_check_1, field_filters_check_2]) => {
            if (!field_filters_check_1 && !field_filters_check_2) {
              path_filters.push([
                filter_path.label,
                [
                  get_flattened_path(filter_path.path),
                  field_struct_name,
                  filter_path.ordering,
                  field_filters_1,
                ],
              ]);
            } else {
              if (field_filters_check_1) {
                path_filters.push([
                  filter_path.label,
                  [
                    get_flattened_path(filter_path.path),
                    field_struct_name,
                    filter_path.ordering,
                    field_filters_1,
                  ],
                ]);
              }
              if (field_filters_check_2) {
                path_filters.push([
                  filter_path.label,
                  [
                    get_flattened_path(filter_path.path),
                    field_struct_name,
                    filter_path.ordering,
                    field_filters_2,
                  ],
                ]);
              }
            }
          }
        );
        break;
      }
      case "i32":
      case "u32":
      case "i64":
      case "u64":
      case "idouble":
      case "udouble":
      case "idecimal":
      case "udecimal": {
        const field_filters_1: Array<
          | [
              "==" | "!=" | ">=" | "<=" | ">" | "<",
              Decimal | ReadonlyArray<string>
            ]
          | undefined
        > = [];
        const field_filters_2: Array<
          | [
              "between" | "not_between",
              [Decimal | ReadonlyArray<string>, Decimal | ReadonlyArray<string>]
            ]
          | undefined
        > = [];
        for (let filter of filters) {
          let check = true;
          const result = filter.filter_paths.findAny((x) =>
            x.equals(filter_path)
          );
          if (result.isSome()) {
            const other_filter_path = result.get();
            if (
              other_filter_path.value[0] === field_struct_name &&
              other_filter_path.value[1] !== undefined
            ) {
              const op = other_filter_path.value[1][0];
              switch (op) {
                case "==":
                case "!=":
                case ">=":
                case "<=":
                case ">":
                case "<": {
                  field_filters_2.push(undefined);
                  const value = other_filter_path.value[1][1];
                  if (is_decimal(value)) {
                    field_filters_1.push([op, value]);
                  } else {
                    field_filters_1.push([op, get_flattened_path(value)]);
                  }
                  break;
                }
                case "between":
                case "not_between": {
                  field_filters_1.push(undefined);
                  const [value1, value2] = other_filter_path.value[1][1];
                  if (is_decimal(value1)) {
                    if (is_decimal(value2)) {
                      field_filters_2.push([op, [value1, value2]]);
                    } else {
                      field_filters_2.push([
                        op,
                        [value1, get_flattened_path(value2)],
                      ]);
                    }
                  } else {
                    if (is_decimal(value2)) {
                      field_filters_2.push([
                        op,
                        [get_flattened_path(value1), value2],
                      ]);
                    } else {
                      field_filters_2.push([
                        op,
                        [
                          get_flattened_path(value1),
                          get_flattened_path(value2),
                        ],
                      ]);
                    }
                  }
                  break;
                }
                default: {
                  const _exhaustiveCheck: never = op;
                  return _exhaustiveCheck;
                }
              }
              check = false;
            }
          }
          if (check) {
            field_filters_1.push(undefined);
            field_filters_2.push(undefined);
          }
        }
        apply(
          [
            fold(false as boolean, field_filters_1, (acc, val) => {
              if (!acc) {
                if (val !== undefined) {
                  return true;
                }
              }
              return acc;
            }),
            fold(false as boolean, field_filters_2, (acc, val) => {
              if (!acc) {
                if (val !== undefined) {
                  return true;
                }
              }
              return acc;
            }),
          ] as [boolean, boolean],
          ([field_filters_check_1, field_filters_check_2]) => {
            if (!field_filters_check_1 && !field_filters_check_2) {
              path_filters.push([
                filter_path.label,
                [
                  get_flattened_path(filter_path.path),
                  field_struct_name,
                  filter_path.ordering,
                  field_filters_1,
                ],
              ]);
            } else {
              if (field_filters_check_1) {
                path_filters.push([
                  filter_path.label,
                  [
                    get_flattened_path(filter_path.path),
                    field_struct_name,
                    filter_path.ordering,
                    field_filters_1,
                  ],
                ]);
              }
              if (field_filters_check_2) {
                path_filters.push([
                  filter_path.label,
                  [
                    get_flattened_path(filter_path.path),
                    field_struct_name,
                    filter_path.ordering,
                    field_filters_2,
                  ],
                ]);
              }
            }
          }
        );
        break;
      }
      case "bool": {
        const field_filters: Array<
          ["==" | "!=", boolean | ReadonlyArray<string>] | undefined
        > = [];
        for (let filter of filters) {
          let check = true;
          const result = filter.filter_paths.findAny((x) =>
            x.equals(filter_path)
          );
          if (result.isSome()) {
            const other_filter_path = result.get();
            if (
              other_filter_path.value[0] === field_struct_name &&
              other_filter_path.value[1] !== undefined
            ) {
              const op = other_filter_path.value[1][0];
              switch (op) {
                case "==":
                case "!=": {
                  const value = other_filter_path.value[1][1];
                  if (typeof value === "object") {
                    field_filters.push([op, get_flattened_path(value)]);
                  } else {
                    field_filters.push([op, value]);
                  }
                  break;
                }
                default: {
                  const _exhaustiveCheck: never = op;
                  return _exhaustiveCheck;
                }
              }
              check = false;
            }
          }
          if (check) {
            field_filters.push(undefined);
          }
        }
        path_filters.push([
          filter_path.label,
          [
            get_flattened_path(filter_path.path),
            field_struct_name,
            filter_path.ordering,
            field_filters,
          ],
        ]);
        break;
      }
      case "date":
      case "time":
      case "timestamp": {
        const field_filters_1: Array<
          | [
              "==" | "!=" | ">=" | "<=" | ">" | "<",
              Date | ReadonlyArray<string>
            ]
          | undefined
        > = [];
        const field_filters_2: Array<
          | [
              "between" | "not_between",
              [Date | ReadonlyArray<string>, Date | ReadonlyArray<string>]
            ]
          | undefined
        > = [];
        for (let filter of filters) {
          let check = true;
          const result = filter.filter_paths.findAny((x) =>
            x.equals(filter_path)
          );
          if (result.isSome()) {
            const other_filter_path = result.get();
            if (
              other_filter_path.value[0] === field_struct_name &&
              other_filter_path.value[1] !== undefined
            ) {
              const op = other_filter_path.value[1][0];
              switch (op) {
                case "==":
                case "!=":
                case ">=":
                case "<=":
                case ">":
                case "<": {
                  field_filters_2.push(undefined);
                  const value = other_filter_path.value[1][1];
                  if (value instanceof Date) {
                    field_filters_1.push([op, value]);
                  } else {
                    field_filters_1.push([op, get_flattened_path(value)]);
                  }
                  break;
                }
                case "between":
                case "not_between": {
                  field_filters_1.push(undefined);
                  const [value1, value2] = other_filter_path.value[1][1];
                  if (value1 instanceof Date) {
                    if (value2 instanceof Date) {
                      field_filters_2.push([op, [value1, value2]]);
                    } else {
                      field_filters_2.push([
                        op,
                        [value1, get_flattened_path(value2)],
                      ]);
                    }
                  } else {
                    if (value2 instanceof Date) {
                      field_filters_2.push([
                        op,
                        [get_flattened_path(value1), value2],
                      ]);
                    } else {
                      field_filters_2.push([
                        op,
                        [
                          get_flattened_path(value1),
                          get_flattened_path(value2),
                        ],
                      ]);
                    }
                  }
                  break;
                }
                default: {
                  const _exhaustiveCheck: never = op;
                  return _exhaustiveCheck;
                }
              }
              check = false;
            }
          }
          if (check) {
            field_filters_1.push(undefined);
            field_filters_2.push(undefined);
          }
        }
        apply(
          [
            fold(false as boolean, field_filters_1, (acc, val) => {
              if (!acc) {
                if (val !== undefined) {
                  return true;
                }
              }
              return acc;
            }),
            fold(false as boolean, field_filters_2, (acc, val) => {
              if (!acc) {
                if (val !== undefined) {
                  return true;
                }
              }
              return acc;
            }),
          ] as [boolean, boolean],
          ([field_filters_check_1, field_filters_check_2]) => {
            if (!field_filters_check_1 && !field_filters_check_2) {
              path_filters.push([
                filter_path.label,
                [
                  get_flattened_path(filter_path.path),
                  field_struct_name,
                  filter_path.ordering,
                  field_filters_1,
                ],
              ]);
            } else {
              if (field_filters_check_1) {
                path_filters.push([
                  filter_path.label,
                  [
                    get_flattened_path(filter_path.path),
                    field_struct_name,
                    filter_path.ordering,
                    field_filters_1,
                  ],
                ]);
              }
              if (field_filters_check_2) {
                path_filters.push([
                  filter_path.label,
                  [
                    get_flattened_path(filter_path.path),
                    field_struct_name,
                    filter_path.ordering,
                    field_filters_2,
                  ],
                ]);
              }
            }
          }
        );
        break;
      }
      case "other": {
        const field_filters: Array<
          ["==" | "!=", Decimal | ReadonlyArray<string>] | undefined
        > = [];
        for (let filter of filters) {
          let check = true;
          const result = filter.filter_paths.findAny((x) =>
            x.equals(filter_path)
          );
          if (result.isSome()) {
            const other_filter_path = result.get();
            if (
              other_filter_path.value[0] === field_struct_name &&
              other_filter_path.value[1] !== undefined
            ) {
              const op = other_filter_path.value[1][0];
              switch (op) {
                case "==":
                case "!=": {
                  const value = other_filter_path.value[1][1];
                  if (is_decimal(value)) {
                    field_filters.push([op, value]);
                  } else {
                    field_filters.push([op, get_flattened_path(value)]);
                  }
                  break;
                }
                default: {
                  const _exhaustiveCheck: never = op;
                  return _exhaustiveCheck;
                }
              }
              check = false;
            }
          }
          if (check) {
            field_filters.push(undefined);
          }
        }
        path_filters.push([
          filter_path.label,
          [
            get_flattened_path(filter_path.path),
            field_struct_name,
            filter_path.ordering,
            field_filters,
            filter_path.value[2].name,
          ],
        ]);
        break;
      }
      default: {
        const _exhaustiveCheck: never = field_struct_name;
        return _exhaustiveCheck;
      }
    }
  }
  return path_filters;
}

///////////////////////////////////

async function load_test_data() {
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
          ])
        ),
      ])
    );
  }
  // const x = await execute_transaction("SELECT * FROM VARS;", []);
  // console.log(x);
}

load_test_data();
