import { useState } from "react";
import { getState, subscribe } from "./store";
import * as SQLite from "expo-sqlite";
import React from "react";
import { apply, fold, is_decimal } from "./prelude";
import Decimal from "decimal.js";
import { PathFilter } from "./variable";
import { HashSet } from "prelude-ts";

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
  | [
      ReadonlyArray<string>,
      "other",
      [Decimal, boolean] | undefined,
      ReadonlyArray<["==" | "!=", Decimal | ReadonlyArray<string>] | undefined>,
      string
    ]
>;

// [ [...], '_value', '_max', '_min', '_avg', '_count' ]
// Aggregate functions wont work since it requires existing statement to be wrapped by another SELECT and then doing aggregate there
// This is because aggregate functions work inside the group
// use max on rows inside groups to eliminate nulls

export function generate_query(
  struct_name: string,
  variable_filters: {
    level: Decimal | undefined;
    id: ReadonlyArray<
      | ["==" | "!=" | ">=" | "<=" | ">" | "<", Decimal]
      | ["between" | "not_between", [Decimal, Decimal]]
    >;
    active: ReadonlyArray<["==" | "!=", boolean]>;
    created_at: ReadonlyArray<
      | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
      | ["between" | "not_between", [Date, Date]]
    >;
    updated_at: ReadonlyArray<
      | ["==" | "!=" | ">=" | "<=" | ">" | "<", Date]
      | ["between" | "not_between", [Date, Date]]
    >;
  },
  path_filters: PathFilters,
  limit: Decimal,
  offset: Decimal
) {
  const dependency_injections: Array<string> = [];
  const group_by_stmt: string = "GROUP BY (v1.level, v1.struct_name, v1.id)";
  var select_stmt: string =
    "SELECT v1.level AS _level, v1.struct_name AS _struct_name, v1.id AS _id, v1.active AS _active, v1.created_at AS _created_at, v1.updated_at AS _updated_at";

  const append_to_select_stmt = (stmt: string) => {
    select_stmt += `, ${stmt}`;
  };

  const join_count: number = fold(0, path_filters, (acc, val) =>
    Math.min(acc, val[0].length)
  );

  apply(undefined, () => {
    const path_name_expression: string = Array.from(Array(join_count).keys())
      .map((x) => {
        const val_ref = x * 2 + 2;
        return `IFNULL(v${val_ref}.field_name, "")`;
      })
      .join(` || "." || `);
    append_to_select_stmt(`${path_name_expression} AS path_name_expression`);
    path_filters.map((path_filter) => {
      const path: ReadonlyArray<string> = path_filter[0];
      const val_ref: number = path.length * 2;
      const field_struct_name = path_filter[1];
      dependency_injections.push(path.join("."));
      dependency_injections.push(path.join("."));
      const stmt = apply(undefined, () => {
        switch (field_struct_name) {
          case "str":
          case "lstr":
          case "clob": {
            return `MAX(CASE WHEN (path_name_expression = ?) THEN (v${val_ref}.text_value) END) AS ?`;
          }
          case "i32":
          case "u32":
          case "i64":
          case "u64": {
            return `MAX(CASE WHEN (path_name_expression = ?) THEN (v${val_ref}.integer_value) END) AS ?`;
          }
          case "idouble":
          case "udouble":
          case "idecimal":
          case "udecimal": {
            return `MAX(CASE WHEN (path_name_expression = ?) THEN (v${val_ref}.real_value) END) AS ?`;
          }
          case "bool": {
            return `MAX(CASE WHEN (path_name_expression = ?) THEN (v${val_ref}.integer_value) END) AS ?`;
          }
          case "date":
          case "time":
          case "timestamp": {
            return `MAX(CASE WHEN (path_name_expression = ?) THEN (v${val_ref}.integer_value) END) AS ?`;
          }
          case "other": {
            return `MAX(CASE WHEN (path_name_expression = ?) THEN (v${val_ref}.integer_value) END) AS ?`;
          }
          default: {
            const _exhaustiveCheck: never = field_struct_name;
            return _exhaustiveCheck;
          }
        }
      });
      append_to_select_stmt(stmt);
    });
  });
  console.log(select_stmt);

  var where_stmt: string = "WHERE ";
  const append_to_where_stmt = (stmt: string) => {
    where_stmt += apply(undefined, () => {
      if (where_stmt === "WHERE ") {
        return `(${stmt})`;
      } else {
        return ` AND (${stmt})`;
      }
    });
  };

  if (variable_filters.level !== undefined) {
    const value: Decimal = variable_filters.level;
    dependency_injections.push(value.truncated().toString());
    stmt = "v1.level = ?";
    append_to_where_stmt(stmt);
  }
  apply(undefined, () => {
    stmt = variable_filters.id
      .map((variable_filter) => {
        const op = variable_filter[0];
        switch (op) {
          case "==":
          case "!=":
          case ">=":
          case "<=":
          case ">":
          case "<": {
            const value = variable_filter[1];
            dependency_injections.push(value.truncated().toString());
            return `v1.id ${op} ?`;
          }
          case "between":
          case "not_between": {
            const start_value = variable_filter[1][0];
            const end_value = variable_filter[1][1];
            dependency_injections.push(start_value.truncated().toString());
            dependency_injections.push(end_value.truncated().toString());
            return `v1.id BETWEEN ? AND ?`;
          }
          default: {
            const _exhaustiveCheck: never = op;
            return _exhaustiveCheck;
          }
        }
      })
      .join(", ");
    if (stmt !== "") {
      append_to_where_stmt(stmt);
    }
  });
  apply(undefined, () => {
    stmt = variable_filters.active
      .map((variable_filter) => {
        const op = variable_filter[0];
        switch (op) {
          case "==":
          case "!=": {
            const value = variable_filter[1];
            dependency_injections.push(value ? "1" : "0");
            return `v1.active ${op} ?`;
          }
          default: {
            const _exhaustiveCheck: never = op;
            return _exhaustiveCheck;
          }
        }
      })
      .join(", ");
    if (stmt !== "") {
      append_to_where_stmt(stmt);
    }
  });
  apply(undefined, () => {
    stmt = variable_filters.created_at
      .map((variable_filter) => {
        const op = variable_filter[0];
        switch (op) {
          case "==":
          case "!=":
          case ">=":
          case "<=":
          case ">":
          case "<": {
            const value = variable_filter[1];
            dependency_injections.push(value.getTime().toString());
            return `v1.created_at ${op} ?`;
          }
          case "between":
          case "not_between": {
            const start_value = variable_filter[1][0];
            const end_value = variable_filter[1][1];
            dependency_injections.push(start_value.getTime().toString());
            dependency_injections.push(end_value.getTime().toString());
            return `v1.created_at BETWEEN ? AND ?`;
          }
          default: {
            const _exhaustiveCheck: never = op;
            return _exhaustiveCheck;
          }
        }
      })
      .join(", ");
    if (stmt !== "") {
      append_to_where_stmt(stmt);
    }
  });
  apply(undefined, () => {
    stmt = variable_filters.updated_at
      .map((variable_filter) => {
        const op = variable_filter[0];
        switch (op) {
          case "==":
          case "!=":
          case ">=":
          case "<=":
          case ">":
          case "<": {
            const value = variable_filter[1];
            dependency_injections.push(value.getTime().toString());
            return `v1.updated_at ${op} ?`;
          }
          case "between":
          case "not_between": {
            const start_value = variable_filter[1][0];
            const end_value = variable_filter[1][1];
            dependency_injections.push(start_value.getTime().toString());
            dependency_injections.push(end_value.getTime().toString());
            return `v1.updated_at BETWEEN ? AND ?`;
          }
          default: {
            const _exhaustiveCheck: never = op;
            return _exhaustiveCheck;
          }
        }
      })
      .join(", ");
    if (stmt !== "") {
      append_to_where_stmt(stmt);
    }
  });

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
        sort_option: path_filter[2],
      }))
      .filter((path_filter) => path_filter.sort_option !== undefined)
      .sort((a, b) => {
        if (a.sort_option !== undefined && b.sort_option !== undefined) {
          if (a.sort_option[0] < b.sort_option[0]) {
            return -1;
          } else {
            return 1;
          }
        }
        return 0;
      }),
    (path_filters) => {
      for (let path_filter of path_filters) {
        if (path_filter.sort_option !== undefined) {
          const path: ReadonlyArray<string> = path_filter.path;
          const sort_order = path_filter.sort_option[1] ? "DESC" : "ASC";
          dependency_injections.push(path.join("."));
          append_to_order_by_stmt("?");
        }
      }
    }
  );
  append_to_order_by_stmt("_requested_at DESC, _updated_at DESC");
  console.log(order_by_stmt);

  var [from_stmt, where_stmt] = apply(
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
              dependency_injections.push(struct_name);
            } else {
              where_stmt += ` v${var_ref}.struct_name = ? AND v${var_ref}.id = ? AND v${var_ref}.deleted = FALSE`;
              dependency_injections.push(struct_name);
              dependency_injections.push(id.truncated().toString());
            }
          } else {
            if (id === undefined) {
              where_stmt += ` v${var_ref}.struct_name = ? AND v${var_ref}.level = ? AND v${var_ref}.deleted = FALSE`;
              dependency_injections.push(struct_name);
              dependency_injections.push(level.toString());
            } else {
              where_stmt += ` v${var_ref}.struct_name = ? AND v${var_ref}.level = ? AND v${var_ref}.id = ? AND v${var_ref}.deleted = FALSE`;
              dependency_injections.push(struct_name);
              dependency_injections.push(level.toString());
              dependency_injections.push(id.truncated().toString());
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
              dependency_injections.push(struct_name);
            } else {
              where_stmt += ` AND v${var_ref}.struct_name = ? AND v${var_ref}.id = ? AND v${var_ref}.deleted = FALSE`;
              dependency_injections.push(struct_name);
              dependency_injections.push(id.truncated().toString());
            }
          } else {
            if (id === undefined) {
              where_stmt += ` AND v${var_ref}.struct_name = ? AND v${var_ref}.level = ? AND v${var_ref}.deleted = FALSE`;
              dependency_injections.push(struct_name);
              dependency_injections.push(level.toString());
            } else {
              where_stmt += ` AND v${var_ref}.struct_name = ? AND v${var_ref}.level = ? AND v${var_ref}.id = ? AND v${var_ref}.deleted = FALSE`;
              dependency_injections.push(struct_name);
              dependency_injections.push(level.toString());
              dependency_injections.push(id.truncated().toString());
            }
          }
        }
        // Filter field by names and their struct names
        apply(
          fold("", path_filters, (acc, val) => {
            if (i < val[0].length) {
              dependency_injections.push(val[0][i]);
              dependency_injections.push(val[1]);
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
  console.log(dependency_injections);
  // Process path filtering by their ops and values/other_paths
  const filters_stmt: Array<Array<string>> = [];
  for (let path_filter of path_filters) {
    const path: ReadonlyArray<string> = path_filter[0];
    const val_ref: number = path_filter[0].length;
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
                        dependency_injections.push(path_field_name);
                        path_constraints.push(
                          `v${path_field_index + 1}.field_name = ?`
                        );
                      }
                      const referenced_val_ref = value.length;
                      return `${path_constraints.join(
                        " AND "
                      )} AND v${referenced_val_ref}.text_value IS NOT NULL AND v${val_ref}.field_struct_name = "${field_struct_name}" AND v${val_ref}.text_value ${op} v${referenced_val_ref}.text_value`;
                    });
                  } else {
                    dependency_injections.push(value);
                    return `v${val_ref}.field_struct_name = "${field_struct_name}" AND v${val_ref}.text_value ${op} ?`;
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
                            dependency_injections.push(path_field_name);
                            start_path_constraints.push(
                              `v${path_field_index + 1}.field_name = ?`
                            );
                          }
                          for (let [
                            path_field_index,
                            path_field_name,
                          ] of end_value.entries()) {
                            dependency_injections.push(path_field_name);
                            end_path_constraints.push(
                              `v${path_field_index + 1}.field_name = ?`
                            );
                          }
                          const referenced_start_val_ref = start_value.length;
                          const referenced_end_val_ref = end_value.length;
                          return `${start_path_constraints.join(
                            " AND "
                          )} AND ${end_path_constraints.join(
                            " AND "
                          )} AND v${referenced_start_val_ref}.text_value IS NOT NULL AND v${referenced_end_val_ref}.text_value IS NOT NULL AND v${val_ref}.field_struct_name = "${field_struct_name}" AND v${val_ref}.text_value ${
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
                          dependency_injections.push(path_field_name);
                          path_constraints.push(
                            `v${path_field_index + 1}.field_name = ?`
                          );
                        }
                        dependency_injections.push(end_value);
                        const referenced_val_ref = start_value.length;
                        return `${path_constraints.join(
                          " AND "
                        )} AND v${referenced_val_ref}.text_value IS NOT NULL AND v${val_ref}.field_struct_name = "${field_struct_name}" AND v${val_ref}.text_value ${
                          op === "not_between" ? "NOT BETWEEN" : op
                        } v${referenced_val_ref}.text_value AND ?`;
                      });
                    }
                  } else {
                    if (typeof end_value === "object") {
                      return apply([] as Array<string>, (path_constraints) => {
                        for (let [
                          path_field_index,
                          path_field_name,
                        ] of end_value.entries()) {
                          dependency_injections.push(path_field_name);
                          path_constraints.push(
                            `v${path_field_index + 1}.field_name = ?`
                          );
                        }
                        dependency_injections.push(start_value);
                        const referenced_val_ref = end_value.length;
                        return `${path_constraints.join(
                          " AND "
                        )} AND v${referenced_val_ref}.text_value IS NOT NULL AND v${val_ref}.field_struct_name = "${field_struct_name}" AND v${val_ref}.text_value ${
                          op === "not_between" ? "NOT BETWEEN" : op
                        } ? AND v${referenced_val_ref}.text_value`;
                      });
                    } else {
                      dependency_injections.push(start_value);
                      dependency_injections.push(end_value);
                      return `v${val_ref}.field_struct_name = "${field_struct_name}" AND v${val_ref}.text_value ${
                        op === "not_between" ? "NOT BETWEEN" : op
                      } ? AND ?`;
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
            if (index > filters_stmt.length) {
              for (let j = index - filters_stmt.length; j > 0; j--) {
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
                    if (integer_fields.includes(field_struct_name)) {
                      dependency_injections.push(value.truncated().toString());
                    } else {
                      dependency_injections.push(value.toString());
                    }
                    return `v${val_ref}.field_struct_name = "${field_struct_name}" AND v${val_ref}.${
                      integer_fields.includes(field_struct_name)
                        ? "integer_value"
                        : "real_value"
                    } ${op} ?`;
                  } else {
                    return apply([] as Array<string>, (path_constraints) => {
                      for (let [
                        path_field_index,
                        path_field_name,
                      ] of value.entries()) {
                        dependency_injections.push(path_field_name);
                        path_constraints.push(
                          `v${path_field_index + 1}.field_name = ?`
                        );
                      }
                      const referenced_val_ref = value.length;
                      return `${path_constraints.join(
                        " AND "
                      )} AND (v${referenced_val_ref}.integer_value IS NOT NULL OR v${referenced_val_ref}.real_value IS NOT NULL) AND v${val_ref}.field_struct_name = "${field_struct_name}" AND (v${val_ref}.${
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
                      if (integer_fields.includes(field_struct_name)) {
                        dependency_injections.push(
                          start_value.truncated().toString()
                        );
                        dependency_injections.push(
                          end_value.truncated().toString()
                        );
                      } else {
                        dependency_injections.push(start_value.toString());
                        dependency_injections.push(end_value.toString());
                      }
                      return `v${val_ref}.field_struct_name = "${field_struct_name}" AND v${val_ref}.${
                        integer_fields.includes(field_struct_name)
                          ? "integer_value"
                          : "real_value"
                      } ${op === "not_between" ? "NOT BETWEEN" : op} ? AND ?`;
                    } else {
                      return apply([] as Array<string>, (path_constraints) => {
                        for (let [
                          path_field_index,
                          path_field_name,
                        ] of end_value.entries()) {
                          dependency_injections.push(path_field_name);
                          path_constraints.push(
                            `v${path_field_index + 1}.field_name = ?`
                          );
                        }
                        if (integer_fields.includes(field_struct_name)) {
                          dependency_injections.push(
                            start_value.truncated().toString()
                          );
                        } else {
                          dependency_injections.push(start_value.toString());
                        }
                        const referenced_val_ref = end_value.length;
                        return `${path_constraints.join(
                          " AND "
                        )} AND (v${referenced_val_ref}.integer_value IS NOT NULL OR v${referenced_val_ref}.real_value IS NOT NULL) AND v${val_ref}.field_struct_name = "${field_struct_name}" AND ((v${val_ref}.${
                          integer_fields.includes(field_struct_name)
                            ? "integer_value"
                            : "real_value"
                        } ${
                          op === "not_between" ? "NOT BETWEEN" : op
                        } ? AND v${referenced_val_ref}.integer_value) OR (v${val_ref}.${
                          integer_fields.includes(field_struct_name)
                            ? "integer_value"
                            : "real_value"
                        } ${
                          op === "not_between" ? "NOT BETWEEN" : op
                        } ? AND v${referenced_val_ref}.real_value))`;
                      });
                    }
                  } else {
                    if (is_decimal(end_value)) {
                      return apply([] as Array<string>, (path_constraints) => {
                        for (let [
                          path_field_index,
                          path_field_name,
                        ] of start_value.entries()) {
                          dependency_injections.push(path_field_name);
                          path_constraints.push(
                            `v${path_field_index + 1}.field_name = ?`
                          );
                        }
                        if (integer_fields.includes(field_struct_name)) {
                          dependency_injections.push(
                            end_value.truncated().toString()
                          );
                        } else {
                          dependency_injections.push(end_value.toString());
                        }
                        const referenced_val_ref = start_value.length;
                        return `${path_constraints.join(
                          " AND "
                        )} AND (v${referenced_val_ref}.integer_value IS NOT NULL OR v${referenced_val_ref}.real_value IS NOT NULL) AND v${val_ref}.field_struct_name = "${field_struct_name}" AND ((v${val_ref}.${
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
                        } v${referenced_val_ref}.real_value AND ?))`;
                      });
                    } else {
                      return apply(
                        [[], []] as [Array<string>, Array<string>],
                        ([start_path_constraints, end_path_constraints]) => {
                          for (let [
                            path_field_index,
                            path_field_name,
                          ] of start_value.entries()) {
                            dependency_injections.push(path_field_name);
                            start_path_constraints.push(
                              `v${path_field_index + 1}.field_name = ?`
                            );
                          }
                          for (let [
                            path_field_index,
                            path_field_name,
                          ] of end_value.entries()) {
                            dependency_injections.push(path_field_name);
                            end_path_constraints.push(
                              `v${path_field_index + 1}.field_name = ?`
                            );
                          }
                          const referenced_start_val_ref = start_value.length;
                          const referenced_end_val_ref = end_value.length;
                          return `${start_path_constraints.join(
                            " AND "
                          )} AND ${end_path_constraints.join(
                            " AND "
                          )} AND (v${referenced_start_val_ref}.integer_value IS NOT NULL OR v${referenced_start_val_ref}.real_value IS NOT NULL) AND (v${referenced_end_val_ref}.integer_value IS NOT NULL OR v${referenced_end_val_ref}.real_value IS NOT NULL) AND v${val_ref}.field_struct_name = "${field_struct_name}" AND ((v${val_ref}.${
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
            if (index > filters_stmt.length) {
              for (let j = index - filters_stmt.length; j > 0; j--) {
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
                        dependency_injections.push(path_field_name);
                        path_constraints.push(
                          `v${path_field_index + 1}.field_name = ?`
                        );
                      }
                      const referenced_val_ref = value.length;
                      return `${path_constraints.join(
                        " AND "
                      )} AND v${referenced_val_ref}.integer_value IS NOT NULL AND v${val_ref}.field_struct_name = "${field_struct_name}" AND v${val_ref}.integer_value ${op} v${referenced_val_ref}.integer_value`;
                    });
                  } else {
                    dependency_injections.push(value ? "1" : "0");
                    return `v${val_ref}.field_struct_name = "${field_struct_name}" AND v${val_ref}.integer_value ${op} ?`;
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
            if (index > filters_stmt.length) {
              for (let j = index - filters_stmt.length; j > 0; j--) {
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
                    dependency_injections.push(value.getTime().toString());
                    return `v${val_ref}.field_struct_name = "${field_struct_name}" AND v${val_ref}.integer_value ${op} ?`;
                  } else {
                    return apply([] as Array<string>, (path_constraints) => {
                      for (let [
                        path_field_index,
                        path_field_name,
                      ] of value.entries()) {
                        dependency_injections.push(path_field_name);
                        path_constraints.push(
                          `v${path_field_index + 1}.field_name = ?`
                        );
                      }
                      const referenced_val_ref = value.length;
                      return `${path_constraints.join(
                        " AND "
                      )} AND v${referenced_val_ref}.integer_value IS NOT NULL AND v${val_ref}.field_struct_name = "${field_struct_name}" AND v${val_ref}.integer_value ${op} v${referenced_val_ref}.integer_value`;
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
                      dependency_injections.push(start_value.toString());
                      dependency_injections.push(end_value.toString());
                      return `v${val_ref}.field_struct_name = "${field_struct_name}" AND v${val_ref}.integer_value ${
                        op === "not_between" ? "NOT BETWEEN" : op
                      } ? AND ?`;
                    } else {
                      return apply([] as Array<string>, (path_constraints) => {
                        for (let [
                          path_field_index,
                          path_field_name,
                        ] of end_value.entries()) {
                          dependency_injections.push(path_field_name);
                          path_constraints.push(
                            `v${path_field_index + 1}.field_name = ?`
                          );
                        }
                        dependency_injections.push(start_value.toString());
                        const referenced_val_ref = end_value.length;
                        return `${path_constraints.join(
                          " AND "
                        )} AND v${referenced_val_ref}.integer_value IS NOT NULL AND v${val_ref}.field_struct_name = "${field_struct_name}" AND (v${val_ref}.integer_value ${
                          op === "not_between" ? "NOT BETWEEN" : op
                        } ? AND v${referenced_val_ref}.integer_value)`;
                      });
                    }
                  } else {
                    if (is_decimal(end_value)) {
                      return apply([] as Array<string>, (path_constraints) => {
                        for (let [
                          path_field_index,
                          path_field_name,
                        ] of start_value.entries()) {
                          dependency_injections.push(path_field_name);
                          path_constraints.push(
                            `v${path_field_index + 1}.field_name = ?`
                          );
                        }
                        dependency_injections.push(end_value.toString());
                        const referenced_val_ref = start_value.length;
                        return `${path_constraints.join(
                          " AND "
                        )} AND v${referenced_val_ref}.integer_value IS NOT NULL AND v${val_ref}.field_struct_name = "${field_struct_name}" AND (v${val_ref}.integer_value ${
                          op === "not_between" ? "NOT BETWEEN" : op
                        } v${referenced_val_ref}.integer_value AND ?)`;
                      });
                    } else {
                      return apply(
                        [[], []] as [Array<string>, Array<string>],
                        ([start_path_constraints, end_path_constraints]) => {
                          for (let [
                            path_field_index,
                            path_field_name,
                          ] of start_value.entries()) {
                            dependency_injections.push(path_field_name);
                            start_path_constraints.push(
                              `v${path_field_index + 1}.field_name = ?`
                            );
                          }
                          for (let [
                            path_field_index,
                            path_field_name,
                          ] of end_value.entries()) {
                            dependency_injections.push(path_field_name);
                            end_path_constraints.push(
                              `v${path_field_index + 1}.field_name = ?`
                            );
                          }
                          const referenced_start_val_ref = start_value.length;
                          const referenced_end_val_ref = end_value.length;
                          return `${start_path_constraints.join(
                            " AND "
                          )} AND ${end_path_constraints.join(
                            " AND "
                          )} AND v${referenced_start_val_ref}.integer_value IS NOT NULL AND v${referenced_end_val_ref}.integer_value IS NOT NULL AND v${val_ref}.field_struct_name = "${field_struct_name}" AND (v${val_ref}.integer_value ${
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
            if (index > filters_stmt.length) {
              for (let j = index - filters_stmt.length; j > 0; j--) {
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
                    dependency_injections.push(value.truncated().toString());
                    return `v${val_ref}.field_struct_name = "${field_struct_name}" AND v${val_ref}.integer_value ${op} ?`;
                  } else {
                    return apply([] as Array<string>, (path_constraints) => {
                      for (let [
                        path_field_index,
                        path_field_name,
                      ] of value.entries()) {
                        dependency_injections.push(path_field_name);
                        path_constraints.push(
                          `v${path_field_index + 1}.field_name = ?`
                        );
                      }
                      const referenced_val_ref = value.length;
                      return `${path_constraints.join(
                        " AND "
                      )} AND v${referenced_val_ref}.field_struct_name = "${field_struct_name}" AND v${referenced_val_ref}.integer_value IS NOT NULL AND v${val_ref}.field_struct_name = "${field_struct_name}" AND v${val_ref}.integer_value ${op} v${referenced_val_ref}.integer_value`;
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
            if (index > filters_stmt.length) {
              for (let j = index - filters_stmt.length; j > 0; j--) {
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
  console.log(filters_stmt);
  console.log(
    ` AND (${filters_stmt.map((x) => `(${x.join(" AND ")})`).join(" OR ")})`
  );
  where_stmt += ` AND (${filters_stmt
    .map((x) => `(${x.join(" AND ")})`)
    .join(" OR ")})`;
}
