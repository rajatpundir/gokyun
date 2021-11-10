import { useState } from "react";
import { getState, subscribe } from "./store";
import * as SQLite from "expo-sqlite";
import React from "react";
import { apply, fold } from "./prelude";

const db = SQLite.openDatabase("db.testDb");

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
          primary_key: ["id", "INTEGER"],
          columns: [
            ["created_at", "INTEGER"],
            ["updated_at", "INTEGER"],
            ["requested_at", "INTEGER"],
            ["last_accessed_at", "INTEGER"],
          ],
        });
      },
      (error) => {
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
    primary_key: [string, "INTEGER" | "REAL" | "TEXT"];
    columns: Array<[string, "INTEGER" | "REAL" | "TEXT"]>;
  }
) {
  tx.executeSql(
    fold(
      `CREATE TABLE IF NOT EXISTS ${table.table_name} (${table.primary_key[0]} ${table.primary_key[1]} PRIMARY KEY NOT NULL`,
      table.columns,
      (acc, val) => acc + `, ${val[0]} ${val[1]}`
    ) + ");",
    [],
    (tx, resultSet) => {
      console.log("Successfully created table: ", table.table_name);
    },
    (tx, error) => {
      console.log("Unable to create table: ", table.table_name);
      return false;
    }
  );
}

function replace_row() {}

function delete_row() {}
