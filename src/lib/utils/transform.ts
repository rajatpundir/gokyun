import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { get_path_with_type } from "./commons";
import { FilterPath, get_variables, OrFilter } from "./db";
import { ErrMsg, errors } from "./errors";
import { Fx, FxArgs, get_fx } from "./fx";
import { BooleanLispExpression, LispExpression } from "./lisp";
import { apply, arrow, CustomError, Err, Ok, Result, unwrap } from "./prelude";
import { get_struct } from "./schema";
import {
  compare_paths,
  get_flattened_path,
  PathString,
  StrongEnum,
  WeakEnum,
} from "./variable";

type TrandformQuery =
  | {
      struct: string;
      // query on basis of top level fields
      fields: ReadonlyArray<string>;
      map: Record<string, PathString>;
    }
  | undefined;

// probably irrelevant
type TransformInputs = Record<string, LispExpression>;

type TransformArgs = {
  base: ReadonlyArray<FxArgs>;
  query: FxArgs;
};

type TransformChecks = Record<string, [BooleanLispExpression, ErrMsg]>;

export class Tranform {
  name: string;
  type: "fx" | "compose";
  invoke: string;
  query: TrandformQuery;
  inputs: TransformInputs;
  checks: TransformChecks;

  constructor(
    name: string,
    type: "fx" | "compose",
    invoke: string,
    query: TrandformQuery,
    inputs: TransformInputs,
    checks: TransformChecks
  ) {
    this.name = name;
    this.type = type;
    this.invoke = invoke;
    this.query = query;
    this.inputs = inputs;
    this.checks = checks;
  }

  equals(other: Tranform): boolean {
    if (!other) {
      return false;
    }
    return this.name === other.name;
  }

  hashCode(): number {
    return 0;
  }

  toString(): string {
    return String(this.name);
  }

  // get_symbols_for_query(
  //   query: Exclude<TrandformQuery, undefined>,
  //   values: TransformArgs["values"]
  // ) {
  //   const struct = get_struct(query.struct);
  //   if (unwrap(struct)) {
  //     const paths: ReadonlyArray<PathString> = arrow(() => {
  //       let paths: ReadonlyArray<PathString> = [];
  //       for (const field_name of Object.keys(query.fields)) {
  //         const expr = query.fields[field_name];
  //         paths = paths.concat(expr.get_paths());
  //       }
  //       return apply([] as Array<PathString>, (it) => {
  //         for (const path of paths) {
  //           let check = true;
  //           for (const existing_path of it) {
  //             if (compare_paths(path, existing_path)) {
  //               check = false;
  //               break;
  //             }
  //           }
  //           if (check) {
  //             it.push(path);
  //           }
  //         }
  //         return it;
  //       });
  //     });
  //     console.log(paths);
  //     // construct symbols based on paths
  //     const symbols: Record<string, Symbol> = {};
  //     for (const field_name of Object.keys(query.fields)) {
  //       if (field_name in struct.value.fields) {
  //         const field = struct.value.fields[field_name];
  //         if (field_name in values) {
  //           const value = values[field_name];
  //           if (value.type === field.type) {
  //           } else {
  //             return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  //           }
  //         } else {
  //           return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  //         }
  //       } else {
  //         return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  //       }
  //     }
  //   } else {
  //     return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  //   }
  // }

