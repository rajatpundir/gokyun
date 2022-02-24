import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { get_path_with_type, get_symbols_for_paths } from "./commons";
import {
  FilterPath,
  get_struct_counter,
  get_variable,
  get_variables,
  increment_struct_counter,
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
  Text,
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
import { get_struct } from "../../schema/struct";
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

// TODO. Also return something that announces creation, updation, deletion of variables in store

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
      updates?: ReadonlyArray<[PathString, LispExpression]>;
    }
>;

export type FxArgs = Record<
  string,
  | Exclude<
      StrongEnum,
      {
        type: "other";
        other: string;
        value: Decimal;
      }
    >
  | {
      type: "other";
      other: string;
      value: Decimal;
      // There must be atleast one read path permission, obtained after using user_paths / borrows
      user_paths: Array<PathString>;
      borrows: Array<string>;
    }
>;

// 'outputs' should be used to insert, replace and delete variables, as well as primitive value forwarding for use in composer computations

// Additionally, a transformer may be marked as such that it cannot be run directly by the user
// In case, a transformer is executed via a Composer, ownership of inputs will not be checked.

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
      op: "delete";
      struct: string;
      // the variable(s) is/are queried on basis of matched fields
      fields: { [index: string]: LispExpression };
    }
  | {
      // Ignore the operation if variable(s) cannot be deleted
      op: "delete_ignore";
      struct: string;
      // the variable(s) is/are queried on basis of matched fields
      fields: { [index: string]: LispExpression };
    }
>;

type FxChecks = Record<string, [BooleanLispExpression, ErrMsg]>;

// Ownership or borrowing over inputs provided will be checked
// But outputs does not have anything to do with ownership
export class Fx {
  name: string;
  inputs: FxInputs;
  outputs: FxOutputs;
  checks: FxChecks;

