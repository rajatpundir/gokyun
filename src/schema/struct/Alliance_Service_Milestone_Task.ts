import { StructSchema } from ".";

export default {
  fields: {
    alliance_service_milestone: {
      type: "other",
      other: "Alliance_Service_Milestone",
    },
    alliance_service_task: { type: "other", other: "Alliance_Service_Task" },
  },
  uniqueness: [[["alliance_service_milestone"], "alliance_service_task"]],
  permissions: {
    borrow: {},
    ownership: {
      alliance_service_milestone: {
        read: [],
        write: [],
      },
      alliance_service_task: {
        read: [],
        write: [],
      },
    },
    public: ["alliance_service_milestone", "alliance_service_task"],
  },
  triggers: {},
  checks: {},
} as StructSchema;
