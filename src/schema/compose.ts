import { Compose, Result, Ok, Err, CustomError, errors, ErrMsg } from "../lib";

import Private_Resource from "./structs/user/Private_Resource/compose";
import Private_Resource_Tag from "./structs/user/Private_Resource_Tag/compose";
import Public_Resource from "./structs/user/Public_Resource/compose";
import Public_Resource_Tag from "./structs/user/Public_Resource_Tag/compose";

// Tag will make lookups faster, so no need to remove it

// Conversion to/from PrivateResource and PublicResource with their tags

// Add checks to match user when deleting private/public resource or their tags
// This is required because others may provide them as args because of readability only
// Same goes for replace operation

const schema: Record<string, Compose> = {
  ...Private_Resource,
  ...Private_Resource_Tag,
  ...Public_Resource,
  ...Public_Resource_Tag,
};

export function get_compose(compose_name: string): Result<Compose> {
  if (compose_name in schema && schema[compose_name].user_invocable) {
    return new Ok(schema[compose_name]);
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
