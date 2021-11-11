import { useState } from "react";
import { getState, subscribe } from "./store";
import * as SQLite from "expo-sqlite";
import React from "react";
import { apply, fold } from "./prelude";
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
            "==" | "!=" | ">=" | "<=",
            ">",
            "<",
            "like" | "glob",
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
        | ["==" | "!=" | ">=" | "<=", ">", "<", Decimal | ReadonlyArray<string>]
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
        | ["==" | "!=" | ">=" | "<=", ">", "<", Date | ReadonlyArray<string>]
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

function generate_query(
  struct_name: string,
  limit: Decimal,
  offset: Decimal,
  path_filters: PathFilters,
  level: Decimal | undefined,
  id: Decimal | undefined
) {
  const selections: Array<string> = [
    "v1.level",
    "v1.struct_name",
    "v1.id",
    "v1.created_at",
    "v1.updated_at",
    "v1.requested_at",
    "v1.last_accessed_at",
    "v2.field_name",
    "v2.field_struct_name",
    "v2.text_value",
    "v2.integer_value",
    "v2.real_value",
  ];
  const stmt =
    "SELECT v1.level, v1.struct_name, v1.id, v1.created_at, v1.updated_at, v1.requested_at, v1.last_accessed_at, v2.field_name, v2.field_struct_name, v2.text_value, v2.integer_value, v2.real_value";
  const stmt2 =
    "FROM vars AS v1 INNER JOIN vals AS v2 ON (v2.level = v1.level AND v2.field_struct_name = v1.struct_name AND v2.variable_id = v1.id )";
  const stmt3 = "";
  (" VARS AS v1 INNER JOIN VALS AS v2 ON (v2.level = v1.level AND v2.field_struct_name = v1.struct_name AND v2.variable_id = v1.id )");
  ("WHERE ((v2.field_name = ? AND v2.field_struct_name = ? AND v2.integer_value IS NOT NULL AND v2.integer_value < [? | v4.integer_value] ))");
}

// // [ [ _id, _struct_name, _created_at, _updated_at, _requested_at, _last_accessed_at, [ [ ...path ], struct_name, value ] ] ]

// const x = {
//   level: 0,
//   struct_name: "",
//   id: 0,
//   created_at: 0,
//   updated_at: 0,
//   requested_at: 0,
//   last_accessed_at: 0,
//   vals: [{
//     path: 0 // Path contains some value
//   }]
// };
