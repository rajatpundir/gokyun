import Decimal from "decimal.js";
import { ErrMsg, errors } from "./errors";
import { FxArgs, get_fx } from "./fx";
import { arrow, CustomError, Err, unwrap } from "./prelude";
import { PathString, StrongEnum, WeakEnum } from "./variable";

type ComposeInputs = Record<
  string,
  | WeakEnum
  | {
      type: "list";
    }
>;

type ComposeArgs = Record<
  string,
  | Exclude<
      StrongEnum,
      {
        type: "other";
        other: string;
        value: Decimal;
      }
    >
  | {
      type: "other";
      other: string;
      value: Decimal;
      // There must be atleast one read path permission, obtained after using user_paths / borrows
      user_paths: Array<PathString>;
      borrows: Array<string>;
    }
  | {
      type: "list";
      value: ReadonlyArray<FxArgs>;
    }
>;

type ComposeStep =
  | {
      type: "fx";
      name: string;
      map: Record<
        string,
        | {
            type: "input";
            value: string;
          }
        | {
            type: "fx" | "compose";
            value: [number, string];
          }
      >;
    }
  | {
      type: "compose";
      name: string;
      map: Record<
        string,
        | {
            type: "input";
            value: string;
          }
        | {
            type: "fx" | "compose";
            value: [number, string];
          }
        | {
            type: "transform";
            value: number;
          }
      >;
    }
  | {
      type: "transform";
      name: string;
      map: {
        base:
          | {
              type: "input";
              value: string;
            }
          | {
              type: "transform";
              value: number;
            };
        query: Record<
          string,
          | {
              type: "input";
              value: string;
            }
          | {
              type: "fx" | "compose";
              value: [number, string];
            }
        >;
      };
    };

type ComposeOutputs = Record<
  string,
  | { type: "input"; value: string }
  | { type: "fx" | "compose"; value: [number, string] }
  | { type: "transform"; value: number }
>;

export class Compose {
  name: string;
  inputs: ComposeInputs;
  steps: ReadonlyArray<ComposeStep>;
  outputs: ComposeOutputs;

  constructor(
    name: string,
    inputs: ComposeInputs,
    steps: ReadonlyArray<ComposeStep>,
    outputs: ComposeOutputs
  ) {
    this.name = name;
    this.inputs = inputs;
    this.steps = steps;
    this.outputs = outputs;
  }

  equals(other: Compose): boolean {
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

  exec(args: ComposeArgs, level: Decimal) {
    const computed_outputs = [];
    // 1. perform steps
    for (const [index, step] of this.steps.entries()) {
      switch (step.type) {
        case "fx": {
          const result = get_fx(step.name);
          if (unwrap(result)) {
            const fx = result.value;
            const fx_args: FxArgs = {};
            for (const input_name of Object.keys(fx.inputs)) {
              if (input_name in step.map) {
                const input = fx.inputs[input_name];
                const step_map = step.map[input_name];
                switch (step_map.type) {
                  case "input": {
                    const arg_name: string = step_map.value;
                    if (arg_name in args) {
                      const arg = args[arg_name];
                      if (arg.type !== "other") {
                        if (arg.type === input.type) {
                          fx_args[input_name] = arrow(() => {
                            switch (arg.type) {
                              case "str":
                              case "lstr":
                              case "clob": {
                                return {
                                  type: arg.type,
                                  value: arg.value,
                                };
                              }
                              case "i32":
                              case "u32":
                              case "i64":
                              case "u64": {
                                return {
                                  type: arg.type,
                                  value: arg.value,
                                };
                              }
                              case "idouble":
                              case "udouble":
                              case "idecimal":
                              case "udecimal": {
                                return {
                                  type: arg.type,
                                  value: arg.value,
                                };
                              }
                              case "bool": {
                                return {
                                  type: arg.type,
                                  value: arg.value,
                                };
                              }
                              case "date":
                              case "time":
                              case "timestamp": {
                                return {
                                  type: arg.type,
                                  value: arg.value,
                                };
                              }
                              default: {
                                const _exhaustiveCheck: never = arg;
                                return _exhaustiveCheck;
                              }
                            }
                          });
                        } else {
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                      } else {
                        if (
                          arg.type === input.type &&
                          arg.other === input.other
                        ) {
                          fx_args[input_name] = {
                            type: input.type,
                            other: input.other,
                            value: arg.value,
                            user_paths: arg.user_paths,
                            borrows: arg.borrows,
                          };
                        } else {
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                      }
                    } else {
                      if (input.default !== undefined) {
                        if (input.type !== "other") {
                          switch (input.type) {
                            case "str":
                            case "lstr":
                            case "clob": {
                              fx_args[input_name] = {
                                type: input.type,
                                value: input.default,
                              };
                              break;
                            }
                            case "i32":
                            case "u32":
                            case "i64":
                            case "u64": {
                              fx_args[input_name] = {
                                type: input.type,
                                value: input.default,
                              };
                              break;
                            }
                            case "idouble":
                            case "udouble":
                            case "idecimal":
                            case "udecimal": {
                              fx_args[input_name] = {
                                type: input.type,
                                value: input.default,
                              };
                              break;
                            }
                            case "bool": {
                              fx_args[input_name] = {
                                type: input.type,
                                value: input.default,
                              };
                              break;
                            }
                            case "date":
                            case "time":
                            case "timestamp": {
                              fx_args[input_name] = {
                                type: input.type,
                                value: input.default,
                              };
                              break;
                            }
                            default: {
                              const _exhaustiveCheck: never = input;
                              return _exhaustiveCheck;
                            }
                          }
                        } else {
                          fx_args[input_name] = {
                            type: input.type,
                            other: input.other,
                            value: input.default,
                            user_paths: [],
                            borrows: [],
                          };
                        }
                      } else {
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                    }
                    break;
                  }
                  case "fx": {
                    const [step_index, output_name] = step_map.value;
                    break;
                  }
                  case "compose": {
                    break;
                  }
                  default: {
                    const _exhaustiveCheck: never = step_map;
                    return _exhaustiveCheck;
                  }
                }
              } else {
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            }
            // invoke fx
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
          break;
        }
        case "compose": {
          break;
        }
        case "transform": {
          break;
        }
        default: {
          const _exhaustiveCheck: never = step;
          return _exhaustiveCheck;
        }
      }
    }
    // 2. generate outputs
    for (const output_name of Object.keys(this.outputs)) {
      const output = this.outputs[output_name];
    }
  }
}
