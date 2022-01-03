import React, { useEffect } from "react";
import { NavigatorProps as RootNavigatorProps } from "../../App";
import { List } from "../../main/utils/list";

export default function Component(props: RootNavigatorProps<"SelectionModal">) {
  useEffect(() => {
    props.navigation.setOptions({ headerTitle: props.route.params.title });
  }, []);
  return (
    <List
      selected={props.route.params.selected}
      struct={props.route.params.struct}
      active={props.route.params.active}
      level={props.route.params.level}
      filters={props.route.params.filters}
      limit={props.route.params.limit}
      render_list_element={props.route.params.render_list_element}
      disptach_values={props.route.params.disptach_values}
      render_custom_fields={props.route.params.render_custom_fields}
    />
  );
}
