import { LispExpression } from "./lisp";
import { WeakEnum } from "./variable";

// Fx, Tranform, Compose

// Ownership or borrowing over inputs provided will be checked
// But outputs does not have anything to do with ownership
export class Fx {
  name: string;
  inputs: Record<string, WeakEnum>;
  // Updates to paths should take place inside 'inputs' instead of 'outputs'
  // 'outputs' should be used to insert, replace and delete variables, as well as primitive value forwarding for use in composer computations
  // Additionally, a transformer mat be marked as such that it cannot be run directly by the user
  // In case, a transformer is executed via a Composer, ownership of inputs will not be checked.
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

  equals(other: Fx): boolean {
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
