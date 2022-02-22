import Decimal from "decimal.js";
import { FxArgs } from "./fx";
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

class Compose {
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

  exec(args: ComposeArgs, level: Decimal) {}
}