  constructor(
    name: string,
    inputs: FxInputs,
    outputs: FxOutputs,
    checks: FxChecks
  ) {
    this.name = name;
    this.inputs = inputs;
    this.outputs = outputs;
    this.checks = checks;
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

  async get_symbols(
    args: FxArgs,
    level: Decimal
  ): Promise<Result<Record<string, Symbol>>> {
    const paths: ReadonlyArray<PathString> = arrow(() => {
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
          for (const [, expr] of input.updates) {
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
          for (const field_name of Object.keys(output.fields)) {
            const expr = output.fields[field_name];
            paths = paths.concat(expr.get_paths());
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
    });
    console.log(paths);
    const symbols: Record<string, Symbol> = {};
    for (const input_name of Object.keys(this.inputs)) {
      const input = this.inputs[input_name];
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
        if (input.type !== "other") {
          switch (input.type) {
            case "str":
            case "lstr":
            case "clob": {
              symbols[input_name] = new Symbol({
                value: new Ok(
                  new Text(
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
          const struct = get_struct(input.other);
          if (unwrap(struct)) {
            const result = unwrap_array(
              paths
                .filter((path) => {
                  const first: string =
                    path[0].length !== 0 ? path[0][0] : path[1];
                  return first === input_name && path[0].length !== 0;
                })
                .map((path) =>
                  get_path_with_type(struct.value, [path[0].slice(1), path[1]])
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
                      struct.value,
                      true,
                      level,
                      arg.value,
                      filter_paths
                    );
                    if (unwrap(variable)) {
                      symbols[input_name] = new Symbol({
                        value: new Ok(new Num(variable.value.id.toNumber())),
                        values: get_symbols_for_paths(variable.value.paths),
                      });
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
                } else {
                  if (input.default !== undefined) {
                    const variable = await get_variable(
                      struct.value,
                      true,
                      level,
                      input.default,
                      filter_paths
                    );
                    if (unwrap(variable)) {
                      symbols[input_name] = new Symbol({
                        value: new Ok(new Num(variable.value.id.toNumber())),
                        values: get_symbols_for_paths(variable.value.paths),
                      });
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
                if (input_name in args) {
                  const arg = args[input_name];
                  if (arg.type === input.type) {
                    symbols[input_name] = new Symbol({
                      value: new Ok(new Num(arg.value.toNumber())),
                      values: {},
                    });
                  } else {
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
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                }
              }
            } else {
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        }
      }
    }
    return new Ok(symbols);
  }

  async exec(
    args: FxArgs,
    level: Decimal
  ): Promise<Result<Record<string, StrongEnum>>> {
    // computed_outputs will not include ids of deleted variables since they cannot be referenced anyway
    const computed_outputs: Record<string, StrongEnum> = {};
    const result = await this.get_symbols(args, level);
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
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        } else {
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      }
      // 2. update inputs
      for (const input_name of Object.keys(this.inputs)) {
        const input = this.inputs[input_name];
        if (input.type === "other" && input.updates !== undefined) {
          const struct = get_struct(input.other);
          if (unwrap(struct)) {
            const paths: Array<Path> = [];
            for (const [path_string, expr] of input.updates) {
              const result = get_path_with_type(struct.value, path_string);
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
                        struct.value,
                        true,
                        level,
                        arg.value,
                        filter_paths
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
                        struct.value,
                        true,
                        level,
                        input.default,
                        filter_paths
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
                        if (expr_result instanceof Text) {
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
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                } else {
                  continue;
                }
              } else {
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            }
            // replace variable
            // TODO. Variable could be fetched even filter_paths are empty
            if (input_name in args) {
              const arg = args[input_name];
              if (arg.type === input.type) {
                const variable = await get_variable(
                  struct.value,
                  true,
                  level,
                  arg.value,
                  HashSet.of()
                );
                if (unwrap(variable)) {
                  await replace_variable(
                    level,
                    new Variable(
                      struct.value,
                      arg.value,
                      true,
                      variable.value.created_at,
                      new Date(),
                      HashSet.ofIterable(paths)
                    )
                  );
                } else {
                  continue;
                }
              } else {
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            } else {
              if (input.default !== undefined) {
                const variable = await get_variable(
                  struct.value,
                  true,
                  level,
                  input.default,
                  HashSet.of()
                );
                if (unwrap(variable)) {
                  await replace_variable(
                    level,
                    new Variable(
                      struct.value,
                      input.default,
                      true,
                      variable.value.created_at,
                      new Date(),
                      HashSet.ofIterable(paths)
                    )
                  );
                } else {
                  continue;
                }
              } else {
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            }
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        }
      }
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
                  if (expr_result instanceof Text) {
                    computed_outputs[output_name] = {
                      type: output.value.type,
                      value: expr_result.value,
                    };
                  } else {
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
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
            break;
          }
          case "insert":
          case "insert_ignore":
          case "replace": {
            const struct = get_struct(output.struct);
            if (unwrap(struct)) {
              let variable: Variable | undefined = undefined;
              const paths: Array<Path> = [];
              const unique_constraints: ReadonlyArray<ReadonlyArray<string>> =
                struct.value.uniqueness.map((uniqueness) => {
                  return apply([uniqueness[1]], (it) =>
                    it.concat(uniqueness[0])
                  );
                });
              const unique_constraint_fields = HashSet.ofIterable(
                unique_constraints.flatMap((x) => x)
              );
              // 1. Process keys present in uniqueness constraints
              for (const field_name of unique_constraint_fields) {
                if (field_name in output.fields) {
                  const field = struct.value.fields[field_name];
                  const expr_result =
                    output.fields[field_name].get_result(symbols);
                  if (unwrap(expr_result)) {
                    const expr_result = result.value;
                    switch (field.type) {
                      case "str":
                      case "lstr":
                      case "clob": {
                        if (expr_result instanceof Text) {
                          paths.push(
                            new Path(output_name, [
                              [],
                              [
                                output_name,
                                {
                                  type: field.type,
                                  value: expr_result.value,
                                },
                              ],
                            ])
                          );
                        } else {
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
                            new Path(output_name, [
                              [],
                              [
                                output_name,
                                {
                                  type: field.type,
                                  value: new Decimal(expr_result.value),
                                },
                              ],
                            ])
                          );
                        } else {
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
                            new Path(output_name, [
                              [],
                              [
                                output_name,
                                {
                                  type: field.type,
                                  value: new Decimal(expr_result.value),
                                },
                              ],
                            ])
                          );
                        } else {
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                        break;
                      }
                      case "bool": {
                        if (expr_result instanceof Bool) {
                          paths.push(
                            new Path(output_name, [
                              [],
                              [
                                output_name,
                                {
                                  type: field.type,
                                  value: expr_result.value,
                                },
                              ],
                            ])
                          );
                        } else {
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
                            new Path(output_name, [
                              [],
                              [
                                output_name,
                                {
                                  type: field.type,
                                  value: new Date(expr_result.value),
                                },
                              ],
                            ])
                          );
                        } else {
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                        break;
                      }
                      case "other": {
                        if (expr_result instanceof Num) {
                          paths.push(
                            new Path(output_name, [
                              [],
                              [
                                output_name,
                                {
                                  type: field.type,
                                  other: field.other,
                                  value: new Decimal(expr_result.value),
                                },
                              ],
                            ])
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
                } else {
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
              // 2. Try to fetch variable based on one set of unique constraint at a time
              for (const unique_constraint of unique_constraints) {
                const unique_constraint_filter_paths: Array<FilterPath> = [];
                for (const field_name of unique_constraint) {
                  const filter_paths = paths.filter((x) =>
                    compare_paths(get_path_string(x), [[], field_name])
                  );
                  if (filter_paths.length === 1) {
                    const path = paths[0];
                    if (path.path[1][1].type !== "other") {
                      unique_constraint_filter_paths.push(
                        new FilterPath(
                          path.label,
                          get_path_string(path),
                          [path.path[1][1].type, undefined],
                          undefined
                        )
                      );
                    } else {
                      const other_struct = get_struct(path.path[1][1].other);
                      if (unwrap(other_struct)) {
                        unique_constraint_filter_paths.push(
                          new FilterPath(
                            path.label,
                            get_path_string(path),
                            [
                              path.path[1][1].type,
                              undefined,
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
                    }
                  } else {
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                }
                const result = await get_variables(
                  struct.value,
                  true,
                  level,
                  new OrFilter(
                    0,
                    [false, undefined],
                    [false, undefined],
                    [false, undefined],
                    HashSet.ofIterable(unique_constraint_filter_paths)
                  ),
                  HashSet.of(),
                  new Decimal(1),
                  new Decimal(0)
                );
                if (unwrap(result)) {
                  if (result.value.length === 1) {
                    variable = result.value[0];
                    break;
                  }
                }
              }
              // 3. Process keys not present in uniqueness constraints
              for (const field_name in Object.keys(struct.value.fields)) {
                if (!unique_constraint_fields.contains(field_name)) {
                  const field = struct.value.fields[field_name];
                  if (field_name in output.fields) {
                    const result =
                      output.fields[field_name].get_result(symbols);
                    if (unwrap(result)) {
                      const expr_result = result.value;
                      switch (field.type) {
                        case "str":
                        case "lstr":
                        case "clob": {
                          if (expr_result instanceof Text) {
                            paths.push(
                              new Path(output_name, [
                                [],
                                [
                                  output_name,
                                  {
                                    type: field.type,
                                    value: expr_result.value,
                                  },
                                ],
                              ])
                            );
                          } else {
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
                              new Path(output_name, [
                                [],
                                [
                                  output_name,
                                  {
                                    type: field.type,
                                    value: new Decimal(expr_result.value),
                                  },
                                ],
                              ])
                            );
                          } else {
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
                              new Path(output_name, [
                                [],
                                [
                                  output_name,
                                  {
                                    type: field.type,
                                    value: new Decimal(expr_result.value),
                                  },
                                ],
                              ])
                            );
                          } else {
                            return new Err(
                              new CustomError([errors.ErrUnexpected] as ErrMsg)
                            );
                          }
                          break;
                        }
                        case "bool": {
                          if (expr_result instanceof Bool) {
                            paths.push(
                              new Path(output_name, [
                                [],
                                [
                                  output_name,
                                  {
                                    type: field.type,
                                    value: expr_result.value,
                                  },
                                ],
                              ])
                            );
                          } else {
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
                              new Path(output_name, [
                                [],
                                [
                                  output_name,
                                  {
                                    type: field.type,
                                    value: new Date(expr_result.value),
                                  },
                                ],
                              ])
                            );
                          } else {
                            return new Err(
                              new CustomError([errors.ErrUnexpected] as ErrMsg)
                            );
                          }
                          break;
                        }
                        case "other": {
                          if (expr_result instanceof Num) {
                            paths.push(
                              new Path(output_name, [
                                [],
                                [
                                  output_name,
                                  {
                                    type: field.type,
                                    other: field.other,
                                    value: new Decimal(expr_result.value),
                                  },
                                ],
                              ])
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
                    }
                  } else {
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
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                  case "insert_ignore": {
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
                    const result = await get_struct_counter(output.struct);
                    await increment_struct_counter(output.struct);
                    if (unwrap(result)) {
                      const variable = new Variable(
                        struct.value,
                        result.value,
                        true,
                        new Date(),
                        new Date(),
                        HashSet.ofIterable(paths)
                      );
                      await replace_variable(level, variable);
                    } else {
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
            } else {
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
            break;
          }
          case "delete":
          case "delete_ignore": {
            // variable(s) found -> deletes, create removal record
            // variable(s) not found -> skip
            const struct = get_struct(output.struct);
            if (unwrap(struct)) {
              const filter_paths: Array<FilterPath> = [];
              // 1. process paths
              for (const field_name in Object.keys(output.fields)) {
                if (field_name in struct.value.fields) {
                  const field = struct.value.fields[field_name];
                  const result = output.fields[field_name].get_result(symbols);
                  if (unwrap(result)) {
                    const expr_result = result.value;
                    switch (field.type) {
                      case "str":
                      case "lstr":
                      case "clob": {
                        if (expr_result instanceof Text) {
                          filter_paths.push(
                            new FilterPath(
                              output_name,
                              [[], output_name],
                              [field.type, ["==", expr_result.value]],
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
                                field.type,
                                ["==", new Decimal(expr_result.value)],
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
                                field.type,
                                ["==", new Decimal(expr_result.value)],
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
                      case "bool": {
                        if (expr_result instanceof Bool) {
                          filter_paths.push(
                            new FilterPath(
                              output_name,
                              [[], output_name],
                              [field.type, ["==", expr_result.value]],
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
                      case "date":
                      case "time":
                      case "timestamp": {
                        if (expr_result instanceof Num) {
                          filter_paths.push(
                            new FilterPath(
                              output_name,
                              [[], output_name],
                              [field.type, ["==", new Date(expr_result.value)]],
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
                      case "other": {
                        if (expr_result instanceof Num) {
                          const other_struct = get_struct(field.other);
                          if (unwrap(other_struct)) {
                            filter_paths.push(
                              new FilterPath(
                                output_name,
                                [[], output_name],
                                [
                                  field.type,
                                  ["==", new Decimal(expr_result.value)],
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
                  }
                } else {
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
              // 2. remove variable(s)
              const result = await get_variables(
                struct.value,
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
              if (unwrap(result)) {
                await remove_variables_in_db(
                  level,
                  struct.value.name,
                  result.value.map((x) => x.id)
                );
              } else {
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            } else {
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
    } else {
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    }
    return new Ok(computed_outputs);
  }
}
