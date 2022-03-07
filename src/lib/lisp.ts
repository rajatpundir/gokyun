import {
  Result,
  Option,
  unwrap,
  Ok,
  Err,
  CustomError,
  fold,
  fold_prev,
  apply,
} from "./prelude";
import { ErrMsg, errors } from "./errors";
import { PathString } from "./variable";
import { getState } from "./store";

export type LispResult = Num | Deci | Txt | Bool;

export type LispExpression =
  | Num
  | Deci
  | Txt
  | Bool
  | NumberArithmeticExpression
  | DecimalArithmeticExpression
  | NumberComparatorExpression
  | DecimalComparatorExpression
  | TextComparatorExpression
  | LogicalBinaryExpression
  | LogicalUnaryExpression
  | DotExpression
  | MatchExpression<ToBoolean, ToNum>;

export type BooleanLispExpression = (LispExpression | Bool) & ToBoolean;

abstract class ToValue {
  abstract equals(
    other: this,
    symbols: Readonly<Record<string, Symbol>>
  ): boolean;
  abstract get_result(
    symbols: Readonly<Record<string, Symbol>>
  ): Result<LispResult>;
  abstract get_paths(): Array<PathString>;
  abstract serialize(): any;
}

export abstract class ToTxt extends ToValue {
  abstract get_text(symbols: Readonly<Record<string, Symbol>>): Result<Txt>;
}

export abstract class ToNum extends ToTxt {
  abstract get_number(symbols: Readonly<Record<string, Symbol>>): Result<Num>;
}

export abstract class ToDeci extends ToTxt {
  abstract get_number(symbols: Readonly<Record<string, Symbol>>): Result<Num>;
  abstract get_decimal(symbols: Readonly<Record<string, Symbol>>): Result<Deci>;
}

export abstract class ToBoolean extends ToTxt {
  abstract get_boolean(symbols: Readonly<Record<string, Symbol>>): Result<Bool>;
}

export class Num implements ToNum, ToDeci, ToTxt {
  value: number;

  constructor(value: number) {
    this.value = parseInt(value.toString());
  }

  equals(other: this, symbols: Readonly<Record<string, Symbol>>): boolean {
    let v = other.get_number(inject_system_constants(symbols));
    if (unwrap(v)) {
      return this.value === v.value.value;
    }
    return false;
  }

  get_result(symbols: Readonly<Record<string, Symbol>>): Result<LispResult> {
    return this.get_number(inject_system_constants(symbols));
  }

  get_number(symbols: Readonly<Record<string, Symbol>>): Result<Num> {
    return new Ok(new Num(this.value));
  }

  get_decimal(symbols: Readonly<Record<string, Symbol>>): Result<Deci> {
    return new Ok(new Deci(this.value));
  }

  get_text(symbols: Readonly<Record<string, Symbol>>): Result<Txt> {
    return new Ok(new Txt(this.value.toString()));
  }

  get_paths(): Array<PathString> {
    return [];
  }

  serialize(): any {
    return this.value;
  }
}

export class Deci implements ToNum, ToDeci, ToTxt {
  value: number;

  constructor(value: number) {
    this.value = parseFloat(value.toString());
  }

  equals(other: this, symbols: Readonly<Record<string, Symbol>>): boolean {
    let v = other.get_decimal(inject_system_constants(symbols));
    if (unwrap(v)) {
      return this.value === v.value.value;
    }
    return false;
  }

  get_result(symbols: Readonly<Record<string, Symbol>>): Result<LispResult> {
    return this.get_decimal(inject_system_constants(symbols));
  }

  get_number(symbols: Readonly<Record<string, Symbol>>): Result<Num> {
    return new Ok(new Num(this.value));
  }

  get_decimal(symbols: Readonly<Record<string, Symbol>>): Result<Deci> {
    return new Ok(new Deci(this.value));
  }

  get_text(symbols: Readonly<Record<string, Symbol>>): Result<Txt> {
    return new Ok(new Txt(this.value.toString()));
  }

  get_paths(): Array<PathString> {
    return [];
  }

  serialize(): any {
    return this.value;
  }
}

export class Txt implements ToTxt {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  equals(other: this, symbols: Readonly<Record<string, Symbol>>): boolean {
    let v = other.get_text(inject_system_constants(symbols));
    if (unwrap(v)) {
      return this.value === v.value.value;
    }
    return false;
  }

  get_result(symbols: Readonly<Record<string, Symbol>>): Result<LispResult> {
    return this.get_text(inject_system_constants(symbols));
  }

  get_text(symbols: Readonly<Record<string, Symbol>>): Result<Txt> {
    return new Ok(new Txt(this.value));
  }

  get_paths(): Array<PathString> {
    return [];
  }

  serialize(): any {
    return this.value;
  }
}

export class Bool implements ToBoolean, ToTxt {
  value: boolean;

  constructor(value: boolean) {
    this.value = value;
  }

  equals(other: this, symbols: Readonly<Record<string, Symbol>>): boolean {
    let v = other.get_boolean(inject_system_constants(symbols));
    if (unwrap(v)) {
      return this.value === v.value.value;
    }
    return false;
  }

  get_result(symbols: Readonly<Record<string, Symbol>>): Result<LispResult> {
    return this.get_boolean(inject_system_constants(symbols));
  }

  get_boolean(symbols: Readonly<Record<string, Symbol>>): Result<Bool> {
    return new Ok(new Bool(this.value));
  }

  get_text(symbols: Readonly<Record<string, Symbol>>): Result<Txt> {
    return new Ok(new Txt(String(this.value)));
  }

  get_paths(): Array<PathString> {
    return [];
  }

  serialize(): any {
    return this.value;
  }
}

type Leaf = Num | Deci | Txt | Bool;

export class Symbol {
  value: {
    value: Option<Leaf>;
    values: Record<string, Symbol>;
  };

  constructor(value: { value: Option<Leaf>; values: Record<string, Symbol> }) {
    this.value = value;
  }
}

export class Add<T extends ToNum | ToDeci> {
  value: [T, ReadonlyArray<T>];

  constructor(value: [T, ReadonlyArray<T>]) {
    this.value = value;
  }
}

export class Multiply<T extends ToNum | ToDeci> {
  value: [T, ReadonlyArray<T>];

  constructor(value: [T, ReadonlyArray<T>]) {
    this.value = value;
  }
}

export class Subtract<T extends ToNum | ToDeci> {
  value: [T, ReadonlyArray<T>];

  constructor(value: [T, ReadonlyArray<T>]) {
    this.value = value;
  }
}

export class Divide<T extends ToNum | ToDeci> {
  value: [T, ReadonlyArray<T>];

