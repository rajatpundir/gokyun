import Decimal from "decimal.js";
import { ErrMsg, errors } from "./errors";
import { BooleanLispExpression, LispExpression } from "./lisp";
import { apply, arrow, CustomError, Err, Ok, Result, unwrap } from "./prelude";
import { get_struct } from "./schema";
import { compare_paths, PathString, StrongEnum } from "./variable";

type TrandformQuery =
  | {
      struct: string;
      // query on basis of top level fields
      fields: { [index: string]: LispExpression };
      paths: Record<string, ReadonlyArray<PathString>>;
    }
  | undefined;

type TransformInputs = Record<string, LispExpression>;

type TransformArgs = {
  values: Record<string, StrongEnum>;
  args: ReadonlyArray<Record<string, StrongEnum>>;
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

  get_symbols_for_query(
    query: Exclude<TrandformQuery, undefined>,
    values: TransformArgs["values"]
  ) {
    const struct = get_struct(query.struct);
    if (unwrap(struct)) {
      const paths: ReadonlyArray<PathString> = arrow(() => {
        let paths: ReadonlyArray<PathString> = [];
        for (const field_name of Object.keys(query.fields)) {
          const expr = query.fields[field_name];
          paths = paths.concat(expr.get_paths());
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
      // construct symbols based on paths
      const symbols: Record<string, Symbol> = {};
      for (const field_name of Object.keys(query.fields)) {
        if (field_name in struct.value.fields) {
          const field = struct.value.fields[field_name];
          if (field_name in values) {
            const value = values[field_name];
            if (value.type === field.type) {
            } else {
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        } else {
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      }
    } else {
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    }
  }

  get_symbols(args: TransformArgs, level: Decimal) {
    if (this.query !== undefined) {
      const query = this.query;
      const struct = get_struct(query.struct);
      if (unwrap(struct)) {
        for (const field_name in Object.keys(query.fields)) {
          if (field_name in struct.value.fields) {
            const field = struct.value.fields[field_name];
            if (field_name in Object.keys(args.values)) {
              const value = args.values[field_name];
            } else {
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        }
      } else {
        return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
      }
    } else {
    }
  }

  exec(
    args: TransformArgs,
    level: Decimal
  ): Result<Array<Record<string, StrongEnum>>> {
    const computed_outputs: Array<Record<string, StrongEnum>> = [];
    return new Ok(computed_outputs);
  }
}
