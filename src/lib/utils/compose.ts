import Decimal from "decimal.js";
import { ErrMsg, errors } from "./errors";
import { FxArgs, get_fx } from "./fx";
import { apply, arrow, CustomError, Err, Ok, Result, unwrap } from "./prelude";
import { get_transform, TransformArgs } from "./transform";
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
      invoke: string;
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
      invoke: string;
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
      invoke: string;
      map: {
        base:
          | {
              type: "input";
              value: string;
            }
          | {
              type: "compose";
              value: [number, string];
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

type StepOutput =
  | {
      type: "fx";
      value: Record<string, StrongEnum>;
    }
  | {
      type: "transform";
      value: ReadonlyArray<Record<string, StrongEnum>>;
    }
  | {
      type: "compose";
      value: Record<
        string,
        StrongEnum | ReadonlyArray<Record<string, StrongEnum>>
      >;
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

  async exec(
    args: ComposeArgs,
    level: Decimal
  ): Promise<
    Result<
      Record<string, StrongEnum | ReadonlyArray<Record<string, StrongEnum>>>
    >
  > {
    const computed_outputs: Record<
      string,
      StrongEnum | ReadonlyArray<Record<string, StrongEnum>>
    > = {};
    const step_outputs: Array<StepOutput> = [];
    // 1. perform steps
    for (const [index, step] of this.steps.entries()) {
      switch (step.type) {
        case "fx": {
          const result = get_fx(step.invoke);
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
                    const [step_index, output_name] = step_map.value as [
                      number,
                      string
                    ];
                    if (step_index > 0 && step_index < step_outputs.length) {
                      const step_output: StepOutput = step_outputs[step_index];
                      if (step_map.type === step_output.type) {
                        if (output_name in step_output.value) {
                          const arg = step_output.value[output_name];
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
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
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
                                user_paths: [],
                                borrows: [],
                              };
                            } else {
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                          }
                        } else {
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                      } else {
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                    } else {
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                    break;
                  }
                  case "compose": {
                    const [step_index, output_name] = step_map.value as [
                      number,
                      string
                    ];
                    if (step_index > 0 && step_index < step_outputs.length) {
                      const step_output: StepOutput = step_outputs[step_index];
                      if (step_map.type === step_output.type) {
                        if (output_name in step_output.value) {
                          const value = step_output.value[output_name];
                          if (!Array.isArray(value)) {
                            const arg: StrongEnum = value as StrongEnum;
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
                                  new CustomError([
                                    errors.ErrUnexpected,
                                  ] as ErrMsg)
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
                                  user_paths: [],
                                  borrows: [],
                                };
                              } else {
                                return new Err(
                                  new CustomError([
                                    errors.ErrUnexpected,
                                  ] as ErrMsg)
                                );
                              }
                            }
                          } else {
                            return new Err(
                              new CustomError([errors.ErrUnexpected] as ErrMsg)
                            );
                          }
                        } else {
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                      } else {
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                    } else {
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
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
            const computed_output = await fx.exec(fx_args, level);
            if (unwrap(computed_output)) {
              step_outputs.push({
                type: step.type,
                value: computed_output.value,
              });
            } else {
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
          break;
        }
        case "compose": {
          const result = get_compose(step.invoke);
          if (unwrap(result)) {
            const compose = result.value;
            const compose_args: ComposeArgs = {};
            for (const input_name of Object.keys(compose.inputs)) {
              const input = compose.inputs[input_name];
              const step_map = step.map[input_name];
              switch (step_map.type) {
                case "input": {
                  const arg_name: string = step_map.value;
                  if (arg_name in args) {
                    const arg = args[arg_name];
                    if (arg.type !== "other") {
                      if (arg.type === input.type) {
                        compose_args[input_name] = arrow(() => {
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
                            case "list": {
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
                        compose_args[input_name] = {
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
                    if (input.type !== "list") {
                      if (input.default !== undefined) {
                        if (input.type !== "other") {
                          switch (input.type) {
                            case "str":
                            case "lstr":
                            case "clob": {
                              compose_args[input_name] = {
                                type: input.type,
                                value: input.default,
                              };
                              break;
                            }
                            case "i32":
                            case "u32":
                            case "i64":
                            case "u64": {
                              compose_args[input_name] = {
                                type: input.type,
                                value: input.default,
                              };
                              break;
                            }
                            case "idouble":
                            case "udouble":
                            case "idecimal":
                            case "udecimal": {
                              compose_args[input_name] = {
                                type: input.type,
                                value: input.default,
                              };
                              break;
                            }
                            case "bool": {
                              compose_args[input_name] = {
                                type: input.type,
                                value: input.default,
                              };
                              break;
                            }
                            case "date":
                            case "time":
                            case "timestamp": {
                              compose_args[input_name] = {
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
                          compose_args[input_name] = {
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
                    } else {
                      compose_args[input_name] = {
                        type: input.type,
                        value: [],
                      };
                    }
                  }
                  break;
                }
                case "fx": {
                  const [step_index, output_name] = step_map.value as [
                    number,
                    string
                  ];
                  if (step_index > 0 && step_index < step_outputs.length) {
                    const step_output: StepOutput = step_outputs[step_index];
                    if (step_map.type === step_output.type) {
                      if (output_name in step_output.value) {
                        const arg = step_output.value[output_name];
                        if (arg.type !== "other") {
                          if (arg.type === input.type) {
                            compose_args[input_name] = arrow(() => {
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
                            compose_args[input_name] = {
                              type: input.type,
                              other: input.other,
                              value: arg.value,
                              user_paths: [],
                              borrows: [],
                            };
                          } else {
                            return new Err(
                              new CustomError([errors.ErrUnexpected] as ErrMsg)
                            );
                          }
                        }
                      } else {
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                    } else {
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  } else {
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                  break;
                }
                case "compose": {
                  const [step_index, output_name] = step_map.value as [
                    number,
                    string
                  ];
                  if (step_index > 0 && step_index < step_outputs.length) {
                    const step_output: StepOutput = step_outputs[step_index];
                    if (step_map.type === step_output.type) {
                      if (output_name in step_output.value) {
                        const value = step_output.value[output_name];
                        if (!Array.isArray(value)) {
                          const arg: StrongEnum = value as StrongEnum;
                          if (arg.type !== "other") {
                            if (arg.type === input.type) {
                              compose_args[input_name] = arrow(() => {
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
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                          } else {
                            if (
                              arg.type === input.type &&
                              arg.other === input.other
                            ) {
                              compose_args[input_name] = {
                                type: input.type,
                                other: input.other,
                                value: arg.value,
                                user_paths: [],
                                borrows: [],
                              };
                            } else {
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                          }
                        } else {
                          compose_args[input_name] = {
                            type: "list",
                            value: apply([] as Array<FxArgs>, (it) => {
                              for (const arg of value as ReadonlyArray<
                                Record<string, StrongEnum>
                              >) {
                                const fx_args: FxArgs = {};
                                for (const field_name of Object.keys(arg)) {
                                  const field = arg[field_name];
                                  if (field.type !== "other") {
                                    fx_args[field_name] = field;
                                  } else {
                                    fx_args[field_name] = {
                                      ...field,
                                      user_paths: [],
                                      borrows: [],
                                    };
                                  }
                                }
                                it.push(fx_args);
                              }
                              return it;
                            }),
                          };
                        }
                      } else {
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                    } else {
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  } else {
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                  break;
                }
                case "transform": {
                  const step_index = step_map.value;
                  if (step_index > 0 && step_index < step_outputs.length) {
                    const step_output: StepOutput = step_outputs[step_index];
                    if (step_map.type === step_output.type) {
                      compose_args[input_name] = {
                        type: "list",
                        value: apply([] as Array<FxArgs>, (it) => {
                          for (const arg of step_output.value) {
                            const fx_args: FxArgs = {};
                            for (const field_name of Object.keys(arg)) {
                              const field = arg[field_name];
                              if (field.type !== "other") {
                                fx_args[field_name] = field;
                              } else {
                                fx_args[field_name] = {
                                  ...field,
                                  user_paths: [],
                                  borrows: [],
                                };
                              }
                            }
                            it.push(fx_args);
                          }
                          return it;
                        }),
                      };
                    } else {
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  } else {
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                  break;
                }
                default: {
                  const _exhaustiveCheck: never = step_map;
                  return _exhaustiveCheck;
                }
              }
            }
            // invoke compose
            const computed_output = await compose.exec(compose_args, level);
            if (unwrap(computed_output)) {
              step_outputs.push({
                type: step.type,
                value: computed_output.value,
              });
            } else {
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
          break;
        }
        case "transform": {
          const result = get_transform(step.invoke);
          if (unwrap(result)) {
            const transform = result.value;
            const transform_base: Array<FxArgs> = [];
            switch (step.map.base.type) {
              case "input": {
                const arg_name: string = step.map.base.value;
                if (arg_name in args) {
                  const arg = args[arg_name];
                  if (arg.type === "list") {
                    for (const value of arg.value) {
                      transform_base.push(value);
                    }
                  } else {
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                }
                break;
              }
              case "compose": {
                const [step_index, output_name] = step.map.base.value as [
                  number,
                  string
                ];
                if (step_index > 0 && step_index < step_outputs.length) {
                  const step_output: StepOutput = step_outputs[step_index];
                  if (step.map.base.type === step_output.type) {
                    if (output_name in step_output.value) {
                      const value = step_output.value[output_name];
                      if (Array.isArray(value)) {
                        const arg = value as ReadonlyArray<
                          Record<string, StrongEnum>
                        >;
                        for (const arg_value of arg) {
                          const fx_args: FxArgs = {};
                          for (const field_name of Object.keys(arg_value)) {
                            const field = arg_value[field_name];
                            if (field.type !== "other") {
                              fx_args[field_name] = field;
                            } else {
                              fx_args[field_name] = {
                                ...field,
                                user_paths: [],
                                borrows: [],
                              };
                            }
                          }
                          transform_base.push(fx_args);
                        }
                      } else {
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                    } else {
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  } else {
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                } else {
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
                break;
              }
              case "transform": {
                const step_index = step.map.base.value;
                if (step_index > 0 && step_index < step_outputs.length) {
                  const step_output: StepOutput = step_outputs[step_index];
                  if (step.map.base.type === step_output.type) {
                    for (const arg of step_output.value) {
                      const fx_args: FxArgs = {};
                      for (const field_name of Object.keys(arg)) {
                        const field = arg[field_name];
                        if (field.type !== "other") {
                          fx_args[field_name] = field;
                        } else {
                          fx_args[field_name] = {
                            ...field,
                            user_paths: [],
                            borrows: [],
                          };
                        }
                      }
                      transform_base.push(fx_args);
                    }
                  } else {
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                } else {
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
                break;
              }
              default: {
                const _exhaustiveCheck: never = step.map.base;
                return _exhaustiveCheck;
              }
            }
            const transform_query: TransformArgs["query"] = {};
            for (const field_name of Object.keys(step.map.query)) {
              const field = step.map.query[field_name];
              switch (field.type) {
                case "input": {
                  break;
                }
                case "fx": {
                  break;
                }
                case "compose": {
                  break;
                }
                default: {
                  const _exhaustiveCheck: never = field;
                  return _exhaustiveCheck;
                }
              }
            }
            // invoke transform
            const computed_output = await transform.exec(
              { base: transform_base, query: transform_query },
              level
            );
            if (unwrap(computed_output)) {
              step_outputs.push({
                type: step.type,
                value: computed_output.value,
              });
            } else {
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
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
    return new Ok(computed_outputs);
  }
}

export function get_compose(fx_name: string): Result<Compose> {
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
