import Decimal from "decimal.js";
import {
  get_struct,
  get_fx,
  get_compose,
  get_transform,
  StructName,
  FxName,
  ComposeName,
  TransformName,
} from "../schema";
import { get_path_with_type } from "./commons";
import { ErrMsg, errors } from "./errors";
import { FxArgs, get_symbols_for_fx_compose_paths } from "./fx";
import { Bool, BooleanLispExpression, Symbol } from "./lisp";
import { apply, arrow, CustomError, Err, Ok, Result, unwrap } from "./prelude";
import { TransformArgs, TransformResult } from "./transform";
import { compare_paths, PathString, StrongEnum, WeakEnum } from "./variable";

export type ComposeInputs = Record<
  string,
  (
    | WeakEnum
    | {
        type: "list";
      }
  ) & {
    output?: string;
  }
>;

export type ComposeArgs =
  | FxArgs
  | Record<
      string,
      {
        type: "list";
        value: TransformResult;
      }
    >;

export class ComposeStep {
  predicate:
    | [BooleanLispExpression, ReadonlyArray<Step | ComposeStep> | undefined]
    | undefined;
  steps: ReadonlyArray<Step | ComposeStep>;

  constructor(
    predicate:
      | [BooleanLispExpression, ReadonlyArray<Step | ComposeStep> | undefined]
      | undefined,
    steps: ReadonlyArray<Step | ComposeStep>
  ) {
    this.predicate = predicate;
    this.steps = steps;
  }
}

type Step =
  | {
      name?: string;
      type: "fx";
      invoke: FxName;
      map: Record<
        string,
        | {
            type: "input";
            value: string;
          }
        | {
            type: "fx" | "compose";
            value: [string, string];
          }
      >;
      output?: Record<string, string>;
    }
  | {
      name?: string;
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
            value: [string, string];
          }
        | {
            type: "transform";
            value: string;
          }
      >;
      output?: Record<string, string>;
    }
  | {
      name?: string;
      type: "transform";
      invoke: TransformName;
      map: {
        base:
          | {
              type: "inject";
              inject: Record<
                string,
                | {
                    type: "input";
                    value: string;
                  }
                | {
                    type: "fx" | "compose";
                    value: [string, string];
                  }
                | {
                    type: "transform";
                    value: string;
                  }
              >;
            }
          | {
              type: "input";
              value: string;
              inject?: Record<
                string,
                | {
                    type: "input";
                    value: string;
                  }
                | {
                    type: "fx" | "compose";
                    value: [string, string];
                  }
                | {
                    type: "transform";
                    value: string;
                  }
              >;
            }
          | {
              type: "compose";
              value: [string, string];
              map: Record<string, string>;
              inject?: Record<
                string,
                | {
                    type: "input";
                    value: string;
                  }
                | {
                    type: "fx" | "compose";
                    value: [string, string];
                  }
                | {
                    type: "transform";
                    value: string;
                  }
              >;
            }
          | {
              type: "transform";
              value: string;
              map: Record<string, string>;
              inject?: Record<
                string,
                | {
                    type: "input";
                    value: string;
                  }
                | {
                    type: "fx" | "compose";
                    value: [string, string];
                  }
                | {
                    type: "transform";
                    value: string;
                  }
              >;
            };
        query?: Record<
          string,
          | {
              type: "input";
              value: string;
            }
          | {
              type: "fx" | "compose";
              value: [string, string];
            }
        >;
      };
      output?: string;
    };

type StepOutput =
  | {
      type: "fx";
      value: Record<string, StrongEnum>;
    }
  | {
      type: "transform";
      value: TransformResult;
    }
  | {
      type: "compose";
      value: ComposeResult;
    };

type ComposeChecks = Record<string, [BooleanLispExpression, ErrMsg]>;

export interface ComposeResult {
  [index: string]: StrongEnum | TransformResult;
}

export class Compose {
  name: string;
  inputs: ComposeInputs;
  step: ComposeStep;
  checks: ComposeChecks;
  user_invocable: boolean;

