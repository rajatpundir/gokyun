import { HashSet } from "prelude-ts";
import { BooleanLispExpression } from "../../lib/lisp";
import { errors, ErrMsg } from "../../lib/errors";
import {
  Struct,
  StructPermissions,
  StructTrigger,
  WeakEnum,
} from "../../lib/variable";
import { CustomError, Err, Ok, Result } from "../../lib/prelude";

import Test from "./test/Test";
import Test2 from "./test/Test2";

import Country from "./system/Country";
import Pincode from "./system/Pincode";
import PincodeStats from "./system/PincodeStats";
import Language from "./system/Language";
import Tag from "./system/Tag";
import User from "./system/User";

import Product_Category from "./user/Product_Category";
import Product_Category_Translation from "./user/Product_Category_Translation";
import Service_Category from "./user/Service_Category";
import Service_Category_Translation from "./user/Service_Category_Translation";
import Wallet from "./user/Wallet";
import User_Product_Family from "./user/User_Product_Family";
import User_Product_Family_Property from "./user/User_Product_Family_Property";
import User_Product_Family_Property_Value from "./user/User_Product_Family_Property_Value";
import User_Product from "./user/User_Product";
import User_Product_Translation from "./user/User_Product_Translation";
import User_Product_Family_Variant from "./user/User_Product_Family_Variant";
import User_Product_Family_Variant_Property_Value from "./user/User_Product_Family_Variant_Property_Value";

import Alliance from "./alliance/Alliance";
import Alliance_Member_Request from "./alliance/Alliance_Member_Request";
import Alliance_Member from "./alliance/Alliance_Member";
import Alliance_Product_Family from "./alliance/Alliance_Product_Family";
import Alliance_Product_Family_Translation from "./alliance/Alliance_Product_Family_Translation";
import Alliance_Product_Family_Property from "./alliance/Alliance_Product_Family_Property";
import Alliance_Product_Family_Property_Translation from "./alliance/Alliance_Product_Family_Property_Translation";
import Alliance_Product_Family_Property_Value from "./alliance/Alliance_Product_Family_Property_Value";
import Alliance_Product_Family_Property_Value_Translation from "./alliance/Alliance_Product_Family_Property_Value_Translation";
import Alliance_Product from "./alliance/Alliance_Product";
import Alliance_Product_Translation from "./alliance/Alliance_Product_Translation";
import Alliance_Product_Tag from "./alliance/Alliance_Product_Tag";
import Alliance_Product_Family_Variant from "./alliance/Alliance_Product_Family_Variant";
import Alliance_Product_Family_Variant_Translation from "./alliance/Alliance_Product_Family_Variant_Translation";
import Alliance_Product_Family_Variant_Property_Value from "./alliance/Alliance_Product_Family_Variant_Property_Value";
import Listed_Alliance_Product_Family_Variant_Request from "./alliance/Listed_Alliance_Product_Family_Variant_Request";
import Listed_Alliance_Product_Family_Variant from "./alliance/Listed_Alliance_Product_Family_Variant";
import Alliance_Virtual_Product from "./alliance/Alliance_Virtual_Product";
import Alliance_Service from "./alliance/Alliance_Service";
import Alliance_Service_Translation from "./alliance/Alliance_Service_Translation";
import Alliance_Service_Task from "./alliance/Alliance_Service_Task";
import Alliance_Service_Task_Translation from "./alliance/Alliance_Service_Task_Translation";
import Alliance_Service_Milestone from "./alliance/Alliance_Service_Milestone";
import Alliance_Service_Milestone_Translation from "./alliance/Alliance_Service_Milestone_Translation";
import Alliance_Service_Milestone_Task from "./alliance/Alliance_Service_Milestone_Task";
import Alliance_Service_Provider from "./alliance/Alliance_Service_Provider";
import Alliance_Coupon from "./alliance/Alliance_Coupon";
import Alliance_Customer from "./alliance/Alliance_Customer";

import Guild from "./guild/Guild";
import Guild_Member_Request from "./guild/Guild_Member_Request";
import Guild_Member from "./guild/Guild_Member";

import Clan from "./clan/Clan";
import Clan_Member_Invite from "./clan/Clan_Member_Invite";
import Clan_Member from "./clan/Clan_Member";
import Clan_Product_Order_Draft from "./clan/Clan_Product_Order_Draft";
import Clan_Product_Order_Draft_Item from "./clan/Clan_Product_Order_Draft_Item";
import Clan_Product_Order from "./clan/Clan_Product_Order";
import Clan_Product_Order_Item from "./clan/Clan_Product_Order_Item";
import Clan_Service_Order from "./clan/Clan_Service_Order";

// All structs are created via Fx

// ResourceType {
// 	name: string
// }

// Resource {
// 	type: ResourceType
// 	url: string
//  name: string
//  user: User
// }

export type StructSchema = {
  fields: Record<string, WeakEnum>;
  uniqueness: ReadonlyArray<[ReadonlyArray<string>, string]>;
  permissions: StructPermissions;
  triggers: Record<string, StructTrigger>;
  checks: Record<string, [BooleanLispExpression, ErrMsg]>;
};

const schema: Record<string, StructSchema> = {
  Test: Test,
  Test2: Test2,
  Product_Category: Product_Category,
  Product_Category_Translation: Product_Category_Translation,
  Service_Category: Service_Category,
  Service_Category_Translation: Service_Category_Translation,
  Tag: Tag,
  Country: Country,
  Pincode: Pincode,
  PincodeStats: PincodeStats,
  Language: Language,
  User: User,
  Wallet: Wallet,
  Alliance: Alliance,
  Guild: Guild,
  Clan: Clan,
  Alliance_Member_Request: Alliance_Member_Request,
  Guild_Member_Request: Guild_Member_Request,
  Clan_Member_Invite: Clan_Member_Invite,
  Alliance_Member: Alliance_Member,
  Guild_Member: Guild_Member,
  Clan_Member: Clan_Member,
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
  User_Product_Family: User_Product_Family,
  User_Product_Family_Property: User_Product_Family_Property,
  User_Product_Family_Property_Value: User_Product_Family_Property_Value,
  User_Product: User_Product,
  User_Product_Translation: User_Product_Translation,
  User_Product_Family_Variant: User_Product_Family_Variant,
  User_Product_Family_Variant_Property_Value:
    User_Product_Family_Variant_Property_Value,
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
  Clan_Product_Order_Draft: Clan_Product_Order_Draft,
  Clan_Product_Order_Draft_Item: Clan_Product_Order_Draft_Item,
  Clan_Product_Order: Clan_Product_Order,
  Clan_Product_Order_Item: Clan_Product_Order_Item,
  Clan_Service_Order: Clan_Service_Order,
};

export function get_struct(struct_name: string): Result<Struct> {
  let structs: HashSet<Struct> = HashSet.of();
  for (const structName in schema) {
    const structDef = schema[structName];
    const struct: Struct = new Struct(
      structName,
      {},
      structDef.uniqueness,
      structDef.permissions,
      structDef.triggers,
      structDef.checks
    );
    for (const fieldName in structDef.fields) {
      struct.fields[fieldName] = structDef.fields[fieldName];
    }
    structs = structs.add(struct);
  }
  const struct = structs.filter((s) => s.name === struct_name).single();
  if (struct.isSome()) {
    return new Ok(struct.get());
  }
  return new Err(new CustomError([errors.ErrUnexpected] as ErrMsg));
}
