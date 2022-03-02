import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";
import { get_fx, get_struct, get_compose, StructName } from "../schema";
import { get_path_with_type } from "./commons";
import { ComposeArgs, ComposeResult } from "./compose";
import { FilterPath, get_variables, OrFilter } from "./db";
import { ErrMsg, errors } from "./errors";
import { FxArgs } from "./fx";
import { arrow, CustomError, Err, Ok, Result, unwrap } from "./prelude";
import {
  compare_paths,
  get_flattened_path,
  get_path_string,
  PathString,
  StrongEnum,
} from "./variable";

type TrandformQuery =
  | {
      struct: string;
      // query on basis of top level fields
      fields: ReadonlyArray<string>;
      map: Record<string, PathString>;
    }
  | undefined;

export type TransformArgs = {
  base: TransformResult;
  query: FxArgs;
};

export type TransformResult = ReadonlyArray<
  Record<string, StrongEnum> | ComposeResult
>;

export class Transform {
  name: string;
  type: "fx" | "compose";
  invoke: string;
  query: TrandformQuery;

  constructor(
    name: string,
    type: "fx" | "compose",
    invoke: string,
    query: TrandformQuery
  ) {
    this.name = name;
    this.type = type;
    this.invoke = invoke;
    this.query = query;
  }

  equals(other: Transform): boolean {
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
    args: TransformArgs,
    level: Decimal
  ): Promise<Result<TransformResult>> {
    const computed_outputs: Array<Record<string, StrongEnum> | ComposeResult> =
      [];
    switch (this.type) {
      case "fx": {
        const result = get_fx(this.invoke);
        if (unwrap(result)) {
          const fx = result.value;
          if (this.query !== undefined) {
            // use query to get fields, spread args fields except those provided via query
            // spread args fields must be proven ownership over
            const query = this.query;
            const struct = get_struct(query.struct as StructName);
            const filter_paths: Array<FilterPath> = [];
            // 1. construct filter paths
            for (const field_name of Object.keys(struct.fields)) {
              if (query.fields.includes(field_name)) {
                const field = struct.fields[field_name];
                if (field_name in args.query) {
                  const arg = args.query[field_name];
                  if (arg.type !== "other") {
                    if (arg.type === field.type) {
                      filter_paths.push(
                        arrow(() => {
                          switch (arg.type) {
                            case "str":
                            case "lstr":
                            case "clob": {
                              return new FilterPath(
                                field_name,
                                [[], field_name],
                                [arg.type, ["==", arg.value]],
                                undefined
                              );
                            }
                            case "i32":
                            case "u32":
                            case "i64":
                            case "u64": {
                              return new FilterPath(
                                field_name,
                                [[], field_name],
                                [arg.type, ["==", arg.value]],
                                undefined
                              );
                            }
                            case "idouble":
                            case "udouble":
                            case "idecimal":
                            case "udecimal": {
                              return new FilterPath(
                                field_name,
                                [[], field_name],
                                [arg.type, ["==", arg.value]],
                                undefined
                              );
                            }
                            case "bool": {
                              return new FilterPath(
                                field_name,
                                [[], field_name],
                                [arg.type, ["==", arg.value]],
                                undefined
                              );
                            }
                            case "date":
                            case "time":
                            case "timestamp": {
                              return new FilterPath(
                                field_name,
                                [[], field_name],
                                [arg.type, ["==", arg.value]],
                                undefined
                              );
                            }
                            default: {
                              const _exhaustiveCheck: never = arg;
                              return _exhaustiveCheck;
                            }
                          }
                        })
                      );
                    } else {
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  } else {
                    if (arg.type === field.type && arg.other === field.other) {
                      const other_struct = get_struct(
                        field.other as StructName
                      );
                      filter_paths.push(
                        new FilterPath(
                          field_name,
                          [[], field_name],
                          [arg.type, ["==", arg.value], other_struct],
                          undefined
                        )
                      );
                    } else {
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  }
                } else {
                  if (field.default !== undefined) {
                    switch (field.type) {
                      case "str":
                      case "lstr":
                      case "clob": {
                        filter_paths.push(
                          new FilterPath(
                            field_name,
                            [[], field_name],
                            [field.type, ["==", field.default]],
                            undefined
                          )
                        );
                        break;
                      }
                      case "i32":
                      case "u32":
                      case "i64":
                      case "u64": {
                        filter_paths.push(
                          new FilterPath(
                            field_name,
                            [[], field_name],
                            [field.type, ["==", field.default]],
                            undefined
                          )
                        );
                        break;
                      }
                      case "idouble":
                      case "udouble":
                      case "idecimal":
                      case "udecimal": {
                        filter_paths.push(
                          new FilterPath(
                            field_name,
                            [[], field_name],
                            [field.type, ["==", field.default]],
                            undefined
                          )
                        );
                        break;
                      }
                      case "bool": {
                        filter_paths.push(
                          new FilterPath(
                            field_name,
                            [[], field_name],
                            [field.type, ["==", field.default]],
                            undefined
                          )
                        );
                        break;
                      }
                      case "date":
                      case "time":
                      case "timestamp": {
                        filter_paths.push(
                          new FilterPath(
                            field_name,
                            [[], field_name],
                            [field.type, ["==", field.default]],
                            undefined
                          )
                        );
                        break;
                      }
                      case "other": {
                        field.other;
                        const other_struct = get_struct(
                          field.other as StructName
                        );
                        filter_paths.push(
                          new FilterPath(
                            field_name,
                            [[], field_name],
                            [field.type, ["==", field.default], other_struct],
                            undefined
                          )
                        );
                        break;
                      }
                      default: {
                        const _exhaustiveCheck: never = field;
                        return _exhaustiveCheck;
                      }
                    }
                  } else {
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                }
              }
            }
            // 2. get paths used in map that were not in filtering
            for (const name of Object.keys(query.map)) {
              const path = query.map[name];
              let check = true;
              for (const filter_path of filter_paths) {
                if (compare_paths(filter_path.path, path)) {
                  check = false;
                  break;
                }
              }
              if (check) {
                const result = get_path_with_type(struct, path);
                if (unwrap(result)) {
                  const field_struct_name = result.value[1];
                  if (field_struct_name[0] !== "other") {
                    filter_paths.push(
                      new FilterPath(
                        get_flattened_path(path).join("."),
                        path,
                        [field_struct_name[0], undefined],
                        undefined
                      )
                    );
                  } else {
                    filter_paths.push(
                      new FilterPath(
                        get_flattened_path(path).join("."),
                        path,
                        [field_struct_name[0], undefined, field_struct_name[1]],
                        undefined
                      )
                    );
                  }
                } else {
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
            }
            // 3. query db
            const variables = await get_variables(
              struct,
              level,
              new OrFilter(
                0,
                [false, undefined],
                [false, undefined],
                [false, undefined],
                HashSet.ofIterable(filter_paths)
              ),
              HashSet.of(),
              new Decimal(10000),
              new Decimal(0),
              []
            );
            if (unwrap(variables)) {
              // 4. construct args and invoke fx
              for (const [index, variable] of variables.value.entries()) {
                const fx_args: FxArgs = {};
                for (const input_name of Object.keys(fx.inputs)) {
                  const input = fx.inputs[input_name];
                  if (input_name in query.map) {
                    const path = variable.paths.findAny((x) =>
                      compare_paths(get_path_string(x), query.map[input_name])
                    );
                    if (path.isSome()) {
                      const value = path.get().path[1][1];
                      if (value.type !== "other") {
                        if (value.type === input.type) {
                          fx_args[input_name] = value;
                        } else {
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                      } else {
                        if (
                          value.type === input.type &&
                          value.other === input.other
                        ) {
                          fx_args[input_name] = {
                            ...value,
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
                  } else if (args.base.length !== 0) {
                    if (
                      index < args.base.length &&
                      input_name in args.base[index]
                    ) {
                      if (!Array.isArray(args.base[index][input_name])) {
                        const value = args.base[index][
                          input_name
                        ] as StrongEnum;
                        if (value.type !== "other") {
                          fx_args[input_name] = value;
                        } else {
                          fx_args[input_name] = {
                            ...value,
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
                    // fields with same value can be mentioned in last arg only
                    else if (input_name in args.base[args.base.length - 1]) {
                      if (
                        !Array.isArray(args.base[index][args.base.length - 1])
                      ) {
                        const value = args.base[index][
                          args.base.length - 1
                        ] as StrongEnum;
                        if (value.type !== "other") {
                          fx_args[input_name] = value;
                        } else {
                          fx_args[input_name] = {
                            ...value,
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
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  } else if (input.default !== undefined) {
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
                  const computed_output = await fx.exec(fx_args, level);
                  if (unwrap(computed_output)) {
                    computed_outputs.push(computed_output.value);
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
            // use args.base
            for (const [index, arg] of args.base.entries()) {
              for (const input_name of Object.keys(fx.inputs)) {
                const fx_args: FxArgs = {};
                const input = fx.inputs[input_name];
                if (input_name in arg) {
                  if (!Array.isArray(arg[input_name])) {
                    const value = arg[input_name] as StrongEnum;
                    if (value.type !== "other") {
                      if (value.type === input.type) {
                        fx_args[input_name] = value;
                      } else {
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                    } else {
                      if (
                        value.type === input.type &&
                        value.other === input.other
                      ) {
                        fx_args[input_name] = {
                          ...value,
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
                } else if (
                  index < args.base.length &&
                  input_name in args.base[index]
                ) {
                  if (!Array.isArray(args.base[index][input_name])) {
                    const value = args.base[index][input_name] as StrongEnum;
                    if (value.type !== "other") {
                      fx_args[input_name] = value;
                    } else {
                      fx_args[input_name] = {
                        ...value,
                        user_paths: [],
                        borrows: [],
                      };
                    }
                  } else {
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                } else if (input.default !== undefined) {
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
                const computed_output = await fx.exec(fx_args, level);
                if (unwrap(computed_output)) {
                  computed_outputs.push(computed_output.value);
                } else {
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
            }
          }
        } else {
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
        break;
      }
      case "compose": {
        const result = get_compose(this.invoke);
        if (unwrap(result)) {
          const compose = result.value;
          if (this.query !== undefined) {
            // use query to get fields, spread args fields except those provided via query
            // spread args fields must be proven ownership over
            const query = this.query;
            const struct = get_struct(query.struct as StructName);
            const filter_paths: Array<FilterPath> = [];
            // 1. construct filter paths
            for (const field_name of Object.keys(struct.fields)) {
              if (query.fields.includes(field_name)) {
                const field = struct.fields[field_name];
                if (field_name in args.query) {
                  const arg = args.query[field_name];
                  if (arg.type !== "other") {
                    if (arg.type === field.type) {
                      filter_paths.push(
                        arrow(() => {
                          switch (arg.type) {
                            case "str":
                            case "lstr":
                            case "clob": {
                              return new FilterPath(
                                field_name,
                                [[], field_name],
                                [arg.type, ["==", arg.value]],
                                undefined
                              );
                            }
                            case "i32":
                            case "u32":
                            case "i64":
                            case "u64": {
                              return new FilterPath(
                                field_name,
                                [[], field_name],
                                [arg.type, ["==", arg.value]],
                                undefined
                              );
                            }
                            case "idouble":
                            case "udouble":
                            case "idecimal":
                            case "udecimal": {
                              return new FilterPath(
                                field_name,
                                [[], field_name],
                                [arg.type, ["==", arg.value]],
                                undefined
                              );
                            }
                            case "bool": {
                              return new FilterPath(
                                field_name,
                                [[], field_name],
                                [arg.type, ["==", arg.value]],
                                undefined
                              );
                            }
                            case "date":
                            case "time":
                            case "timestamp": {
                              return new FilterPath(
                                field_name,
                                [[], field_name],
                                [arg.type, ["==", arg.value]],
                                undefined
                              );
                            }
                            default: {
                              const _exhaustiveCheck: never = arg;
                              return _exhaustiveCheck;
                            }
                          }
                        })
                      );
                    } else {
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  } else {
                    if (arg.type === field.type && arg.other === field.other) {
                      const other_struct = get_struct(
                        field.other as StructName
                      );
                      filter_paths.push(
                        new FilterPath(
                          field_name,
                          [[], field_name],
                          [arg.type, ["==", arg.value], other_struct],
                          undefined
                        )
                      );
                    } else {
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  }
                } else {
                  if (field.default !== undefined) {
                    switch (field.type) {
                      case "str":
                      case "lstr":
                      case "clob": {
                        filter_paths.push(
                          new FilterPath(
                            field_name,
                            [[], field_name],
                            [field.type, ["==", field.default]],
                            undefined
                          )
                        );
                        break;
                      }
                      case "i32":
                      case "u32":
                      case "i64":
                      case "u64": {
                        filter_paths.push(
                          new FilterPath(
                            field_name,
                            [[], field_name],
                            [field.type, ["==", field.default]],
                            undefined
                          )
                        );
                        break;
                      }
                      case "idouble":
                      case "udouble":
                      case "idecimal":
                      case "udecimal": {
                        filter_paths.push(
                          new FilterPath(
                            field_name,
                            [[], field_name],
                            [field.type, ["==", field.default]],
                            undefined
                          )
                        );
                        break;
                      }
                      case "bool": {
                        filter_paths.push(
                          new FilterPath(
                            field_name,
                            [[], field_name],
                            [field.type, ["==", field.default]],
                            undefined
                          )
                        );
                        break;
                      }
                      case "date":
                      case "time":
                      case "timestamp": {
                        filter_paths.push(
                          new FilterPath(
                            field_name,
                            [[], field_name],
                            [field.type, ["==", field.default]],
                            undefined
                          )
                        );
                        break;
                      }
                      case "other": {
                        field.other;
                        const other_struct = get_struct(
                          field.other as StructName
                        );
                        filter_paths.push(
                          new FilterPath(
                            field_name,
                            [[], field_name],
                            [field.type, ["==", field.default], other_struct],
                            undefined
                          )
                        );
                        break;
                      }
                      default: {
                        const _exhaustiveCheck: never = field;
                        return _exhaustiveCheck;
                      }
                    }
                  } else {
                    return new Err(
                      new CustomError([errors.ErrUnexpected] as ErrMsg)
                    );
                  }
                }
              }
            }
            // 2. get paths used in map that were not in filtering
            for (const name of Object.keys(query.map)) {
              const path = query.map[name];
              let check = true;
              for (const filter_path of filter_paths) {
                if (compare_paths(filter_path.path, path)) {
                  check = false;
                  break;
                }
              }
              if (check) {
                const result = get_path_with_type(struct, path);
                if (unwrap(result)) {
                  const field_struct_name = result.value[1];
                  if (field_struct_name[0] !== "other") {
                    filter_paths.push(
                      new FilterPath(
                        get_flattened_path(path).join("."),
                        path,
                        [field_struct_name[0], undefined],
                        undefined
                      )
                    );
                  } else {
                    filter_paths.push(
                      new FilterPath(
                        get_flattened_path(path).join("."),
                        path,
                        [field_struct_name[0], undefined, field_struct_name[1]],
                        undefined
                      )
                    );
                  }
                } else {
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
            }
            // 3. query db
            const variables = await get_variables(
              struct,
              level,
              new OrFilter(
                0,
                [false, undefined],
                [false, undefined],
                [false, undefined],
                HashSet.ofIterable(filter_paths)
              ),
              HashSet.of(),
              new Decimal(10000),
              new Decimal(0),
              []
            );
            if (unwrap(variables)) {
              // 4. construct args and invoke compose
              for (const [index, variable] of variables.value.entries()) {
                const compose_args: ComposeArgs = {};
                for (const input_name of Object.keys(compose.inputs)) {
                  const input = compose.inputs[input_name];
                  if (input_name in query.map) {
                    const path = variable.paths.findAny((x) =>
                      compare_paths(get_path_string(x), query.map[input_name])
                    );
                    if (path.isSome()) {
                      const value = path.get().path[1][1];
                      if (value.type !== "other") {
                        if (value.type === input.type) {
                          compose_args[input_name] = value;
                        } else {
                          return new Err(
                            new CustomError([errors.ErrUnexpected] as ErrMsg)
                          );
                        }
                      } else {
                        if (
                          value.type === input.type &&
                          value.other === input.other
                        ) {
                          compose_args[input_name] = {
                            ...value,
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
                  } else if (args.base.length !== 0) {
                    if (
                      index < args.base.length &&
                      input_name in args.base[index]
                    ) {
                      if (!Array.isArray(args.base[index][input_name])) {
                        const value = args.base[index][
                          input_name
                        ] as StrongEnum;
                        if (value.type !== "other") {
                          compose_args[input_name] = value;
                        } else {
                          compose_args[input_name] = {
                            ...value,
                            user_paths: [],
                            borrows: [],
                          };
                        }
                      } else {
                        const value = args.base[index][
                          input_name
                        ] as TransformResult;
                        compose_args[input_name] = {
                          type: "list",
                          value: value,
                        };
                      }
                    }
                    // fields with same value can be mentioned in last arg only
                    else if (input_name in args.base[args.base.length - 1]) {
                      if (
                        !Array.isArray(args.base[index][args.base.length - 1])
                      ) {
                        const value = args.base[index][
                          args.base.length - 1
                        ] as StrongEnum;
                        if (value.type !== "other") {
                          compose_args[input_name] = value;
                        } else {
                          compose_args[input_name] = {
                            ...value,
                            user_paths: [],
                            borrows: [],
                          };
                        }
                      } else {
                        const value = args.base[index][
                          args.base.length - 1
                        ] as TransformResult;
                        compose_args[input_name] = {
                          type: "list",
                          value: value,
                        };
                      }
                    } else {
                      return new Err(
                        new CustomError([errors.ErrUnexpected] as ErrMsg)
                      );
                    }
                  } else {
                    if (input.type === "list") {
                      compose_args[input_name] = { type: "list", value: [] };
                    } else {
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
                    }
                  }
                  const computed_output = await compose.exec(
                    compose_args,
                    level
                  );
                  if (unwrap(computed_output)) {
                    computed_outputs.push(computed_output.value);
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
            // use args.base
            for (const [index, arg] of args.base.entries()) {
              for (const input_name of Object.keys(compose.inputs)) {
                const compose_args: ComposeArgs = {};
                const input = compose.inputs[input_name];
                if (input_name in arg) {
                  if (!Array.isArray(arg[input_name])) {
                    const value = arg[input_name] as StrongEnum;
                    if (value.type !== "other") {
                      if (value.type === input.type) {
                        compose_args[input_name] = value;
                      } else {
                        return new Err(
                          new CustomError([errors.ErrUnexpected] as ErrMsg)
                        );
                      }
                    } else {
                      if (
                        value.type === input.type &&
                        value.other === input.other
                      ) {
                        compose_args[input_name] = {
                          ...value,
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
                    const value = arg[input_name] as TransformResult;
                    compose_args[input_name] = {
                      type: "list",
                      value: value,
                    };
                  }
                } else if (
                  index < args.base.length &&
                  input_name in args.base[index]
                ) {
                  if (!Array.isArray(args.base[index][input_name])) {
                    const value = args.base[index][input_name] as StrongEnum;
                    if (value.type !== "other") {
                      compose_args[input_name] = value;
                    } else {
                      compose_args[input_name] = {
                        ...value,
                        user_paths: [],
                        borrows: [],
                      };
                    }
                  } else {
                    const value = args.base[index][
                      input_name
                    ] as TransformResult;
                    compose_args[input_name] = {
                      type: "list",
                      value: value,
                    };
                  }
                } else {
                  if (input.type === "list") {
                    compose_args[input_name] = { type: "list", value: [] };
                  } else {
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
                  }
                }
                const computed_output = await compose.exec(compose_args, level);
                if (unwrap(computed_output)) {
                  computed_outputs.push(computed_output.value);
                } else {
                  return new Err(
                    new CustomError([errors.ErrUnexpected] as ErrMsg)
                  );
                }
              }
            }
          }
        } else {
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
        break;
      }
      default: {
        const _exhaustiveCheck: never = this.type;
        return _exhaustiveCheck;
      }
    }
    return new Ok(computed_outputs);
  }
}
