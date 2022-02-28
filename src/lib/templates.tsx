import React from "react";
import { Label, Field, Check } from "./field";
import { apply, arrow } from "./prelude";
import { get_flattened_path, PathString, Struct } from "./variable";
import { Action, get_label, State } from "./commons";
import { Row, Column } from "native-base";
import { FieldOptions } from "./field_variants";

type CommonProps = {
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
  fields: ReadonlyArray<
    | string
    | PathString
    | {
        path: string | PathString;
        placeholder?: string;
        checks?: ReadonlyArray<{ name: string; message: string }>;
        options?: FieldOptions;
        variant?: string;
      }
  >;
};

type CH_Props = CommonProps;

function CH(props: CH_Props): JSX.Element {
  return (
    <Column>
      {props.fields
        .map((x) => {
          if (typeof x === "string") {
            return { path: x };
          } else if (Array.isArray(x)) {
            return { path: x };
          } else {
            return x;
          }
        })
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
                    <Field
                      {...props}
                      {...field}
                      checks={
                        field.checks ? field.checks.map((x) => x.name) : []
                      }
                    />
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

type CV_Props = CommonProps;

function CV(props: CV_Props): JSX.Element {
  return (
    <Column>
      {props.fields
        .map((x) => {
          if (typeof x === "string") {
            return { path: x };
          } else if (Array.isArray(x)) {
            return { path: x };
          } else {
            return x;
          }
        })
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
                  <Field
                    {...props}
                    {...field}
                    checks={field.checks ? field.checks.map((x) => x.name) : []}
                  />
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

type RV_Props = CommonProps;

function RV(props: RV_Props): JSX.Element {
  return (
    <Row space={2} my={"1"}>
      {props.fields
        .map((x) => {
          if (typeof x === "string") {
            return { path: x };
          } else if (Array.isArray(x)) {
            return { path: x };
          } else {
            return x;
          }
        })
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
                <Field
                  {...props}
                  {...field}
                  checks={field.checks ? field.checks.map((x) => x.name) : []}
                />
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

type RH_Props = CommonProps;

function RH(props: RH_Props): JSX.Element {
  return (
    <Row
      space={2}
      my={"1"}
      justifyContent={"space-between"}
      alignItems={"center"}
    >
      {props.fields
        .map((x) => {
          if (typeof x === "string") {
            return { path: x };
          } else if (Array.isArray(x)) {
            return { path: x };
          } else {
            return x;
          }
        })
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
              <Row
                flex={1}
                justifyContent={"space-between"}
                alignItems={"center"}
              >
                <Column flex={1}>
                  <Label {...props} {...field} />
                </Column>
                <Field
                  {...props}
                  {...field}
                  checks={field.checks ? field.checks.map((x) => x.name) : []}
                />
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

type TemplateProps = CommonProps & {
  type: "CH" | "CV" | "RV" | "RH";
};

export function Template(props: TemplateProps): JSX.Element {
  switch (props.type) {
    case "CV": {
      return <CV {...props} />;
    }
    case "CH": {
      return <CH {...props} />;
    }
    case "RV": {
      return <RV {...props} />;
    }
    case "RH": {
      return <RH {...props} />;
    }
    default: {
      const _exhaustiveCheck: never = props.type;
      return _exhaustiveCheck;
    }
  }
}
