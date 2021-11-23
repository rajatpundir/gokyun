import { LispExpression } from "./lisp";
import { WeakEnum } from "./variable";

// Ownership over inputs provided will be checked
// But outputs does not have anything to do with ownership
export class Transformer {
  name: string;
  inputs: Record<string, WeakEnum>;
  outputs: Record<
    string,
    | {
        op: "insert";
        struct: string;
        fields: { [index: string]: LispExpression };
      }
    | {
        op: "insert_ignore";
        struct: string;
        fields: { [index: string]: LispExpression };
      }
    | {
        // Remove any variable that causes unique constraint violation
        op: "replace";
        struct: string;
        id: LispExpression;
        fields: { [index: string]: LispExpression };
      }
    | {
        op: "delete";
        struct: string;
        fields: { [index: string]: LispExpression };
      }
    | {
        op: "delete_ignore";
        struct: string;
        fields: { [index: string]: LispExpression };
      }
    | {
        op: "update";
        struct: string;
        id: LispExpression;
        paths: ReadonlyArray<[[ReadonlyArray<string>, string], LispExpression]>;
      }
  >;

  constructor(
    name: string,
    inputs: Record<string, WeakEnum>,
    outputs: Record<
      string,
      | {
          op: "insert";
          struct: string;
          fields: { [index: string]: LispExpression };
        }
      | {
          op: "insert_ignore";
          struct: string;
          fields: { [index: string]: LispExpression };
        }
      | {
          // Remove any variable that causes unique constraint violation
          op: "replace";
          struct: string;
          id: LispExpression;
          fields: { [index: string]: LispExpression };
        }
      | {
          op: "delete";
          struct: string;
          fields: { [index: string]: LispExpression };
        }
      | {
          op: "delete_ignore";
          struct: string;
          fields: { [index: string]: LispExpression };
        }
      | {
          op: "update";
          struct: string;
          id: LispExpression;
          paths: ReadonlyArray<
            [[ReadonlyArray<string>, string], LispExpression]
          >;
        }
    >
  ) {
    this.name = name;
    this.inputs = inputs;
    this.outputs = outputs;
  }

  equals(other: Transformer): boolean {
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
}

// Mapper
// Reducer
// Composer
