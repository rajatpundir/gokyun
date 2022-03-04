import { test_ids } from "./structs/test/Test";
import { resource_type_ids } from "./structs/system/Resource_Type";
import { user_ids } from "./structs/system/User";

export const ids = {
  ...user_ids,
  ...test_ids,
  ...resource_type_ids,
};
