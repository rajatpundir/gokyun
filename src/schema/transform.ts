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

const transforms = {
  ...Tag,
  ...Private_Resource_Tag,
  ...Public_Resource_Tag,
};

export type TransformName = keyof typeof transforms;

const schema: Record<string, Transform> = transforms;

export function get_transform(
  transform_name: TransformName,
  user_invoked: boolean = true
): Result<Transform> {
  if (transform_name in schema && schema[transform_name].user_invocable) {
    if (user_invoked) {
      if (schema[transform_name].user_invocable) {
        return new Ok(schema[transform_name]);
      }
    } else {
      return new Ok(schema[transform_name]);
    }
  }
  console.log("[ERROR] Invalid transform: ", transform_name);
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
