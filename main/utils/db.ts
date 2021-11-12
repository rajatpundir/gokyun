import { useState } from "react";
import { getState, subscribe } from "./store";
import * as SQLite from "expo-sqlite";
import React from "react";
import { apply, fold, is_decimal } from "./prelude";
import Decimal from "decimal.js";

const db = apply(SQLite.openDatabase("db.testDb"), (db) => {
  db.exec([{ sql: "PRAGMA journal_mode = WAL;", args: [] }], false, () =>
    console.log("PRAGMA journal_mode = WAL;")
  );
  db.exec([{ sql: "PRAGMA synchronous = 1;", args: [] }], false, () =>
    console.log("PRAGMA synchronous = 1;")
  );
  db.exec([{ sql: "PRAGMA foreign_keys = ON;", args: [] }], false, () =>
    console.log("PRAGMA foreign_keys = ON;")
  );
  db.exec([{ sql: "VACUUM;", args: [] }], false, () => console.log("VACUUM"));
  return db;
});

export function useDB() {
  const [db_updation_toggle, set_db_updation_toggle] = useState(
    getState().db_updation_toggle
  );
  subscribe((store) => {
    set_db_updation_toggle(store.db_updation_toggle);
  });
  React.useEffect(() => {
    db.transaction(
      (tx) => {
        create_table(tx, {
          table_name: "VARIABLES",
          columns: [
            ["id", "INTEGER"],
            ["created_at", "INTEGER"],
            ["updated_at", "INTEGER"],
            ["requested_at", "INTEGER"],
            ["last_accessed_at", "INTEGER"],
          ],
          unique_constraints: [["id"]],
        });
      },
      (_error) => {
        console.log("Unable to execute transaction");
      },
      () => {
        console.log("Transaction was successfully executed");
      }
    );
  }, []);
  return db;
}

function create_table(
  tx: SQLite.SQLTransaction,
  table: {
    table_name: string;
    columns: ReadonlyArray<[string, "INTEGER" | "REAL" | "TEXT"]>;
    unique_constraints: ReadonlyArray<ReadonlyArray<string>>;
  }
) {
  tx.executeSql(
    fold(
      `CREATE TABLE IF NOT EXISTS ${table.table_name} (`,
      table.columns,
      (acc, val) => acc + `, ${val[0]} ${val[1]}`
    ) +
      fold(
        "",
        table.unique_constraints,
        (acc, val) =>
          acc + `, UNQUE(${fold("", val, (acc, val) => acc + `, ${val}`)})`
      ) +
      ");",
    [],
    (_tx, _resultSet) => {
      console.log("Successfully created table: ", table.table_name);
    },
    (_tx, _error) => {
      console.log("Unable to create table: ", table.table_name);
      // Check the significance of below returned boolean is as assumed
      return false;
    }
  );
}

function replace_row(
  _tx: SQLite.SQLTransaction,
  table: {
    table_name: string;
    values: ReadonlyArray<[string, Decimal | number | string]>;
  }
) {
  // REPLACE INTO table(column_list) VALUES(value_list);
}

