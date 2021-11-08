import Decimal from "decimal.js";
import { Immutable } from "immer";
import { HashSet, Vector } from "prelude-ts";
import { Struct, Path } from "./variable";

export function get_variables(
  struct: Struct,
  permissions: [HashSet<Vector<string>>, HashSet<Vector<string>>],
  // below four fields will not be passed as props to Box
  // but Box would user to select them
  requested_paths: HashSet<Path>,
  field_filters: Immutable<ReadonlyArray<ReadonlyArray<Path>>>,
  limit: Immutable<Decimal>,
  offset: Immutable<Decimal>
): Array<{
  struct: Struct;
  id: Decimal;
  paths: HashSet<Path>;
}> {
  return [];
}
