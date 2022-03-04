import {
  Transform,
  Result,
  Ok,
  Err,
  CustomError,
  errors,
  ErrMsg,
} from "../lib";

import Tag from "./structs/system/Tag/transform";
import Private_Resource_Tag from "./structs/user/Private_Resource_Tag/transform";
import Public_Resource_Tag from "./structs/user/Public_Resource_Tag/transform";

const schema: Record<string, Transform> = {
  ...Tag,
  ...Private_Resource_Tag,
  ...Public_Resource_Tag,
};

export function get_transform(transform_name: string): Result<Transform> {
  if (transform_name in schema && schema[transform_name].user_invocable) {
    return new Ok(schema[transform_name]);
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
