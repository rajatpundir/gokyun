import Decimal from "decimal.js";
import { ErrMsg } from "./errors";
import { BooleanLispExpression, LispExpression } from "./lisp";
import { Ok, Result } from "./prelude";
import { PathString, StrongEnum } from "./variable";

type TrandformQuery =
  | {
      struct: string;
      // query on basis of top level fields
      fields: { [index: string]: LispExpression };
      paths: Record<string, ReadonlyArray<PathString>>;
    }
  | undefined;

type TransformInputs = Record<string, LispExpression>;

type TransformArgs = ReadonlyArray<StrongEnum>;

type TransformChecks = Record<string, [BooleanLispExpression, ErrMsg]>;

export class Tranform {
  name: string;
  fx: string;
  query: TrandformQuery;
  inputs: TransformInputs;
  checks: TransformChecks;

  constructor(
    name: string,
    fx: string,
    query: TrandformQuery,
    inputs: TransformInputs,
    checks: TransformChecks
  ) {
    this.name = name;
    this.fx = fx;
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

  get_symbols(args: TransformArgs, level: Decimal) {}

  exec(
    args: TransformArgs,
    level: Decimal
  ): Result<Array<Record<string, StrongEnum>>> {
    const computed_outputs: Array<Record<string, StrongEnum>> = [];
    return new Ok(computed_outputs);
  }
}
