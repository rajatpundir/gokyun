import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
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
import {
  compare_flattened_paths,
  compare_paths,
  get_flattened_path,
  Path,
  PathString,
  StrongEnum,
  Struct,
  Variable,
} from "./variable";
import { ErrMsg, errors } from "./errors";
import { get_struct, StructName } from "../schema/struct";
import { terminal } from "./terminal";

// TODO. Add Existence functionality

const db_name: string = "test1.db";

const db = apply(SQLite.openDatabase(db_name), (db) => {
  db.exec(
    [
      { sql: "PRAGMA foreign_keys = ON;", args: [] },
      { sql: "VACUUM;", args: [] },
      { sql: `DROP TABLE IF EXISTS "LEVELS";`, args: [] },
      { sql: `DROP TABLE IF EXISTS "REMOVED_VARS";`, args: [] },
      { sql: `DROP TABLE IF EXISTS "VARS";`, args: [] },
      { sql: `DROP TABLE IF EXISTS "VALS";`, args: [] },
      { sql: `DROP TABLE IF EXISTS "PARAMS";`, args: [] },
      { sql: `DROP TABLE IF EXISTS "COUNTERS";`, args: [] },
      {
        sql: `CREATE TABLE IF NOT EXISTS "LEVELS" ("id" INTEGER NOT NULL UNIQUE, "created_at" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT));`,
        args: [],
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS "REMOVED_VARS" ("level" INTEGER NOT NULL, "struct_name" TEXT NOT NULL, "id" INTEGER NOT NULL, CONSTRAINT "PK" UNIQUE("level","struct_name","id"), CONSTRAINT "FK" FOREIGN KEY("level") REFERENCES "LEVELS"("id") ON DELETE CASCADE);`,
        args: [],
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS "VARS" ("level" INTEGER NOT NULL, "struct_name" TEXT NOT NULL COLLATE BINARY, "id" INTEGER NOT NULL, "created_at" INTEGER NOT NULL, "updated_at" INTEGER NOT NULL, "requested_at" INTEGER NOT NULL, CONSTRAINT "PK" UNIQUE("level","struct_name","id"), CONSTRAINT "FK" FOREIGN KEY("level") REFERENCES "LEVELS"("id") ON DELETE CASCADE);`,
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
        sql: `REPLACE INTO "LEVELS"("id", "created_at") VALUES (?, ?);`,
        args: [0, 0],
      },
    ],
    false,
    () => {
      terminal(["db", `Successfully run statements`]);
    }
  );
  return db;
});

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
        if (!err.message.includes("UNIQUE constraint failed")) {
          terminal([
            "error",
            ["db", `\nTRANSACTION ERROR: \n${sql}\n${args}\n${err}\n`],
          ]);
        }
        reject(String(err));
      }
    );
  });
}

