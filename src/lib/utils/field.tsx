import React from "react";
import { Text } from "native-base";
import { apply, unwrap, Result, arrow, fold } from "./prelude";
import { Action, State, get_path, get_label } from "./commons";
import { PathString, Struct } from "./variable";
import { theme } from "./theme";
import { FieldOptions, field_variants } from "./field_variants";

export function Label(props: {
  state: State;
  path: PathString | string;
}): JSX.Element {
  const label = get_label(props.state, props.path);
  if (label !== "") {
    return <Text color={theme.placeholder}>{label}</Text>;
  }
  return <></>;
}

export function Check(props: {
  state: State;
  name: string;
  message: string;
}): JSX.Element {
  const { state } = props;
  if (props.name in state.checks) {
    const result = state.checks[props.name] as Result<boolean>;
    if (unwrap(result)) {
      if (!result.value) {
        return (
          <Text fontSize={"xs"} color={"lightBlue.600"}>
            * {props.message}
          </Text>
        );
      }
    }
  }
  return <></>;
}

export function Field(props: {
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
  path: PathString | string;
  mode?: "read";
  placeholder?: string;
  checks?: ReadonlyArray<string>;
  options?: FieldOptions;
  variant?: string;
}): JSX.Element {
  const path_string: PathString = arrow(() => {
    if (typeof props.path === "string") {
      return [[], props.path];
    } else {
      return props.path;
    }
  });
  const placeholder = props.placeholder
    ? props.placeholder
    : get_label(props.state, path_string);
  const check_validation = fold(
    true,
    (props.checks ? props.checks : []).map((x) => {
      if (x in props.state.checks) {
        const result = props.state.checks[x] as Result<boolean>;
        if (unwrap(result)) {
          return result.value;
        }
      }
      return true;
    }),
    (acc, val) => acc && val
  );
  return apply(get_path(props.state, path_string), (path) => {
    if (unwrap(path)) {
      const field_struct_name = path.value.path[1][1].type;
      switch (field_struct_name) {
        case "str": {
          const Variant = arrow(() => {
            if (props.variant !== undefined) {
              if (props.variant in field_variants[field_struct_name][1]) {
                return field_variants[field_struct_name][1][props.variant];
              }
            }
            return field_variants[field_struct_name][0];
          });
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "str"
          ) {
            return (
              <Variant
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                placeholder={placeholder}
                violates_checks={!check_validation}
                {...props.options[1]}
              />
            );
          }
          return (
            <Variant
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
              placeholder={placeholder}
              violates_checks={!check_validation}
            />
          );
        }
        case "lstr": {
          const Variant = arrow(() => {
            if (props.variant !== undefined) {
              if (props.variant in field_variants[field_struct_name][1]) {
                return field_variants[field_struct_name][1][props.variant];
              }
            }
            return field_variants[field_struct_name][0];
          });
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "lstr"
          ) {
            return (
              <Variant
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                placeholder={placeholder}
                violates_checks={!check_validation}
                {...props.options[1]}
              />
            );
          }
          return (
            <Variant
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
              placeholder={placeholder}
              violates_checks={!check_validation}
            />
          );
        }
        case "clob": {
          const Variant = arrow(() => {
            if (props.variant !== undefined) {
              if (props.variant in field_variants[field_struct_name][1]) {
                return field_variants[field_struct_name][1][props.variant];
              }
            }
            return field_variants[field_struct_name][0];
          });
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "clob"
          ) {
            return (
              <Variant
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                placeholder={placeholder}
                violates_checks={!check_validation}
                {...props.options[1]}
              />
            );
          }
          return (
            <Variant
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              placeholder={placeholder}
              violates_checks={!check_validation}
              path={path.value}
            />
          );
        }
        case "u32": {
          const Variant = arrow(() => {
            if (props.variant !== undefined) {
              if (props.variant in field_variants[field_struct_name][1]) {
                return field_variants[field_struct_name][1][props.variant];
              }
            }
            return field_variants[field_struct_name][0];
          });
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "u32"
          ) {
            return (
              <Variant
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                placeholder={placeholder}
                violates_checks={!check_validation}
                {...props.options[1]}
              />
            );
          }
          return (
            <Variant
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
              placeholder={placeholder}
              violates_checks={!check_validation}
            />
          );
        }
        case "i32": {
          const Variant = arrow(() => {
            if (props.variant !== undefined) {
              if (props.variant in field_variants[field_struct_name][1]) {
                return field_variants[field_struct_name][1][props.variant];
              }
            }
            return field_variants[field_struct_name][0];
          });
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "i32"
          ) {
            return (
              <Variant
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                placeholder={placeholder}
                violates_checks={!check_validation}
                {...props.options[1]}
              />
            );
          }
          return (
            <Variant
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
              placeholder={placeholder}
              violates_checks={!check_validation}
            />
          );
        }
        case "u64": {
          const Variant = arrow(() => {
            if (props.variant !== undefined) {
              if (props.variant in field_variants[field_struct_name][1]) {
                return field_variants[field_struct_name][1][props.variant];
              }
            }
            return field_variants[field_struct_name][0];
          });
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "u64"
          ) {
            return (
              <Variant
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                placeholder={placeholder}
                violates_checks={!check_validation}
                {...props.options[1]}
              />
            );
          }
          return (
            <Variant
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              placeholder={placeholder}
              violates_checks={!check_validation}
              path={path.value}
            />
          );
        }
        case "i64": {
          const Variant = arrow(() => {
            if (props.variant !== undefined) {
              if (props.variant in field_variants[field_struct_name][1]) {
                return field_variants[field_struct_name][1][props.variant];
              }
            }
            return field_variants[field_struct_name][0];
          });
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "i64"
          ) {
            return (
              <Variant
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                placeholder={placeholder}
                violates_checks={!check_validation}
                {...props.options[1]}
              />
            );
          }
          return (
            <Variant
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
              placeholder={placeholder}
              violates_checks={!check_validation}
            />
          );
        }
        case "udouble": {
          const Variant = arrow(() => {
            if (props.variant !== undefined) {
              if (props.variant in field_variants[field_struct_name][1]) {
                return field_variants[field_struct_name][1][props.variant];
              }
            }
            return field_variants[field_struct_name][0];
          });
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "udouble"
          ) {
            return (
              <Variant
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                placeholder={placeholder}
                violates_checks={!check_validation}
                {...props.options[1]}
              />
            );
          }
          return (
            <Variant
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
              placeholder={placeholder}
              violates_checks={!check_validation}
            />
          );
        }
        case "idouble": {
          const Variant = arrow(() => {
            if (props.variant !== undefined) {
              if (props.variant in field_variants[field_struct_name][1]) {
                return field_variants[field_struct_name][1][props.variant];
              }
            }
            return field_variants[field_struct_name][0];
          });
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "idouble"
          ) {
            return (
              <Variant
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                placeholder={placeholder}
                violates_checks={!check_validation}
                {...props.options[1]}
              />
            );
          }
          return (
            <Variant
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
              placeholder={placeholder}
              violates_checks={!check_validation}
            />
          );
        }
        case "udecimal": {
          const Variant = arrow(() => {
            if (props.variant !== undefined) {
              if (props.variant in field_variants[field_struct_name][1]) {
                return field_variants[field_struct_name][1][props.variant];
              }
            }
            return field_variants[field_struct_name][0];
          });
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "udecimal"
          ) {
            return (
              <Variant
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                placeholder={placeholder}
                violates_checks={!check_validation}
                {...props.options[1]}
              />
            );
          }
          return (
            <Variant
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
              placeholder={placeholder}
              violates_checks={!check_validation}
            />
          );
        }
        case "idecimal": {
          const Variant = arrow(() => {
            if (props.variant !== undefined) {
              if (props.variant in field_variants[field_struct_name][1]) {
                return field_variants[field_struct_name][1][props.variant];
              }
            }
            return field_variants[field_struct_name][0];
          });
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "idecimal"
          ) {
            return (
              <Variant
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                placeholder={placeholder}
                violates_checks={!check_validation}
                {...props.options[1]}
              />
            );
          }
          return (
            <Variant
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
              placeholder={placeholder}
              violates_checks={!check_validation}
            />
          );
        }
        case "bool": {
          const Variant = arrow(() => {
            if (props.variant !== undefined) {
              if (props.variant in field_variants[field_struct_name][1]) {
                return field_variants[field_struct_name][1][props.variant];
              }
            }
            return field_variants[field_struct_name][0];
          });
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "bool"
          ) {
            return (
              <Variant
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                placeholder={placeholder}
                violates_checks={!check_validation}
                {...props.options[1]}
              />
            );
          }
          return (
            <Variant
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
              placeholder={placeholder}
              violates_checks={!check_validation}
            />
          );
        }
        case "date": {
          const Variant = arrow(() => {
            if (props.variant !== undefined) {
              if (props.variant in field_variants[field_struct_name][1]) {
                return field_variants[field_struct_name][1][props.variant];
              }
            }
            return field_variants[field_struct_name][0];
          });
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "date"
          ) {
            return (
              <Variant
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                placeholder={placeholder}
                violates_checks={!check_validation}
                {...props.options[1]}
              />
            );
          }
          return (
            <Variant
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
              placeholder={placeholder}
              violates_checks={!check_validation}
            />
          );
        }
        case "time": {
          const Variant = arrow(() => {
            if (props.variant !== undefined) {
              if (props.variant in field_variants[field_struct_name][1]) {
                return field_variants[field_struct_name][1][props.variant];
              }
            }
            return field_variants[field_struct_name][0];
          });
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "time"
          ) {
            return (
              <Variant
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                placeholder={placeholder}
                violates_checks={!check_validation}
                {...props.options[1]}
              />
            );
          }
          return (
            <Variant
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
              placeholder={placeholder}
              violates_checks={!check_validation}
            />
          );
        }
        case "timestamp": {
          const Variant = arrow(() => {
            if (props.variant !== undefined) {
              if (props.variant in field_variants[field_struct_name][1]) {
                return field_variants[field_struct_name][1][props.variant];
              }
            }
            return field_variants[field_struct_name][0];
          });
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "timestamp"
          ) {
            return (
              <Variant
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                placeholder={placeholder}
                violates_checks={!check_validation}
                {...props.options[1]}
              />
            );
          }
          return (
            <Variant
              mode={
                props.state.mode === "write"
                  ? path.value.writeable
                    ? "write"
                    : "read"
                  : "read"
              }
              {...props}
              path={path.value}
              placeholder={placeholder}
              violates_checks={!check_validation}
            />
          );
        }
        case "other": {
          const Variant = arrow(() => {
            if (props.variant !== undefined) {
              if (props.variant in field_variants[field_struct_name][1]) {
                return field_variants[field_struct_name][1][props.variant];
              }
            }
            return field_variants[field_struct_name][0];
          });
          if (
            props.options !== null &&
            props.options !== undefined &&
            props.options[0] === "other"
          ) {
            return (
              <Variant
                mode={
                  props.state.mode === "write"
                    ? path.value.writeable
                      ? "write"
                      : "read"
                    : "read"
                }
                {...props}
                path={path.value}
                placeholder={placeholder}
                violates_checks={!check_validation}
                {...props.options[1]}
              />
            );
          }
          return <></>;
        }
        default: {
          const _exhaustiveCheck: never = field_struct_name;
          return _exhaustiveCheck;
        }
      }
    }
    return <></>;
  });
}
