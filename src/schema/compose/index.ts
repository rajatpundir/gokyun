import {
  Compose,
  Result,
  Ok,
  Err,
  CustomError,
  errors,
  ErrMsg,
  ComposeStep,
} from "../../lib";

const schema: Record<string, Compose> = {
  Create_Private_Resource: new Compose(
    "Create_Private_Resource",
    {},
    new ComposeStep(undefined, []),
    {}
  ),
  Create_Public_Resource: new Compose(
    "Create_Public_Resource",
    {},
    new ComposeStep(undefined, []),
    {}
  ),
};

export function get_compose(compose_name: string): Result<Compose> {
  if (compose_name in schema) {
    return new Ok(schema[compose_name]);
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
