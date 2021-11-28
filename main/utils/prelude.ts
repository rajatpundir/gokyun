import Decimal from "decimal.js";
import { errors, ErrMsg } from "./errors";

export class CustomError {
  value: ErrMsg | Record<string, CustomError>;

  constructor(value: ErrMsg | Record<string, CustomError>) {
    this.value = value;
  }
}

export class Ok<T> {
  readonly value: T;

  constructor(value: T) {
    this.value = value;
  }
}

export class Err {
  readonly value: CustomError;

  constructor(value: CustomError) {
    this.value = value;
  }
}

export type Option<T> = Ok<T> | undefined;

export type Result<T> = Ok<T> | Err;

export function unwrap<T>(result: Result<T> | Option<T>): result is Ok<T> {
  return result instanceof Ok;
}

export function unwrap_array<T>(
  input: ReadonlyArray<Result<T>>
): Result<ReadonlyArray<T>> {
  const results: Array<T> = [];
  for (let result of input) {
    if (unwrap(result)) {
      results.push(result.value);
    } else {
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    }
  }
  return new Ok(results);
}

export function apply<T, U>(v: T, fx: (it: T) => U): U {
  return fx(v);
}

export function fold<T, U>(
  init: T,
  values: ReadonlyArray<U>,
  fn: (acc: T, val: U) => T
): T {
  return apply(init, (acc) => {
    for (let val of values) {
      acc = fn(acc, val);
    }
    return acc;
  });
}

export function fold_prev<T, U>(
  init: T,
  prev: U,
  values: ReadonlyArray<U>,
  fn: (acc: T, prev: U, val: U) => T
): T {
  return apply(init, (acc) => {
    for (let val of values) {
      acc = fn(acc, prev, val);
      prev = val;
    }
    return acc;
  });
}

export function is_decimal(value: any): value is Decimal {
  return Decimal.isDecimal(value);
}
