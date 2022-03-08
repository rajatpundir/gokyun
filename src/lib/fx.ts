import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import {
  get_path_with_type,
  get_symbols_for_paths,
  inject_system_constants,
} from "./commons";
import {
  FilterPath,
  get_incremented_struct_counter,
  get_variable,
  get_variables,
  OrFilter,
} from "./db";
import { remove_variables_in_db, replace_variable } from "./db_variables";
import { ErrMsg, errors } from "./errors";
import {
  Bool,
  BooleanLispExpression,
  Deci,
  LispExpression,
  Num,
  Symbol,
  Txt,
} from "./lisp";
import {
  apply,
  arrow,
  CustomError,
  Err,
  Ok,
  Option,
  Result,
  unwrap,
  unwrap_array,
} from "./prelude";
import { get_struct, StructName } from "../schema/struct";
import {
  compare_paths,
  get_flattened_path,
  get_path_string,
  Path,
  PathString,
  StrongEnum,
  Variable,
  WeakEnum,
} from "./variable";
import { ComposeArgs, ComposeInputs } from "./compose";

// Note. Trigger fields will be passed to fx for creation of variables, on client side, but absent on server side

type FxInputs = Record<
  string,
  | Exclude<
      WeakEnum,
      {
        type: "other";
        other: string;
        default?: Decimal;
      }
    >
  | {
      type: "other";
      other: string;
      default?: Decimal;
      updates?: ReadonlyArray<{ path: PathString; expr: LispExpression }>;
      delete_mode?: "delete" | "delete_ignore";
    }
>;

export type FxArgs = Record<string, StrongEnum>;

type FxOutputs = Record<
  string,
  | {
      op: "value";
      value: StrongEnum & {
        value: LispExpression;
      };
    }
  | {
      // Abort if there is any unique constraint violation
      op: "insert";
      struct: string;
      fields: { [index: string]: LispExpression };
    }
  | {
      // Ignore the operation, if there is unique constraint violation
      op: "insert_ignore";
      struct: string;
      fields: { [index: string]: LispExpression };
    }
  | {
      // Remove any variable that causes unique constraint violation
      op: "replace";
      struct: string;
      fields: { [index: string]: LispExpression };
    }
  | {
      // Abort if variable(s) cannot be deleted (maybe referenced somewhere)
      op: "delete_all";
      struct: string;
      // the variable(s) is/are queried on basis of matched fields
      fields: ReadonlyArray<{ path: PathString; expr: LispExpression }>;
    }
  | {
      // Ignore the operation if variable(s) cannot be deleted
      op: "delete_all_ignore";
      struct: string;
      // the variable(s) is/are queried on basis of matched fields
      fields: ReadonlyArray<{ path: PathString; expr: LispExpression }>;
    }
>;

type FxChecks = Record<string, [BooleanLispExpression, ErrMsg]>;

export type FxResult = Record<string, StrongEnum>;

// Ownership or borrowing over inputs provided will be checked
// But outputs does not have anything to do with ownership
export class Fx {
  name: string;
  inputs: FxInputs;
  outputs: FxOutputs;
  checks: FxChecks;
  user_invocable: boolean;

  constructor(
    name: string,
    inputs: FxInputs,
    outputs: FxOutputs,
    checks: FxChecks,
    user_invocable: boolean = false
  ) {
    this.name = name;
    this.inputs = inputs;
    this.outputs = outputs;
    this.checks = checks;
    this.user_invocable = user_invocable;
  }

