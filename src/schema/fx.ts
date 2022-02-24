import { errors, ErrMsg } from "../lib/utils/errors";
import { Fx } from "../lib/utils/fx";
import { Result, Err, CustomError } from "../lib/utils/prelude";

export function get_fx(fx_name: string): Result<Fx> {
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
