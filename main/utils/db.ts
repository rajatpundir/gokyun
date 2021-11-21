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
} from "./prelude";
import Decimal from "decimal.js";
import { StrongEnum } from "./variable";
import { ErrMsg, errors } from "./errors";
import * as FileSystem from "expo-file-system";
import { HashSet, Vector } from "prelude-ts";

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

type PathFilters = ReadonlyArray<
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
            [Decimal | ReadonlyArray<string>, Decimal | ReadonlyArray<string>]
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
    ]
>;

export function get_select_query(
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
  path_filters: PathFilters,
  limit_offset: [Decimal, Decimal] | undefined
): string {
  const join_count: number = fold(0, path_filters, (acc, val) =>
    Math.max(acc, val[0].length)
  );

  var select_stmt: string = "SELECT \n";
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
    var intermediate_paths = HashSet.of<Vector<string>>();
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
    // console.log(intermediate_paths.toArray().map((x) => x.toArray()));
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

  var where_stmt: string = "WHERE ";
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
    stmt = `v1.level = '${value.truncated().toString()}'`;
    append_to_where_stmt(stmt);
  }
  append_to_where_stmt(`v1.struct_name = '${struct_name}'`);
  append_to_where_stmt(`v1.active = ${variable_filters.active ? "1" : "0"}`);

  var from_stmt: string =
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

  // Process path filtering by their ops and values/other_paths
  const filters_stmt: Array<Array<string>> = [];
  for (let [index, filter] of variable_filters.id.entries()) {
    var stmt: string | undefined = undefined;
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
          stmt = `v1.id ${op} '${value.truncated().toString()}'`;
          break;
        }
        case "between":
        case "not_between": {
          const start_value = filter[1][0];
          const end_value = filter[1][1];
          stmt = `v1.id BETWEEN '${start_value
            .truncated()
            .toString()}' AND '${end_value.truncated().toString()}'`;
          break;
        }
        default: {
          const _exhaustiveCheck: never = op;
          return _exhaustiveCheck;
        }
      }
      if (stmt !== undefined) {
        if (index >= filters_stmt.length) {
          for (let j = 0; j <= index - filters_stmt.length; j++) {
            filters_stmt.push([]);
          }
        }
        filters_stmt[index].push(stmt);
      }
    }
  }
  console.log(filters_stmt);
  for (let [index, filter] of variable_filters.created_at.entries()) {
    var stmt: string | undefined = undefined;
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
          stmt = `v1.created_at ${op} '${value.getTime().toString()}'`;
          break;
        }
        case "between":
        case "not_between": {
          const start_value = filter[1][0];
          const end_value = filter[1][1];
          stmt = `v1.created_at BETWEEN '${start_value
            .getTime()
            .toString()}' AND '${end_value.getTime().toString()}'`;
          break;
        }
        default: {
          const _exhaustiveCheck: never = op;
          return _exhaustiveCheck;
        }
      }
      if (stmt !== undefined) {
        if (index >= filters_stmt.length) {
          for (let j = 0; j <= index - filters_stmt.length; j++) {
            filters_stmt.push([]);
          }
        }
        filters_stmt[index].push(stmt);
      }
    }
  }
  for (let [index, filter] of variable_filters.updated_at.entries()) {
    var stmt: string | undefined = undefined;
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
          stmt = `v1.updated_at ${op} '${value.getTime().toString()}'`;
          break;
        }
        case "between":
        case "not_between": {
          const start_value = filter[1][0];
          const end_value = filter[1][1];
          stmt = `v1.updated_at BETWEEN '${start_value
            .getTime()
            .toString()}' AND '${end_value.getTime().toString()}'`;
          break;
        }
        default: {
          const _exhaustiveCheck: never = op;
          return _exhaustiveCheck;
        }
      }
      if (stmt !== undefined) {
        if (index >= filters_stmt.length) {
          for (let j = 0; j <= index - filters_stmt.length; j++) {
            filters_stmt.push([]);
          }
        }
        filters_stmt[index].push(stmt);
      }
    }
  }
  for (let path_filter of path_filters) {
    const path: ReadonlyArray<string> = path_filter[0];
    const val_ref: number = path_filter[0].length * 2;
    const field_struct_name = path_filter[1];
    switch (field_struct_name) {
      case "str":
      case "lstr":
      case "clob": {
        for (let [index, filter] of path_filter[3].entries()) {
          var stmt: string | undefined = undefined;
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
                    return apply([] as Array<string>, (path_constraints) => {
                      for (let [
                        path_field_index,
                        path_field_name,
                      ] of value.entries()) {
                        path_constraints.push(
                          `v${
                            path_field_index + 1
                          }.field_name = '${path_field_name}'`
                        );
                      }
                      const referenced_val_ref = value.length;
                      return `${path_constraints.join(
                        " AND "
                      )} AND v${referenced_val_ref}.text_value IS NOT NULL AND v${val_ref}.field_struct_name = '${field_struct_name}' AND v${val_ref}.text_value ${op} v${referenced_val_ref}.text_value`;
                    });
                  } else {
                    return `v${val_ref}.field_struct_name = '${field_struct_name}' AND v${val_ref}.text_value ${op} '${value}'`;
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
                      return apply(
                        [[], []] as [Array<string>, Array<string>],
                        ([start_path_constraints, end_path_constraints]) => {
                          for (let [
                            path_field_index,
                            path_field_name,
                          ] of start_value.entries()) {
                            start_path_constraints.push(
                              `v${
                                path_field_index + 1
                              }.field_name = '${path_field_name}'`
                            );
                          }
                          for (let [
                            path_field_index,
                            path_field_name,
                          ] of end_value.entries()) {
                            end_path_constraints.push(
                              `v${
                                path_field_index + 1
                              }.field_name = '${path_field_name}'`
                            );
                          }
                          const referenced_start_val_ref = start_value.length;
                          const referenced_end_val_ref = end_value.length;
                          return `${start_path_constraints.join(
                            " AND "
                          )} AND ${end_path_constraints.join(
                            " AND "
                          )} AND v${referenced_start_val_ref}.text_value IS NOT NULL AND v${referenced_end_val_ref}.text_value IS NOT NULL AND v${val_ref}.field_struct_name = '${field_struct_name}' AND v${val_ref}.text_value ${
                            op === "not_between" ? "NOT BETWEEN" : op
                          } v${referenced_start_val_ref}.text_value AND v${referenced_end_val_ref}.text_value`;
                        }
                      );
                    } else {
                      return apply([] as Array<string>, (path_constraints) => {
                        for (let [
                          path_field_index,
                          path_field_name,
                        ] of start_value.entries()) {
                          path_constraints.push(
                            `v${
                              path_field_index + 1
                            }.field_name = '${path_field_name}'`
                          );
                        }
                        const referenced_val_ref = start_value.length;
                        return `${path_constraints.join(
                          " AND "
                        )} AND v${referenced_val_ref}.text_value IS NOT NULL AND v${val_ref}.field_struct_name = '${field_struct_name}' AND v${val_ref}.text_value ${
                          op === "not_between" ? "NOT BETWEEN" : op
                        } v${referenced_val_ref}.text_value AND '${end_value}'`;
                      });
                    }
                  } else {
                    if (typeof end_value === "object") {
                      return apply([] as Array<string>, (path_constraints) => {
                        for (let [
                          path_field_index,
                          path_field_name,
                        ] of end_value.entries()) {
                          path_constraints.push(
                            `v${
                              path_field_index + 1
                            }.field_name = '${path_field_name}'`
                          );
                        }
                        const referenced_val_ref = end_value.length;
                        return `${path_constraints.join(
                          " AND "
                        )} AND v${referenced_val_ref}.text_value IS NOT NULL AND v${val_ref}.field_struct_name = '${field_struct_name}' AND v${val_ref}.text_value ${
                          op === "not_between" ? "NOT BETWEEN" : op
                        } '${start_value}' AND v${referenced_val_ref}.text_value`;
                      });
                    } else {
                      return `v${val_ref}.field_struct_name = '${field_struct_name}' AND v${val_ref}.text_value ${
                        op === "not_between" ? "NOT BETWEEN" : op
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
            if (index >= filters_stmt.length) {
              for (let j = 0; j <= index - filters_stmt.length; j++) {
                filters_stmt.push([]);
              }
            }
            filters_stmt[index].push(stmt);
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
          var stmt: string | undefined = undefined;
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
                    return `v${val_ref}.field_struct_name = '${field_struct_name}' AND v${val_ref}.${
                      integer_fields.includes(field_struct_name)
                        ? "integer_value"
                        : "real_value"
                    } ${op} '${apply(undefined, () => {
                      if (integer_fields.includes(field_struct_name)) {
                        return value.truncated().toString();
                      } else {
                        return value.toString();
                      }
                    })}'`;
                  } else {
                    return apply([] as Array<string>, (path_constraints) => {
                      for (let [
                        path_field_index,
                        path_field_name,
                      ] of value.entries()) {
                        path_constraints.push(
                          `v${
                            path_field_index + 1
                          }.field_name = '${path_field_name}'`
                        );
                      }
                      const referenced_val_ref = value.length;
                      return `${path_constraints.join(
                        " AND "
                      )} AND (v${referenced_val_ref}.integer_value IS NOT NULL OR v${referenced_val_ref}.real_value IS NOT NULL) AND v${val_ref}.field_struct_name = '${field_struct_name}' AND (v${val_ref}.${
                        integer_fields.includes(field_struct_name)
                          ? "integer_value"
                          : "real_value"
                      } ${op} v${referenced_val_ref}.integer_value OR v${val_ref}.${
                        integer_fields.includes(field_struct_name)
                          ? "integer_value"
                          : "real_value"
                      } ${op} v${referenced_val_ref}.real_value)`;
                    });
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
                      return `v${val_ref}.field_struct_name = '${field_struct_name}' AND v${val_ref}.${
                        integer_fields.includes(field_struct_name)
                          ? "integer_value"
                          : "real_value"
                      } ${op === "not_between" ? "NOT BETWEEN" : op} '${apply(
                        undefined,
                        () => {
                          if (integer_fields.includes(field_struct_name)) {
                            return start_value.truncated().toString();
                          } else {
                            return start_value.toString();
                          }
                        }
                      )}' AND '${apply(undefined, () => {
                        if (integer_fields.includes(field_struct_name)) {
                          return end_value.truncated().toString();
                        } else {
                          return end_value.toString();
                        }
                      })}'`;
                    } else {
                      return apply([] as Array<string>, (path_constraints) => {
                        for (let [
                          path_field_index,
                          path_field_name,
                        ] of end_value.entries()) {
                          path_constraints.push(
                            `v${
                              path_field_index + 1
                            }.field_name = '${path_field_name}'`
                          );
                        }
                        const referenced_val_ref = end_value.length;
                        return `${path_constraints.join(
                          " AND "
                        )} AND (v${referenced_val_ref}.integer_value IS NOT NULL OR v${referenced_val_ref}.real_value IS NOT NULL) AND v${val_ref}.field_struct_name = '${field_struct_name}' AND ((v${val_ref}.${
                          integer_fields.includes(field_struct_name)
                            ? "integer_value"
                            : "real_value"
                        } ${
                          op === "not_between" ? "NOT BETWEEN" : op
                        } ? AND v${referenced_val_ref}.integer_value) OR (v${val_ref}.${
                          integer_fields.includes(field_struct_name)
                            ? "integer_value"
                            : "real_value"
                        } ${op === "not_between" ? "NOT BETWEEN" : op} '${apply(
                          undefined,
                          () => {
                            if (integer_fields.includes(field_struct_name)) {
                              return start_value.truncated().toString();
                            } else {
                              return start_value.toString();
                            }
                          }
                        )}' AND v${referenced_val_ref}.real_value))`;
                      });
                    }
                  } else {
                    if (is_decimal(end_value)) {
                      return apply([] as Array<string>, (path_constraints) => {
                        for (let [
                          path_field_index,
                          path_field_name,
                        ] of start_value.entries()) {
                          path_constraints.push(
                            `v${
                              path_field_index + 1
                            }.field_name = '${path_field_name}'`
                          );
                        }
                        const referenced_val_ref = start_value.length;
                        return `${path_constraints.join(
                          " AND "
                        )} AND (v${referenced_val_ref}.integer_value IS NOT NULL OR v${referenced_val_ref}.real_value IS NOT NULL) AND v${val_ref}.field_struct_name = '${field_struct_name}' AND ((v${val_ref}.${
                          integer_fields.includes(field_struct_name)
                            ? "integer_value"
                            : "real_value"
                        } ${
                          op === "not_between" ? "NOT BETWEEN" : op
                        } v${referenced_val_ref}.integer_value AND ?) OR (v${val_ref}.${
                          integer_fields.includes(field_struct_name)
                            ? "integer_value"
                            : "real_value"
                        } ${
                          op === "not_between" ? "NOT BETWEEN" : op
                        } v${referenced_val_ref}.real_value AND '${apply(
                          undefined,
                          () => {
                            if (integer_fields.includes(field_struct_name)) {
                              return end_value.truncated().toString();
                            } else {
                              return end_value.toString();
                            }
                          }
                        )}'))`;
                      });
                    } else {
                      return apply(
                        [[], []] as [Array<string>, Array<string>],
                        ([start_path_constraints, end_path_constraints]) => {
                          for (let [
                            path_field_index,
                            path_field_name,
                          ] of start_value.entries()) {
                            start_path_constraints.push(
                              `v${
                                path_field_index + 1
                              }.field_name = '${path_field_name}'`
                            );
                          }
                          for (let [
                            path_field_index,
                            path_field_name,
                          ] of end_value.entries()) {
                            end_path_constraints.push(
                              `v${
                                path_field_index + 1
                              }.field_name = '${path_field_name}'`
                            );
                          }
                          const referenced_start_val_ref = start_value.length;
                          const referenced_end_val_ref = end_value.length;
                          return `${start_path_constraints.join(
                            " AND "
                          )} AND ${end_path_constraints.join(
                            " AND "
                          )} AND (v${referenced_start_val_ref}.integer_value IS NOT NULL OR v${referenced_start_val_ref}.real_value IS NOT NULL) AND (v${referenced_end_val_ref}.integer_value IS NOT NULL OR v${referenced_end_val_ref}.real_value IS NOT NULL) AND v${val_ref}.field_struct_name = '${field_struct_name}' AND ((v${val_ref}.${
                            integer_fields.includes(field_struct_name)
                              ? "integer_value"
                              : "real_value"
                          } ${
                            op === "not_between" ? "NOT BETWEEN" : op
                          } v${referenced_start_val_ref}.integer_value AND v${referenced_end_val_ref}.integer_value) OR (v${val_ref}.${
                            integer_fields.includes(field_struct_name)
                              ? "integer_value"
                              : "real_value"
                          } ${
                            op === "not_between" ? "NOT BETWEEN" : op
                          } v${referenced_start_val_ref}.integer_value AND v${referenced_end_val_ref}.real_value) OR (v${val_ref}.${
                            integer_fields.includes(field_struct_name)
                              ? "integer_value"
                              : "real_value"
                          } ${
                            op === "not_between" ? "NOT BETWEEN" : op
                          } v${referenced_start_val_ref}.real_value AND v${referenced_end_val_ref}.integer_value) OR (v${val_ref}.${
                            integer_fields.includes(field_struct_name)
                              ? "integer_value"
                              : "real_value"
                          } ${
                            op === "not_between" ? "NOT BETWEEN" : op
                          } v${referenced_start_val_ref}.real_value AND v${referenced_end_val_ref}.real_value))`;
                        }
                      );
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
            filters_stmt[index].push("");
          }
          if (stmt !== undefined) {
            if (index >= filters_stmt.length) {
              for (let j = 0; j <= index - filters_stmt.length; j++) {
                filters_stmt.push([]);
              }
            }
            filters_stmt[index].push(stmt);
          }
        }
        break;
      }
      case "bool": {
        for (let [index, filter] of path_filter[3].entries()) {
          var stmt: string | undefined = undefined;
          if (filter !== undefined) {
            const op = filter[0];
            switch (op) {
              case "==":
              case "!=": {
                const value = filter[1];
                stmt = apply(undefined, () => {
                  if (typeof value === "object") {
                    return apply([] as Array<string>, (path_constraints) => {
                      for (let [
                        path_field_index,
                        path_field_name,
                      ] of value.entries()) {
                        path_constraints.push(
                          `v${
                            path_field_index + 1
                          }.field_name = '${path_field_name}'`
                        );
                      }
                      const referenced_val_ref = value.length;
                      return `${path_constraints.join(
                        " AND "
                      )} AND v${referenced_val_ref}.integer_value IS NOT NULL AND v${val_ref}.field_struct_name = '${field_struct_name}' AND v${val_ref}.integer_value ${op} v${referenced_val_ref}.integer_value`;
                    });
                  } else {
                    return `v${val_ref}.field_struct_name = '${field_struct_name}' AND v${val_ref}.integer_value ${op} ${
                      value ? "1" : "0"
                    }`;
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
            if (index >= filters_stmt.length) {
              for (let j = 0; j <= index - filters_stmt.length; j++) {
                filters_stmt.push([]);
              }
            }
            filters_stmt[index].push(stmt);
          }
        }
        break;
      }
      case "date":
      case "time":
      case "timestamp": {
        for (let [index, filter] of path_filter[3].entries()) {
          var stmt: string | undefined = undefined;
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
                    return `v${val_ref}.field_struct_name = '${field_struct_name}' AND v${val_ref}.integer_value ${op} '${value
                      .getTime()
                      .toString()}'`;
                  } else {
                    return apply([] as Array<string>, (path_constraints) => {
                      for (let [
                        path_field_index,
                        path_field_name,
                      ] of value.entries()) {
                        path_constraints.push(
                          `v${
                            path_field_index + 1
                          }.field_name = '${path_field_name}'`
                        );
                      }
                      const referenced_val_ref = value.length;
                      return `${path_constraints.join(
                        " AND "
                      )} AND v${referenced_val_ref}.integer_value IS NOT NULL AND v${val_ref}.field_struct_name = '${field_struct_name}' AND v${val_ref}.integer_value ${op} v${referenced_val_ref}.integer_value`;
                    });
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
                      return `v${val_ref}.field_struct_name = '${field_struct_name}' AND v${val_ref}.integer_value ${
                        op === "not_between" ? "NOT BETWEEN" : op
                      } '${start_value.toString()}' AND '${end_value.toString()}'`;
                    } else {
                      return apply([] as Array<string>, (path_constraints) => {
                        for (let [
                          path_field_index,
                          path_field_name,
                        ] of end_value.entries()) {
                          path_constraints.push(
                            `v${
                              path_field_index + 1
                            }.field_name = '${path_field_name}'`
                          );
                        }
                        const referenced_val_ref = end_value.length;
                        return `${path_constraints.join(
                          " AND "
                        )} AND v${referenced_val_ref}.integer_value IS NOT NULL AND v${val_ref}.field_struct_name = '${field_struct_name}' AND (v${val_ref}.integer_value ${
                          op === "not_between" ? "NOT BETWEEN" : op
                        } '${start_value.toString()}' AND v${referenced_val_ref}.integer_value)`;
                      });
                    }
                  } else {
                    if (is_decimal(end_value)) {
                      return apply([] as Array<string>, (path_constraints) => {
                        for (let [
                          path_field_index,
                          path_field_name,
                        ] of start_value.entries()) {
                          path_constraints.push(
                            `v${
                              path_field_index + 1
                            }.field_name = '${path_field_name}'`
                          );
                        }
                        const referenced_val_ref = start_value.length;
                        return `${path_constraints.join(
                          " AND "
                        )} AND v${referenced_val_ref}.integer_value IS NOT NULL AND v${val_ref}.field_struct_name = '${field_struct_name}' AND (v${val_ref}.integer_value ${
                          op === "not_between" ? "NOT BETWEEN" : op
                        } v${referenced_val_ref}.integer_value AND '${end_value.toString()}')`;
                      });
                    } else {
                      return apply(
                        [[], []] as [Array<string>, Array<string>],
                        ([start_path_constraints, end_path_constraints]) => {
                          for (let [
                            path_field_index,
                            path_field_name,
                          ] of start_value.entries()) {
                            start_path_constraints.push(
                              `v${
                                path_field_index + 1
                              }.field_name = '${path_field_name}'`
                            );
                          }
                          for (let [
                            path_field_index,
                            path_field_name,
                          ] of end_value.entries()) {
                            end_path_constraints.push(
                              `v${
                                path_field_index + 1
                              }.field_name = '${path_field_name}'`
                            );
                          }
                          const referenced_start_val_ref = start_value.length;
                          const referenced_end_val_ref = end_value.length;
                          return `${start_path_constraints.join(
                            " AND "
                          )} AND ${end_path_constraints.join(
                            " AND "
                          )} AND v${referenced_start_val_ref}.integer_value IS NOT NULL AND v${referenced_end_val_ref}.integer_value IS NOT NULL AND v${val_ref}.field_struct_name = '${field_struct_name}' AND (v${val_ref}.integer_value ${
                            op === "not_between" ? "NOT BETWEEN" : op
                          } v${referenced_start_val_ref}.integer_value AND v${referenced_end_val_ref}.integer_value)`;
                        }
                      );
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
            if (index >= filters_stmt.length) {
              for (let j = 0; j <= index - filters_stmt.length; j++) {
                filters_stmt.push([]);
              }
            }
            filters_stmt[index].push(stmt);
          }
        }
        break;
      }
      case "other": {
        const field_struct_name = path_filter[4];
        for (let [index, filter] of path_filter[3].entries()) {
          var stmt: string | undefined = undefined;
          if (filter !== undefined) {
            const op = filter[0];
            switch (op) {
              case "==":
              case "!=": {
                const value = filter[1];
                stmt = apply(undefined, () => {
                  if (is_decimal(value)) {
                    return `v${val_ref}.field_struct_name = '${field_struct_name}' AND v${val_ref}.integer_value ${op} '${value
                      .truncated()
                      .toString()}'`;
                  } else {
                    return apply([] as Array<string>, (path_constraints) => {
                      for (let [
                        path_field_index,
                        path_field_name,
                      ] of value.entries()) {
                        path_constraints.push(
                          `v${
                            path_field_index + 1
                          }.field_name = '${path_field_name}'`
                        );
                      }
                      const referenced_val_ref = value.length;
                      return `${path_constraints.join(
                        " AND "
                      )} AND v${referenced_val_ref}.field_struct_name = '${field_struct_name}' AND v${referenced_val_ref}.integer_value IS NOT NULL AND v${val_ref}.field_struct_name = '${field_struct_name}' AND v${val_ref}.integer_value ${op} v${referenced_val_ref}.integer_value`;
                    });
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
            if (index >= filters_stmt.length) {
              for (let j = 0; j <= index - filters_stmt.length; j++) {
                filters_stmt.push([]);
              }
            }
            filters_stmt[index].push(stmt);
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
    `${filters_stmt.map((x) => `(${x.join(" AND ")})`).join(" OR ")}`,
    (it) => {
      if (it !== "") {
        append_to_where_stmt(it);
      }
    }
  );

  const group_by_stmt: string = "GROUP BY v1.level, v1.struct_name, v1.id";

  var order_by_stmt: string = "ORDER BY ";
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
          const path_name_expression = get_path_name_expression(path.length);
          const sort_order = path_filter.sort_option[1] ? "DESC" : "ASC";
          const val_ref: number = path.length * 2;
          const field_struct_name = path_filter.type;
          const stmt = apply(undefined, () => {
            switch (field_struct_name) {
              case "str":
              case "lstr":
              case "clob": {
                return `MAX(CASE WHEN (${path_name_expression} = '${path.join(
                  "."
                )}') THEN (v${val_ref}.text_value) END)`;
              }
              case "i32":
              case "u32":
              case "i64":
              case "u64": {
                return `MAX(CASE WHEN (${path_name_expression} = '${path.join(
                  "."
                )}') THEN (v${val_ref}.integer_value) END)`;
              }
              case "idouble":
              case "udouble":
              case "idecimal":
              case "udecimal": {
                return `MAX(CASE WHEN (${path_name_expression} = '${path.join(
                  "."
                )}') THEN (v${val_ref}.real_value) END)`;
              }
              case "bool": {
                return `MAX(CASE WHEN (${path_name_expression} = '${path.join(
                  "."
                )}') THEN (v${val_ref}.integer_value) END)`;
              }
              case "date":
              case "time":
              case "timestamp": {
                return `MAX(CASE WHEN (${path_name_expression} = '${path.join(
                  "."
                )}') THEN (v${val_ref}.integer_value) END)`;
              }
              case "other": {
                return `MAX(CASE WHEN (${path_name_expression} = '${path.join(
                  "."
                )}') THEN (v${val_ref}.integer_value) END)`;
              }
              default: {
                const _exhaustiveCheck: never = field_struct_name;
                return _exhaustiveCheck;
              }
            }
          });
          append_to_order_by_stmt(`${stmt} ${sort_order}`);
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

  const final_stmt = `\n\n${select_stmt} \n\n${from_stmt} \n\n${where_stmt}  \n\n${group_by_stmt} \n\n${order_by_stmt}  \n\n${limit_offset_stmt};\n\n`;

  return final_stmt;
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

export async function replace_variable(
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
      var ref_struct_name = struct_name;
      var ref_id: Decimal = id.truncated();
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

export async function replace_variables(
  level: Decimal,
  requested_at: Date,
  struct_name: string,
  variables: ReadonlyArray<{
    id: Decimal;
    active: boolean;
    created_at: Date;
    updated_at: Date;
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
    >;
  }>
): Promise<Result<[]>> {
  try {
    for (let variable of variables) {
      await replace_variable(
        level,
        requested_at,
        struct_name,
        variable.id,
        variable.active,
        variable.created_at,
        variable.updated_at,
        variable.paths
      );
    }
  } catch (err) {
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
  return new Ok([] as []);
}

export async function remove_variables(
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
