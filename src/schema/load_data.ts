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
  if (unwrap(compose)) {
    let result = await compose.value.run({
      resource_type: {
        type: "other",
        other: "Resource_Type",
        value: ids.ResourceType["image/jpeg"]._id,
      },
      url: {
        type: "str",
        value:
          "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885__480.jpg",
      },
      tags: {
        type: "list",
        value: [
          {
            name: {
              type: "str",
              value: "tree",
            },
          },
          {
            name: {
              type: "str",
              value: "landscape",
            },
          },
          {
            name: {
              type: "str",
              value: "image",
            },
          },
        ],
      },
    });
    console.log(result);
    console.log(
      "-------------------------------------------------------------------"
    );
    result = await compose.value.run({
      resource_type: {
        type: "other",
        other: "Resource_Type",
        value: ids.ResourceType["image/png"]._id,
      },
      url: {
        type: "str",
        value: "http://www.clipartbest.com/cliparts/RTG/yBy/RTGyBy7yc.png",
      },
      tags: {
        type: "list",
        value: [
          {
            name: {
              type: "str",
              value: "dragon-ball",
            },
          },
          {
            name: {
              type: "str",
              value: "seiyan",
            },
          },
          {
            name: {
              type: "str",
              value: "image",
            },
          },
        ],
      },
    });
    console.log(result);
    console.log(
      "-------------------------------------------------------------------"
    );
    result = await compose.value.run({
      resource_type: {
        type: "other",
        other: "Resource_Type",
        value: ids.ResourceType["video/mp4"]._id,
      },
      url: {
        type: "str",
        value:
          "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4",
      },
      tags: {
        type: "list",
        value: [
          {
            name: {
              type: "str",
              value: "big",
            },
          },
          {
            name: {
              type: "str",
              value: "buck",
            },
          },
          {
            name: {
              type: "str",
              value: "bunny",
            },
          },
          {
            name: {
              type: "str",
              value: "video",
            },
          },
        ],
      },
    });
    console.log(result);
    console.log(
      "-------------------------------------------------------------------"
    );
  }
}
