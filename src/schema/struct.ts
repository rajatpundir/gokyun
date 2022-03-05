import {
  WeakEnum,
  StructPermissions,
  StructTrigger,
  BooleanLispExpression,
  ErrMsg,
  Struct,
} from "../lib";

import Test from "./structs/test/Test";
import Test2 from "./structs/test/Test2";

import Country from "./structs/system/Country";
import Pincode from "./structs/system/Pincode";
import PincodeStats from "./structs/system/PincodeStats";
import Language from "./structs/system/Language";
import Tag from "./structs/system/Tag";
import User from "./structs/system/User";
import Resource_Type from "./structs/system/Resource_Type";

import Product_Category from "./structs/user/Product_Category";
import Product_Category_Translation from "./structs/user/Product_Category_Translation";
import Service_Category from "./structs/user/Service_Category";
import Service_Category_Translation from "./structs/user/Service_Category_Translation";
import Wallet from "./structs/user/Wallet";
import User_Product_Family from "./structs/user/User_Product_Family";
import User_Product_Family_Property from "./structs/user/User_Product_Family_Property";
import User_Product_Family_Property_Value from "./structs/user/User_Product_Family_Property_Value";
import User_Product from "./structs/user/User_Product";
import User_Product_Translation from "./structs/user/User_Product_Translation";
import User_Product_Family_Variant from "./structs/user/User_Product_Family_Variant";
import User_Product_Family_Variant_Property_Value from "./structs/user/User_Product_Family_Variant_Property_Value";
import Private_Resource from "./structs/user/Private_Resource";
import Private_Resource_Tag from "./structs/user/Private_Resource_Tag";
import Public_Resource from "./structs/user/Public_Resource";
import Public_Resource_Tag from "./structs/user/Public_Resource_Tag";

import Alliance from "./structs/alliance/Alliance";
import Alliance_Member_Request from "./structs/alliance/Alliance_Member_Request";
import Alliance_Member from "./structs/alliance/Alliance_Member";
import Alliance_Product_Family from "./structs/alliance/Alliance_Product_Family";
import Alliance_Product_Family_Translation from "./structs/alliance/Alliance_Product_Family_Translation";
import Alliance_Product_Family_Property from "./structs/alliance/Alliance_Product_Family_Property";
import Alliance_Product_Family_Property_Translation from "./structs/alliance/Alliance_Product_Family_Property_Translation";
import Alliance_Product_Family_Property_Value from "./structs/alliance/Alliance_Product_Family_Property_Value";
import Alliance_Product_Family_Property_Value_Translation from "./structs/alliance/Alliance_Product_Family_Property_Value_Translation";
import Alliance_Product from "./structs/alliance/Alliance_Product";
import Alliance_Product_Translation from "./structs/alliance/Alliance_Product_Translation";
import Alliance_Product_Tag from "./structs/alliance/Alliance_Product_Tag";
import Alliance_Product_Family_Variant from "./structs/alliance/Alliance_Product_Family_Variant";
import Alliance_Product_Family_Variant_Translation from "./structs/alliance/Alliance_Product_Family_Variant_Translation";
import Alliance_Product_Family_Variant_Property_Value from "./structs/alliance/Alliance_Product_Family_Variant_Property_Value";
import Listed_Alliance_Product_Family_Variant_Request from "./structs/alliance/Listed_Alliance_Product_Family_Variant_Request";
import Listed_Alliance_Product_Family_Variant from "./structs/alliance/Listed_Alliance_Product_Family_Variant";
import Alliance_Virtual_Product from "./structs/alliance/Alliance_Virtual_Product";
import Alliance_Service from "./structs/alliance/Alliance_Service";
import Alliance_Service_Translation from "./structs/alliance/Alliance_Service_Translation";
import Alliance_Service_Task from "./structs/alliance/Alliance_Service_Task";
import Alliance_Service_Task_Translation from "./structs/alliance/Alliance_Service_Task_Translation";
import Alliance_Service_Milestone from "./structs/alliance/Alliance_Service_Milestone";
import Alliance_Service_Milestone_Translation from "./structs/alliance/Alliance_Service_Milestone_Translation";
import Alliance_Service_Milestone_Task from "./structs/alliance/Alliance_Service_Milestone_Task";
import Alliance_Service_Provider from "./structs/alliance/Alliance_Service_Provider";
import Alliance_Coupon from "./structs/alliance/Alliance_Coupon";
import Alliance_Customer from "./structs/alliance/Alliance_Customer";

import Guild from "./structs/guild/Guild";
import Guild_Member_Request from "./structs/guild/Guild_Member_Request";
import Guild_Member from "./structs/guild/Guild_Member";

