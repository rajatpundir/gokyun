import { errors, ErrMsg } from "../lib/utils/errors";
import { Result, Err, CustomError } from "../lib/utils/prelude";
import { Transform } from "../lib/utils/transform";

export function get_transform(transform_name: string): Result<Transform> {
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
