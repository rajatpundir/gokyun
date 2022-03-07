import { Transform } from "../../../../lib/transform";

export default {
  Create_Private_Resource_Tag: new Transform(
    "Create_Private_Resource_Tag",
    "fx",
    "Create_Private_Resource_Tag",
    undefined
  ),
  Delete_Public_Resource_Tag_By_Public_Resource: new Transform(
    "Delete_Public_Resource_Tag_By_Public_Resource",
    "fx",
    "Delete_Private_Resource_Tag",
    undefined
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