  constructor(
    name: string,
    inputs: ComposeInputs,
    steps: ComposeStep,
    checks: ComposeChecks,
    user_invocable: boolean
  ) {
    this.name = name;
    this.inputs = inputs;
    this.step = steps;
    this.checks = checks;
    this.user_invocable = user_invocable;
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
  ): Promise<Result<ComposeResult>> {
    const result = await get_symbols_for_fx_compose_paths(
      level,
      arrow(() => {
        // Process checks
        let paths: ReadonlyArray<PathString> = [];
        for (const check_name of Object.keys(this.checks)) {
          const expr = this.checks[check_name][0];
          paths = paths.concat(expr.get_paths());
        }
        return apply([] as Array<PathString>, (it) => {
          for (const path of paths) {
            let check = true;
            for (const existing_path of it) {
              if (compare_paths(path, existing_path)) {
                check = false;
                break;
              }
            }
            if (check) {
              it.push(path);
            }
          }
          return it;
        });
      }),
      [this.inputs, args]
    );
    if (unwrap(result)) {
      const symbols = result.value;
      // run checks
      for (const check_name of Object.keys(this.checks)) {
        const expr = this.checks[check_name][0];
        const result = expr.get_result(symbols);
        if (unwrap(result)) {
          const expr_result = result.value;
          if (expr_result instanceof Bool) {
            if (!expr_result.value) {
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        } else {
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      }
      const computed_outputs: Record<string, StrongEnum | TransformResult> = {};
      // process inputs forwarded to outputs
      for (const input_name of Object.keys(this.inputs)) {
        const input = this.inputs[input_name];
        if (input.output !== undefined) {
          if (input_name in args) {
            const arg = args[input_name];
            if (arg.type === "list") {
              if (arg.type === input.type) {
                computed_outputs[input_name] = arg.value;
              } else {
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            } else {
              if (arg.type !== "other") {
                if (arg.type === input.type) {
                  computed_outputs[input_name] = {
                    type: arg.type,
                    value: arg.value,
                  } as StrongEnum;
                } else {
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              } else {
                if (arg.type === input.type && arg.other === input.other) {
                  const other_struct = get_struct(input.other as StructName);
                  computed_outputs[input_name] = {
                    type: arg.type,
                    other: other_struct.name,
                    value: arg.value,
                  };
                } else {
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
            }
          } else {
            if (input.type === "list") {
              computed_outputs[input_name] = [];
            } else {
              if (input.default !== undefined) {
                if (input.type !== "other") {
                  computed_outputs[input_name] = {
                    type: input.type,
                    value: input.default,
                  } as StrongEnum;
                } else {
                  const other_struct = get_struct(input.other as StructName);
                  computed_outputs[input_name] = {
                    type: input.type,
                    other: other_struct.name,
                    value: input.default,
                  };
                }
              } else {
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            }
          }
        }
      }
      return this.traverse_steps(
        this.step,
        symbols,
        computed_outputs,
        args,
        level
      );
    } else {
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    }
  }

  async traverse_steps(
    compose_step: ComposeStep,
    symbols: Readonly<Record<string, Symbol>>,
    computed_outputs: Record<string, StrongEnum | TransformResult>,
    args: ComposeArgs,
    level: Decimal,
    step_outputs: Record<string, StepOutput> = {}
  ): Promise<Result<ComposeResult>> {
    if (compose_step.predicate !== undefined) {
      const expr = compose_step.predicate[0];
      const result = expr.get_result(symbols);
      if (unwrap(result)) {
        const expr_result = result.value;
        if (expr_result instanceof Bool) {
          if (expr_result.value) {
            for (const step of compose_step.steps) {
              if (step instanceof ComposeStep) {
                const result = await this.traverse_steps(
                  step,
                  symbols,
                  computed_outputs,
                  args,
                  level,
                  step_outputs
                );
                if (!unwrap(result)) {
                  return result;
                }
              } else {
                const result = await this.exec_step(
                  step,
                  step_outputs,
                  computed_outputs,
                  args,
                  level
                );
                if (!unwrap(result)) {
                  return result;
                }
              }
            }
          } else {
            if (compose_step.predicate[1] !== undefined) {
              for (const step of compose_step.predicate[1]) {
                if (step instanceof ComposeStep) {
                  const result = await this.traverse_steps(
                    step,
                    symbols,
                    computed_outputs,
                    args,
                    level,
                    step_outputs
                  );
                  if (!unwrap(result)) {
                    return result;
                  }
                } else {
                  const result = await this.exec_step(
                    step,
                    step_outputs,
                    computed_outputs,
                    args,
                    level
                  );
                  if (!unwrap(result)) {
                    return result;
                  }
                }
              }
            }
          }
        } else {
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      } else {
        return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
      }
    } else {
      for (const step of compose_step.steps) {
        if (step instanceof ComposeStep) {
          const result = await this.traverse_steps(
            step,
            symbols,
            computed_outputs,
            args,
            level,
            step_outputs
          );
          if (!unwrap(result)) {
            return result;
          }
        } else {
          const result = await this.exec_step(
            step,
            step_outputs,
            computed_outputs,
            args,
            level
          );
          if (!unwrap(result)) {
            return result;
          }
        }
      }
    }
    return new Ok(computed_outputs);
  }

  async exec_step(
    step: Step,
    step_outputs: Record<string, StepOutput>,
    computed_outputs: Record<string, StrongEnum | TransformResult>,
    args: ComposeArgs,
    level: Decimal
  ): Promise<Result<ComposeResult>> {
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
                  const [step_ref, fx_output_name] = step_map.value as [
                    string,
                    string
                  ];
                  if (step_ref in step_outputs) {
                    const step_output: StepOutput = step_outputs[step_ref];
                    if (step_map.type === step_output.type) {
                      if (fx_output_name in step_output.value) {
                        const arg = step_output.value[fx_output_name];
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
                  const [step_ref, compose_output_name] = step_map.value as [
                    string,
                    string
                  ];
                  if (step_ref in step_outputs) {
                    const step_output: StepOutput = step_outputs[step_ref];
                    if (step_map.type === step_output.type) {
                      if (compose_output_name in step_output.value) {
                        const value = step_output.value[compose_output_name];
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
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
          }
          // invoke fx
          const computed_output = await fx.exec(fx_args, level);
          if (unwrap(computed_output)) {
            if (step.name !== undefined) {
              step_outputs[step.name] = {
                type: step.type,
                value: computed_output.value,
              };
            }
            if (step.output !== undefined) {
              for (const output_name of Object.keys(step.output)) {
                const value: string = step.output[output_name];
                if (value in computed_output.value) {
                  computed_outputs[output_name] = computed_output.value[value];
                } else {
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
            }
          } else {
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        } else {
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
        break;
      }
      case "compose": {
        const result = get_compose(step.invoke as ComposeName);
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
                    if (arg.type === input.type && arg.other === input.other) {
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
                const [step_ref, fx_output_name] = step_map.value as [
                  string,
                  string
                ];
                if (step_ref in step_outputs) {
                  const step_output: StepOutput = step_outputs[step_ref];
                  if (step_map.type === step_output.type) {
                    if (fx_output_name in step_output.value) {
                      const arg = step_output.value[fx_output_name];
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
                const [step_ref, compose_output_name] = step_map.value as [
                  string,
                  string
                ];
                if (step_ref in step_outputs) {
                  const step_output: StepOutput = step_outputs[step_ref];
                  if (step_map.type === step_output.type) {
                    if (compose_output_name in step_output.value) {
                      const value = step_output.value[compose_output_name];
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
                const step_ref: string = step_map.value;
                if (step_ref in step_outputs) {
                  const step_output: StepOutput = step_outputs[step_ref];
                  if (step_map.type === step_output.type) {
                    compose_args[input_name] = {
                      type: "list",
                      value: step_output.value,
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
            if (step.name !== undefined) {
              step_outputs[step.name] = {
                type: step.type,
                value: computed_output.value,
              };
            }
            if (step.output !== undefined) {
              for (const output_name of Object.keys(step.output)) {
                const value: string = step.output[output_name];
                if (value in computed_output.value) {
                  computed_outputs[output_name] = computed_output.value[value];
                } else {
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
            }
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
          const transform_base: Array<
            Record<string, StrongEnum> | ComposeResult
          > = [];
          switch (step.map.base.type) {
            case "inject": {
              const transform_arg: Record<string, StrongEnum> | ComposeResult =
                {};
              for (const field_name of Object.keys(step.map.base.inject)) {
                const inject = step.map.base.inject[field_name];
                switch (inject.type) {
                  case "input": {
                    const inject_arg_name: string = inject.value;
                    if (inject_arg_name in args) {
                      const inject_arg = args[inject_arg_name];
                      if (inject_arg.type === "list") {
                        transform_arg[field_name] = inject_arg.value;
                      } else {
                        transform_arg[field_name] = inject_arg;
                      }
                    } else {
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                    break;
                  }
                  case "fx": {
                    const [inject_step_ref, inject_fx_output_name] =
                      inject.value as [string, string];
                    if (inject_step_ref in step_outputs) {
                      const inject_step_output: StepOutput =
                        step_outputs[inject_step_ref];
                      if (inject.type === inject_step_output.type) {
                        if (inject_fx_output_name in inject_step_output.value) {
                          transform_arg[field_name] =
                            inject_step_output.value[inject_fx_output_name];
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
                    const [inject_step_ref, inject_compose_output_name] =
                      inject.value as [string, string];
                    if (inject_step_ref in step_outputs) {
                      const inject_step_output: StepOutput =
                        step_outputs[inject_step_ref];
                      if (inject.type === inject_step_output.type) {
                        if (
                          inject_compose_output_name in inject_step_output.value
                        ) {
                          transform_arg[field_name] =
                            inject_step_output.value[
                              inject_compose_output_name
                            ];
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
                    const inject_step_ref: string = inject.value;
                    if (inject_step_ref in step_outputs) {
                      const inject_step_output: StepOutput =
                        step_outputs[inject_step_ref];
                      if (inject.type === inject_step_output.type) {
                        transform_arg[field_name] = inject_step_output.value;
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
                    const _exhaustiveCheck: never = inject;
                    return _exhaustiveCheck;
                  }
                }
              }
              transform_base.push(transform_arg);
              break;
            }
            case "input": {
              const arg_name: string = step.map.base.value;
              if (arg_name in args) {
                const arg = args[arg_name];
                if (arg.type === "list") {
                  for (const arg_value of arg.value) {
                    const transform_arg:
                      | Record<string, StrongEnum>
                      | ComposeResult = arg_value;
                    if (step.map.base.inject !== undefined) {
                      for (const field_name of Object.keys(
                        step.map.base.inject
                      )) {
                        const inject = step.map.base.inject[field_name];
                        switch (inject.type) {
                          case "input": {
                            const inject_arg_name: string = inject.value;
                            if (inject_arg_name in args) {
                              const inject_arg = args[inject_arg_name];
                              if (inject_arg.type === "list") {
                                transform_arg[field_name] = inject_arg.value;
                              } else {
                                transform_arg[field_name] = inject_arg;
                              }
                            } else {
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                            break;
                          }
                          case "fx": {
                            const [inject_step_ref, inject_fx_output_name] =
                              inject.value as [string, string];
                            if (inject_step_ref in step_outputs) {
                              const inject_step_output: StepOutput =
                                step_outputs[inject_step_ref];
                              if (inject.type === inject_step_output.type) {
                                if (
                                  inject_fx_output_name in
                                  inject_step_output.value
                                ) {
                                  transform_arg[field_name] =
                                    inject_step_output.value[
                                      inject_fx_output_name
                                    ];
                                } else {
                                  return new Err(
                                    new CustomError([
                                      errors.ErrUnexpected,
                                    ] as ErrMsg)
                                  );
                                }
                              } else {
                                return new Err(
                                  new CustomError([
                                    errors.ErrUnexpected,
                                  ] as ErrMsg)
                                );
                              }
                            } else {
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                            break;
                          }
                          case "compose": {
                            const [
                              inject_step_ref,
                              inject_compose_output_name,
                            ] = inject.value as [string, string];
                            if (inject_step_ref in step_outputs) {
                              const inject_step_output: StepOutput =
                                step_outputs[inject_step_ref];
                              if (inject.type === inject_step_output.type) {
                                if (
                                  inject_compose_output_name in
                                  inject_step_output.value
                                ) {
                                  transform_arg[field_name] =
                                    inject_step_output.value[
                                      inject_compose_output_name
                                    ];
                                } else {
                                  return new Err(
                                    new CustomError([
                                      errors.ErrUnexpected,
                                    ] as ErrMsg)
                                  );
                                }
                              } else {
                                return new Err(
                                  new CustomError([
                                    errors.ErrUnexpected,
                                  ] as ErrMsg)
                                );
                              }
                            } else {
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                            break;
                          }
                          case "transform": {
                            const inject_step_ref: string = inject.value;
                            if (inject_step_ref in step_outputs) {
                              const inject_step_output: StepOutput =
                                step_outputs[inject_step_ref];
                              if (inject.type === inject_step_output.type) {
                                transform_arg[field_name] =
                                  inject_step_output.value;
                              } else {
                                return new Err(
                                  new CustomError([
                                    errors.ErrUnexpected,
                                  ] as ErrMsg)
                                );
                              }
                            } else {
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                            break;
                          }
                          default: {
                            const _exhaustiveCheck: never = inject;
                            return _exhaustiveCheck;
                          }
                        }
                      }
                    }
                    transform_base.push(transform_arg);
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
              const [step_ref, compose_output_name] = step.map.base.value as [
                string,
                string
              ];
              if (step_ref in step_outputs) {
                const step_output: StepOutput = step_outputs[step_ref];
                if (step.map.base.type === step_output.type) {
                  if (compose_output_name in step_output.value) {
                    const value = step_output.value[compose_output_name];
                    if (Array.isArray(value)) {
                      const arg = value as ReadonlyArray<
                        Record<string, StrongEnum>
                      >;
                      for (const arg_value of arg) {
                        const transform_arg:
                          | Record<string, StrongEnum>
                          | ComposeResult = {};
                        for (const field_name of Object.keys(
                          step.map.base.map
                        )) {
                          const ref_field_name: string =
                            step.map.base.map[field_name];
                          if (ref_field_name in arg_value) {
                            transform_arg[field_name] =
                              arg_value[ref_field_name];
                          } else {
                            return new Err(
                              new CustomError([errors.ErrUnexpected] as ErrMsg)
                            );
                          }
                        }
                        if (step.map.base.inject !== undefined) {
                          for (const field_name of Object.keys(
                            step.map.base.inject
                          )) {
                            const inject = step.map.base.inject[field_name];
                            switch (inject.type) {
                              case "input": {
                                const inject_arg_name: string = inject.value;
                                if (inject_arg_name in args) {
                                  const inject_arg = args[inject_arg_name];
                                  if (inject_arg.type === "list") {
                                    transform_arg[field_name] =
                                      inject_arg.value;
                                  } else {
                                    transform_arg[field_name] = inject_arg;
                                  }
                                } else {
                                  return new Err(
                                    new CustomError([
                                      errors.ErrUnexpected,
                                    ] as ErrMsg)
                                  );
                                }
                                break;
                              }
                              case "fx": {
                                const [inject_step_ref, inject_fx_output_name] =
                                  inject.value as [string, string];
                                if (inject_step_ref in step_outputs) {
                                  const inject_step_output: StepOutput =
                                    step_outputs[inject_step_ref];
                                  if (inject.type === inject_step_output.type) {
                                    if (
                                      inject_fx_output_name in
                                      inject_step_output.value
                                    ) {
                                      transform_arg[field_name] =
                                        inject_step_output.value[
                                          inject_fx_output_name
                                        ];
                                    } else {
                                      return new Err(
                                        new CustomError([
                                          errors.ErrUnexpected,
                                        ] as ErrMsg)
                                      );
                                    }
                                  } else {
                                    return new Err(
                                      new CustomError([
                                        errors.ErrUnexpected,
                                      ] as ErrMsg)
                                    );
                                  }
                                } else {
                                  return new Err(
                                    new CustomError([
                                      errors.ErrUnexpected,
                                    ] as ErrMsg)
                                  );
                                }
                                break;
                              }
                              case "compose": {
                                const [
                                  inject_step_ref,
                                  inject_compose_output_name,
                                ] = inject.value as [string, string];
                                if (inject_step_ref in step_outputs) {
                                  const inject_step_output: StepOutput =
                                    step_outputs[inject_step_ref];
                                  if (inject.type === inject_step_output.type) {
                                    if (
                                      inject_compose_output_name in
                                      inject_step_output.value
                                    ) {
                                      transform_arg[field_name] =
                                        inject_step_output.value[
                                          inject_compose_output_name
                                        ];
                                    } else {
                                      return new Err(
                                        new CustomError([
                                          errors.ErrUnexpected,
                                        ] as ErrMsg)
                                      );
                                    }
                                  } else {
                                    return new Err(
                                      new CustomError([
                                        errors.ErrUnexpected,
                                      ] as ErrMsg)
                                    );
                                  }
                                } else {
                                  return new Err(
                                    new CustomError([
                                      errors.ErrUnexpected,
                                    ] as ErrMsg)
                                  );
                                }
                                break;
                              }
                              case "transform": {
                                const inject_step_ref: string = inject.value;
                                if (inject_step_ref in step_outputs) {
                                  const inject_step_output: StepOutput =
                                    step_outputs[inject_step_ref];
                                  if (inject.type === inject_step_output.type) {
                                    transform_arg[field_name] =
                                      inject_step_output.value;
                                  } else {
                                    return new Err(
                                      new CustomError([
                                        errors.ErrUnexpected,
                                      ] as ErrMsg)
                                    );
                                  }
                                } else {
                                  return new Err(
                                    new CustomError([
                                      errors.ErrUnexpected,
                                    ] as ErrMsg)
                                  );
                                }
                                break;
                              }
                              default: {
                                const _exhaustiveCheck: never = inject;
                                return _exhaustiveCheck;
                              }
                            }
                          }
                        }
                        transform_base.push(transform_arg);
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
              const step_ref = step.map.base.value;
              if (step_ref in step_outputs) {
                const step_output: StepOutput = step_outputs[step_ref];
                if (step.map.base.type === step_output.type) {
                  for (const arg_value of step_output.value) {
                    const transform_arg:
                      | Record<string, StrongEnum>
                      | ComposeResult = {};
                    for (const field_name of Object.keys(step.map.base.map)) {
                      const ref_field_name: string =
                        step.map.base.map[field_name];
                      if (ref_field_name in arg_value) {
                        transform_arg[field_name] = arg_value[ref_field_name];
                      } else {
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                    }
                    if (step.map.base.inject !== undefined) {
                      for (const field_name of Object.keys(
                        step.map.base.inject
                      )) {
                        const inject = step.map.base.inject[field_name];
                        switch (inject.type) {
                          case "input": {
                            const inject_arg_name: string = inject.value;
                            if (inject_arg_name in args) {
                              const inject_arg = args[inject_arg_name];
                              if (inject_arg.type === "list") {
                                transform_arg[field_name] = inject_arg.value;
                              } else {
                                transform_arg[field_name] = inject_arg;
                              }
                            } else {
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                            break;
                          }
                          case "fx": {
                            const [inject_step_ref, inject_fx_output_name] =
                              inject.value as [string, string];
                            if (inject_step_ref in step_outputs) {
                              const inject_step_output: StepOutput =
                                step_outputs[inject_step_ref];
                              if (inject.type === inject_step_output.type) {
                                if (
                                  inject_fx_output_name in
                                  inject_step_output.value
                                ) {
                                  transform_arg[field_name] =
                                    inject_step_output.value[
                                      inject_fx_output_name
                                    ];
                                } else {
                                  return new Err(
                                    new CustomError([
                                      errors.ErrUnexpected,
                                    ] as ErrMsg)
                                  );
                                }
                              } else {
                                return new Err(
                                  new CustomError([
                                    errors.ErrUnexpected,
                                  ] as ErrMsg)
                                );
                              }
                            } else {
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                            break;
                          }
                          case "compose": {
                            const [
                              inject_step_ref,
                              inject_compose_output_name,
                            ] = inject.value as [string, string];
                            if (inject_step_ref in step_outputs) {
                              const inject_step_output: StepOutput =
                                step_outputs[inject_step_ref];
                              if (inject.type === inject_step_output.type) {
                                if (
                                  inject_compose_output_name in
                                  inject_step_output.value
                                ) {
                                  transform_arg[field_name] =
                                    inject_step_output.value[
                                      inject_compose_output_name
                                    ];
                                } else {
                                  return new Err(
                                    new CustomError([
                                      errors.ErrUnexpected,
                                    ] as ErrMsg)
                                  );
                                }
                              } else {
                                return new Err(
                                  new CustomError([
                                    errors.ErrUnexpected,
                                  ] as ErrMsg)
                                );
                              }
                            } else {
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                            break;
                          }
                          case "transform": {
                            const inject_step_ref: string = inject.value;
                            if (inject_step_ref in step_outputs) {
                              const inject_step_output: StepOutput =
                                step_outputs[inject_step_ref];
                              if (inject.type === inject_step_output.type) {
                                transform_arg[field_name] =
                                  inject_step_output.value;
                              } else {
                                return new Err(
                                  new CustomError([
                                    errors.ErrUnexpected,
                                  ] as ErrMsg)
                                );
                              }
                            } else {
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                            break;
                          }
                          default: {
                            const _exhaustiveCheck: never = inject;
                            return _exhaustiveCheck;
                          }
                        }
                      }
                    }
                    transform_base.push(transform_arg);
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
          if (transform.query !== undefined && step.map.query !== undefined) {
            for (const input_name of Object.keys(transform.query.map)) {
              const struct = get_struct(transform.query.struct as StructName);
              const result = get_path_with_type(
                struct,
                transform.query.map[input_name]
              );
              if (unwrap(result)) {
                const field_struct_name = result.value[1];
                if (input_name in step.map.query) {
                  const step_map = step.map.query[input_name];
                  switch (step_map.type) {
                    case "input": {
                      const arg_name: string = step_map.value;
                      if (arg_name in args) {
                        const arg = args[arg_name];
                        if (arg.type !== "other") {
                          if (arg.type === field_struct_name[0]) {
                            transform_query[input_name] = arrow(() => {
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
                            arg.type === field_struct_name[0] &&
                            arg.other === field_struct_name[1].name
                          ) {
                            transform_query[input_name] = {
                              type: field_struct_name[0],
                              other: field_struct_name[1].name,
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
                      }
                      break;
                    }
                    case "fx": {
                      const [step_ref, fx_output_name] = step_map.value as [
                        string,
                        string
                      ];
                      if (step_ref in step_outputs) {
                        const step_output: StepOutput = step_outputs[step_ref];
                        if (step_map.type === step_output.type) {
                          if (fx_output_name in step_output.value) {
                            const arg = step_output.value[fx_output_name];
                            if (arg.type !== "other") {
                              if (arg.type === field_struct_name[0]) {
                                transform_query[input_name] = arrow(() => {
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
                                arg.type === field_struct_name[0] &&
                                arg.other === field_struct_name[1].name
                              ) {
                                transform_query[input_name] = {
                                  type: field_struct_name[0],
                                  other: field_struct_name[1].name,
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
                      const [step_ref, compose_output_name] =
                        step_map.value as [string, string];
                      if (step_ref in step_outputs) {
                        const step_output: StepOutput = step_outputs[step_ref];
                        if (step_map.type === step_output.type) {
                          if (compose_output_name in step_output.value) {
                            const value =
                              step_output.value[compose_output_name];
                            if (!Array.isArray(value)) {
                              const arg: StrongEnum = value as StrongEnum;
                              if (arg.type !== "other") {
                                if (arg.type === field_struct_name[0]) {
                                  transform_query[input_name] = arrow(() => {
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
                                  arg.type === field_struct_name[0] &&
                                  arg.other === field_struct_name[1].name
                                ) {
                                  transform_query[input_name] = {
                                    type: field_struct_name[0],
                                    other: field_struct_name[1].name,
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
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
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
                }
              } else {
                return new Err(
                  new CustomError([errors.ErrUnexpected] as ErrMsg)
                );
              }
            }
          }
          // invoke transform
          const computed_output = await transform.exec(
            { base: transform_base, query: transform_query },
            level
          );
          if (unwrap(computed_output)) {
            if (step.name !== undefined) {
              step_outputs[step.name] = {
                type: step.type,
                value: computed_output.value,
              };
            }
            if (step.output !== undefined) {
              computed_outputs[step.output] = computed_output.value;
            }
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
    return new Ok(computed_outputs);
  }
}