function delete_row(
  _tx: SQLite.SQLTransaction,
  table: {
    table_name: string;
    values: ReadonlyArray<[string, Decimal | number | string]>;
  }
) {
  //DELETE FROM table WHERE search_condition;
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
>;

export function generate_query(
  struct_name: string,
  limit: Decimal,
  offset: Decimal,
  path_filters: PathFilters,
  level: Decimal | undefined,
  id: Decimal | undefined
) {
  const value_injections: Array<string> = [];
  const join_count: number = fold(0, path_filters, (acc, val) =>
    Math.min(acc, val[0].length)
  );
  const select_stmt: string = apply("SELECT", (it) => {
    const columns = [
      [
        "struct_name",
        "id",
        "created_at",
        "updated_at",
        "requested_at",
        "last_accessed_at",
      ],
      ["field_struct_name", "text_value", "integer_value", "real_value"],
    ];
    for (let i = 0; i < join_count; i++) {
      const [var_ref, val_ref] = [i * 2 + 1, i * 2 + 2];
      if (it !== "SELECT") {
        it += ", ";
      }
      it += fold(
        ` v${var_ref}.level`,
        columns[0],
        (acc, val) => `${acc}, v${var_ref}.${val}`
      );
      it += fold(
        `, v${val_ref}.field_name`,
        columns[1],
        (acc, val) => `${acc}, v${val_ref}.${val}`
      );
    }
    return it;
  });
  console.log(select_stmt);
  const [from_stmt, where_stmt] = apply(
    ["FROM", "WHERE"],
    ([from_stmt, where_stmt]) => {
      for (let i = 0; i < join_count; i++) {
        const [var_ref, val_ref] = [i * 2 + 1, i * 2 + 2];
        // Join tables
        if (i == 0) {
          from_stmt += ` vars AS v${var_ref} LEFT JOIN vals as v${val_ref} ON (v${val_ref}.level = v${var_ref}.level AND v${val_ref}.struct_name = v${var_ref}.struct_name AND v${val_ref}.variable_id = v${var_ref}.id)`;
          if (level === undefined) {
            if (id === undefined) {
              where_stmt += ` v${var_ref}.struct_name = ? AND v${var_ref}.deleted = FALSE`;
              value_injections.push(struct_name);
            } else {
              where_stmt += ` v${var_ref}.struct_name = ? AND v${var_ref}.id = ? AND v${var_ref}.deleted = FALSE`;
              value_injections.push(struct_name);
              value_injections.push(id.truncated().toString());
            }
          } else {
            if (id === undefined) {
              where_stmt += ` v${var_ref}.struct_name = ? AND v${var_ref}.level = ? AND v${var_ref}.deleted = FALSE`;
              value_injections.push(struct_name);
              value_injections.push(level.toString());
            } else {
              where_stmt += ` v${var_ref}.struct_name = ? AND v${var_ref}.level = ? AND v${var_ref}.id = ? AND v${var_ref}.deleted = FALSE`;
              value_injections.push(struct_name);
              value_injections.push(level.toString());
              value_injections.push(id.truncated().toString());
            }
          }
        } else {
          from_stmt += ` LEFT JOIN vars AS v${var_ref} ON (v${var_ref}.struct_name = v${
            var_ref - 1
          }.field_struct_name AND v${var_ref}.id = v${
            var_ref - 1
          }.integer_value)`;
          from_stmt += ` LEFT JOIN vals AS v${val_ref} ON (v${val_ref}.level = v${var_ref}.level AND v${val_ref}.struct_name = v${var_ref}.struct_name AND v${val_ref}.variable_id = v${var_ref}.id)`;
          where_stmt += ` AND v${var_ref - 1}.level >= v${var_ref}.level`;
          if (level === undefined) {
            if (id === undefined) {
              where_stmt += ` AND v${var_ref}.struct_name = ? AND v${var_ref}.deleted = FALSE`;
              value_injections.push(struct_name);
            } else {
              where_stmt += ` AND v${var_ref}.struct_name = ? AND v${var_ref}.id = ? AND v${var_ref}.deleted = FALSE`;
              value_injections.push(struct_name);
              value_injections.push(id.truncated().toString());
            }
          } else {
            if (id === undefined) {
              where_stmt += ` AND v${var_ref}.struct_name = ? AND v${var_ref}.level = ? AND v${var_ref}.deleted = FALSE`;
              value_injections.push(struct_name);
              value_injections.push(level.toString());
            } else {
              where_stmt += ` AND v${var_ref}.struct_name = ? AND v${var_ref}.level = ? AND v${var_ref}.id = ? AND v${var_ref}.deleted = FALSE`;
              value_injections.push(struct_name);
              value_injections.push(level.toString());
              value_injections.push(id.truncated().toString());
            }
          }
        }
        // Filter field by names and their struct names
        apply(
          fold("", path_filters, (acc, val) => {
            if (i < val[0].length) {
              value_injections.push(val[0][i]);
              value_injections.push(val[1]);
              if (acc === "") {
                return `(v${val_ref}.field_name = ? AND v${val_ref}.field_struct_name = ?)`;
              } else {
                return ` ${acc} OR (v${val_ref}.field_name = ? AND v${val_ref}.field_struct_name = ?)`;
              }
            }
            return acc;
          }),
          (field_name_filter_stmt) => {
            if (field_name_filter_stmt !== "") {
              where_stmt += ` AND (${field_name_filter_stmt})`;
            }
            console.log(field_name_filter_stmt);
          }
        );
      }
      return [from_stmt, where_stmt];
    }
  );
  console.log(from_stmt);
  console.log(where_stmt);
  console.log(value_injections);
  // Process path filtering by their ops and values/other_paths
  const filters_stmt: ReadonlyArray<ReadonlyArray<string>> = [];
  for (let path_filter of path_filters) {
    const path: ReadonlyArray<string> = path_filter[0];
    const val_ref: number = path_filter[0].length;
    const field_struct_name = path_filter[1];
    switch (field_struct_name) {
      case "str":
      case "lstr":
      case "clob": {
        for (let filter of path_filter[3]) {
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
                if (typeof value === "object") {
                  const referenced_val_ref = value.length;
                  value;
                } else {
                  value;
                }
                break;
              }
              case "between":
              case "not_between": {
                const value = filter[1];
                if (typeof value === "object") {
                  const referenced_val_ref = value.length;
                  value;
                } else {
                  value;
                }
                break;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
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
        for (let filter of path_filter[3]) {
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
                if (is_decimal(value)) {
                  value;
                } else {
                  const referenced_val_ref = value.length;
                  value;
                }
                break;
              }
              case "between":
              case "not_between": {
                const value = filter[1];
                if (is_decimal(value)) {
                  value;
                } else {
                  const referenced_val_ref = value.length;
                  value;
                }
                break;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
        }
        break;
      }
      case "bool": {
        for (let filter of path_filter[3]) {
          if (filter !== undefined) {
            const op = filter[0];
            switch (op) {
              case "==":
              case "!=": {
                const value = filter[1];
                if (typeof value === "object") {
                  const referenced_val_ref = value.length;
                  value;
                } else {
                  value;
                }
                break;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
          }
        }
        break;
      }
      case "date":
      case "time":
      case "timestamp": {
        for (let filter of path_filter[3]) {
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
                if (value instanceof Date) {
                  value;
                } else {
                  const referenced_val_ref = value.length;
                  value;
                }
                break;
              }
              case "between":
              case "not_between": {
                const start_value = filter[1][0];
                const end_value = filter[1][1];
                if (is_decimal(start_value)) {
                  if (is_decimal(end_value)) {
                    start_value;
                    end_value;
                  } else {
                    const referenced_end_val_ref = end_value.length;
                    start_value;
                    end_value;
                  }
                } else {
                  const referenced_start_val_ref = start_value.length;
                  if (is_decimal(end_value)) {
                    start_value;
                    end_value;
                  } else {
                    const referenced_end_val_ref = end_value.length;
                    start_value;
                    end_value;
                  }
                }
                break;
              }
              default: {
                const _exhaustiveCheck: never = op;
                return _exhaustiveCheck;
              }
            }
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
}
