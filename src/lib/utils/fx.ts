import Decimal from "decimal.js";
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
import { apply, arrow, CustomError, Err, Ok, Result } from "./prelude";
import {
  compare_paths,
  PathString,
  StrongEnum,
  StructPermissions,
  WeakEnum,
} from "./variable";

// Fx, Tranform, Compose

// Add checks for inputs, and user_invoked args

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
  private paths: ReadonlyArray<PathString>;

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
    this.paths = this.get_paths();
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
    for (let check_name of Object.keys(this.checks)) {
      const expr = this.checks[check_name][0];
      paths = paths.concat(expr.get_paths());
    }
    // 2. Process input updates
    for (let input_name of Object.keys(this.inputs)) {
      const input = this.inputs[input_name];
      if (input.type === "other" && input.updates !== undefined) {
        for (let [, expr] of input.updates) {
          paths = paths.concat(expr.get_paths());
        }
      }
    }
    // 3. Process outputs
    for (let output_name of Object.keys(this.outputs)) {
      const output = this.outputs[output_name];
      for (let field_name of Object.keys(output.fields)) {
        const expr = output.fields[field_name];
        paths = paths.concat(expr.get_paths());
      }
    }
    return apply([] as Array<PathString>, (it) => {
      for (let path of paths) {
        let check = true;
        for (let existing_path of it) {
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

  get_symbols(args: FxArgs): Result<{}> {
    console.log(this.paths);
    const symbols: Record<string, Symbol> = {};
    for (let input_name of Object.keys(this.inputs)) {
      const input = this.inputs[input_name];
      let check = false;
      for (let path of this.paths) {
        const first: string = path[0].length !== 0 ? path[0][0] : path[1];
        if (first === input_name) {
          check = true;
          break;
        }
      }
      if (check) {
        symbols[input_name] = arrow(() => {
          if (input.type !== "other") {
            switch (input.type) {
              case "str":
              case "lstr":
              case "clob": {
                return new Symbol({
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
              }
              case "i32":
              case "u32":
              case "i64":
              case "u64": {
                return new Symbol({
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
              }
              case "idouble":
              case "udouble":
              case "idecimal":
              case "udecimal": {
                return new Symbol({
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
              }
              case "bool": {
                return new Symbol({
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
              }
              case "date":
              case "time":
              case "timestamp": {
                return new Symbol({
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
              }
            }
          } else {
            return new Symbol({
              value: new Ok(new Num(0)),
              values: {},
            });
          }
        });
      }
    }
    return new Ok({});
  }

  exec(args: FxArgs, level: Decimal) {}
}
