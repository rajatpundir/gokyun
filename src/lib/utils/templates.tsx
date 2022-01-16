import React from "react";
import { Label, Field, Check, FieldOptions } from "./fields";
import { apply, arrow } from "./prelude";
import { get_flattened_path, PathString, Struct } from "./variable";
import { Action, get_label, State } from "./commons";
import { Row, Column } from "native-base";

// Side By Side
export function SBS(props: {
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
  fields: ReadonlyArray<{
    path: string | PathString;
    placeholder?: string;
    checks?: ReadonlyArray<{ name: string; message: string }>;
    options?: FieldOptions;
  }>;
}): JSX.Element {
  return (
    <Column>
      {props.fields
        .filter((x) => get_label(props.state, x.path) !== "")
        .map((field) => {
          const key = apply(field.path, (it) => {
            if (typeof it === "string") {
              return it;
            } else {
              return get_flattened_path(it).join(".");
            }
          });
          return (
            <Row key={key} my={"1"}>
              <Column flex={1}>
                <Row alignItems={"center"}>
                  <Column w={"24"}>
                    <Label {...props} {...field} />
                  </Column>
                  <Column
                    flex={1}
                    flexDirection={"row"}
                    justifyContent={"flex-end"}
                  >
                    <Field {...props} {...field} />
                  </Column>
                </Row>
                {arrow(() => {
                  if (field.checks) {
                    return (
                      <Row mx={"2"} my={"1"}>
                        <Column flex={1}>
                          {field.checks.map((x) => (
                            <Row key={x.name}>
                              <Check
                                {...props}
                                name={x.name}
                                message={x.message}
                              />
                            </Row>
                          ))}
                        </Column>
                      </Row>
                    );
                  }
                  return <></>;
                })}
              </Column>
            </Row>
          );
        })}
    </Column>
  );
}

// One Above Another
export function OAA(props: {
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
  fields: ReadonlyArray<{
    path: string | PathString;
    placeholder?: string;
    checks?: ReadonlyArray<{ name: string; message: string }>;
    options?: FieldOptions;
  }>;
}): JSX.Element {
  return (
    <Column>
      {props.fields
        .filter((x) => get_label(props.state, x.path) !== "")
        .map((field) => {
          const key = apply(field.path, (it) => {
            if (typeof it === "string") {
              return it;
            } else {
              return get_flattened_path(it).join(".");
            }
          });
          return (
            <Row key={key} my={"1"}>
              <Column flex={1}>
                <Row>
                  <Label {...props} {...field} />
                </Row>
                <Row mt={"1"}>
                  <Field {...props} {...field} />
                </Row>
                {arrow(() => {
                  if (field.checks) {
                    return (
                      <Row mx={"2"} my={"1"}>
                        <Column flex={1}>
                          {field.checks.map((x) => (
                            <Row key={x.name}>
                              <Check
                                {...props}
                                name={x.name}
                                message={x.message}
                              />
                            </Row>
                          ))}
                        </Column>
                      </Row>
                    );
                  }
                  return <></>;
                })}
              </Column>
            </Row>
          );
        })}
    </Column>
  );
}

// One Beside Another
export function OBA(props: {
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
  fields: ReadonlyArray<{
    path: string | PathString;
    placeholder?: string;
    checks?: ReadonlyArray<{ name: string; message: string }>;
    options?: FieldOptions;
  }>;
}): JSX.Element {
  return (
    <Row space={2} my={"1"}>
      {props.fields
        .filter((x) => get_label(props.state, x.path) !== "")
        .map((field) => {
          const key = apply(field.path, (it) => {
            if (typeof it === "string") {
              return it;
            } else {
              return get_flattened_path(it).join(".");
            }
          });
          return (
            <Column key={key} flex={1}>
              <Row>
                <Label {...props} {...field} />
              </Row>
              <Row mt={"1"}>
                <Field {...props} {...field} />
              </Row>
              {arrow(() => {
                if (field.checks) {
                  return (
                    <Row mx={"2"} my={"1"}>
                      <Column flex={1}>
                        {field.checks.map((x) => (
                          <Row key={x.name}>
                            <Check
                              {...props}
                              name={x.name}
                              message={x.message}
                            />
                          </Row>
                        ))}
                      </Column>
                    </Row>
                  );
                }
                return <></>;
              })}
            </Column>
          );
        })}
    </Row>
  );
}
