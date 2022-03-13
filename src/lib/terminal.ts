import { apply, arrow } from "./prelude";

type TerminalArgs =
  | ["db", string]
  | ["commons", string]
  | ["permissions", string];

export function terminal(args: TerminalArgs) {
  apply(true, (debug) => {
    if (debug) {
      console.log(
        arrow(() => {
          switch (args[0]) {
            case "db": {
              return apply(true, (debug) => {
                if (debug) {
                  return args[1];
                }
                return "";
              });
            }
            case "commons": {
              return apply(true, (debug) => {
                if (debug) {
                  return args[1];
                }
                return "";
              });
            }
            case "permissions": {
              return apply(true, (debug) => {
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
