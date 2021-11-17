import Mustache from "mustache";

export type Language = "English";

export const languages = {
  English: "English",
};

export type ErrMsg =
  | ["ErrUnexpected"]
  | ["ErrMissingSymbol"]
  | ["ErrEmptyField"]
  | ["CannotBeEmpty", { field: string }] // template error example
  | ["CustomMsg", { msg: string }];

export const errors = {
  ErrUnexpected: "ErrUnexpected",
  ErrMissingSymbol: "ErrMissingSymbol",
  ErrEmptyField: "ErrEmptyField",
  CannotBeEmpty: "CannotBeEmpty",
  CustomMsg: "CustomMsg",
};

export function to_string(message: ErrMsg, lang: Language): string {
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
        case "CustomMsg": {
          return Mustache.render(" Value for {{field}} cannot be empty", {
            field: message[1].msg,
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
