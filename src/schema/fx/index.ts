import { errors, ErrMsg } from "../../lib/errors";
import { Fx } from "../../lib/fx";
import { Result, Err, CustomError, Ok } from "../../lib/prelude";

const schema: Record<string, Fx> = {};

export function get_fx(fx_name: string): Result<Fx> {
  if (fx_name in schema) {
    return new Ok(schema[fx_name]);
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
