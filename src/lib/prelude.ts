import Decimal from "decimal.js";
import { errors, ErrMsg } from "./errors";
import { Image } from "react-native";

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
  for (const result of input) {
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
    for (const val of values) {
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
    for (const val of values) {
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

async function get_image_size(url: string): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      url,
      (width, height) => resolve([width, height]),
      (err) => {
        console.log("Error loading image: ", err);
        reject(String(err));
      }
    );
  });
}

export type Resource =
  | undefined
  | ({ url: string } & (
      | {
          type: "image";
          subtype: "png" | "jpeg" | "bmp" | "gif" | "webp";
          width: number;
          height: number;
        }
      | { type: "video"; subtype: "mp4" }
      | { type: "application"; subtype: "pdf" }
      | { type: "text"; subtype: "youtube" }
    ));

export async function get_resource(url: URL): Promise<Resource> {
  const trimmed_url = url.toString().replace(/\/+$/, "");
  const response = await fetch(trimmed_url, { method: "GET" });
  const content_type: string | null = response.headers.get("content-type");
  if (content_type !== null && content_type.split("/").length === 2) {
    const [mime_type, mime_subtype] = content_type.split("/");
    console.log("--", mime_type, "--", mime_subtype);
    switch (mime_type) {
      case "image": {
        switch (mime_subtype) {
          case "png":
          case "jpeg":
          case "bmp":
          case "gif":
          case "webp": {
            const [width, height] = await get_image_size(trimmed_url);
            return {
              url: trimmed_url,
              type: mime_type,
              subtype: mime_subtype,
              width: width,
              height: height,
            };
          }
        }
        break;
      }
      case "video": {
        switch (mime_subtype) {
          case "mp4": {
            return {
              url: trimmed_url,
              type: mime_type,
              subtype: mime_subtype,
            };
          }
        }
        break;
      }
      case "application": {
        switch (mime_subtype) {
          case "pdf": {
            return {
              url: trimmed_url,
              type: mime_type,
              subtype: mime_subtype,
            };
          }
        }
        break;
      }
      case "text": {
        switch (mime_subtype) {
          case "html; charset=utf-8": {
            if (trimmed_url.startsWith("https://youtu.be/")) {
              return apply(trimmed_url.split("https://youtu.be/"), (it) => {
                if (it.length === 2) {
                  return {
                    url: it[1],
                    type: mime_type,
                    subtype: "youtube",
                  };
                }
                return undefined;
              });
            }
            break;
          }
        }
        break;
      }
    }
  }
  return undefined;
}
