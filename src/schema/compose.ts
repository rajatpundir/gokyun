import { Compose } from "../lib/utils/compose";
import { errors, ErrMsg } from "../lib/utils/errors";
import { Result, Err, CustomError, Ok } from "../lib/utils/prelude";

const schema: Record<string, Compose> = {};

export function get_compose(compose_name: string): Result<Compose> {
  if (compose_name in schema) {
    return new Ok(schema[compose_name]);
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
