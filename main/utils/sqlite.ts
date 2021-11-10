import Decimal from "decimal.js";
import { Immutable } from "immer";
import { HashSet, Vector } from "prelude-ts";
import { Struct, Path, PathFilter } from "./variable";

export async function get_variables(
  struct: Struct,
  permissions: [HashSet<Vector<string>>, HashSet<Vector<string>>],
  // below four fields will not be passed as props to Box
  // but Box would user to select them
  requested_paths: HashSet<Path>,
  filters: Immutable<ReadonlyArray<[boolean, HashSet<PathFilter>]>>,
  limit: Immutable<Decimal>,
  offset: Immutable<Decimal>
): Promise<
  Array<{
    struct: Struct;
    id: Decimal;
    paths: HashSet<Path>;
  }>
> {
  return [];
}