function query(
  struct: Struct,
  level: Decimal | undefined,
  init_filter: OrFilter,
  filters: HashSet<AndFilter>,
  limit: Decimal,
  offset: Decimal,
  existences: ReadonlyArray<Existence>
): Promise<SQLite.SQLResultSet> {
  const join_count: number = Math.max(
    0,
    ...init_filter.filter_paths
      .toArray()
      .map((filter_path) => filter_path.path[0].length + 1),
    ...filters
      .flatMap((x) => x.filters)
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
    append_to_select_stmt("v1.created_at AS _created_at");
    append_to_select_stmt("v1.updated_at AS _updated_at");
    append_to_select_stmt("v1.requested_at AS _requested_at");
  });

  apply(
    init_filter.filter_paths
      .toArray()
      .map(
        (x) =>
          [get_flattened_path(x.path), x.value[0]] as [
            ReadonlyArray<string>,
            FilterPathValue[0]
          ]
      ),
    (it) => {
      for (const [path, field_struct_name] of it) {
        append_to_select_stmt(
          `MAX(CASE WHEN(${Array.from(Array(path.length).keys())
            .map((x) => `IFNULL(v${2 * (x + 1)}.field_name, '')`)
            .join(` || '.' || `)} = '${path.join(".")}') THEN(v${
            2 * path.length
          }.${arrow(() => {
            switch (field_struct_name) {
              case "str":
              case "lstr":
              case "clob": {
                return "text_value";
              }
              case "i32":
              case "u32":
              case "i64":
              case "u64": {
                return "integer_value";
              }
              case "idouble":
              case "udouble":
              case "idecimal":
              case "udecimal": {
                return "real_value";
              }
              case "bool": {
                return "integer_value";
              }
              case "date":
              case "time":
              case "timestamp": {
                return "integer_value";
              }
              case "other": {
                return "integer_value";
              }
            }
          })}) END) AS '${path.join(".")}'`
        );
      }
    }
  );

  apply(
    arrow(() => {
      let path_headers: Array<ReadonlyArray<string>> = [];
      for (const path_header of init_filter.filter_paths
        .toArray()
        .map((x) => x.path[0])) {
        const sub_path_headers: Array<ReadonlyArray<string>> = [];
        for (let i = 0; i <= path_header.length; i++) {
          sub_path_headers.push(path_header.slice(0, i));
        }
        for (const sub_path_header of sub_path_headers) {
          let check = true;
          for (const ph of path_headers) {
            if (sub_path_header.length === ph.length) {
              if (compare_flattened_paths(sub_path_header, ph)) {
                check = false;
                break;
              }
            }
          }
          if (check && sub_path_header.length !== 0) {
            path_headers.push(sub_path_header);
          }
        }
      }
      return path_headers;
    }),
    (path_headers) => {
      for (const path_header of path_headers) {
        const gen_stmt = (z: [string, string]) =>
          `MAX(CASE WHEN(${Array.from(Array(path_header.length).keys())
            .map((x) => `IFNULL(v${2 * (x + 1)}.field_name, '')`)
            .join(` || '.' || `)} = '${path_header.join(".")}') THEN(v${
            path_header.length * 2 + 1
          }.${z[0]}) END) AS '${path_header.join(".")}${z[1]}'`;
        append_to_select_stmt(gen_stmt(["id", ""]));
        append_to_select_stmt(gen_stmt(["struct_name", "._struct_name"]));
        append_to_select_stmt(gen_stmt(["created_at", "._created_at"]));
        append_to_select_stmt(gen_stmt(["updated_at", "._updated_at"]));
      }
    }
  );

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
    // TODO. MAybe less than equals should be used here.
    let stmt = `v1.level = '${value.abs().truncated().toString()}'`;
    append_to_where_stmt(stmt);
  }
  append_to_where_stmt(`v1.struct_name = '${struct.name}'`);

  let from_stmt: string =
    "FROM vars AS v1 LEFT JOIN vals as v2 ON (v2.level <= v1.level AND v2.struct_name = v1.struct_name AND v2.variable_id = v1.id)";
  append_to_where_stmt(
    `v1.level = (SELECT MAX(vars.level) FROM vars INNER JOIN levels ON (vars.level = levels.id) LEFT JOIN removed_vars ON(removed_vars.level = vars.level AND removed_vars.struct_name = vars.struct_name AND removed_vars.id = vars.id) WHERE vars.struct_name = v1.struct_name AND vars.id = v1.id AND removed_vars.id IS NULL)`
  );
  append_to_where_stmt(
    `v2.level = (SELECT MAX(vals.level) FROM vals INNER JOIN levels ON (vals.level = levels.id) LEFT JOIN removed_vars ON(removed_vars.level = vals.level AND removed_vars.struct_name = vals.struct_name AND removed_vars.id = vals.variable_id) WHERE vals.struct_name = v2.struct_name AND vals.variable_id = v2.variable_id AND vals.field_name = v2.field_name AND removed_vars.id IS NULL)`
  );

  for (let i = 1; i < join_count; i++) {
    let var_ref = i * 2 + 1;
    const prev_val_ref = var_ref - 1;
    const next_val_ref = var_ref + 1;
    from_stmt += `\n LEFT JOIN vars AS v${var_ref} ON (v${var_ref}.level <= v${prev_val_ref}.level AND v${var_ref}.struct_name = v${prev_val_ref}.field_struct_name AND  v${var_ref}.id = v${prev_val_ref}.integer_value)`;
    from_stmt += `\n LEFT JOIN vals AS v${next_val_ref} ON (v${next_val_ref}.level <= v${var_ref}.level AND v${next_val_ref}.struct_name = v${var_ref}.struct_name AND v${next_val_ref}.variable_id = v${var_ref}.id)`;
    append_to_where_stmt(
      `v${var_ref}.level IS NULL OR v${var_ref}.level = (SELECT MAX(vars.level) FROM vars INNER JOIN levels ON (vars.level = levels.id) LEFT JOIN removed_vars ON(removed_vars.level = vars.level AND removed_vars.struct_name = vars.struct_name AND removed_vars.id = vars.id) WHERE vars.struct_name = v${var_ref}.struct_name AND vars.id = v${var_ref}.id AND removed_vars.id IS NULL)`
    );
    append_to_where_stmt(
      `v${next_val_ref}.level IS NULL OR v${next_val_ref}.level = (SELECT MAX(vals.level) FROM vals INNER JOIN levels ON (vals.level = levels.id) LEFT JOIN removed_vars ON(removed_vars.level = vals.level AND removed_vars.struct_name = vals.struct_name AND removed_vars.id = vals.variable_id) WHERE vals.struct_name = v${next_val_ref}.struct_name AND vals.variable_id = v${next_val_ref}.variable_id AND vals.field_name = v${next_val_ref}.field_name AND removed_vars.id IS NULL)`
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
        for (const arg of filter_args) {
          args.push(arg);
        }
      }
      return stmt;
    });
    const filters_stmt = filters
      .toArray()
      .map((and_filter) =>
        and_filter.filters
          .toArray()
          .map((or_filter) => {
            const [stmt, filter_args] = get_filter_stmt(or_filter);
            if (stmt !== "") {
              for (const arg of filter_args) {
                args.push(arg);
              }
            }
            return stmt;
          })
          .filter((x) => x !== "")
          .map((x) => `(${x})`)
          .join(" \nOR ")
      )
      .filter((x) => x !== "")
      .map((x) => `(${x})`)
      .join(" \nAND ");
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
      for (const path_filter of path_filters) {
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
  terminal(["db", `FINAL STMT = ${final_stmt}`]);
  terminal(["db", `ARGS: ${args}`]);
  return execute_transaction(final_stmt, args);
}

