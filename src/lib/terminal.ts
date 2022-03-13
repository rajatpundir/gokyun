import { apply, arrow } from "./prelude";

type TerminalArgs =
  | [
      "error",
      (
        | ["compose", string]
        | ["transform", string]
        | ["fx", string]
        | ["permissions", string]
        | ["db", string]
        | ["field_variants", string]
        | ["schema", string]
      )
    ]
  | ["db", string]
  | ["db_variables", string]
  | ["compose", string]
  | ["transform", string]
  | ["fx", string]
  | ["permissions", string];

export function terminal(args: TerminalArgs) {
  apply(true, (debug) => {
    if (debug) {
      console.log(
        arrow(() => {
          switch (args[0]) {
            case "error": {
              const value = args[1];
              switch (value[0]) {
                case "compose": {
                  return `[ERROR] [COMPOSE] ${value[1]}`;
                }
                case "transform": {
                  return `[ERROR] [TRANSFORM] ${value[1]}`;
                }
                case "fx": {
                  return `[ERROR] [FX] ${value[1]}`;
                }
                case "permissions": {
                  return `[ERROR] [PERMISSIONS] ${value[1]}`;
                }
                case "db": {
                  return `[ERROR] [DB] ${value[1]}`;
                }
                case "field_variants": {
                  return `[ERROR] [FIELD_VARIANTS] ${value[1]}`;
                }
                case "schema": {
                  return `[ERROR] [SCHEMA] ${value[1]}`;
                }
                default: {
                  const _exhaustiveCheck: never = value;
                  return _exhaustiveCheck;
                }
              }
            }
            case "db": {
              return apply(false, (debug) => {
                if (debug) {
                  return args[1];
                }
                return "";
              });
            }
            case "db_variables": {
              return apply(false, (debug) => {
                if (debug) {
                  return args[1];
                }
                return "";
              });
            }
            case "compose": {
              return apply(false, (debug) => {
                if (debug) {
                  return args[1];
                }
                return "";
              });
            }
            case "transform": {
              return apply(false, (debug) => {
                if (debug) {
                  return args[1];
                }
                return "";
              });
            }
            case "fx": {
              return apply(false, (debug) => {
                if (debug) {
                  return args[1];
                }
                return "";
              });
            }
            case "permissions": {
              return apply(false, (debug) => {
                if (debug) {
                  return args[1];
                }
                return "";
              });
            }
            default: {
              const _exhaustiveCheck: never = args;
              return _exhaustiveCheck;
            }
          }
        })
      );
    }
  });
}
