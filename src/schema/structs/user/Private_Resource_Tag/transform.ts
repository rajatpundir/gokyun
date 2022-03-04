import { Transform } from "../../../../lib";

export default {
  Create_Private_Resource_Tag: new Transform(
    "Create_Private_Resource_Tag",
    "fx",
    "Create_Private_Resource_Tag",
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
