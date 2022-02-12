import Decimal from "decimal.js";
import { errors, ErrMsg } from "./errors";

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

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

export function arrow<T>(fx: () => T): T {
  return fx();
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

type Function<T, U> = [(x: T) => U, (x: U) => T];

export function get_array_item<T>(
  array: ReadonlyArray<T>,
  index: number | Decimal
): Option<T> {
  return apply(
    arrow(() => {
      if (is_decimal(index)) {
        return index.abs().truncated().toNumber();
      } else {
        return Math.abs(index);
      }
    }),
    (it) => {
      if (it < array.length) {
        return new Ok(array[it]);
      }
      return undefined;
    }
  );
}

export async function check_url(url: string) {
  const x = await fetch(url, { method: "GET" });
  console.log(x.status, x.ok, x.url);
  return x.ok;
}

import { Image } from "react-native";

export async function get_image_size(url: URL): Promise<[URL, number, number]> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      url.toString().replace(/\/+$/, ""),
      (width, height) => resolve([url, width, height]),
      (err) => {
        console.log("Error loading image: ", err);
        reject(String(err));
      }
    );
  });
}
