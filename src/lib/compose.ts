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

export type ComposeArgs = Record<
  string,
  | StrongEnum
  | {
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
        base?:
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
    user_invocable: boolean = false
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
    console.log("[COMPOSE]", this.name);
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
              console.log("COMPOSE", 1);
              return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
            }
          } else {
            console.log("COMPOSE", 2);
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        } else {
          console.log("COMPOSE", 3);
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
                console.log("COMPOSE", 4);
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
                  console.log("COMPOSE", 5);
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
                  console.log("COMPOSE", 6);
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
                console.log("COMPOSE", 7);
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
      console.log("COMPOSE", 8);
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
          console.log("COMPOSE", 9);
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      } else {
        console.log("COMPOSE", 10);
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
        const result = get_fx(step.invoke, false);
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
                        console.log("COMPOSE", 11);
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
                        };
                      } else {
                        console.log("COMPOSE", 12);
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
                        };
                      }
                    } else {
                      console.log("COMPOSE", 13);
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
                            console.log("COMPOSE", 14);
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
                            };
                          } else {
                            console.log("COMPOSE", 15);
                            return new Err(
                              new CustomError([errors.ErrUnexpected] as ErrMsg)
                            );
                          }
                        }
                      } else {
                        console.log("COMPOSE", 16);
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                    } else {
                      console.log("COMPOSE", 17);
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  } else {
                    console.log("COMPOSE", 18);
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
                              console.log("COMPOSE", 19);
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
                              };
                            } else {
                              console.log("COMPOSE", 20);
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                          }
                        } else {
                          console.log("COMPOSE", 21);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                      } else {
                        console.log("COMPOSE", 22);
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                    } else {
                      console.log("COMPOSE", 23);
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  } else {
                    console.log("COMPOSE", 24);
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
              console.log("COMPOSE", 25);
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
                  console.log("COMPOSE", 26);
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
            }
          } else {
            console.log("COMPOSE", 27);
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        } else {
          console.log("COMPOSE", 28);
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
        break;
      }
      case "compose": {
        const result = get_compose(step.invoke as ComposeName, false);
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
                      console.log("COMPOSE", 29);
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
                      };
                    } else {
                      console.log("COMPOSE", 30);
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
                        };
                      }
                    } else {
                      console.log("COMPOSE", 31);
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
                          console.log("COMPOSE", 32);
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
                          };
                        } else {
                          console.log("COMPOSE", 33);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                      }
                    } else {
                      console.log("COMPOSE", 34);
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  } else {
                    console.log("COMPOSE", 35);
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                } else {
                  console.log("COMPOSE", 36);
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
                            console.log("COMPOSE", 37);
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
                            };
                          } else {
                            console.log("COMPOSE", 38);
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
                                fx_args[field_name] = arg[field_name];
                              }
                              it.push(fx_args);
                            }
                            return it;
                          }),
                        };
                      }
                    } else {
                      console.log("COMPOSE", 39);
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  } else {
                    console.log("COMPOSE", 40);
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                } else {
                  console.log("COMPOSE", 41);
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
                    console.log("COMPOSE", 42);
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                } else {
                  console.log("COMPOSE", 43);
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
                  console.log("COMPOSE", 44);
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
            }
          } else {
            console.log("COMPOSE", 45);
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        } else {
          console.log("COMPOSE", 46);
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
        break;
      }
      case "transform": {
        const result = get_transform(step.invoke, false);
        if (unwrap(result)) {
          const transform = result.value;
          const transform_base: Array<
            Record<string, StrongEnum> | ComposeResult
          > = [];
          if (step.map.base !== undefined) {
            switch (step.map.base.type) {
              case "inject": {
                const transform_arg:
                  | Record<string, StrongEnum>
                  | ComposeResult = {};
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
                        console.log("COMPOSE", 47);
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
                          if (
                            inject_fx_output_name in inject_step_output.value
                          ) {
                            transform_arg[field_name] =
                              inject_step_output.value[inject_fx_output_name];
                          } else {
                            console.log("COMPOSE", 48);
                            return new Err(
                              new CustomError([errors.ErrUnexpected] as ErrMsg)
                            );
                          }
                        } else {
                          console.log("COMPOSE", 49);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                      } else {
                        console.log("COMPOSE", 50);
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
                            inject_compose_output_name in
                            inject_step_output.value
                          ) {
                            transform_arg[field_name] =
                              inject_step_output.value[
                                inject_compose_output_name
                              ];
                          } else {
                            console.log("COMPOSE", 51);
                            return new Err(
                              new CustomError([errors.ErrUnexpected] as ErrMsg)
                            );
                          }
                        } else {
                          console.log("COMPOSE", 52);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                      } else {
                        console.log("COMPOSE", 53);
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
                          console.log("COMPOSE", 54);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                      } else {
                        console.log("COMPOSE", 55);
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
                                console.log("COMPOSE", 56);
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
                                    console.log("COMPOSE", 57);
                                    return new Err(
                                      new CustomError([
                                        errors.ErrUnexpected,
                                      ] as ErrMsg)
                                    );
                                  }
                                } else {
                                  console.log("COMPOSE", 58);
                                  return new Err(
                                    new CustomError([
                                      errors.ErrUnexpected,
                                    ] as ErrMsg)
                                  );
                                }
                              } else {
                                console.log("COMPOSE", 59);
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
                                    console.log("COMPOSE", 60);
                                    return new Err(
                                      new CustomError([
                                        errors.ErrUnexpected,
                                      ] as ErrMsg)
                                    );
                                  }
                                } else {
                                  console.log("COMPOSE", 61);
                                  return new Err(
                                    new CustomError([
                                      errors.ErrUnexpected,
                                    ] as ErrMsg)
                                  );
                                }
                              } else {
                                console.log("COMPOSE", 62);
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
                                  console.log("COMPOSE", 63);
                                  return new Err(
                                    new CustomError([
                                      errors.ErrUnexpected,
                                    ] as ErrMsg)
                                  );
                                }
                              } else {
                                console.log("COMPOSE", 64);
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
                    console.log("COMPOSE", 65);
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
                              console.log("COMPOSE", 66);
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
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
                                    console.log("COMPOSE", 67);
                                    return new Err(
                                      new CustomError([
                                        errors.ErrUnexpected,
                                      ] as ErrMsg)
                                    );
                                  }
                                  break;
                                }
                                case "fx": {
                                  const [
                                    inject_step_ref,
                                    inject_fx_output_name,
                                  ] = inject.value as [string, string];
                                  if (inject_step_ref in step_outputs) {
                                    const inject_step_output: StepOutput =
                                      step_outputs[inject_step_ref];
                                    if (
                                      inject.type === inject_step_output.type
                                    ) {
                                      if (
                                        inject_fx_output_name in
                                        inject_step_output.value
                                      ) {
                                        transform_arg[field_name] =
                                          inject_step_output.value[
                                            inject_fx_output_name
                                          ];
                                      } else {
                                        console.log("COMPOSE", 68);
                                        return new Err(
                                          new CustomError([
                                            errors.ErrUnexpected,
                                          ] as ErrMsg)
                                        );
                                      }
                                    } else {
                                      console.log("COMPOSE", 69);
                                      return new Err(
                                        new CustomError([
                                          errors.ErrUnexpected,
                                        ] as ErrMsg)
                                      );
                                    }
                                  } else {
                                    console.log("COMPOSE", 70);
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
                                    if (
                                      inject.type === inject_step_output.type
                                    ) {
                                      if (
                                        inject_compose_output_name in
                                        inject_step_output.value
                                      ) {
                                        transform_arg[field_name] =
                                          inject_step_output.value[
                                            inject_compose_output_name
                                          ];
                                      } else {
                                        console.log("COMPOSE", 71);
                                        return new Err(
                                          new CustomError([
                                            errors.ErrUnexpected,
                                          ] as ErrMsg)
                                        );
                                      }
                                    } else {
                                      console.log("COMPOSE", 72);
                                      return new Err(
                                        new CustomError([
                                          errors.ErrUnexpected,
                                        ] as ErrMsg)
                                      );
                                    }
                                  } else {
                                    console.log("COMPOSE", 73);
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
                                    if (
                                      inject.type === inject_step_output.type
                                    ) {
                                      transform_arg[field_name] =
                                        inject_step_output.value;
                                    } else {
                                      console.log("COMPOSE", 74);
                                      return new Err(
                                        new CustomError([
                                          errors.ErrUnexpected,
                                        ] as ErrMsg)
                                      );
                                    }
                                  } else {
                                    console.log("COMPOSE", 75);
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
                        console.log("COMPOSE", 76);
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                    } else {
                      console.log("COMPOSE", 77);
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  } else {
                    console.log("COMPOSE", 78);
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                } else {
                  console.log("COMPOSE", 79);
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
                          console.log("COMPOSE", 80);
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
                                console.log("COMPOSE", 81);
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
                                    console.log("COMPOSE", 82);
                                    return new Err(
                                      new CustomError([
                                        errors.ErrUnexpected,
                                      ] as ErrMsg)
                                    );
                                  }
                                } else {
                                  console.log("COMPOSE", 83);
                                  return new Err(
                                    new CustomError([
                                      errors.ErrUnexpected,
                                    ] as ErrMsg)
                                  );
                                }
                              } else {
                                console.log("COMPOSE", 84);
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
                                    console.log("COMPOSE", 85);
                                    return new Err(
                                      new CustomError([
                                        errors.ErrUnexpected,
                                      ] as ErrMsg)
                                    );
                                  }
                                } else {
                                  console.log("COMPOSE", 86);
                                  return new Err(
                                    new CustomError([
                                      errors.ErrUnexpected,
                                    ] as ErrMsg)
                                  );
                                }
                              } else {
                                console.log("COMPOSE", 87);
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
                                  console.log("COMPOSE", 88);
                                  return new Err(
                                    new CustomError([
                                      errors.ErrUnexpected,
                                    ] as ErrMsg)
                                  );
                                }
                              } else {
                                console.log("COMPOSE", 89);
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
                    console.log("COMPOSE", 90);
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                } else {
                  console.log("COMPOSE", 91);
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
                            console.log("COMPOSE", 92);
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
                            };
                          } else {
                            console.log("COMPOSE", 93);
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
                                console.log("COMPOSE", 94);
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
                                };
                              } else {
                                console.log("COMPOSE", 95);
                                return new Err(
                                  new CustomError([
                                    errors.ErrUnexpected,
                                  ] as ErrMsg)
                                );
                              }
                            }
                          } else {
                            console.log("COMPOSE", 96);
                            return new Err(
                              new CustomError([errors.ErrUnexpected] as ErrMsg)
                            );
                          }
                        } else {
                          console.log("COMPOSE", 97);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                      } else {
                        console.log("COMPOSE", 98);
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
                                  console.log("COMPOSE", 99);
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
                                  };
                                } else {
                                  console.log("COMPOSE", 100);
                                  return new Err(
                                    new CustomError([
                                      errors.ErrUnexpected,
                                    ] as ErrMsg)
                                  );
                                }
                              }
                            } else {
                              console.log("COMPOSE", 101);
                              return new Err(
                                new CustomError([
                                  errors.ErrUnexpected,
                                ] as ErrMsg)
                              );
                            }
                          } else {
                            console.log("COMPOSE", 102);
                            return new Err(
                              new CustomError([errors.ErrUnexpected] as ErrMsg)
                            );
                          }
                        } else {
                          console.log("COMPOSE", 103);
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                      } else {
                        console.log("COMPOSE", 104);
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
                console.log("COMPOSE", 105);
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
            console.log("COMPOSE", 106);
            return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
          }
        } else {
          console.log("COMPOSE", 107);
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
        break;
      }
      default: {
        const _exhaustiveCheck: never = step;
        return _exhaustiveCheck;
      }
    }
    console.log("[STEP]", step.name ? step.name : "");
    return new Ok(computed_outputs);
  }
}
