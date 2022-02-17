import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { get_path_with_type } from "./commons";
import { FilterPath, get_variable } from "./db";
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
  Result,
  unwrap,
  unwrap_array,
} from "./prelude";
import { get_struct } from "./schema";
import {
  compare_paths,
  get_flattened_path,
  Path,
  PathString,
  StrongEnum,
  Struct,
  StructPermissions,
  Variable,
  WeakEnum,
} from "./variable";

// Fx, Tranform, Compose

type FxPermissions = StructPermissions;

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

type FxArgs = Record<
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

// Updates to paths should take place inside 'inputs' instead of 'outputs'
// 'outputs' should be used to insert, replace and delete variables, as well as primitive value forwarding for use in composer computations
// Additionally, a transformer mat be marked as such that it cannot be run directly by the user
// In case, a transformer is executed via a Composer, ownership of inputs will not be checked.
type FxOutputs = Record<
  string,
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
      // Abort if variable cannot be deleted (maybe referenced somewhere)
      op: "delete";
      struct: string;
      // the variable(s) is/are looked up on basis of matched fields
      fields: { [index: string]: LispExpression };
    }
  | {
      // Ignore the operation if variable cannot be deleted
      op: "delete_ignore";
      struct: string;
      // the variable(s) is/are looked up on basis of matched fields
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
  user_invoked: boolean;

  constructor(
    name: string,
    inputs: FxInputs,
    outputs: FxOutputs,
    checks: FxChecks,
    user_invoked: boolean = true
  ) {
    this.name = name;
    this.inputs = inputs;
    this.outputs = outputs;
    this.checks = checks;
    this.user_invoked = user_invoked;
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

  get_paths(): ReadonlyArray<PathString> {
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
      for (const field_name of Object.keys(output.fields)) {
        const expr = output.fields[field_name];
        paths = paths.concat(expr.get_paths());
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
  }

  // function to convert array of paths

  get_symbols_for_paths(paths: HashSet<Path>): Record<string, Symbol> {
    const symbols: Record<string, Symbol> = {};
    const firsts: HashSet<string> = paths.map((path) =>
      path.path[0].length !== 0 ? path.path[0][0][0] : path.path[1][0]
    );
    for (const first of firsts) {
      const filtered_paths = paths.filter(
        (path) =>
          first ===
          (path.path[0].length !== 0 ? path.path[0][0][0] : path.path[1][0])
      );
      symbols[first] = arrow(() => {
        const sub_symbols: Record<string, Symbol> = this.get_symbols_for_paths(
          filtered_paths
            .filter((path) => path.path[0].length !== 0)
            .map(
              (path) =>
                new Path(path.label, [path.path[0].slice(1), path.path[1]])
            )
        );
        const filtered_path = filtered_paths.findAny(
          (path) => path.path[0].length === 0
        );
        if (filtered_path.isSome()) {
          const value = filtered_path.get().path[1][1];
          switch (value.type) {
            case "str":
            case "lstr":
            case "clob": {
              return new Symbol({
                value: new Ok(new Text(value.value)),
                values: sub_symbols,
              });
            }
            case "i32":
            case "u32":
            case "i64":
            case "u64": {
              return new Symbol({
                value: new Ok(new Num(value.value.toNumber())),
                values: sub_symbols,
              });
            }
            case "idouble":
            case "udouble":
            case "idecimal":
            case "udecimal": {
              return new Symbol({
                value: new Ok(new Deci(value.value.toNumber())),
                values: sub_symbols,
              });
            }
            case "bool": {
              return new Symbol({
                value: new Ok(new Bool(value.value)),
                values: sub_symbols,
              });
            }
            case "date":
            case "time":
            case "timestamp": {
              return new Symbol({
                value: new Ok(new Num(value.value.getTime())),
                values: sub_symbols,
              });
            }
            case "other": {
              return new Symbol({
                value: new Ok(new Num(value.value.toNumber())),
                values: sub_symbols,
              });
            }
            default: {
              const _exhaustiveCheck: never = value;
              return _exhaustiveCheck;
            }
          }
        } else {
          return new Symbol({
            value: undefined,
            values: sub_symbols,
          });
        }
      });
    }
    return symbols;
  }

  async get_symbols(
    args: FxArgs,
    level: Decimal
  ): Promise<Result<Record<string, Symbol>>> {
    const paths = this.get_paths();
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
                        values: this.get_symbols_for_paths(
                          variable.value.paths
                        ),
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
                        values: this.get_symbols_for_paths(
                          variable.value.paths
                        ),
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

  exec(args: FxArgs, level: Decimal) {}
}
