import React from "react";
import { Label, Field, Check, FieldOptions } from "../lib/utils/fields";
import { apply, arrow } from "../lib/utils/prelude";
import { get_flattened_path, PathString, Struct } from "../lib/utils/variable";
import { Action, get_label, State } from "../lib/utils/commons";
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
      {props.fields.map((x) => (
        <Item
          key={apply(x.path, (it) => {
            if (typeof it === "string") {
              return it;
            } else {
              return get_flattened_path(it).join(".");
            }
          })}
          {...props}
          {...x}
        />
      ))}
    </Column>
  );
}

function Item(props: {
  struct: Struct;
  state: State;
  dispatch: React.Dispatch<Action>;
  path: string | PathString;
  placeholder?: string;
  checks?: ReadonlyArray<{ name: string; message: string }>;
  options?: FieldOptions;
}): JSX.Element {
  const label: string = get_label(props.state, props.path);
  if (label !== "") {
    return (
      <Row my={"2"}>
        <Column flex={1}>
          <Row alignItems={"center"}>
            <Column w={"20"}>
              <Label {...props} />
            </Column>
            <Column flex={1} flexDirection={"row"} justifyContent={"flex-end"}>
              <Field {...props} />
            </Column>
          </Row>
          {arrow(() => {
            if (props.checks) {
              return (
                <Row mx={"2"} my={"1"}>
                  <Column flex={1}>
                    {props.checks.map((x) => (
                      <Row key={x.name}>
                        <Check {...props} name={x.name} message={x.message} />
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
  }
  return <></>;
}
