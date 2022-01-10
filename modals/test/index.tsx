import React, { useEffect, useLayoutEffect } from "react";
import Decimal from "decimal.js";
import { HashSet } from "prelude-ts";

import { NavigatorProps as RootNavigatorProps } from "../../App";
import { get_struct } from "../../main/utils/schema";
import { unwrap } from "../../main/utils/prelude";
import { useComponent } from "../../main/utils/component";
import { views } from "../../views";

// 1. Update TextInput everywhere
// 2. List Tests component
// 3. Create, Read, Update, Delete

// IMPORTANT. Get working on creating actual app components for real by 12th of Jan!

export default function Component(
  props: RootNavigatorProps<"Test">
): JSX.Element {
  const struct1 = get_struct("Test");
  const struct2 = get_struct("Test2");
  if (unwrap(struct1) && unwrap(struct2)) {
    const [state1, dispatch1, jsx1] = useComponent({
      struct: struct1.value,
      id: new Decimal(props.route.params.id),
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
      values: HashSet.of(),
      init_values: HashSet.of(),
      extensions: {},
      labels: [
        ["STR", [[], "str"]],
        ["LSTR", [[], "lstr"]],
        ["CLOB", [[], "clob"]],
        ["U32", [[], "u32"]],
        ["I32", [[], "i32"]],
        ["U64", [[], "u64"]],
        ["I64", [[], "i64"]],
        ["UDOUBLE", [[], "udouble"]],
        ["IDOUBLE", [[], "idouble"]],
        ["UDECIMAL", [[], "udecimal"]],
        ["IDECIMAL", [[], "idecimal"]],
        ["BOOL", [[], "bool"]],
        ["DATE", [[], "date"]],
        ["TIME", [[], "time"]],
        ["TIMESTAMP", [[], "timestamp"]],
        ["USER", [[], "user"]],
        ["USER NICKNAME", [["user"], "nickname"]],
      ],
      higher_structs: [[struct2.value, [[], "z"]]],
      user_paths: [[[], "user"]],
      borrows: [],
      create: views.Test["Default"].create,
      update: views.Test["Default"].update,
      show: views.Test["Default"].show,
    });

    const [state2, dispatch2, jsx2] = useComponent({
      struct: struct2.value,
      id: new Decimal(props.route.params.id),
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
      values: HashSet.of(),
      init_values: HashSet.of(),
      extensions: {},
      labels: [
        ["STR2", [[], "str"]],
        ["STR3", [["z"], "str"]],
        ["LSTR2", [[], "lstr"]],
        ["CLOB2", [[], "clob"]],
        ["U322", [[], "u32"]],
        ["I322", [[], "i32"]],
        ["U642", [[], "u64"]],
        ["I642", [[], "i64"]],
        ["UDOUBLE2", [[], "udouble"]],
        ["IDOUBLE2", [[], "idouble"]],
        ["UDECIMAL2", [[], "udecimal"]],
        ["IDECIMAL2", [[], "idecimal"]],
        ["BOOL2", [[], "bool"]],
        ["DATE2", [[], "date"]],
        ["TIME2", [[], "time"]],
        ["TIMESTAMP2", [[], "timestamp"]],
        ["USER2", [[], "user"]],
        ["USER NICKNAME2", [["user"], "nickname"]],
      ],
      higher_structs: [],
      user_paths: [[[], "user"]],
      borrows: [],
      create: views.Test["Default"].create,
      update: views.Test["Default"].update,
      show: views.Test["Default"].show,
    });

    useLayoutEffect(() => {
      // state1 is getting embedded so state.values is necessary dependency for the effect
      dispatch2([
        "extension",
        {
          ...state2.extensions,
          z: {
            struct: struct1.value,
            state: state1,
            dispatch: dispatch1,
          },
        },
      ]);
    }, [state1.values]);

    useLayoutEffect(() => dispatch2(["event_trigger"]), [state1.event_trigger]);

    useLayoutEffect(() => dispatch2(["check_trigger"]), [state1.check_trigger]);

    useEffect(() => {
      const set_title = async (title: string) => {
        props.navigation.setOptions({ headerTitle: title });
      };
      if (state1.mode === "write") {
        if (state1.id.equals(-1)) {
          set_title("Create Test");
        } else {
          set_title("Update Test");
        }
      } else {
        set_title("Test");
      }
    }, []);

    return (
      <>
        {jsx1}
        {/* {jsx2} */}
      </>
    );
  }
  return <></>;
}
