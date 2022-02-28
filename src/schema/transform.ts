import { errors, ErrMsg } from "../lib/errors";
import { Result, Err, CustomError, Ok } from "../lib/prelude";
import { Transform } from "../lib/transform";

const schema: Record<string, Transform> = {};

export function get_transform(transform_name: string): Result<Transform> {
  if (transform_name in schema) {
    return new Ok(schema[transform_name]);
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
