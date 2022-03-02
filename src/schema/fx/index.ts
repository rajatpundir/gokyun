import { Fx, Result, Ok, Err, CustomError, errors, ErrMsg } from "../../lib";

import Create_Tag from "./system/Tag/Create_Tag";
import Create_Private_Resource from "./user/Private_Resource/Create_Private_Resource";
import Create_Private_Resource_Tag from "./user/Private_Resource_Tag/Create_Private_Resource_Tag";
import Create_Public_Resource from "./user/Public_Resource/Create_Public_Resource";
import Create_Public_Resource_Tag from "./user/Public_Resource_Tag/Create_Public_Resource_Tag";

const schema: Record<string, Fx> = {
  Create_Tag: Create_Tag,
  Create_Private_Resource: Create_Private_Resource,
  Create_Private_Resource_Tag: Create_Private_Resource_Tag,
  Create_Public_Resource: Create_Public_Resource,
  Create_Public_Resource_Tag: Create_Public_Resource_Tag,
};

export function get_fx(fx_name: string): Result<Fx> {
  if (fx_name in schema) {
    return new Ok(schema[fx_name]);
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
