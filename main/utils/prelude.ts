import Mustache from "mustache";

export type Language = "English";

export const languages = {
  English: "English",
};

export type Message =
  | ["ErrUnexpected"]
  | ["ErrMissingSymbol"]
  | ["ErrEmptyField"]
  | ["CannotBeEmpty", { field: string }]; // template error example

export const errors = {
  ErrUnexpected: "ErrUnexpected",
  ErrMissingSymbol: "ErrMissingSymbol",
  ErrEmptyField: "ErrEmptyField",
  CannotBeEmpty: "CannotBeEmpty",
};

export function to_string(message: Message, lang: Language): string {
  switch (lang) {
    case "English": {
      switch (message[0]) {
        case "ErrUnexpected":
          return "Unexpected Error";
        case "ErrMissingSymbol":
          return "Symbol not found";
        case "ErrEmptyField":
          return "Field cannot be empty";
        case "CannotBeEmpty": {
          return Mustache.render(" Value for {{field}} cannot be empty", {
            field: message[1].field,
          });
        }
        default: {
          const _exhaustiveCheck: never = message;
          return _exhaustiveCheck;
        }
      }
    }
    default: {
      const _exhaustiveCheck: never = lang;
      return _exhaustiveCheck;
    }
  }
}

export class CustomError {
  value: Message | Record<string, CustomError>;

  constructor(value: Message | Record<string, CustomError>) {
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

export function unwrap<T>(result: Result<T>): result is Ok<T> {
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
      return new Err(new CustomError([errors.ErrUnexpected] as Message));
    }
  }
  return new Ok(results);
}

export function apply<T, U>(v: T, fx: (it: T) => U): U {
  return fx(v);
}
