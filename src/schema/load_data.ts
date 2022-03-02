import { replace_param } from "../lib";
import { load_resource_type } from "./struct/system/Resource_Type";
import { load_user } from "./struct/system/User";
import { load_test } from "./struct/test/Test";

export async function load_data() {
  await replace_param("theme", { type: "str", value: "Black" });
  await load_user();
  await load_test();
  await load_resource_type();
}
