import { Fx, Result, Ok, Err, CustomError, errors, ErrMsg } from "../../lib";

const schema: Record<string, Fx> = {};

export function get_fx(fx_name: string): Result<Fx> {
  if (fx_name in schema) {
    return new Ok(schema[fx_name]);
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
