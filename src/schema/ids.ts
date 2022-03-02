import { test_ids } from "./struct/test/Test";
import { resource_type_ids } from "./struct/system/Resource_Type";
import { user_ids } from "./struct/system/User";

export const ids = {
  ...user_ids,
  ...test_ids,
  ...resource_type_ids,
};
