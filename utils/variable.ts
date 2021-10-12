import { HashSet } from "prelude-ts";
import { BooleanLispExpression, LispExpression } from "./lisp";
import { Message } from "./prelude";

// Ownership states multiple ways to prove ownership of a struct
// Permissions are matched against proven ownerships to get allowed operations

// Borrowing is same as Ownership but only allows read, also assumes writes operations as read ops

// Define working of ownership and borrowing

export type StructPermissions = {
  ownership: ReadonlyArray<[string, BooleanLispExpression]>;
  borrow: Record<
    string,
    ReadonlyArray<[string, string, BooleanLispExpression]>
  >;
  private: Record<
    string,
    {
      read: ReadonlyArray<[ReadonlyArray<string>, BooleanLispExpression]>;
      write: ReadonlyArray<[ReadonlyArray<string>, BooleanLispExpression]>;
    }
  >;
  public: ReadonlyArray<[ReadonlyArray<string>, BooleanLispExpression]>;
};

export type StructEffects = Record<
  string,
  {
    dependencies: ReadonlyArray<ReadonlyArray<string>>;
    mutate: ReadonlyArray<{
      // path starts with '_prev' or '_curr'
      // on creation, expression starting with '_curr' that does not depend on '_prev' are run
      // on updation, expression with both '_prev' and '_curr' are run
      // on deletion, expression with '_prev' that does not depend on '_curr' are run
      path: ReadonlyArray<string>;
      expr: LispExpression;
    }>;
  }
>;

export class Struct {
  name: string;
  fields: HashSet<Field>;
  uniqueness: ReadonlyArray<ReadonlyArray<string>>;
  permissions: StructPermissions;
  effects: StructEffects;
  checks: Record<string, [BooleanLispExpression, Message]>;

  constructor(
    name: string,
    fields: HashSet<Field>,
    uniqueness: ReadonlyArray<ReadonlyArray<string>>,
    permissions: StructPermissions,
    effects: StructEffects,
    checks: Record<string, [BooleanLispExpression, Message]>
  ) {
    this.name = name;
    this.fields = fields;
    this.uniqueness = uniqueness;
    this.permissions = permissions;
    this.effects = effects;
    this.checks = checks;
  }

  equals(other: Struct): boolean {
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

export class Field {
  struct: Struct;
  name: string;
  variants: HashSet<FieldVariant>;

  constructor(struct: Struct, name: string, variants: HashSet<FieldVariant>) {
    this.struct = struct;
    this.name = name;
    this.variants = variants;
  }

  equals(other: Field): boolean {
    if (!other) {
      return false;
    }
    return this.struct.equals(other.struct) && this.name === other.name;
  }

  hashCode(): number {
    return 0;
  }

  toString(): string {
    return String(this.name);
  }
}

export class FieldVariant {
  field: Field;
  variant: WeakEnum;

  constructor(field: Field, variant: WeakEnum) {
    this.field = field;
    this.variant = variant;
  }

  equals(other: FieldVariant): boolean {
    if (!other) {
      return false;
    }
    if (this.field.equals(other.field)) {
      if (this.variant.type === other.variant.type) {
        if (this.variant.type === "other" && other.variant.type === "other") {
          if (this.variant.other !== other.variant.type) {
            return false;
          }
        }
        return true;
      }
    }
    return false;
  }

  hashCode(): number {
    return 0;
  }

  toString(): string {
    return String(this.variant);
  }
}

export type WeakEnum =
  | {
      type: "str";
      default?: string;
    }
  | {
      type: "lstr";
      default?: string;
    }
  | {
      type: "clob";
      default?: string;
    }
  | {
      type: "i32";
      default?: number;
    }
  | {
      type: "u32";
      default?: number;
    }
  | {
      type: "i64";
      default?: number;
    }
  | {
      type: "u64";
      default?: number;
    }
  | {
      type: "idouble";
      default?: number;
    }
  | {
      type: "udouble";
      default?: number;
    }
  | {
      type: "idecimal";
      default?: number;
    }
  | {
      type: "udecimal";
      default?: number;
    }
  | {
      type: "bool";
      default?: boolean;
    }
  | {
      type: "date";
      default?: number;
    }
  | {
      type: "time";
      default?: number;
    }
  | {
      type: "timestamp";
      default?: number;
    }
  | {
      type: "timeslice";
      default?: [number, number];
    }
  | {
      type: "other";
      other: string;
      default?: number;
    };

export class Variable {
  id: number;
  struct: Struct;
  values: Array<Value>;
  created_at: number;
  updated_at: number;
  requested_at: number;

  constructor(
    id: number,
    struct: Struct,
    values: Array<Value>,
    created_at: number,
    updated_at: number,
    requested_at: number
  ) {
    this.id = parseInt(String(id));
    this.struct = struct;
    this.values = values;
    this.created_at = Math.max(0, parseInt(String(created_at)));
    this.updated_at = Math.max(0, parseInt(String(updated_at)));
    this.requested_at = Math.max(0, parseInt(String(requested_at)));
  }

  equals(other: Variable): boolean {
    if (!other) {
      return false;
    }
    return this.id === other.id;
  }

  hashCode(): number {
    return 0;
  }

  toString(): string {
    return String(this.id);
  }
}

export class Value {
  variable: Variable;
  variant: FieldVariant;
  value: StrongEnum;

  constructor(variable: Variable, variant: FieldVariant, value: StrongEnum) {
    this.variable = variable;
    this.variant = variant;
    this.value = value;
  }

  equals(other: Value): boolean {
    if (!other) {
      return false;
    }
    return (
      this.variable.equals(other.variable) && this.variant.equals(other.variant)
    );
  }

  hashCode(): number {
    return 0;
  }

  toString(): string {
    return String(this.variable);
  }
}

type StrongEnum =
  | {
      type: "str";
      value: string;
    }
  | {
      type: "lstr";
      value: string;
    }
  | {
      type: "clob";
      value: string;
    }
  | {
      type: "i32";
      value: number;
    }
  | {
      type: "u32";
      value: number;
    }
  | {
      type: "i64";
      value: number;
    }
  | {
      type: "u64";
      value: number;
    }
  | {
      type: "idouble";
      value: number;
    }
  | {
      type: "udouble";
      value: number;
    }
  | {
      type: "idecimal";
      value: number;
    }
  | {
      type: "udecimal";
      value: number;
    }
  | {
      type: "bool";
      value: boolean;
    }
  | {
      type: "date";
      value: number;
    }
  | {
      type: "time";
      value: number;
    }
  | {
      type: "timestamp";
      value: number;
    }
  | {
      type: "timeslice";
      value: [number, number];
    }
  | {
      type: "other";
      other: string;
      value: number;
    };
