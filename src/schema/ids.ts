import { resource_type_ids } from "./structs/system/Resource_Type/load";
import { user_ids } from "./structs/system/User";
import { test_ids } from "./structs/test/Test/load";

export const ids = {
  ...user_ids,
  ...test_ids,
  ...resource_type_ids,
};
