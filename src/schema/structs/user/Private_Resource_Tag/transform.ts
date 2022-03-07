import { Transform } from "../../../../lib/transform";

export default {
  Create_Private_Resource_Tag: new Transform(
    "Create_Private_Resource_Tag",
    "fx",
    "Create_Private_Resource_Tag",
    undefined
  ),
  Delete_Private_Resource_Tag_By_Private_Resource: new Transform(
    "Delete_Private_Resource_Tag_By_Private_Resource",
    "fx",
    "Delete_Private_Resource_Tag",
    {
      struct: "Private_Resource_Tag",
      fields: ["private_resource"],
      map: { private_resource_tag: [[], "_id"] },
    }
  ),
  Create_Public_Resource_Tag_From_Private_Resource_Tag: new Transform(
    "Create_Public_Resource_Tag_From_Private_Resource_Tag",
    "fx",
    "Create_Public_Resource_Tag_From_Private_Resource_Tag",
    {
      struct: "Public_Resource_Tag",
      fields: ["private_resource"],
      map: { tag: [[], "tag"] },
    }
  ),
};
