import { Transform } from "../../../../lib/transform";

export default {
  Create_Public_Resource_Tag: new Transform(
    "Create_Public_Resource_Tag",
    "fx",
    "Create_Public_Resource_Tag",
    undefined
  ),
  Create_Private_Resource_Tag_From_Public_Resource_Tag: new Transform(
    "Create_Private_Resource_Tag_From_Public_Resource_Tag",
    "fx",
    "Create_Private_Resource_Tag_From_Public_Resource_Tag",
    {
      struct: "Private_Resource_Tag",
      fields: ["public_resource"],
      map: { tag: [[], "tag"] },
    }
  ),
};
