import { HashSet } from "prelude-ts";
import Decimal from "decimal.js";
import { BooleanLispExpression, LispExpression } from "./lisp";
import { ErrMsg } from "./errors";

type PathString = [ReadonlyArray<string>, string];

export type StructPermissions = {
  ownership: ReadonlyArray<string>;
  borrow: Record<
    string,
    {
      // Here, prove is struct, and field in borrowed struct over which ownership must be proven
      prove: [string, string];
      // For proved borrowing, further enforce some equality constraints
      // For example.
      // You may be trying to access some alliance's info with memberhip of some other alliance
      // To prevent above misuse, we must ensure that membership is of same alliance
      constraints: ReadonlyArray<[PathString, PathString]>;
      ownership: PathString;
    }
  >;
  private: Record<
    string,
    {
      read: ReadonlyArray<PathString>;
      write: ReadonlyArray<PathString>;
    }
  >;
  public: ReadonlyArray<PathString>;
};

type StructTriggers = Record<
  string,
  {
    // Snapshot of paths is taken as per the name indicates
    event:
      | "after_creation"
      | "before_update"
      | "after_update"
      | "before_deletion";
    monitor: ReadonlyArray<PathString>;
    operation:
      | {
          op: "insert";
          struct: string;
          fields: { [index: string]: LispExpression };
        }
      | {
          // Does not throw exception if variable cannot be created due to unique constraint violation
          // That is, variable was already present and operation will behave as if it had created the variable
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
          // Does not throw exception if variable does not exist
          op: "delete_ignore";
          struct: string;
          fields: { [index: string]: LispExpression };
        }
      | {
          op: "update";
          path: PathString;
          value: LispExpression;
        };
  }
>;

export class Struct {
  name: string;
  fields: Record<string, WeakEnum>;
  uniqueness: ReadonlyArray<PathString>;
  permissions: StructPermissions;
  triggers: StructTriggers;
  checks: Record<string, [BooleanLispExpression, ErrMsg]>;

  constructor(
    name: string,
    fields: Record<string, WeakEnum>,
    uniqueness: ReadonlyArray<PathString>,
    permissions: StructPermissions,
    triggers: StructTriggers,
    checks: Record<string, [BooleanLispExpression, ErrMsg]>
  ) {
    this.name = name;
    this.fields = fields;
    this.uniqueness = uniqueness;
    this.permissions = permissions;
    this.triggers = triggers;
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
      default?: Decimal;
    }
  | {
      type: "u32";
      default?: Decimal;
    }
  | {
      type: "i64";
      default?: Decimal;
    }
  | {
      type: "u64";
      default?: Decimal;
    }
  | {
      type: "idouble";
      default?: Decimal;
    }
  | {
      type: "udouble";
      default?: Decimal;
    }
  | {
      type: "idecimal";
      default?: Decimal;
    }
  | {
      type: "udecimal";
      default?: Decimal;
    }
  | {
      type: "bool";
      default?: boolean;
    }
  | {
      type: "date";
      default?: Date;
    }
  | {
      type: "time";
      default?: Date;
    }
  | {
      type: "timestamp";
      default?: Date;
    }
  | {
      type: "other";
      other: string;
      default?: Decimal;
    };

export type StrongEnum =
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
      value: Decimal;
    }
  | {
      type: "u32";
      value: Decimal;
    }
  | {
      type: "i64";
      value: Decimal;
    }
  | {
      type: "u64";
      value: Decimal;
    }
  | {
      type: "idouble";
      value: Decimal;
    }
  | {
      type: "udouble";
      value: Decimal;
    }
  | {
      type: "idecimal";
      value: Decimal;
    }
  | {
      type: "udecimal";
      value: Decimal;
    }
  | {
      type: "bool";
      value: boolean;
    }
  | {
      type: "date";
      value: Date;
    }
  | {
      type: "time";
      value: Date;
    }
  | {
      type: "timestamp";
      value: Date;
    }
  | {
      type: "other";
      other: string;
      value: Decimal;
    };

export class Path {
  label: string;
  path: [
    Array<
      [
        string,
        {
          struct: Struct;
          id: Decimal;
          active: boolean;
          created_at: Date;
          updated_at: Date;
        }
      ]
    >,
    [string, StrongEnum]
  ];
  updatable: boolean = false;

  constructor(
    label: string,
    path: [
      Array<
        [
          string,
          {
            struct: Struct;
            id: Decimal;
            active: boolean;
            created_at: Date;
            updated_at: Date;
          }
        ]
      >,
      [string, StrongEnum]
    ]
  ) {
    this.label = label;
    this.path = path;
  }

  equals(other: Path): boolean {
    if (!other) {
      return false;
    }
    if (this.label !== other.label) {
      return false;
    } else {
      if (this.path[0].length !== other.path[0].length) {
        return false;
      } else {
        for (let i = 0; i < this.path[0].length; i++) {
          const [this_field_name, this_ref] = this.path[0][i];
          const [other_field_name, other_ref] = this.path[0][i];
          if (
            this_field_name !== other_field_name ||
            !this_ref.struct.equals(other_ref.struct) ||
            this_ref.id !== other_ref.id
          ) {
            return false;
          }
        }
        if (
          this.path[1][0] !== other.path[1][0] ||
          this.path[1][1].type !== other.path[1][1].type
        ) {
          return false;
        }
      }
    }
    return true;
  }

  hashCode(): number {
    return 0;
  }

  toString(): string {
    return String([this.path, this.updatable]);
  }
}

export class Variable {
  struct: Struct;
  id: Decimal;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  paths: HashSet<Path>;

  constructor(
    struct: Struct,
    id: Decimal,
    active: boolean,
    created_at: Date,
    updated_at: Date,
    paths: HashSet<Path>
  ) {
    this.struct = struct;
    this.id = id;
    this.active = active;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.paths = paths;
  }

  equals(other: Variable): boolean {
    if (!other) {
      return false;
    }
    return this.struct.equals(other.struct) && this.id.equals(other.id);
  }

  hashCode(): number {
    return 0;
  }

  toString(): string {
    return String({
      struct: this.struct.name,
      id: this.id.toString(),
      active: this.active.valueOf(),
      created_at: this.created_at,
      updated_at: this.updated_at,
      paths: this.paths.toArray(),
    });
  }
}
