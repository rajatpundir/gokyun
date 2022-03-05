import { CustomError, Err, ErrMsg, errors, Fx, Ok, Result } from "../lib";

import Test from "./structs/test/Test/fx";
import Tag from "./structs/system/Tag/fx";
import Private_Resource from "./structs/user/Private_Resource/fx";
import Private_Resource_Tag from "./structs/user/Private_Resource_Tag/fx";
import Public_Resource from "./structs/user/Public_Resource/fx";
import Public_Resource_Tag from "./structs/user/Public_Resource_Tag/fx";

// All structs are created via Fx

// Resource_Type {
// 	type: string
// 	subtype: string
// }

// Public_Resource {
// 	resource_type: Resource_Type
// 	url: string
// 	owner: User
// }

// Public_Resource_Tag {
// 	public_resource: Public_Resource
// 	tag: Tag
// }

// Private_Resource {
// 	resource_type: Resource_Type
// 	url: string
// 	owner: User
// }

// Private_Resource_Tag {
// 	private_resource: Private_Resource
// 	tag: Tag
// }

const fxs = {
  ...Test,
  ...Tag,
  ...Private_Resource,
  ...Private_Resource_Tag,
  ...Public_Resource,
  ...Public_Resource_Tag,
};

export type FxName = keyof typeof fxs;

const schema: Record<string, Fx> = fxs;

export function get_fx(
  fx_name: FxName,
  user_invoked: boolean = true
): Result<Fx> {
  if (fx_name in schema) {
    if (user_invoked) {
      if (schema[fx_name].user_invocable) {
        return new Ok(schema[fx_name]);
      }
    } else {
      return new Ok(schema[fx_name]);
    }
  }
  console.log("[ERROR] Invalid fx: ", fx_name);
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