function get_filter_stmt(
  filter: OrFilter
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
  for (const filter_path of filter.filter_paths) {
    if (filter_path.active) {
      const [stmt, filter_path_args] = get_filter_path_stmt(filter_path);
      if (stmt !== "") {
        append_to_filter_stmt(stmt);
        for (const arg of filter_path_args) {
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

async function get_max_level(): Promise<Result<Decimal>> {
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
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

export async function create_level(): Promise<Result<Decimal>> {
  const max_level = await get_max_level();
  if (unwrap(max_level)) {
    const level = max_level.value.add(1).abs().truncated();
    await execute_transaction(
      `INSERT INTO "LEVELS"("id", "created_at") VALUES (?, ?);`,
      [level.toString(), new Date().getTime().toString()]
    );
    return new Ok(level);
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
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

async function get_struct_counter(name: string): Promise<Result<Decimal>> {
  try {
    const result_set = await execute_transaction(
      `SELECT struct_name, count FROM counters WHERE struct_name = ?`,
      [name]
    );
    if (result_set.rows.length == 1) {
      const result = result_set.rows._array[0];
      if ("count" in result) {
        return new Ok(new Decimal(result["count"]).truncated().abs().negated());
      }
    } else {
      try {
        const result_set = await execute_transaction(
          `REPLACE INTO "COUNTERS" ("struct_name", "count") VALUES(?, 2)`,
          [name]
        );
        return new Ok(new Decimal(-2));
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

export async function get_incremented_struct_counter(
  name: string
): Promise<Result<Decimal>> {
  const counter = await get_struct_counter(name);
  if (unwrap(counter)) {
    const result_set = await execute_transaction(
      `UPDATE "COUNTERS" SET count = ? WHERE struct_name = ?`,
      [counter.value.truncated().abs().add(1).toString(), name]
    );
    return new Ok(counter.value.truncated().abs().negated());
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}

export async function get_variables(
  struct: Struct,
  level: Decimal | undefined,
  init_filter: OrFilter,
  filters: HashSet<AndFilter>,
  limit: Decimal,
  offset: Decimal,
  existences: ReadonlyArray<Existence>
): Promise<Result<Array<Variable>>> {
  try {
    const variables: Array<Variable> = [];
    const result_set = await query(
      struct,
      level,
      init_filter,
      filters,
      limit,
      offset,
      existences
    );
    terminal(["db", `${JSON.stringify(result_set, null, 2)}`]);
    for (const result of result_set.rows._array) {
      try {
        const paths: Array<Path> = [];
        for (const filter_path of init_filter.filter_paths) {
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
                  created_at: Date;
                  updated_at: Date;
                }
              ]
            > = [];
            for (const [index, field_name] of init.entries()) {
              const ref: string = init.slice(0, index + 1).join(".");
              const ref_struct_name = new String(
                result[`${ref}._struct_name`]
              ).valueOf();
              const ref_struct = get_struct(ref_struct_name as StructName);
              init_path.push([
                field_name,
                {
                  struct: ref_struct,
                  id: new Decimal(result[`${ref}`]).truncated(),
                  created_at: new Date(result[`${ref}._created_at`]),
                  updated_at: new Date(result[`${ref}._updated_at`]),
                },
              ]);
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
            new Date(result["_created_at"]),
            new Date(result["_updated_at"]),
            HashSet.ofIterable(paths)
          )
        );
      } catch (err) {
        terminal(["error", ["db", `${err}`]]);
      }
    }
    return new Ok(variables);
  } catch (err) {
    terminal(["error", ["db", `${err}`]]);
    return new Err(new CustomError([errors.CustomMsg, { msg: err }] as ErrMsg));
  }
}

export async function get_variable(
  struct: Struct,
  level: Decimal | undefined,
  id: Decimal,
  filter_paths: HashSet<FilterPath>,
  existences: ReadonlyArray<Existence>
): Promise<Result<Variable>> {
  try {
    const result = await get_variables(
      struct,
      level,
      new OrFilter(
        0,
        [true, ["==", id]],
        [false, undefined],
        [false, undefined],
        filter_paths
      ),
      HashSet.of(),
      new Decimal(1),
      new Decimal(0),
      existences
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

export class OrFilter {
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

  equals(other: OrFilter): boolean {
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
    return new OrFilter(
      this.index,
      this.id,
      this.created_at,
      this.updated_at,
      this.filter_paths
    );
  }
}

export class AndFilter {
  index: number;
  filters: HashSet<OrFilter>;

  constructor(index: number, filters: HashSet<OrFilter>) {
    this.index = index;
    this.filters = filters;
  }

  equals(other: AndFilter): boolean {
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
    return new AndFilter(this.index, this.filters);
  }
}

type Existence = {
  path: PathString;
  struct: Struct;
  init_filter: OrFilter;
  filters: HashSet<AndFilter>;
};