  equals(other: Fx): boolean {
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

  async exec(args: FxArgs, level: Decimal): Promise<Result<FxResult>> {
    console.log("\n[FX]", this.name, "\n", args, "\n");
    const result = await get_symbols_for_fx_compose_paths(
      level,
      arrow(() => {
        // 1. Process checks
        let paths: ReadonlyArray<PathString> = [];
        for (const check_name of Object.keys(this.checks)) {
          const expr = this.checks[check_name][0];
          paths = paths.concat(expr.get_paths());
        }
        // 2. Process input updates
        for (const input_name of Object.keys(this.inputs)) {
          const input = this.inputs[input_name];
          if (input.type === "other" && input.updates !== undefined) {
            for (const { expr } of input.updates) {
              paths = paths.concat(expr.get_paths());
            }
          }
        }
        // 3. Process outputs
        for (const output_name of Object.keys(this.outputs)) {
          const output = this.outputs[output_name];
          if (output.op === "value") {
            const expr = output.value.value;
            paths = paths.concat(expr.get_paths());
          } else {
            switch (output.op) {
              case "insert":
              case "insert_ignore":
              case "replace": {
                for (const field_name of Object.keys(output.fields)) {
                  const expr = output.fields[field_name];
                  paths = paths.concat(expr.get_paths());
                }
                break;
              }
              case "delete_all":
              case "delete_all_ignore": {
                for (const { expr } of output.fields) {
                  paths = paths.concat(expr.get_paths());
                }
                break;
              }
              default: {
                const _exhaustiveCheck: never = output;
                return _exhaustiveCheck;
              }
            }
          }
        }
        return apply([] as Array<PathString>, (it) => {
          for (const path of paths) {
            let check = true;
            for (const existing_path of it) {
              if (compare_paths(path, existing_path)) {
                check = false;
                break;
              }
            }
            if (check) {
              it.push(path);
            }
          }
          return it;
        });
      }),
      [this.inputs, args]
    );
    if (unwrap(result)) {
      const symbols = result.value;
      // 1. run checks
      for (const check_name of Object.keys(this.checks)) {
        const expr = this.checks[check_name][0];
        const result = expr.get_result(symbols);
        if (unwrap(result)) {
          const expr_result = result.value;
          if (expr_result instanceof Bool) {
            if (!expr_result.value) {
              console.log("FX", 1);
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
          } else {
            console.log("FX", 2);
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        } else {
          console.log("FX", 3);
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      }
      // 2. update inputs
      for (const input_name of Object.keys(this.inputs)) {
        const input = this.inputs[input_name];
        if (input.type === "other") {
          const struct = get_struct(input.other as StructName);
          if (input.updates !== undefined) {
            const paths: Array<Path> = [];
            for (const update of input.updates) {
              const path_string = update.path;
              const expr = update.expr;
              const result = get_path_with_type(struct, path_string);
              if (unwrap(result)) {
                const field_struct_name = result.value[1];
                // fetch single path, ignore path update if it does not exist
                const path: Option<Path> = await arrow(async () => {
                  const filter_paths: HashSet<FilterPath> = HashSet.of(
                    arrow(() => {
                      if (field_struct_name[0] !== "other") {
                        return new FilterPath(
                          get_flattened_path(path_string).join("."),
                          path_string,
                          [field_struct_name[0], undefined],
                          undefined
                        );
                      } else {
                        return new FilterPath(
                          get_flattened_path(path_string).join("."),
                          path_string,
                          [
                            field_struct_name[0],
                            undefined,
                            field_struct_name[1],
                          ],
                          undefined
                        );
                      }
                    })
                  );
                  if (input_name in args) {
                    const arg = args[input_name];
                    if (arg.type === input.type) {
                      const variable = await get_variable(
                        struct,
                        level,
                        arg.value,
                        filter_paths,
                        []
                      );
                      if (unwrap(variable)) {
                        const path = variable.value.paths.findAny((x) =>
                          compare_paths(path_string, get_path_string(x))
                        );
                        if (path.isSome()) {
                          const value = path.get().path[1][1];
                          if (value.type !== "other") {
                            if (value.type === field_struct_name[0]) {
                              path.get();
                            }
                          } else {
                            if (value.type === field_struct_name[0]) {
                              if (value.other === field_struct_name[1].name) {
                                return new Ok(path.get());
                              }
                            }
                          }
                        }
                      }
                    }
                  } else {
                    if (input.default !== undefined) {
                      const variable = await get_variable(
                        struct,
                        level,
                        input.default,
                        filter_paths,
                        []
                      );
                      if (unwrap(variable)) {
                        const path = variable.value.paths.findAny((x) =>
                          compare_paths(path_string, get_path_string(x))
                        );
                        if (path.isSome()) {
                          const value = path.get().path[1][1];
                          if (value.type !== "other") {
                            if (value.type === field_struct_name[0]) {
                              path.get();
                            }
                          } else {
                            if (value.type === field_struct_name[0]) {
                              if (value.other === field_struct_name[1].name) {
                                return new Ok(path.get());
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                });
                if (unwrap(path)) {
                  const res = expr.get_result(symbols);
                  if (unwrap(res)) {
                    const expr_result = res.value;
                    switch (field_struct_name[0]) {
                      case "str":
                      case "lstr":
                      case "clob": {
                        if (expr_result instanceof Txt) {
                          paths.push(
                            apply(path.value, (it) => {
                              it.path[1][1] = {
                                type: field_struct_name[0],
                                value: expr_result.value,
                              } as StrongEnum;
                              return it;
                            })
                          );
                        } else {
                          console.log("FX", 4);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                        break;
                      }
                      case "i32":
                      case "u32":
                      case "i64":
                      case "u64": {
                        if (expr_result instanceof Num) {
                          paths.push(
                            apply(path.value, (it) => {
                              it.path[1][1] = {
                                type: field_struct_name[0],
                                value: new Decimal(expr_result.value),
                              } as StrongEnum;
                              return it;
                            })
                          );
                        } else {
                          console.log("FX", 5);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                        break;
                      }
                      case "idouble":
                      case "udouble":
                      case "idecimal":
                      case "udecimal": {
                        if (expr_result instanceof Deci) {
                          paths.push(
                            apply(path.value, (it) => {
                              it.path[1][1] = {
                                type: field_struct_name[0],
                                value: new Decimal(expr_result.value),
                              } as StrongEnum;
                              return it;
                            })
                          );
                        } else {
                          console.log("FX", 6);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                        break;
                      }
                      case "bool": {
                        if (expr_result instanceof Bool) {
                          paths.push(
                            apply(path.value, (it) => {
                              it.path[1][1] = {
                                type: field_struct_name[0],
                                value: expr_result.value,
                              } as StrongEnum;
                              return it;
                            })
                          );
                        } else {
                          console.log("FX", 7);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                        break;
                      }
                      case "date":
                      case "time":
                      case "timestamp": {
                        if (expr_result instanceof Num) {
                          paths.push(
                            apply(path.value, (it) => {
                              it.path[1][1] = {
                                type: field_struct_name[0],
                                value: new Date(expr_result.value),
                              } as StrongEnum;
                              return it;
                            })
                          );
                        } else {
                          console.log("FX", 8);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                        break;
                      }
                      case "other": {
                        if (expr_result instanceof Num) {
                          paths.push(
                            apply(path.value, (it) => {
                              it.path[1][1] = {
                                type: field_struct_name[0],
                                other: field_struct_name[1].name,
                                value: new Decimal(expr_result.value),
                              } as StrongEnum;
                              return it;
                            })
                          );
                        } else {
                          console.log("FX", 9);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                        break;
                      }
                      default: {
                        const _exhaustiveCheck: never = field_struct_name;
                        return _exhaustiveCheck;
                      }
                    }
                  } else {
                    console.log("FX", 10);
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                } else {
                  continue;
                }
              } else {
                console.log("FX", 11);
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            }
            // replace variable
            if (input_name in args) {
              const arg = args[input_name];
              if (arg.type === input.type) {
                const variable = await get_variable(
                  struct,
                  level,
                  arg.value,
                  HashSet.of(),
                  []
                );
                if (unwrap(variable)) {
                  await replace_variable(
                    level,
                    new Variable(
                      struct,
                      arg.value,
                      variable.value.created_at,
                      new Date(),
                      HashSet.ofIterable(paths)
                    )
                  );
                } else {
                  continue;
                }
              } else {
                console.log("FX", 12);
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            } else {
              if (input.default !== undefined) {
                const variable = await get_variable(
                  struct,
                  level,
                  input.default,
                  HashSet.of(),
                  []
                );
                if (unwrap(variable)) {
                  await replace_variable(
                    level,
                    new Variable(
                      struct,
                      input.default,
                      variable.value.created_at,
                      new Date(),
                      HashSet.ofIterable(paths)
                    )
                  );
                } else {
                  continue;
                }
              } else {
                console.log("FX", 13);
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            }
          }
          if (input.delete_mode !== undefined) {
            // delete variable
            if (input_name in args) {
              const arg = args[input_name];
              if (arg.type === input.type && arg.other === input.other) {
                await remove_variables_in_db(level, struct.name, [arg.value]);
              } else {
                console.log("FX", 14);
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            } else {
              console.log("FX", 15);
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
          }
        }
      }
      // computed_outputs will not include ids of deleted variables since they cannot be referenced anyway
      const computed_outputs: Record<string, StrongEnum> = {};
      // 3. generate outputs
      for (const output_name of Object.keys(this.outputs)) {
        const output = this.outputs[output_name];
        switch (output.op) {
          case "value": {
            const expr_result = output.value.value.get_result(symbols);
            if (unwrap(expr_result)) {
              switch (output.value.type) {
                case "str":
                case "lstr":
                case "clob": {
                  if (expr_result instanceof Txt) {
                    computed_outputs[output_name] = {
                      type: output.value.type,
                      value: expr_result.value,
                    };
                  } else {
                    console.log("FX", 16);
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                  break;
                }
                case "i32":
                case "u32":
                case "i64":
                case "u64": {
                  if (expr_result instanceof Num) {
                    computed_outputs[output_name] = {
                      type: output.value.type,
                      value: new Decimal(expr_result.value),
                    };
                  } else {
                    console.log("FX", 17);
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                  break;
                }
                case "idouble":
                case "udouble":
                case "idecimal":
                case "udecimal": {
                  if (expr_result instanceof Deci) {
                    computed_outputs[output_name] = {
                      type: output.value.type,
                      value: new Decimal(expr_result.value),
                    };
                  } else {
                    console.log("FX", 18);
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                  break;
                }
                case "bool": {
                  if (expr_result instanceof Bool) {
                    computed_outputs[output_name] = {
                      type: output.value.type,
                      value: expr_result.value,
                    };
                  } else {
                    console.log("FX", 19);
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                  break;
                }
                case "date":
                case "time":
                case "timestamp": {
                  if (expr_result instanceof Num) {
                    computed_outputs[output_name] = {
                      type: output.value.type,
                      value: new Date(expr_result.value),
                    };
                  } else {
                    console.log("FX", 20);
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                  break;
                }
                case "other": {
                  if (expr_result instanceof Num) {
                    computed_outputs[output_name] = {
                      type: output.value.type,
                      other: output.value.other,
                      value: new Decimal(expr_result.value),
                    };
                  } else {
                    console.log("FX", 21);
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                  break;
                }
                default: {
                  const _exhaustiveCheck: never = output.value;
                  return _exhaustiveCheck;
                }
              }
            } else {
              console.log("FX", 22);
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
            break;
          }
          case "insert":
          case "insert_ignore":
          case "replace": {
            const struct = get_struct(output.struct as StructName);
            let variable: Variable | undefined = undefined;
            const paths: Array<Path> = [];
            const unique_constraints: ReadonlyArray<ReadonlyArray<string>> =
              struct.uniqueness.map((uniqueness) => {
                return apply([uniqueness[1]], (it) => it.concat(uniqueness[0]));
              });
            const unique_constraint_fields = HashSet.ofIterable(
              unique_constraints.flatMap((x) => x)
            );
            // 1. Process keys present in uniqueness constraints
            for (const field_name of unique_constraint_fields) {
              if (field_name in output.fields) {
                const field = struct.fields[field_name];
                const expr_result =
                  output.fields[field_name].get_result(symbols);
                if (unwrap(expr_result)) {
                  const expr_result_value = expr_result.value;
                  switch (field.type) {
                    case "str":
                    case "lstr":
                    case "clob": {
                      if (expr_result_value instanceof Txt) {
                        paths.push(
                          new Path(field_name, [
                            [],
                            [
                              field_name,
                              {
                                type: field.type,
                                value: expr_result_value.value,
                              },
                            ],
                          ])
                        );
                      } else {
                        console.log("FX", 23);
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                      break;
                    }
                    case "i32":
                    case "u32":
                    case "i64":
                    case "u64": {
                      if (expr_result_value instanceof Num) {
                        paths.push(
                          new Path(field_name, [
                            [],
                            [
                              field_name,
                              {
                                type: field.type,
                                value: new Decimal(expr_result_value.value),
                              },
                            ],
                          ])
                        );
                      } else {
                        console.log("FX", 24);
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                      break;
                    }
                    case "idouble":
                    case "udouble":
                    case "idecimal":
                    case "udecimal": {
                      if (expr_result_value instanceof Deci) {
                        paths.push(
                          new Path(field_name, [
                            [],
                            [
                              field_name,
                              {
                                type: field.type,
                                value: new Decimal(expr_result_value.value),
                              },
                            ],
                          ])
                        );
                      } else {
                        console.log("FX", 25);
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                      break;
                    }
                    case "bool": {
                      if (expr_result_value instanceof Bool) {
                        paths.push(
                          new Path(field_name, [
                            [],
                            [
                              field_name,
                              {
                                type: field.type,
                                value: expr_result_value.value,
                              },
                            ],
                          ])
                        );
                      } else {
                        console.log("FX", 26);
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                      break;
                    }
                    case "date":
                    case "time":
                    case "timestamp": {
                      if (expr_result_value instanceof Num) {
                        paths.push(
                          new Path(field_name, [
                            [],
                            [
                              field_name,
                              {
                                type: field.type,
                                value: new Date(expr_result_value.value),
                              },
                            ],
                          ])
                        );
                      } else {
                        console.log("FX", 27);
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                      break;
                    }
                    case "other": {
                      if (expr_result_value instanceof Num) {
                        paths.push(
                          new Path(field_name, [
                            [],
                            [
                              field_name,
                              {
                                type: field.type,
                                other: field.other,
                                value: new Decimal(expr_result_value.value),
                              },
                            ],
                          ])
                        );
                      } else {
                        console.log("FX", 28);
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
                  console.log("FX", 29);
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              } else {
                console.log("FX", 30);
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            }
            // 2. Try to fetch variable based on one set of unique constraint at a time
            for (const unique_constraint of unique_constraints) {
              let check = true;
              for (const field_name of unique_constraint) {
                if (!(field_name in output.fields)) {
                  check = false;
                  break;
                }
              }
              if (!check) {
                continue;
              } else {
                const unique_constraint_filter_paths: Array<FilterPath> = [];
                for (const field_name of unique_constraint) {
                  const filter_paths = paths.filter((x) =>
                    compare_paths(get_path_string(x), [[], field_name])
                  );
                  if (filter_paths.length === 1) {
                    const path = filter_paths[0];
                    // TODO. Add equals op and activate filter paths part of unique constraints
                    const expr_result =
                      output.fields[field_name].get_result(symbols);
                    if (unwrap(expr_result)) {
                      const expr_result_value = expr_result.value;
                      if (path.path[1][1].type !== "other") {
                        switch (path.path[1][1].type) {
                          case "str":
                          case "lstr":
                          case "clob": {
                            if (expr_result_value instanceof Txt) {
                              unique_constraint_filter_paths.push(
                                new FilterPath(
                                  path.label,
                                  get_path_string(path),
                                  [
                                    path.path[1][1].type,
                                    ["==", expr_result_value.value],
                                  ],
                                  undefined
                                )
                              );
                            } else {
                              console.log("FX", 30.1);
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                            break;
                          }
                          case "i32":
                          case "u32":
                          case "i64":
                          case "u64": {
                            if (expr_result_value instanceof Num) {
                              unique_constraint_filter_paths.push(
                                new FilterPath(
                                  path.label,
                                  get_path_string(path),
                                  [
                                    path.path[1][1].type,
                                    [
                                      "==",
                                      new Decimal(expr_result_value.value),
                                    ],
                                  ],
                                  undefined
                                )
                              );
                            } else {
                              console.log("FX", 30.2);
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                            break;
                          }
                          case "idouble":
                          case "udouble":
                          case "idecimal":
                          case "udecimal": {
                            if (expr_result_value instanceof Deci) {
                              unique_constraint_filter_paths.push(
                                new FilterPath(
                                  path.label,
                                  get_path_string(path),
                                  [
                                    path.path[1][1].type,
                                    [
                                      "==",
                                      new Decimal(expr_result_value.value),
                                    ],
                                  ],
                                  undefined
                                )
                              );
                            } else {
                              console.log("FX", 30.3);
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                            break;
                          }
                          case "bool": {
                            if (expr_result_value instanceof Bool) {
                              unique_constraint_filter_paths.push(
                                new FilterPath(
                                  path.label,
                                  get_path_string(path),
                                  [
                                    path.path[1][1].type,
                                    ["==", expr_result_value.value],
                                  ],
                                  undefined
                                )
                              );
                            } else {
                              console.log("FX", 30.4);
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                            break;
                          }
                          case "date":
                          case "time":
                          case "timestamp": {
                            if (expr_result_value instanceof Num) {
                              unique_constraint_filter_paths.push(
                                new FilterPath(
                                  path.label,
                                  get_path_string(path),
                                  [
                                    path.path[1][1].type,
                                    ["==", new Date(expr_result_value.value)],
                                  ],
                                  undefined
                                )
                              );
                            } else {
                              console.log("FX", 30.5);
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                            break;
                          }
                          default: {
                            const _exhaustiveCheck: never = path.path[1][1];
                            return _exhaustiveCheck;
                          }
                        }
                      } else {
                        if (expr_result_value instanceof Num) {
                          const other_struct = get_struct(
                            path.path[1][1].other as StructName
                          );
                          unique_constraint_filter_paths.push(
                            new FilterPath(
                              path.label,
                              get_path_string(path),
                              [
                                path.path[1][1].type,
                                ["==", new Decimal(expr_result_value.value)],
                                other_struct,
                              ],
                              undefined
                            )
                          );
                        } else {
                          console.log("FX", 30.6);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                      }
                    } else {
                      console.log("FX", 30.7);
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  } else {
                    console.log("FX", 31);
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                }
                const result = await get_variables(
                  struct,
                  level,
                  new OrFilter(
                    0,
                    [false, undefined],
                    [false, undefined],
                    [false, undefined],
                    HashSet.ofIterable(
                      unique_constraint_filter_paths.map((filter_path) => {
                        filter_path.active = true;
                        return filter_path;
                      })
                    )
                  ),
                  HashSet.of(),
                  new Decimal(1),
                  new Decimal(0),
                  []
                );
                if (unwrap(result)) {
                  if (result.value.length === 1) {
                    variable = result.value[0];
                    break;
                  }
                }
              }
            }
            // 3. Process keys not present in uniqueness constraints
            for (const field_name of Object.keys(struct.fields)) {
              if (!unique_constraint_fields.contains(field_name)) {
                const field = struct.fields[field_name];
                if (field_name in output.fields) {
                  const result = output.fields[field_name].get_result(symbols);
                  if (unwrap(result)) {
                    const expr_result = result.value;
                    switch (field.type) {
                      case "str":
                      case "lstr":
                      case "clob": {
                        if (expr_result instanceof Txt) {
                          paths.push(
                            new Path(field_name, [
                              [],
                              [
                                field_name,
                                {
                                  type: field.type,
                                  value: expr_result.value,
                                },
                              ],
                            ])
                          );
                        } else {
                          console.log("FX", 32);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                        break;
                      }
                      case "i32":
                      case "u32":
                      case "i64":
                      case "u64": {
                        if (expr_result instanceof Num) {
                          paths.push(
                            new Path(field_name, [
                              [],
                              [
                                field_name,
                                {
                                  type: field.type,
                                  value: new Decimal(expr_result.value),
                                },
                              ],
                            ])
                          );
                        } else {
                          console.log("FX", 33);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                        break;
                      }
                      case "idouble":
                      case "udouble":
                      case "idecimal":
                      case "udecimal": {
                        if (expr_result instanceof Deci) {
                          paths.push(
                            new Path(field_name, [
                              [],
                              [
                                field_name,
                                {
                                  type: field.type,
                                  value: new Decimal(expr_result.value),
                                },
                              ],
                            ])
                          );
                        } else {
                          console.log("FX", 34);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                        break;
                      }
                      case "bool": {
                        if (expr_result instanceof Bool) {
                          paths.push(
                            new Path(field_name, [
                              [],
                              [
                                field_name,
                                {
                                  type: field.type,
                                  value: expr_result.value,
                                },
                              ],
                            ])
                          );
                        } else {
                          console.log("FX", 35);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                        break;
                      }
                      case "date":
                      case "time":
                      case "timestamp": {
                        if (expr_result instanceof Num) {
                          paths.push(
                            new Path(field_name, [
                              [],
                              [
                                field_name,
                                {
                                  type: field.type,
                                  value: new Date(expr_result.value),
                                },
                              ],
                            ])
                          );
                        } else {
                          console.log("FX", 36);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                        break;
                      }
                      case "other": {
                        if (expr_result instanceof Num) {
                          paths.push(
                            new Path(field_name, [
                              [],
                              [
                                field_name,
                                {
                                  type: field.type,
                                  other: field.other,
                                  value: new Decimal(expr_result.value),
                                },
                              ],
                            ])
                          );
                        } else {
                          console.log("FX", 37);
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
                  }
                } else {
                  console.log("FX", 38);
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
            }
            // 4. Replace variable
            if (variable !== undefined) {
              // insert -> fails
              // insert_ignore -> skips
              // replace -> replace
              switch (output.op) {
                case "insert": {
                  console.log("FX", 39);
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
                case "insert_ignore": {
                  computed_outputs[output_name] = {
                    type: "other",
                    other: variable.struct.name,
                    value: variable.id,
                  };
                  continue;
                }
                case "replace": {
                  await replace_variable(
                    level,
                    apply(variable, (it) => {
                      it.paths = HashSet.ofIterable(paths);
                      return it;
                    })
                  );
                  computed_outputs[output_name] = {
                    type: "other",
                    other: variable.struct.name,
                    value: variable.id,
                  };
                  break;
                }
                default: {
                  const _exhaustiveCheck: never = output;
                  return _exhaustiveCheck;
                }
              }
            } else {
              // insert -> insert
              // insert_ignore -> insert
              // replace -> skips
              switch (output.op) {
                case "insert":
                case "insert_ignore": {
                  const result = await get_incremented_struct_counter(
                    output.struct
                  );
                  if (unwrap(result)) {
                    const variable = new Variable(
                      struct,
                      result.value,
                      new Date(),
                      new Date(),
                      HashSet.ofIterable(paths)
                    );
                    await replace_variable(level, variable);
                    computed_outputs[output_name] = {
                      type: "other",
                      other: variable.struct.name,
                      value: variable.id,
                    };
                  } else {
                    console.log("FX", 40);
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                  break;
                }
                case "replace": {
                  continue;
                }
                default: {
                  const _exhaustiveCheck: never = output;
                  return _exhaustiveCheck;
                }
              }
            }
            break;
          }
          case "delete_all":
          case "delete_all_ignore": {
            // variable(s) found -> deletes, create removal record
            // variable(s) not found -> skip
            const struct = get_struct(output.struct as StructName);
            const filter_paths: Array<FilterPath> = [];
            // 1. process paths
            for (const field of output.fields) {
              const result = get_path_with_type(struct, field.path);
              if (unwrap(result)) {
                const field_struct_name = result.value[1];
                const value = field.expr.get_result(symbols);
                if (unwrap(value)) {
                  const expr_result = value.value;
                  switch (field_struct_name[0]) {
                    case "str":
                    case "lstr":
                    case "clob": {
                      if (expr_result instanceof Txt) {
                        filter_paths.push(
                          new FilterPath(
                            output_name,
                            [[], output_name],
                            [field_struct_name[0], ["==", expr_result.value]],
                            undefined
                          )
                        );
                      } else {
                        console.log("FX", 41);
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                      break;
                    }
                    case "i32":
                    case "u32":
                    case "i64":
                    case "u64": {
                      if (expr_result instanceof Num) {
                        filter_paths.push(
                          new FilterPath(
                            output_name,
                            [[], output_name],
                            [
                              field_struct_name[0],
                              ["==", new Decimal(expr_result.value)],
                            ],
                            undefined
                          )
                        );
                      } else {
                        console.log("FX", 42);
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                      break;
                    }
                    case "idouble":
                    case "udouble":
                    case "idecimal":
                    case "udecimal": {
                      if (expr_result instanceof Deci) {
                        filter_paths.push(
                          new FilterPath(
                            output_name,
                            [[], output_name],
                            [
                              field_struct_name[0],
                              ["==", new Decimal(expr_result.value)],
                            ],
                            undefined
                          )
                        );
                      } else {
                        console.log("FX", 43);
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                      break;
                    }
                    case "bool": {
                      if (expr_result instanceof Bool) {
                        filter_paths.push(
                          new FilterPath(
                            output_name,
                            [[], output_name],
                            [field_struct_name[0], ["==", expr_result.value]],
                            undefined
                          )
                        );
                      } else {
                        console.log("FX", 44);
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                      break;
                    }
                    case "date":
                    case "time":
                    case "timestamp": {
                      if (expr_result instanceof Num) {
                        filter_paths.push(
                          new FilterPath(
                            output_name,
                            [[], output_name],
                            [
                              field_struct_name[0],
                              ["==", new Date(expr_result.value)],
                            ],
                            undefined
                          )
                        );
                      } else {
                        console.log("FX", 45);
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                      break;
                    }
                    case "other": {
                      if (expr_result instanceof Num) {
                        const other_struct = field_struct_name[1];
                        filter_paths.push(
                          new FilterPath(
                            output_name,
                            [[], output_name],
                            [
                              field_struct_name[0],
                              ["==", new Decimal(expr_result.value)],
                              other_struct,
                            ],
                            undefined
                          )
                        );
                      } else {
                        console.log("FX", 46);
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                      break;
                    }
                    default: {
                      const _exhaustiveCheck: never = field_struct_name;
                      return _exhaustiveCheck;
                    }
                  }
                } else {
                  console.log("FX", 47);
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              } else {
                console.log("FX", 48);
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            }
            // 2. remove variable(s)
            const result = await get_variables(
              struct,
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
              new Decimal(0),
              []
            );
            if (unwrap(result)) {
              await remove_variables_in_db(
                level,
                struct.name,
                result.value.map((x) => x.id)
              );
            } else {
              console.log("FX", 49);
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
            break;
          }
          default: {
            const _exhaustiveCheck: never = output;
            return _exhaustiveCheck;
          }
        }
      }
      console.log("[SUCCESS]");
      return new Ok(computed_outputs);
    } else {
      console.log("FX", 50);
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    }
  }
}

export async function get_symbols_for_fx_compose_paths(
  level: Decimal,
  paths: ReadonlyArray<PathString>,
  value: [FxInputs, FxArgs] | [ComposeInputs, ComposeArgs]
): Promise<Result<Record<string, Symbol>>> {
  const [inputs, args] = value;
  // console.log(paths);
  const symbols: Record<string, Symbol> = {};
  for (const input_name of Object.keys(inputs)) {
    const input = inputs[input_name];
    // check if input is used in path of any expression
    let check = false;
    for (const path of paths) {
      const first: string = path[0].length !== 0 ? path[0][0] : path[1];
      if (first === input_name) {
        check = true;
        break;
      }
    }
    if (check) {
      if (input.type !== "list") {
        if (input.type !== "other") {
          switch (input.type) {
            case "str":
            case "lstr":
            case "clob": {
              symbols[input_name] = new Symbol({
                value: new Ok(
                  new Txt(
                    arrow(() => {
                      if (input_name in args) {
                        const arg = args[input_name];
                        if (arg.type === input.type) {
                          return arg.value;
                        }
                      }
                      return input.default !== undefined ? input.default : "";
                    })
                  )
                ),
                values: {},
              });
              break;
            }
            case "i32":
            case "u32":
            case "i64":
            case "u64": {
              symbols[input_name] = new Symbol({
                value: new Ok(
                  new Num(
                    arrow(() => {
                      if (input_name in args) {
                        const arg = args[input_name];
                        if (arg.type === input.type) {
                          return arg.value.toNumber();
                        }
                      }
                      return input.default !== undefined
                        ? input.default.toNumber()
                        : 0;
                    })
                  )
                ),
                values: {},
              });
              break;
            }
            case "idouble":
            case "udouble":
            case "idecimal":
            case "udecimal": {
              symbols[input_name] = new Symbol({
                value: new Ok(
                  new Deci(
                    arrow(() => {
                      if (input_name in args) {
                        const arg = args[input_name];
                        if (arg.type === input.type) {
                          return arg.value.toNumber();
                        }
                      }
                      return input.default !== undefined
                        ? input.default.toNumber()
                        : 0;
                    })
                  )
                ),
                values: {},
              });
              break;
            }
            case "bool": {
              symbols[input_name] = new Symbol({
                value: new Ok(
                  new Bool(
                    arrow(() => {
                      if (input_name in args) {
                        const arg = args[input_name];
                        if (arg.type === input.type) {
                          return arg.value;
                        }
                      }
                      return input.default !== undefined
                        ? input.default
                        : false;
                    })
                  )
                ),
                values: {},
              });
              break;
            }
            case "date":
            case "time":
            case "timestamp": {
              symbols[input_name] = new Symbol({
                value: new Ok(
                  new Num(
                    arrow(() => {
                      if (input_name in args) {
                        const arg = args[input_name];
                        if (arg.type === input.type) {
                          return arg.value.getTime();
                        }
                      }
                      return input.default !== undefined
                        ? input.default.getTime()
                        : 0;
                    })
                  )
                ),
                values: {},
              });
              break;
            }
            default: {
              const _exhaustiveCheck: never = input;
              return _exhaustiveCheck;
            }
          }
        } else {
          // 1. filter paths which starts with input_name
          // 2. query db to get values
          // 3. use values to construct symbol and assign it here
          const struct = get_struct(input.other as StructName);
          const result = unwrap_array(
            paths
              .filter((path) => {
                const first: string =
                  path[0].length !== 0 ? path[0][0] : path[1];
                return first === input_name && path[0].length !== 0;
              })
              .map((path) =>
                get_path_with_type(struct, [path[0].slice(1), path[1]])
              )
          );
          if (unwrap(result)) {
            const filter_paths: HashSet<FilterPath> = HashSet.ofIterable(
              result.value.map((x) => {
                const [path, field_struct_name] = x;
                if (field_struct_name[0] !== "other") {
                  return new FilterPath(
                    get_flattened_path(path).join("."),
                    path,
                    [field_struct_name[0], undefined],
                    undefined
                  );
                } else {
                  return new FilterPath(
                    get_flattened_path(path).join("."),
                    path,
                    [field_struct_name[0], undefined, field_struct_name[1]],
                    undefined
                  );
                }
              })
            );
            if (filter_paths.length() !== 0) {
              if (input_name in args) {
                const arg = args[input_name];
                if (arg.type === input.type) {
                  const variable = await get_variable(
                    struct,
                    level,
                    arg.value,
                    filter_paths,
                    []
                  );
                  if (unwrap(variable)) {
                    symbols[input_name] = new Symbol({
                      value: new Ok(new Num(variable.value.id.toNumber())),
                      values: get_symbols_for_paths(variable.value.paths),
                    });
                  } else {
                    console.log("FX", 51);
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                } else {
                  console.log("FX", 52);
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              } else {
                if (input.default !== undefined) {
                  const variable = await get_variable(
                    struct,
                    level,
                    input.default,
                    filter_paths,
                    []
                  );
                  if (unwrap(variable)) {
                    symbols[input_name] = new Symbol({
                      value: new Ok(new Num(variable.value.id.toNumber())),
                      values: get_symbols_for_paths(variable.value.paths),
                    });
                  } else {
                    console.log("FX", 53);
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                } else {
                  console.log("FX", 54);
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
            } else {
              if (input_name in args) {
                const arg = args[input_name];
                if (arg.type === input.type) {
                  symbols[input_name] = new Symbol({
                    value: new Ok(new Num(arg.value.toNumber())),
                    values: {},
                  });
                } else {
                  console.log("FX", 55);
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              } else {
                if (input.default !== undefined) {
                  symbols[input_name] = new Symbol({
                    value: new Ok(new Num(input.default.toNumber())),
                    values: {},
                  });
                } else {
                  console.log("FX", 56);
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
            }
          } else {
            console.log("FX", 57);
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        }
      }
    }
  }
  return new Ok(inject_system_constants(symbols));
}
