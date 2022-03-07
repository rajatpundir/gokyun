import Decimal from "decimal.js";
import { unwrap } from "../lib";
import { replace_param } from "../lib/db";
import { get_compose } from "./compose";
import { ids } from "./ids";
import { load_resource_type } from "./structs/system/Resource_Type/load";
import { load_user } from "./structs/system/User/load";
import { load_test } from "./structs/test/Test/load";

export async function load_data() {
  await replace_param("theme", { type: "str", value: "Black" });
  await load_resource_type();
  await load_user();
  await load_test();
  const compose = get_compose("Create_Private_Resource");
  console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%111111111111111");
  if (unwrap(compose)) {
    const result = await compose.value.exec(
      {
        resource_type: {
          type: "other",
          other: "Resource_Type",
          value: ids.ResourceType["image/jpeg"]._id,
        },
        url: {
          type: "str",
          value: "some_url",
        },
        tags: {
          type: "list",
          value: [],
        },
      },
      new Decimal(0)
    );
    console.log(result);
  }
  console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%22222222222");
  const compose2 = get_compose("Create_Private_Resource");
  if (unwrap(compose2)) {
    const result = await compose2.value.exec(
      {
        resource_type: {
          type: "other",
          other: "Resource_Type",
          value: ids.ResourceType["image/png"]._id,
        },
        url: {
          type: "str",
          value: "some_url2",
        },
        tags: {
          type: "list",
          value: [],
        },
      },
      new Decimal(0)
    );
    console.log(result);
  }
  console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%33333333333");
}