  constructor(value: [T, ReadonlyArray<T>]) {
    this.value = value;
  }
}

export class Modulus<T extends ToNum | ToDeci> {
  value: [T, ReadonlyArray<T>];

  constructor(value: [T, ReadonlyArray<T>]) {
    this.value = value;
  }
}

type ArithmeticExpressionVariant<T extends ToNum | ToDeci> =
  | Add<T>
  | Multiply<T>
  | Subtract<T>
  | Divide<T>
  | Modulus<T>;

export class NumberArithmeticExpression implements ToNum, ToDeci {
  value: ArithmeticExpressionVariant<ToNum>;

  constructor(value: ArithmeticExpressionVariant<ToNum>) {
    this.value = value;
  }

  equals(other: this, symbols: Readonly<Record<string, Symbol>>): boolean {
    let v = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      let v1 = v.value.get_number(inject_system_constants(symbols));
      if (unwrap(v1)) {
        let v2 = other.eval(inject_system_constants(symbols));
        if (unwrap(v2)) {
          let v3 = v2.value.get_number(inject_system_constants(symbols));
          if (unwrap(v3)) {
            return v1.value.value === v3.value.value;
          }
        }
      }
    }
    return false;
  }

  get_result(symbols: Readonly<Record<string, Symbol>>): Result<LispResult> {
    return this.get_number(inject_system_constants(symbols));
  }

  get_number(symbols: Readonly<Record<string, Symbol>>): Result<Num> {
    let v: Result<ToNum> = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      return v.value.get_number(inject_system_constants(symbols));
    } else {
      return v;
    }
  }

  get_decimal(symbols: Readonly<Record<string, Symbol>>): Result<Deci> {
    let v: Result<ToNum> = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      let v1 = v.value.get_number(inject_system_constants(symbols));
      if (unwrap(v1)) {
        return new Ok(new Deci(v1.value.value));
      } else {
        return v1;
      }
    } else {
      return v;
    }
  }

  get_text(symbols: Readonly<Record<string, Symbol>>): Result<Txt> {
    let v: Result<ToNum> = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      return v.value.get_text(inject_system_constants(symbols));
    } else {
      return v;
    }
  }

  eval(symbols: Readonly<Record<string, Symbol>>): Result<ToNum> {
    let args: [ToNum, ReadonlyArray<ToNum>] = this.value.value;
    if (this.value instanceof Add) {
      let result: Result<ToNum> = fold(
        args[0].get_number(inject_system_constants(symbols)),
        args[1],
        (acc, val) => {
          if (unwrap(acc)) {
            let v = val.get_number(inject_system_constants(symbols));
            if (unwrap(v)) {
              return new Ok(new Num(acc.value.value + v.value.value));
            }
          }
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      );
      return result;
    } else if (this.value instanceof Multiply) {
      let result: Result<ToNum> = fold(
        args[0].get_number(inject_system_constants(symbols)),
        args[1],
        (acc, val) => {
          if (unwrap(acc)) {
            let v = val.get_number(inject_system_constants(symbols));
            if (unwrap(v)) {
              return new Ok(new Num(acc.value.value * v.value.value));
            }
          }
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      );
      return result;
    } else if (this.value instanceof Subtract) {
      let result: Result<ToNum> = fold(
        args[0].get_number(inject_system_constants(symbols)),
        args[1],
        (acc, val) => {
          if (unwrap(acc)) {
            let v = val.get_number(inject_system_constants(symbols));
            if (unwrap(v)) {
              return new Ok(new Num(acc.value.value - v.value.value));
            }
          }
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      );
      return result;
    } else if (this.value instanceof Divide) {
      let result: Result<ToNum> = fold(
        args[0].get_number(inject_system_constants(symbols)),
        args[1],
        (acc, val) => {
          if (unwrap(acc)) {
            let v = val.get_number(inject_system_constants(symbols));
            if (unwrap(v)) {
              return new Ok(new Num(acc.value.value / v.value.value));
            }
          }
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      );
      return result;
    } else if (this.value instanceof Modulus) {
      let result: Result<ToNum> = fold(
        args[0].get_number(inject_system_constants(symbols)),
        args[1],
        (acc, val) => {
          if (unwrap(acc)) {
            let v = val.get_number(inject_system_constants(symbols));
            if (unwrap(v)) {
              return new Ok(new Num(acc.value.value % v.value.value));
            }
          }
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      );
      return result;
    } else {
      const _exhaustiveCheck: never = this.value;
      return _exhaustiveCheck;
    }
  }

  get_paths(): Array<PathString> {
    return apply([] as Array<PathString>, (it) => {
      it = it.concat(this.value.value[0].get_paths());
      for (const expr of this.value.value[1]) {
        it = it.concat(expr.get_paths());
      }
      return it;
    });
  }

  serialize(): any {
    let args: Array<any> = [];
    args.push(this.value.value[0].serialize());
    for (const arg of this.value.value[1]) {
      args.push(arg.serialize());
    }
    if (this.value instanceof Add) {
      return {
        op: "+",
        type: "Number",
        args: args,
      };
    } else if (this.value instanceof Multiply) {
      return {
        op: "*",
        type: "Number",
        args: args,
      };
    } else if (this.value instanceof Subtract) {
      return {
        op: "-",
        type: "Number",
        args: args,
      };
    } else if (this.value instanceof Divide) {
      return {
        op: "/",
        type: "Number",
        args: args,
      };
    } else if (this.value instanceof Modulus) {
      return {
        op: "%",
        type: "Number",
        args: args,
      };
    } else {
      const _exhaustiveCheck: never = this.value;
      return _exhaustiveCheck;
    }
  }
}

export class DecimalArithmeticExpression implements ToNum, ToDeci {
  value: ArithmeticExpressionVariant<ToDeci>;

  constructor(value: ArithmeticExpressionVariant<ToDeci>) {
    this.value = value;
  }

  get_result(symbols: Readonly<Record<string, Symbol>>): Result<LispResult> {
    return this.get_decimal(inject_system_constants(symbols));
  }

  equals(other: this, symbols: Readonly<Record<string, Symbol>>): boolean {
    let v = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      let v1 = v.value.get_decimal(inject_system_constants(symbols));
      if (unwrap(v1)) {
        let v2 = other.eval(inject_system_constants(symbols));
        if (unwrap(v2)) {
          let v3 = v2.value.get_decimal(inject_system_constants(symbols));
          if (unwrap(v3)) {
            return v1.value.value === v3.value.value;
          }
        }
      }
    }
    return false;
  }

  get_number(symbols: Readonly<Record<string, Symbol>>): Result<Num> {
    let v: Result<ToDeci> = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      return v.value.get_number(inject_system_constants(symbols));
    } else {
      return v;
    }
  }

  get_decimal(symbols: Readonly<Record<string, Symbol>>): Result<Deci> {
    let v: Result<ToDeci> = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      return v.value.get_decimal(inject_system_constants(symbols));
    } else {
      return v;
    }
  }

  get_text(symbols: Readonly<Record<string, Symbol>>): Result<Txt> {
    let v: Result<ToDeci> = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      return v.value.get_text(inject_system_constants(symbols));
    } else {
      return v;
    }
  }

  eval(symbols: Readonly<Record<string, Symbol>>): Result<ToDeci> {
    let args: [ToDeci, ReadonlyArray<ToDeci>] = this.value.value;
    if (this.value instanceof Add) {
      let result: Result<ToDeci> = fold(
        args[0].get_decimal(inject_system_constants(symbols)),
        args[1],
        (acc, val) => {
          if (unwrap(acc)) {
            let v = val.get_decimal(inject_system_constants(symbols));
            if (unwrap(v)) {
              return new Ok(new Num(acc.value.value + v.value.value));
            }
          }
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      );
      return result;
    } else if (this.value instanceof Multiply) {
      let result: Result<ToDeci> = fold(
        args[0].get_decimal(inject_system_constants(symbols)),
        args[1],
        (acc, val) => {
          if (unwrap(acc)) {
            let v = val.get_decimal(inject_system_constants(symbols));
            if (unwrap(v)) {
              return new Ok(new Num(acc.value.value * v.value.value));
            }
          }
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      );
      return result;
    } else if (this.value instanceof Subtract) {
      let result: Result<ToDeci> = fold(
        args[0].get_decimal(inject_system_constants(symbols)),
        args[1],
        (acc, val) => {
          if (unwrap(acc)) {
            let v = val.get_decimal(inject_system_constants(symbols));
            if (unwrap(v)) {
              return new Ok(new Num(acc.value.value - v.value.value));
            }
          }
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      );
      return result;
    } else if (this.value instanceof Divide) {
      let result: Result<ToDeci> = fold(
        args[0].get_decimal(inject_system_constants(symbols)),
        args[1],
        (acc, val) => {
          if (unwrap(acc)) {
            let v = val.get_decimal(inject_system_constants(symbols));
            if (unwrap(v)) {
              return new Ok(new Num(acc.value.value / v.value.value));
            }
          }
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      );
      return result;
    } else if (this.value instanceof Modulus) {
      let result: Result<ToDeci> = fold(
        args[0].get_decimal(inject_system_constants(symbols)),
        args[1],
        (acc, val) => {
          if (unwrap(acc)) {
            let v = val.get_decimal(inject_system_constants(symbols));
            if (unwrap(v)) {
              return new Ok(new Num(acc.value.value % v.value.value));
            }
          }
          return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
        }
      );
      return result;
    } else {
      const _exhaustiveCheck: never = this.value;
      return _exhaustiveCheck;
    }
  }

  get_paths(): Array<PathString> {
    return apply([] as Array<PathString>, (it) => {
      it = it.concat(this.value.value[0].get_paths());
      for (const expr of this.value.value[1]) {
        it = it.concat(expr.get_paths());
      }
      return it;
    });
  }

  serialize(): any {
    let args: Array<any> = [];
    args.push(this.value.value[0].serialize());
    for (const arg of this.value.value[1]) {
      args.push(arg.serialize());
    }
    if (this.value instanceof Add) {
      return {
        op: "+",
        type: "Decimal",
        args: args,
      };
    } else if (this.value instanceof Multiply) {
      return {
        op: "*",
        type: "Decimal",
        args: args,
      };
    } else if (this.value instanceof Subtract) {
      return {
        op: "-",
        type: "Decimal",
        args: args,
      };
    } else if (this.value instanceof Divide) {
      return {
        op: "/",
        type: "Decimal",
        args: args,
      };
    } else if (this.value instanceof Modulus) {
      return {
        op: "%",
        type: "Decimal",
        args: args,
      };
    } else {
      const _exhaustiveCheck: never = this.value;
      return _exhaustiveCheck;
    }
  }
}

export class Equals<T> {
  value: [T, T, ReadonlyArray<T>];

  constructor(value: [T, T, ReadonlyArray<T>]) {
    this.value = value;
  }
}

export class GreaterThan<T> {
  value: [T, T, ReadonlyArray<T>];

  constructor(value: [T, T, ReadonlyArray<T>]) {
    this.value = value;
  }
}

export class LessThan<T> {
  value: [T, T, ReadonlyArray<T>];

  constructor(value: [T, T, ReadonlyArray<T>]) {
    this.value = value;
  }
}

export class GreaterThanEquals<T> {
  value: [T, T, ReadonlyArray<T>];

  constructor(value: [T, T, ReadonlyArray<T>]) {
    this.value = value;
  }
}

export class LessThanEquals<T> {
  value: [T, T, ReadonlyArray<T>];

  constructor(value: [T, T, ReadonlyArray<T>]) {
    this.value = value;
  }
}

type ComparatorExpressionVariant<T> =
  | Equals<T>
  | GreaterThan<T>
  | LessThan<T>
  | GreaterThanEquals<T>
  | LessThanEquals<T>;

export class NumberComparatorExpression implements ToBoolean {
  value: ComparatorExpressionVariant<ToNum>;

  constructor(value: ComparatorExpressionVariant<ToNum>) {
    this.value = value;
  }

  equals(other: this, symbols: Readonly<Record<string, Symbol>>): boolean {
    let v = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      let v1 = v.value.get_boolean(inject_system_constants(symbols));
      if (unwrap(v1)) {
        let v2 = other.eval(inject_system_constants(symbols));
        if (unwrap(v2)) {
          let v3 = v2.value.get_boolean(inject_system_constants(symbols));
          if (unwrap(v3)) {
            return v1.value.value === v3.value.value;
          }
        }
      }
    }
    return false;
  }

  get_result(symbols: Readonly<Record<string, Symbol>>): Result<LispResult> {
    return this.get_boolean(inject_system_constants(symbols));
  }

  get_boolean(symbols: Readonly<Record<string, Symbol>>): Result<Bool> {
    let v: Result<ToBoolean> = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      return v.value.get_boolean(inject_system_constants(symbols));
    } else {
      return v;
    }
  }

  get_text(symbols: Readonly<Record<string, Symbol>>): Result<Txt> {
    let v: Result<ToBoolean> = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      return v.value.get_text(inject_system_constants(symbols));
    } else {
      return v;
    }
  }

  eval(symbols: Readonly<Record<string, Symbol>>): Result<ToBoolean> {
    let args: [ToNum, ToNum, ReadonlyArray<ToNum>] = this.value.value;
    if (this.value instanceof Equals) {
      let v = args[0].get_number(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_number(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value === v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === true) {
                  let v2 = prev.get_number(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_number(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(
                        new Bool(v2.value.value === v3.value.value)
                      );
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else if (this.value instanceof GreaterThan) {
      let v = args[0].get_number(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_number(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value < v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === true) {
                  let v2 = prev.get_number(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_number(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(new Bool(v2.value.value < v3.value.value));
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else if (this.value instanceof LessThan) {
      let v = args[0].get_number(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_number(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value > v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === true) {
                  let v2 = prev.get_number(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_number(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(new Bool(v2.value.value > v3.value.value));
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else if (this.value instanceof GreaterThanEquals) {
      let v = args[0].get_number(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_number(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value <= v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === true) {
                  let v2 = prev.get_number(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_number(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(new Bool(v2.value.value <= v3.value.value));
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else if (this.value instanceof LessThanEquals) {
      let v = args[0].get_number(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_number(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value >= v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === true) {
                  let v2 = prev.get_number(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_number(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(new Bool(v2.value.value >= v3.value.value));
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else {
      const _exhaustiveCheck: never = this.value;
      return _exhaustiveCheck;
    }
  }

  get_paths(): Array<PathString> {
    return apply([] as Array<PathString>, (it) => {
      it = it.concat(this.value.value[0].get_paths());
      it = it.concat(this.value.value[1].get_paths());
      for (const expr of this.value.value[2]) {
        it = it.concat(expr.get_paths());
      }
      return it;
    });
  }

  serialize(): any {
    let args: Array<any> = [];
    args.push(this.value.value[0].serialize());
    args.push(this.value.value[1].serialize());
    for (const arg of this.value.value[2]) {
      args.push(arg.serialize());
    }
    if (this.value instanceof Equals) {
      return {
        op: "==",
        type: "Number",
        args: args,
      };
    } else if (this.value instanceof GreaterThan) {
      return {
        op: "<",
        type: "Number",
        args: args,
      };
    } else if (this.value instanceof LessThan) {
      return {
        op: ">",
        type: "Number",
        args: args,
      };
    } else if (this.value instanceof GreaterThanEquals) {
      return {
        op: "<=",
        type: "Number",
        args: args,
      };
    } else if (this.value instanceof LessThanEquals) {
      return {
        op: ">=",
        type: "Number",
        args: args,
      };
    } else {
      const _exhaustiveCheck: never = this.value;
      return _exhaustiveCheck;
    }
  }
}

export class DecimalComparatorExpression implements ToBoolean {
  value: ComparatorExpressionVariant<ToDeci>;

  constructor(value: ComparatorExpressionVariant<ToDeci>) {
    this.value = value;
  }

  equals(other: this, symbols: Readonly<Record<string, Symbol>>): boolean {
    let v = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      let v1 = v.value.get_boolean(inject_system_constants(symbols));
      if (unwrap(v1)) {
        let v2 = other.eval(inject_system_constants(symbols));
        if (unwrap(v2)) {
          let v3 = v2.value.get_boolean(inject_system_constants(symbols));
          if (unwrap(v3)) {
            return v1.value.value === v3.value.value;
          }
        }
      }
    }
    return false;
  }

  get_result(symbols: Readonly<Record<string, Symbol>>): Result<LispResult> {
    return this.get_boolean(inject_system_constants(symbols));
  }

  get_boolean(symbols: Readonly<Record<string, Symbol>>): Result<Bool> {
    let v: Result<ToBoolean> = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      return v.value.get_boolean(inject_system_constants(symbols));
    } else {
      return v;
    }
  }

  get_text(symbols: Readonly<Record<string, Symbol>>): Result<Txt> {
    let v: Result<ToBoolean> = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      return v.value.get_text(inject_system_constants(symbols));
    } else {
      return v;
    }
  }

  eval(symbols: Readonly<Record<string, Symbol>>): Result<ToBoolean> {
    let args: [ToDeci, ToDeci, ReadonlyArray<ToDeci>] = this.value.value;
    if (this.value instanceof Equals) {
      let v = args[0].get_decimal(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_decimal(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value === v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === true) {
                  let v2 = prev.get_decimal(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_decimal(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(
                        new Bool(v2.value.value === v3.value.value)
                      );
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else if (this.value instanceof GreaterThan) {
      let v = args[0].get_decimal(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_decimal(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value < v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === true) {
                  let v2 = prev.get_decimal(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_decimal(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(new Bool(v2.value.value < v3.value.value));
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else if (this.value instanceof LessThan) {
      let v = args[0].get_decimal(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_decimal(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value > v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === true) {
                  let v2 = prev.get_decimal(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_decimal(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(new Bool(v2.value.value > v3.value.value));
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else if (this.value instanceof GreaterThanEquals) {
      let v = args[0].get_decimal(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_decimal(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value <= v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === true) {
                  let v2 = prev.get_decimal(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_decimal(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(new Bool(v2.value.value <= v3.value.value));
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else if (this.value instanceof LessThanEquals) {
      let v = args[0].get_decimal(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_decimal(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value >= v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === true) {
                  let v2 = prev.get_decimal(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_decimal(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(new Bool(v2.value.value >= v3.value.value));
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else {
      const _exhaustiveCheck: never = this.value;
      return _exhaustiveCheck;
    }
  }

  get_paths(): Array<PathString> {
    return apply([] as Array<PathString>, (it) => {
      it = it.concat(this.value.value[0].get_paths());
      it = it.concat(this.value.value[1].get_paths());
      for (const expr of this.value.value[2]) {
        it = it.concat(expr.get_paths());
      }
      return it;
    });
  }

  serialize(): any {
    let args: Array<any> = [];
    args.push(this.value.value[0].serialize());
    args.push(this.value.value[1].serialize());
    for (const arg of this.value.value[2]) {
      args.push(arg.serialize());
    }
    if (this.value instanceof Equals) {
      return {
        op: "==",
        type: "Decimal",
        args: args,
      };
    } else if (this.value instanceof GreaterThan) {
      return {
        op: "<",
        type: "Decimal",
        args: args,
      };
    } else if (this.value instanceof LessThan) {
      return {
        op: ">",
        type: "Decimal",
        args: args,
      };
    } else if (this.value instanceof GreaterThanEquals) {
      return {
        op: "<=",
        type: "Decimal",
        args: args,
      };
    } else if (this.value instanceof LessThanEquals) {
      return {
        op: ">=",
        type: "Decimal",
        args: args,
      };
    } else {
      const _exhaustiveCheck: never = this.value;
      return _exhaustiveCheck;
    }
  }
}

export class TextComparatorExpression implements ToBoolean {
  value: ComparatorExpressionVariant<ToTxt>;

  constructor(value: ComparatorExpressionVariant<ToTxt>) {
    this.value = value;
  }

  equals(other: this, symbols: Readonly<Record<string, Symbol>>): boolean {
    let v = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      let v1 = v.value.get_boolean(inject_system_constants(symbols));
      if (unwrap(v1)) {
        let v2 = other.eval(inject_system_constants(symbols));
        if (unwrap(v2)) {
          let v3 = v2.value.get_boolean(inject_system_constants(symbols));
          if (unwrap(v3)) {
            return v1.value.value === v3.value.value;
          }
        }
      }
    }
    return false;
  }

  get_result(symbols: Readonly<Record<string, Symbol>>): Result<LispResult> {
    return this.get_boolean(inject_system_constants(symbols));
  }

  get_boolean(symbols: Readonly<Record<string, Symbol>>): Result<Bool> {
    let v: Result<ToBoolean> = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      return v.value.get_boolean(inject_system_constants(symbols));
    } else {
      return v;
    }
  }

  get_text(symbols: Readonly<Record<string, Symbol>>): Result<Txt> {
    let v: Result<ToBoolean> = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      return v.value.get_text(inject_system_constants(symbols));
    } else {
      return v;
    }
  }

  eval(symbols: Readonly<Record<string, Symbol>>): Result<ToBoolean> {
    let args: [ToTxt, ToTxt, ReadonlyArray<ToTxt>] = this.value.value;
    if (this.value instanceof Equals) {
      let v = args[0].get_text(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_text(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value === v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === true) {
                  let v2 = prev.get_text(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_text(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(
                        new Bool(v2.value.value === v3.value.value)
                      );
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else if (this.value instanceof GreaterThan) {
      let v = args[0].get_text(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_text(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value < v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === true) {
                  let v2 = prev.get_text(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_text(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(new Bool(v2.value.value < v3.value.value));
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else if (this.value instanceof LessThan) {
      let v = args[0].get_text(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_text(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value > v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === true) {
                  let v2 = prev.get_text(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_text(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(new Bool(v2.value.value > v3.value.value));
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else if (this.value instanceof GreaterThanEquals) {
      let v = args[0].get_text(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_text(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value <= v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === true) {
                  let v2 = prev.get_text(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_text(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(new Bool(v2.value.value <= v3.value.value));
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else if (this.value instanceof LessThanEquals) {
      let v = args[0].get_text(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_text(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value >= v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === true) {
                  let v2 = prev.get_text(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_text(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(new Bool(v2.value.value >= v3.value.value));
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else {
      const _exhaustiveCheck: never = this.value;
      return _exhaustiveCheck;
    }
  }

  get_paths(): Array<PathString> {
    return apply([] as Array<PathString>, (it) => {
      it = it.concat(this.value.value[0].get_paths());
      it = it.concat(this.value.value[1].get_paths());
      for (const expr of this.value.value[2]) {
        it = it.concat(expr.get_paths());
      }
      return it;
    });
  }

  serialize(): any {
    let args: Array<any> = [];
    args.push(this.value.value[0].serialize());
    args.push(this.value.value[1].serialize());
    for (const arg of this.value.value[2]) {
      args.push(arg.serialize());
    }
    if (this.value instanceof Equals) {
      return {
        op: "==",
        type: "Text",
        args: args,
      };
    } else if (this.value instanceof GreaterThan) {
      return {
        op: "<",
        type: "Text",
        args: args,
      };
    } else if (this.value instanceof LessThan) {
      return {
        op: ">",
        type: "Text",
        args: args,
      };
    } else if (this.value instanceof GreaterThanEquals) {
      return {
        op: "<=",
        type: "Text",
        args: args,
      };
    } else if (this.value instanceof LessThanEquals) {
      return {
        op: ">=",
        type: "Text",
        args: args,
      };
    } else {
      const _exhaustiveCheck: never = this.value;
      return _exhaustiveCheck;
    }
  }
}

export class And {
  value: [ToBoolean, ToBoolean, ReadonlyArray<ToBoolean>];

  constructor(value: [ToBoolean, ToBoolean, ReadonlyArray<ToBoolean>]) {
    this.value = value;
  }
}

export class Or {
  value: [ToBoolean, ToBoolean, ReadonlyArray<ToBoolean>];

  constructor(value: [ToBoolean, ToBoolean, ReadonlyArray<ToBoolean>]) {
    this.value = value;
  }
}

type LogicalBinaryExpressionVariant = And | Or;

export class LogicalBinaryExpression implements ToBoolean {
  value: LogicalBinaryExpressionVariant;

  constructor(value: LogicalBinaryExpressionVariant) {
    this.value = value;
  }

  equals(other: this, symbols: Readonly<Record<string, Symbol>>): boolean {
    let v = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      let v1 = v.value.get_boolean(inject_system_constants(symbols));
      if (unwrap(v1)) {
        let v2 = other.eval(inject_system_constants(symbols));
        if (unwrap(v2)) {
          let v3 = v2.value.get_boolean(inject_system_constants(symbols));
          if (unwrap(v3)) {
            return v1.value.value === v3.value.value;
          }
        }
      }
    }
    return false;
  }

  get_result(symbols: Readonly<Record<string, Symbol>>): Result<LispResult> {
    return this.get_boolean(inject_system_constants(symbols));
  }

  get_boolean(symbols: Readonly<Record<string, Symbol>>): Result<Bool> {
    let v: Result<ToBoolean> = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      return v.value.get_boolean(inject_system_constants(symbols));
    } else {
      return v;
    }
  }

  get_text(symbols: Readonly<Record<string, Symbol>>): Result<Txt> {
    let v: Result<ToBoolean> = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      return v.value.get_text(inject_system_constants(symbols));
    } else {
      return v;
    }
  }

  eval(symbols: Readonly<Record<string, Symbol>>): Result<ToBoolean> {
    let args: [ToBoolean, ToBoolean, ReadonlyArray<ToBoolean>] =
      this.value.value;
    if (this.value instanceof And) {
      let v = args[0].get_boolean(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_boolean(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value && v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === true) {
                  let v2 = prev.get_boolean(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_boolean(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(new Bool(v2.value.value && v3.value.value));
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else if (this.value instanceof Or) {
      let v = args[0].get_boolean(inject_system_constants(symbols));
      if (unwrap(v)) {
        let v1 = args[1].get_boolean(inject_system_constants(symbols));
        if (unwrap(v1)) {
          let result: Result<Bool> = fold_prev(
            new Ok(new Bool(v.value.value || v1.value.value)) as Result<Bool>,
            args[1],
            args[2],
            (acc, prev, val) => {
              if (unwrap(acc)) {
                if (acc.value.value === false) {
                  let v2 = prev.get_boolean(inject_system_constants(symbols));
                  if (unwrap(v2)) {
                    let v3 = val.get_boolean(inject_system_constants(symbols));
                    if (unwrap(v3)) {
                      return new Ok(new Bool(v2.value.value || v3.value.value));
                    }
                  }
                }
              }
              return acc;
            }
          );
          return result;
        }
      }
      return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
    } else {
      const _exhaustiveCheck: never = this.value;
      return _exhaustiveCheck;
    }
  }

  get_paths(): Array<PathString> {
    return apply([] as Array<PathString>, (it) => {
      it = it.concat(this.value.value[0].get_paths());
      it = it.concat(this.value.value[1].get_paths());
      for (const expr of this.value.value[2]) {
        it = it.concat(expr.get_paths());
      }
      return it;
    });
  }

  serialize(): any {
    let args: Array<any> = [];
    args.push(this.value.value[0].serialize());
    args.push(this.value.value[1].serialize());
    for (const arg of this.value.value[2]) {
      args.push(arg.serialize());
    }
    if (this.value instanceof And) {
      return {
        op: "and",
        args: args,
      };
    } else if (this.value instanceof Or) {
      return {
        op: "or",
        args: args,
      };
    } else {
      const _exhaustiveCheck: never = this.value;
      return _exhaustiveCheck;
    }
  }
}

export class Not {
  value: ToBoolean;

  constructor(value: ToBoolean) {
    this.value = value;
  }
}

type LogicalUnaryExpressionVariant = Not;

export class LogicalUnaryExpression implements ToBoolean {
  value: LogicalUnaryExpressionVariant;

  constructor(value: LogicalUnaryExpressionVariant) {
    this.value = value;
  }

  get_result(symbols: Readonly<Record<string, Symbol>>): Result<LispResult> {
    return this.get_boolean(inject_system_constants(symbols));
  }

  equals(other: this, symbols: Readonly<Record<string, Symbol>>): boolean {
    let v = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      let v1 = v.value.get_boolean(inject_system_constants(symbols));
      if (unwrap(v1)) {
        let v2 = other.eval(inject_system_constants(symbols));
        if (unwrap(v2)) {
          let v3 = v2.value.get_boolean(inject_system_constants(symbols));
          if (unwrap(v3)) {
            return v1.value.value === v3.value.value;
          }
        }
      }
    }
    return false;
  }

  get_boolean(symbols: Readonly<Record<string, Symbol>>): Result<Bool> {
    let v: Result<ToBoolean> = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      return v.value.get_boolean(inject_system_constants(symbols));
    } else {
      return v;
    }
  }

  get_text(symbols: Readonly<Record<string, Symbol>>): Result<Txt> {
    let v: Result<ToBoolean> = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      return v.value.get_text(inject_system_constants(symbols));
    } else {
      return v;
    }
  }

  eval(symbols: Readonly<Record<string, Symbol>>): Result<ToBoolean> {
    let args: ToBoolean = this.value.value;
    let v = args.get_boolean(inject_system_constants(symbols));
    if (unwrap(v)) {
      return new Ok(new Bool(!v.value.value));
    }
    return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  }

  get_paths(): Array<PathString> {
    return this.value.value.get_paths();
  }

  serialize(): any {
    let args: Array<any> = [];
    args.push(this.value.value.serialize());
    return {
      op: "not",
      args: args,
    };
  }
}

export class Match<T extends ToValue, U extends ToValue> {
  value: [T, ReadonlyArray<[T, U]>, U];

  constructor(value: [T, ReadonlyArray<[T, U]>, U]) {
    this.value = value;
  }
}

export class MatchExpression<T extends ToValue, U extends ToValue>
  implements ToNum, ToDeci, ToTxt, ToBoolean
{
  value: Match<T, U>;

  constructor(value: Match<T, U>) {
    this.value = value;
  }

  equals(other: this, symbols: Readonly<Record<string, Symbol>>): boolean {
    let v = this.get_result(inject_system_constants(symbols));
    if (unwrap(v)) {
      if (v.value instanceof ToNum) {
        let v1 = other.get_result(inject_system_constants(symbols));
        if (unwrap(v1)) {
          if (v1.value instanceof ToNum) {
            let v2 = v.value.get_number(inject_system_constants(symbols));
            let v3 = v1.value.get_number(inject_system_constants(symbols));
            if (unwrap(v2) && unwrap(v3)) {
              return v2.value.value === v3.value.value;
            }
          } else if (v1.value instanceof ToDeci) {
            let v2 = v.value.get_number(inject_system_constants(symbols));
            let v3 = v1.value.get_number(inject_system_constants(symbols));
            if (unwrap(v2) && unwrap(v3)) {
              return v2.value.value === v3.value.value;
            }
          }
        }
      } else if (v.value instanceof ToDeci) {
        let v1 = other.get_result(inject_system_constants(symbols));
        if (unwrap(v1)) {
          if (v1.value instanceof ToDeci) {
            let v2 = v.value.get_decimal(inject_system_constants(symbols));
            let v3 = v1.value.get_decimal(inject_system_constants(symbols));
            if (unwrap(v2) && unwrap(v3)) {
              return v2.value.value === v3.value.value;
            }
          } else if (v1.value instanceof ToNum) {
            let v2 = v.value.get_decimal(inject_system_constants(symbols));
            let v3 = v1.value.get_number(inject_system_constants(symbols));
            if (unwrap(v2) && unwrap(v3)) {
              return v2.value.value === v3.value.value;
            }
          }
        }
      } else if (v.value instanceof ToTxt) {
        let v1 = other.get_result(inject_system_constants(symbols));
        if (unwrap(v1)) {
          if (v1.value instanceof ToTxt) {
            let v2 = v.value.get_text(inject_system_constants(symbols));
            let v3 = v1.value.get_text(inject_system_constants(symbols));
            if (unwrap(v2) && unwrap(v3)) {
              return v2.value.value === v3.value.value;
            }
          }
        }
      } else if (v.value instanceof ToBoolean) {
        let v1 = other.get_result(inject_system_constants(symbols));
        if (unwrap(v1)) {
          if (v1.value instanceof ToBoolean) {
            let v2 = v.value.get_boolean(inject_system_constants(symbols));
            let v3 = v1.value.get_boolean(inject_system_constants(symbols));
            if (unwrap(v2) && unwrap(v3)) {
              return v2.value.value === v3.value.value;
            }
          }
        }
      }
    }
    return false;
  }

  get_result(symbols: Readonly<Record<string, Symbol>>): Result<LispResult> {
    return this.eval(inject_system_constants(symbols));
  }

  get_number(symbols: Readonly<Record<string, Symbol>>): Result<Num> {
    let v = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      if (v.value instanceof ToNum) {
        let v1 = v.value.get_number(inject_system_constants(symbols));
        if (unwrap(v1)) {
          return v1;
        }
      } else if (v.value instanceof ToDeci) {
        let v1 = v.value.get_decimal(inject_system_constants(symbols));
        if (unwrap(v1)) {
          return new Ok(new Num(v1.value.value));
        }
      }
    }
    return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  }

  get_decimal(symbols: Readonly<Record<string, Symbol>>): Result<Deci> {
    let v = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      if (v.value instanceof ToDeci) {
        let v1 = v.value.get_decimal(inject_system_constants(symbols));
        if (unwrap(v1)) {
          return v1;
        }
      } else if (v.value instanceof ToNum) {
        let v1 = v.value.get_number(inject_system_constants(symbols));
        if (unwrap(v1)) {
          return new Ok(new Deci(v1.value.value));
        }
      }
    }
    return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  }

  get_text(symbols: Readonly<Record<string, Symbol>>): Result<Txt> {
    let v = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      if (v.value instanceof ToTxt) {
        let v1 = v.value.get_text(inject_system_constants(symbols));
        if (unwrap(v1)) {
          return v1;
        }
      }
    }
    return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  }

  get_boolean(symbols: Readonly<Record<string, Symbol>>): Result<Bool> {
    let v = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      if (v.value instanceof ToBoolean) {
        let v1 = v.value.get_boolean(inject_system_constants(symbols));
        if (unwrap(v1)) {
          return v1;
        }
      }
    }
    return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  }

  eval(symbols: Readonly<Record<string, Symbol>>): Result<LispResult> {
    let args: [T, ReadonlyArray<[T, U]>, U] = this.value.value;
    let condition: Result<LispResult> = args[0].get_result(
      inject_system_constants(symbols)
    );
    if (unwrap(condition)) {
      for (const guard of args[1]) {
        let v: Result<LispResult> = guard[0].get_result(
          inject_system_constants(symbols)
        );
        if (unwrap(v)) {
          if (condition.value instanceof Num && v.value instanceof Num) {
            if (condition.value.equals(v.value, symbols)) {
              return guard[1].get_result(inject_system_constants(symbols));
            }
          } else if (
            condition.value instanceof Deci &&
            v.value instanceof Deci
          ) {
            if (condition.value.equals(v.value, symbols)) {
              return guard[1].get_result(inject_system_constants(symbols));
            }
          } else if (condition.value instanceof Txt && v.value instanceof Txt) {
            if (condition.value.equals(v.value, symbols)) {
              return guard[1].get_result(inject_system_constants(symbols));
            }
          } else if (
            condition.value instanceof Bool &&
            v.value instanceof Bool
          ) {
            if (condition.value.equals(v.value, symbols)) {
              return guard[1].get_result(inject_system_constants(symbols));
            }
          }
        }
      }
      let otherwise: Result<LispResult> = args[2].get_result(
        inject_system_constants(symbols)
      );
      return otherwise;
    }
    return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  }

  get_paths(): Array<PathString> {
    return apply([] as Array<PathString>, (it) => {
      it = it.concat(this.value.value[0].get_paths());
      for (const expr of this.value.value[1]) {
        it = it.concat(expr[0].get_paths());
        it = it.concat(expr[1].get_paths());
      }
      it = it.concat(this.value.value[2].get_paths());
      return it;
    });
  }

  serialize(): any {
    let args: Array<any> = [];
    args.push(this.value.value[0].serialize());
    let guards: Array<[any, any]> = [];
    for (const arg of this.value.value[1]) {
      guards.push([arg[0].serialize(), arg[1].serialize()]);
    }
    args.push(this.value.value[2].serialize());
    if (this.value.value[2] instanceof ToNum) {
      if (this.value.value[0] instanceof ToNum) {
        return {
          op: "match",
          type: ["Number", "Number"],
          args: args,
        };
      } else if (this.value.value[0] instanceof ToDeci) {
        return {
          op: "match",
          type: ["Number", "Decimal"],
          args: args,
        };
      } else if (this.value.value[0] instanceof ToTxt) {
        return {
          op: "match",
          type: ["Number", "Text"],
          args: args,
        };
      } else if (this.value.value[0] instanceof ToBoolean) {
        return {
          op: "match",
          type: ["Number", "Boolean"],
          args: args,
        };
      }
    } else if (this.value.value[2] instanceof ToDeci) {
      if (this.value.value[0] instanceof ToNum) {
        return {
          op: "match",
          type: ["Decimal", "Number"],
          args: args,
        };
      } else if (this.value.value[0] instanceof ToDeci) {
        return {
          op: "match",
          type: ["Decimal", "Decimal"],
          args: args,
        };
      } else if (this.value.value[0] instanceof ToTxt) {
        return {
          op: "match",
          type: ["Decimal", "Text"],
          args: args,
        };
      } else if (this.value.value[0] instanceof ToBoolean) {
        return {
          op: "match",
          type: ["Decimal", "Boolean"],
          args: args,
        };
      }
    } else if (this.value.value[2] instanceof ToTxt) {
      if (this.value.value[0] instanceof ToNum) {
        return {
          op: "match",
          type: ["Text", "Number"],
          args: args,
        };
      } else if (this.value.value[0] instanceof ToDeci) {
        return {
          op: "match",
          type: ["Text", "Decimal"],
          args: args,
        };
      } else if (this.value.value[0] instanceof ToTxt) {
        return {
          op: "match",
          type: ["Text", "Text"],
          args: args,
        };
      } else if (this.value.value[0] instanceof ToBoolean) {
        return {
          op: "match",
          type: ["Text", "Boolean"],
          args: args,
        };
      }
    } else if (this.value.value[2] instanceof ToBoolean) {
      if (this.value.value[0] instanceof ToNum) {
        return {
          op: "match",
          type: ["Boolean", "Number"],
          args: args,
        };
      } else if (this.value.value[0] instanceof ToDeci) {
        return {
          op: "match",
          type: ["Boolean", "Decimal"],
          args: args,
        };
      } else if (this.value.value[0] instanceof ToTxt) {
        return {
          op: "match",
          type: ["Boolean", "Text"],
          args: args,
        };
      } else if (this.value.value[0] instanceof ToBoolean) {
        return {
          op: "match",
          type: ["Boolean", "Boolean"],
          args: args,
        };
      }
    }
    return {
      op: "match",
      type: ["?", "?"],
      args: args,
    };
  }
}

export class Dot {
  value: ReadonlyArray<string>;

  constructor(value: ReadonlyArray<string>) {
    this.value = value;
  }
}

export class DotExpression implements ToNum, ToTxt, ToBoolean {
  value: Dot;

  constructor(value: Dot) {
    this.value = value;
  }

  equals(other: this, symbols: Readonly<Record<string, Symbol>>): boolean {
    let v = this.get_result(inject_system_constants(symbols));
    if (unwrap(v)) {
      if (v.value instanceof ToNum) {
        let v1 = other.get_result(inject_system_constants(symbols));
        if (unwrap(v1)) {
          if (v1.value instanceof ToNum) {
            let v2 = v.value.get_number(inject_system_constants(symbols));
            let v3 = v1.value.get_number(inject_system_constants(symbols));
            if (unwrap(v2) && unwrap(v3)) {
              return v2.value.value === v3.value.value;
            }
          } else if (v1.value instanceof ToDeci) {
            let v2 = v.value.get_number(inject_system_constants(symbols));
            let v3 = v1.value.get_number(inject_system_constants(symbols));
            if (unwrap(v2) && unwrap(v3)) {
              return v2.value.value === v3.value.value;
            }
          }
        }
      } else if (v.value instanceof ToDeci) {
        let v1 = other.get_result(inject_system_constants(symbols));
        if (unwrap(v1)) {
          if (v1.value instanceof ToDeci) {
            let v2 = v.value.get_decimal(inject_system_constants(symbols));
            let v3 = v1.value.get_decimal(inject_system_constants(symbols));
            if (unwrap(v2) && unwrap(v3)) {
              return v2.value.value === v3.value.value;
            }
          } else if (v1.value instanceof ToNum) {
            let v2 = v.value.get_decimal(inject_system_constants(symbols));
            let v3 = v1.value.get_number(inject_system_constants(symbols));
            if (unwrap(v2) && unwrap(v3)) {
              return v2.value.value === v3.value.value;
            }
          }
        }
      } else if (v.value instanceof ToTxt) {
        let v1 = other.get_result(inject_system_constants(symbols));
        if (unwrap(v1)) {
          if (v1.value instanceof ToTxt) {
            let v2 = v.value.get_text(inject_system_constants(symbols));
            let v3 = v1.value.get_text(inject_system_constants(symbols));
            if (unwrap(v2) && unwrap(v3)) {
              return v2.value.value === v3.value.value;
            }
          }
        }
      } else if (v.value instanceof ToBoolean) {
        let v1 = other.get_result(inject_system_constants(symbols));
        if (unwrap(v1)) {
          if (v1.value instanceof ToBoolean) {
            let v2 = v.value.get_boolean(inject_system_constants(symbols));
            let v3 = v1.value.get_boolean(inject_system_constants(symbols));
            if (unwrap(v2) && unwrap(v3)) {
              return v2.value.value === v3.value.value;
            }
          }
        }
      }
    }
    return false;
  }

  get_result(symbols: Readonly<Record<string, Symbol>>): Result<LispResult> {
    return this.eval(inject_system_constants(symbols));
  }

  get_number(symbols: Readonly<Record<string, Symbol>>): Result<Num> {
    let v = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      if (v.value instanceof Num) {
        let v1 = v.value.get_number(inject_system_constants(symbols));
        if (unwrap(v1)) {
          return v1;
        }
      } else if (v.value instanceof Deci) {
        let v1 = v.value.get_number(inject_system_constants(symbols));
        if (unwrap(v1)) {
          return new Ok(new Num(v1.value.value));
        }
      }
    }
    return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  }

  get_decimal(symbols: Readonly<Record<string, Symbol>>): Result<Deci> {
    let v = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      if (v.value instanceof Deci) {
        let v1 = v.value.get_decimal(inject_system_constants(symbols));
        if (unwrap(v1)) {
          return v1;
        }
      } else if (v.value instanceof Num) {
        let v1 = v.value.get_number(inject_system_constants(symbols));
        if (unwrap(v1)) {
          return new Ok(new Deci(v1.value.value));
        }
      }
    }
    return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  }

  get_text(symbols: Readonly<Record<string, Symbol>>): Result<Txt> {
    let v = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      if (v.value instanceof Txt) {
        let v1 = v.value.get_text(inject_system_constants(symbols));
        if (unwrap(v1)) {
          return v1;
        }
      }
    }
    return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  }

  get_boolean(symbols: Readonly<Record<string, Symbol>>): Result<Bool> {
    let v = this.eval(inject_system_constants(symbols));
    if (unwrap(v)) {
      if (v.value instanceof Bool) {
        let v1 = v.value.get_boolean(inject_system_constants(symbols));
        if (unwrap(v1)) {
          return v1;
        }
      }
    }
    return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  }

  eval(symbols: Readonly<Record<string, Symbol>>): Result<LispResult> {
    let result: Result<Leaf> = this.get_leaf(this.value.value, symbols);
    return result;
  }

  get_leaf(
    path: ReadonlyArray<string>,
    symbols: Readonly<Record<string, Symbol>>
  ): Result<Leaf> {
    if (path.length !== 0) {
      let v = path[0];
      if (v in symbols) {
        let v1: Symbol = symbols[v];
        if (v1.value.value) {
          let v2: Leaf = v1.value.value.value;
          return new Ok(v2);
        } else {
          let v2: Record<string, Symbol> = v1.value.values;
          return this.get_leaf(path.slice(1), v2);
        }
      }
    }
    return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
  }

  get_paths(): Array<PathString> {
    return apply(this.value.value, (path) => {
      if (path.length !== 0) {
        return [[path.slice(0, path.length - 1), path[path.length - 1]]];
      }
      return [];
    });
  }

  serialize(): any {
    return {
      op: ".",
      args: this.value.value,
    };
  }
}

export function get_system_constants() {
  return {
    max_private_resource_count: new Num(10),
    max_public_resource_count: new Num(10),
    user_id: new Num(getState().params.user_id.truncated().toNumber()),
  };
}

function inject_system_constants(
  symbols: Readonly<Record<string, Symbol>>
): Readonly<Record<string, Symbol>> {
  const system_constants: Record<string, Leaf> = get_system_constants();
  const values: Record<string, Symbol> = {};
  for (const symbol_name of Object.keys(system_constants)) {
    values[symbol_name] = new Symbol({
      value: new Ok(system_constants[symbol_name]),
      values: {},
    });
  }
  const updated_symbols = { ...symbols };
  updated_symbols["_system"] = new Symbol({
    value: undefined,
    values: values,
  });
  return updated_symbols;
}