import Clan from "./structs/clan/Clan";
import Clan_Member_Invite from "./structs/clan/Clan_Member_Invite";
import Clan_Member from "./structs/clan/Clan_Member";
import Clan_Product_Order_Draft from "./structs/clan/Clan_Product_Order_Draft";
import Clan_Product_Order_Draft_Item from "./structs/clan/Clan_Product_Order_Draft_Item";
import Clan_Product_Order from "./structs/clan/Clan_Product_Order";
import Clan_Product_Order_Item from "./structs/clan/Clan_Product_Order_Item";
import Clan_Service_Order from "./structs/clan/Clan_Service_Order";

export type StructSchema = {
  fields: Record<string, WeakEnum>;
  uniqueness: ReadonlyArray<[ReadonlyArray<string>, string]>;
  permissions: StructPermissions;
  triggers: Record<string, StructTrigger>;
  checks: Record<string, [BooleanLispExpression, ErrMsg]>;
};

const structs = {
  ...Test,
  ...Test2,

  Country: Country,
  Pincode: Pincode,
  PincodeStats: PincodeStats,
  Language: Language,
  ...Tag,
  User: User,
  Resource_Type: Resource_Type,

  Product_Category: Product_Category,
  Product_Category_Translation: Product_Category_Translation,
  Service_Category: Service_Category,
  Service_Category_Translation: Service_Category_Translation,

  Wallet: Wallet,
  User_Product_Family: User_Product_Family,
  User_Product_Family_Property: User_Product_Family_Property,
  User_Product_Family_Property_Value: User_Product_Family_Property_Value,
  User_Product: User_Product,
  User_Product_Translation: User_Product_Translation,
  User_Product_Family_Variant: User_Product_Family_Variant,
  User_Product_Family_Variant_Property_Value:
    User_Product_Family_Variant_Property_Value,
  ...Private_Resource,
  ...Private_Resource_Tag,
  ...Public_Resource,
  ...Public_Resource_Tag,

  Alliance: Alliance,
  Alliance_Member_Request: Alliance_Member_Request,
  Alliance_Member: Alliance_Member,
  Alliance_Product_Family: Alliance_Product_Family,
  Alliance_Product_Family_Translation: Alliance_Product_Family_Translation,
  Alliance_Product_Family_Property: Alliance_Product_Family_Property,
  Alliance_Product_Family_Property_Translation:
    Alliance_Product_Family_Property_Translation,
  Alliance_Product_Family_Property_Value:
    Alliance_Product_Family_Property_Value,
  Alliance_Product_Family_Property_Value_Translation:
    Alliance_Product_Family_Property_Value_Translation,
  Alliance_Product: Alliance_Product,
  Alliance_Product_Translation: Alliance_Product_Translation,
  Alliance_Product_Tag: Alliance_Product_Tag,
  Alliance_Product_Family_Variant: Alliance_Product_Family_Variant,
  Alliance_Product_Family_Variant_Translation:
    Alliance_Product_Family_Variant_Translation,
  Alliance_Product_Family_Variant_Property_Value:
    Alliance_Product_Family_Variant_Property_Value,
  Listed_Alliance_Product_Family_Variant_Request:
    Listed_Alliance_Product_Family_Variant_Request,
  Listed_Alliance_Product_Family_Variant:
    Listed_Alliance_Product_Family_Variant,
  Alliance_Virtual_Product: Alliance_Virtual_Product,
  Alliance_Service: Alliance_Service,
  Alliance_Service_Translation: Alliance_Service_Translation,
  Alliance_Service_Task: Alliance_Service_Task,
  Alliance_Service_Task_Translation: Alliance_Service_Task_Translation,
  Alliance_Service_Milestone: Alliance_Service_Milestone,
  Alliance_Service_Milestone_Translation:
    Alliance_Service_Milestone_Translation,
  Alliance_Service_Milestone_Task: Alliance_Service_Milestone_Task,
  Alliance_Service_Provider: Alliance_Service_Provider,
  Alliance_Coupon: Alliance_Coupon,
  Alliance_Customer: Alliance_Customer,

  Guild: Guild,
  Guild_Member_Request: Guild_Member_Request,
  Guild_Member: Guild_Member,

  Clan: Clan,
  Clan_Member_Invite: Clan_Member_Invite,
  Clan_Member: Clan_Member,
  Clan_Product_Order_Draft: Clan_Product_Order_Draft,
  Clan_Product_Order_Draft_Item: Clan_Product_Order_Draft_Item,
  Clan_Product_Order: Clan_Product_Order,
  Clan_Product_Order_Item: Clan_Product_Order_Item,
  Clan_Service_Order: Clan_Service_Order,
};

export type StructName = keyof typeof structs;

const schema: Record<string, StructSchema> = structs;

export function get_struct(struct_name: StructName): Struct {
  const structDef = schema[struct_name];
  const struct: Struct = new Struct(
    struct_name,
    {},
    structDef.uniqueness,
    structDef.permissions,
    structDef.triggers,
    structDef.checks
  );
  for (const fieldName in structDef.fields) {
    struct.fields[fieldName] = structDef.fields[fieldName];
  }
  return struct;
}
