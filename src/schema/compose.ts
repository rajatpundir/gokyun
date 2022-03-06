import { Compose } from "../lib/compose";
import { errors, ErrMsg } from "../lib/errors";
import { Result, Ok, Err, CustomError } from "../lib/prelude";
import Private_Resource from "./structs/user/Private_Resource/compose";
import Private_Resource_Tag from "./structs/user/Private_Resource_Tag/compose";
import Public_Resource from "./structs/user/Public_Resource/compose";
import Public_Resource_Tag from "./structs/user/Public_Resource_Tag/compose";

const composes = {
  ...Private_Resource,
  ...Private_Resource_Tag,
  ...Public_Resource,
  ...Public_Resource_Tag,
};

export type ComposeName = keyof typeof composes;

const schema: Record<string, Compose> = composes;

export function get_compose(
  compose_name: ComposeName,
  user_invoked: boolean = true
): Result<Compose> {
  if (compose_name in schema && schema[compose_name].user_invocable) {
    if (user_invoked) {
      if (schema[compose_name].user_invocable) {
        return new Ok(schema[compose_name]);
      }
    } else {
      return new Ok(schema[compose_name]);
    }
  }
  console.log("[ERROR] Invalid compose: ", compose_name);
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
