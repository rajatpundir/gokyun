import {
  Transform,
  Result,
  Ok,
  Err,
  CustomError,
  errors,
  ErrMsg,
} from "../../lib";

const schema: Record<string, Transform> = {
  Create_Tag: new Transform("Create_Tag", "fx", "Create_Tag", undefined),
  Create_Private_Resource_Tag: new Transform(
    "Create_Private_Resource_Tag",
    "fx",
    "Create_Private_Resource_Tag",
    undefined
  ),
  Delete_Private_Resource_Tag: new Transform(
    "Delete_Private_Resource_Tag",
    "fx",
    "Delete_Private_Resource_Tag",
    {
      struct: "Private_Resource_Tag",
      fields: ["private_resource"],
      map: { private_resource: [[], "private_resource"], tag: [[], "tag"] },
    }
  ),
  Create_Public_Resource_Tag: new Transform(
    "Create_Public_Resource_Tag",
    "fx",
    "Create_Public_Resource_Tag",
    undefined
  ),
  Delete_Public_Resource_Tag: new Transform(
    "Delete_Public_Resource_Tag",
    "fx",
    "Delete_Public_Resource_Tag",
    {
      struct: "Public_Resource_Tag",
      fields: ["public_resource"],
      map: { public_resource: [[], "public_resource"], tag: [[], "tag"] },
    }
  ),
};

export function get_transform(transform_name: string): Result<Transform> {
  if (transform_name in schema) {
    return new Ok(schema[transform_name]);
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
