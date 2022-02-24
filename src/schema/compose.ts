import { Compose } from "../lib/utils/compose";
import { errors, ErrMsg } from "../lib/utils/errors";
import { Result, Err, CustomError } from "../lib/utils/prelude";

export function get_compose(compose_name: string): Result<Compose> {
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
