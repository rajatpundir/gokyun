import { Immutable, Draft } from "immer";
import { HashSet } from "prelude-ts";
import { Path, Struct } from "./variable";
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

export type State = Immutable<{
  struct: Struct;
  id: Decimal;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  values: HashSet<Path>;
}>;

export type Action =
  | ["id", Decimal]
  | ["active", boolean]
  | ["created_at", Date]
  | ["updated_at", Date]
  | ["values", Path];

export function reducer(state: Draft<State>, action: Action) {
  switch (action[0]) {
    case "id": {
      state.id = action[1];
      break;
    }
    case "active": {
      state.active = action[1];
      break;
    }
    case "created_at": {
      state.created_at = action[1];
      break;
    }
    case "updated_at": {
      state.updated_at = action[1];
      break;
    }
    case "values": {
      if (action[1].writeable) {
        state.values = apply(state.values.remove(action[1]), (it) => {
          return it.add(action[1]);
        });
      }
      break;
    }
    default: {
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
    }
  }
}