  async get_symbols(args: TransformArgs, level: Decimal) {
    const result: Result<Fx> = arrow(() => {
      switch (this.type) {
        case "fx": {
          return get_fx(this.invoke);
        }
        case "compose": {
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
        default: {
          const _exhaustiveCheck: never = this.type;
          return _exhaustiveCheck;
        }
      }
    });
    if (unwrap(result)) {
      const fx = result.value;
      if (this.query !== undefined) {
        // use query to get fields, overwrite args fields except those prohibited by query
        // overwritten args fields must be proven ownership over
        const query = this.query;
        const result = get_struct(query.struct);
        if (unwrap(result)) {
          const struct = result.value;
          const filter_paths: Array<FilterPath> = [];
          // 1. construct filter paths
          for (const field_name of Object.keys(struct.fields)) {
            if (query.fields.includes(field_name)) {
              const field = struct.fields[field_name];
              if (field_name in args.query) {
                const arg = args.query[field_name];
                if (arg.type !== "other") {
                  if (arg.type === field.type) {
                    filter_paths.push(
                      arrow(() => {
                        switch (arg.type) {
                          case "str":
                          case "lstr":
                          case "clob": {
                            return new FilterPath(
                              field_name,
                              [[], field_name],
                              [arg.type, ["==", arg.value]],
                              undefined
                            );
                          }
                          case "i32":
                          case "u32":
                          case "i64":
                          case "u64": {
                            return new FilterPath(
                              field_name,
                              [[], field_name],
                              [arg.type, ["==", arg.value]],
                              undefined
                            );
                          }
                          case "idouble":
                          case "udouble":
                          case "idecimal":
                          case "udecimal": {
                            return new FilterPath(
                              field_name,
                              [[], field_name],
                              [arg.type, ["==", arg.value]],
                              undefined
                            );
                          }
                          case "bool": {
                            return new FilterPath(
                              field_name,
                              [[], field_name],
                              [arg.type, ["==", arg.value]],
                              undefined
                            );
                          }
                          case "date":
                          case "time":
                          case "timestamp": {
                            return new FilterPath(
                              field_name,
                              [[], field_name],
                              [arg.type, ["==", arg.value]],
                              undefined
                            );
                          }
                          default: {
                            const _exhaustiveCheck: never = arg;
                            return _exhaustiveCheck;
                          }
                        }
                      })
                    );
                  } else {
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                } else {
                  if (arg.type === field.type && arg.other === field.other) {
                    const other_struct = get_struct(field.other);
                    if (unwrap(other_struct)) {
                      filter_paths.push(
                        new FilterPath(
                          field_name,
                          [[], field_name],
                          [arg.type, ["==", arg.value], other_struct.value],
                          undefined
                        )
                      );
                    } else {
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  } else {
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                }
              } else {
                if (field.default !== undefined) {
                  switch (field.type) {
                    case "str":
                    case "lstr":
                    case "clob": {
                      filter_paths.push(
                        new FilterPath(
                          field_name,
                          [[], field_name],
                          [field.type, ["==", field.default]],
                          undefined
                        )
                      );
                      break;
                    }
                    case "i32":
                    case "u32":
                    case "i64":
                    case "u64": {
                      filter_paths.push(
                        new FilterPath(
                          field_name,
                          [[], field_name],
                          [field.type, ["==", field.default]],
                          undefined
                        )
                      );
                      break;
                    }
                    case "idouble":
                    case "udouble":
                    case "idecimal":
                    case "udecimal": {
                      filter_paths.push(
                        new FilterPath(
                          field_name,
                          [[], field_name],
                          [field.type, ["==", field.default]],
                          undefined
                        )
                      );
                      break;
                    }
                    case "bool": {
                      filter_paths.push(
                        new FilterPath(
                          field_name,
                          [[], field_name],
                          [field.type, ["==", field.default]],
                          undefined
                        )
                      );
                      break;
                    }
                    case "date":
                    case "time":
                    case "timestamp": {
                      filter_paths.push(
                        new FilterPath(
                          field_name,
                          [[], field_name],
                          [field.type, ["==", field.default]],
                          undefined
                        )
                      );
                      break;
                    }
                    case "other": {
                      field.other;
                      const other_struct = get_struct(field.other);
                      if (unwrap(other_struct)) {
                        filter_paths.push(
                          new FilterPath(
                            field_name,
                            [[], field_name],
                            [
                              field.type,
                              ["==", field.default],
                              other_struct.value,
                            ],
                            undefined
                          )
                        );
                      } else {
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                      break;
                    }
                    default: {
                      const _exhaustiveCheck: never = field;
                      return _exhaustiveCheck;
                    }
                  }
                } else {
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
            }
          }
          // 2. get paths used in map that were not in filtering
          for (const name of Object.keys(query.map)) {
            const path = query.map[name];
            let check = true;
            for (const filter_path of filter_paths) {
              if (compare_paths(filter_path.path, path)) {
                check = false;
                break;
              }
            }
            if (check) {
              const result = get_path_with_type(struct, path);
              if (unwrap(result)) {
                const field_struct_name = result.value[1];
                if (field_struct_name[0] !== "other") {
                  filter_paths.push(
                    new FilterPath(
                      get_flattened_path(path).join("."),
                      path,
                      [field_struct_name[0], undefined],
                      undefined
                    )
                  );
                } else {
                  filter_paths.push(
                    new FilterPath(
                      get_flattened_path(path).join("."),
                      path,
                      [field_struct_name[0], undefined, field_struct_name[1]],
                      undefined
                    )
                  );
                }
              } else {
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            }
          }
          // 3. query db
          const variables = await get_variables(
            struct,
            true,
            level,
            new OrFilter(
              0,
              [false, undefined],
              [false, undefined],
              [false, undefined],
              HashSet.ofIterable(filter_paths)
            ),
            HashSet.of(),
            new Decimal(10000),
            new Decimal(0)
          );
          if (unwrap(variables)) {
            // 4. construct args and invoke fx
            const fx_args: FxArgs = {};
            for (const variable of variables.value) {
              // use base, queried variable to construct symbols required by this.inputs
              // output of this.inputs is fed to fx
            }
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        } else {
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      } else {
        // use args.base
        for (const input_name of Object.keys(fx.inputs)) {
          const input = fx.inputs[input_name];
        }
      }
    } else {
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    }
    // if (this.query !== undefined) {
    //   const query = this.query;
    //   const struct = get_struct(query.struct);
    //   if (unwrap(struct)) {
    //     for (const field_name in Object.keys(query.fields)) {
    //       if (field_name in struct.value.fields) {
    //         const field = struct.value.fields[field_name];
    //         if (field_name in Object.keys(args.values)) {
    //           const value = args.values[field_name];
    //         } else {
    //           return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    //         }
    //       } else {
    //         return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    //       }
    //     }
    //   } else {
    //     return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    //   }
    // } else {
    // }
  }

  exec(
    args: TransformArgs,
    level: Decimal
  ): Result<Array<Record<string, StrongEnum>>> {
    const computed_outputs: Array<Record<string, StrongEnum>> = [];
    return new Ok(computed_outputs);
  }
}
